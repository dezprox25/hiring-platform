import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            role: import("../common/enums/role.enum").Role;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    forgotPassword(email?: string): Promise<{
        message: string;
    }>;
    resetPassword(body?: {
        token?: string;
        password?: string;
    }): Promise<{
        message: string;
    }>;
    refresh(user: JwtPayload & {
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(user: JwtPayload): Promise<void>;
}
