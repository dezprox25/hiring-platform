import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from '../common/enums/role.enum';

/**
 * Staff users ensured on bootstrap in non-production (and when SEED_DEV_LOGIN_USERS=true).
 * Missing rows are created; existing demo rows get password reset if they do not match password123.
 */
const DEV_SEED_ACCOUNTS: Array<{
  email: string;
  role: Role;
}> = [
  { email: 'priya@dezprox.com', role: Role.ADMIN },
  { email: 'karan@dezprox.com', role: Role.MANAGER },
  { email: 'neha@dezprox.com', role: Role.HR },
  { email: 'aarav@dezprox.com', role: Role.CANDIDATE },
];

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const nodeEnv = (this.configService.get<string>('NODE_ENV') ?? 'development').trim();
    const forceSeed = this.configService.get<string>('SEED_DEV_LOGIN_USERS') === 'true';
    const isProdLike = nodeEnv === 'production' || nodeEnv === 'staging';
    const allowDevBootstrap = forceSeed || !isProdLike;

    if (!allowDevBootstrap) {
      this.logger.log(`Users bootstrap: skipped (NODE_ENV=${nodeEnv}).`);
      return;
    }

    const devPassword = 'password123';
    const passwordHash = await bcrypt.hash(devPassword, 10);
    let created = 0;
    let reset = 0;

    for (const row of DEV_SEED_ACCOUNTS) {
      const email = row.email.toLowerCase();
      const existing = await this.usersRepository.findOne({ where: { email } });
      if (!existing) {
        await this.usersRepository.save(
          this.usersRepository.create({
            email,
            password_hash: passwordHash,
            role: row.role,
            is_active: true,
          }),
        );
        created++;
        continue;
      }
      const matches = await bcrypt.compare(devPassword, existing.password_hash);
      if (!matches) {
        await this.usersRepository.update(existing.id, { password_hash: passwordHash });
        reset++;
      }
    }

    if (created > 0 || reset > 0) {
      this.logger.warn(
        `Dev auth bootstrap: created ${created} demo user(s), reset password for ${reset} demo account(s). ` +
          `Sign in: ${DEV_SEED_ACCOUNTS[0].email} / ${devPassword}`,
      );
    }

    const total = await this.usersRepository.count();
    this.logger.log(`Users table row count after bootstrap: ${total}`);
  }

  /**
   * Find a user by email (case-insensitive).
   * Alias must not be "user" — it is reserved in PostgreSQL and can break lookups.
   */
  async findByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    return this.usersRepository
      .createQueryBuilder('u')
      .where('LOWER(TRIM(u.email)) = :email', { email: cleanEmail })
      .getOne();
  }

  /**
   * Find a user by id.
   */
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * Update the stored refresh token hash for a user
   */
  async updateRefreshToken(userId: string, hashedToken: string | null): Promise<void> {
    await this.usersRepository.update(userId, { refresh_token_hash: hashedToken });
  }

  /**
   * Create a new user (internal use for seeding/initial setup)
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData as User);
    return this.usersRepository.save(user);
  }

  /**
   * Find all users ordered by creation date descending, excluding sensitive fields.
   */
  async findAll(): Promise<Omit<User, 'password_hash' | 'refresh_token_hash'>[]> {
    const users = await this.usersRepository.find({ order: { created_at: 'DESC' } });
    return users.map((u) => {
      const { password_hash, refresh_token_hash, ...safeUser } = u;
      return safeUser as any;
    });
  }

  /**
   * Create a staff or general user with hashed password.
   */
  async createUser(dto: { email: string; role: Role; password?: string; is_active?: boolean }): Promise<Omit<User, 'password_hash'>> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('User with this email already exists');
    }
    const rawPassword = dto.password || 'password123';
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const user = this.usersRepository.create({
      email,
      role: dto.role,
      password_hash: passwordHash,
      is_active: dto.is_active ?? true,
    });
    const saved = await this.usersRepository.save(user);
    const { password_hash, refresh_token_hash, ...safe } = saved;
    return safe as any;
  }

  /**
   * Update existing user details or reset password.
   */
  async updateUser(id: string, dto: { role?: Role; is_active?: boolean; password?: string }): Promise<Omit<User, 'password_hash'>> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    if (dto.role) user.role = dto.role;
    if (dto.is_active !== undefined) user.is_active = dto.is_active;
    if (dto.password) {
      user.password_hash = await bcrypt.hash(dto.password, 10);
    }
    const saved = await this.usersRepository.save(user);
    const { password_hash, refresh_token_hash, ...safe } = saved;
    return safe as any;
  }

  /**
   * Remove or deactivate a user.
   */
  async removeUser(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}

