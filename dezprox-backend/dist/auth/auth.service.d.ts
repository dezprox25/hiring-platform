import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/role.enum';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
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
    private updateRefreshToken;
    private jwtExpiresIn;
    private getTokens;
}
