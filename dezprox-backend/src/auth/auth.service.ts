import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Validate user credentials and generate access/refresh tokens
   */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Revoke a refresh token (logout)
   */
  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * Generate new access/refresh tokens using a valid refresh token
   */
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refresh_token_hash) {
      throw new UnauthorizedException();
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refresh_token_hash,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }

  private jwtExpiresIn(key: string, fallback: string): JwtSignOptions['expiresIn'] {
    const value = this.configService.get<string>(key) ?? fallback;
    return value as JwtSignOptions['expiresIn'];
  }

  private async getTokens(userId: string, email: string, role: Role) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.jwtExpiresIn('JWT_EXPIRES_IN', '15m'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.jwtExpiresIn('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
