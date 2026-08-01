import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/role.enum';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private mailService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, mailService: MailService);
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            role: Role;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    refreshTokens(userId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(email?: string): Promise<{
        message: string;
    }>;
    resetPassword(token?: string, newPassword?: string): Promise<{
        message: string;
    }>;
    private updateRefreshToken;
    private jwtExpiresIn;
    private getTokens;
}
