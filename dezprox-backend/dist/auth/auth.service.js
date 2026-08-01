"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, mailService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
    }
    async login(loginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async logout(userId) {
        await this.usersService.updateRefreshToken(userId, null);
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refresh_token_hash) {
            throw new common_1.UnauthorizedException();
        }
        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refresh_token_hash);
        if (!refreshTokenMatches) {
            throw new common_1.ForbiddenException('Invalid refresh token');
        }
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async forgotPassword(email) {
        if (!email)
            throw new common_1.BadRequestException('Email address is required');
        const user = await this.usersService.findByEmail(email);
        if (user) {
            const token = await this.jwtService.signAsync({ sub: user.id, purpose: 'password-reset' }, {
                secret: this.configService.get('JWT_SECRET') || 'your-secret-key-at-least-32-chars',
                expiresIn: '1h',
            });
            await this.mailService.sendPasswordReset(user.email, token);
        }
        return {
            message: 'If an account matching that email address exists, password reset instructions have been dispatched.',
        };
    }
    async resetPassword(token, newPassword) {
        if (!token || !newPassword) {
            throw new common_1.BadRequestException('Reset token and new password are required');
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET') || 'your-secret-key-at-least-32-chars',
            });
            if (payload.purpose !== 'password-reset' || !payload.sub) {
                throw new common_1.BadRequestException('Invalid reset token purpose');
            }
            await this.usersService.updateUser(payload.sub, { password: newPassword });
            return { message: 'Your password has been updated successfully. You may now sign in.' };
        }
        catch (err) {
            throw new common_1.BadRequestException('The reset token is invalid or has expired. Please request a new link.');
        }
    }
    async updateRefreshToken(userId, refreshToken) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
    }
    jwtExpiresIn(key, fallback) {
        const value = this.configService.get(key) ?? fallback;
        return value;
    }
    async getTokens(userId, email, role) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync({ sub: userId, email, role }, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.jwtExpiresIn('JWT_EXPIRES_IN', '15m'),
            }),
            this.jwtService.signAsync({ sub: userId, email, role }, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.jwtExpiresIn('JWT_REFRESH_EXPIRES_IN', '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map