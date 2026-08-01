import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Role } from '../common/enums/role.enum';
export declare class UsersService implements OnModuleInit {
    private readonly usersRepository;
    private readonly configService;
    private readonly logger;
    constructor(usersRepository: Repository<User>, configService: ConfigService);
    onModuleInit(): Promise<void>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    updateRefreshToken(userId: string, hashedToken: string | null): Promise<void>;
    create(userData: Partial<User>): Promise<User>;
    findAll(): Promise<Omit<User, 'password_hash' | 'refresh_token_hash'>[]>;
    createUser(dto: {
        email: string;
        role: Role;
        password?: string;
        is_active?: boolean;
    }): Promise<Omit<User, 'password_hash'>>;
    updateUser(id: string, dto: {
        role?: Role;
        is_active?: boolean;
        password?: string;
    }): Promise<Omit<User, 'password_hash'>>;
    removeUser(id: string): Promise<void>;
}
