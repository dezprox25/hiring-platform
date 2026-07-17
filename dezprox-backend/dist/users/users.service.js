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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const config_1 = require("@nestjs/config");
const user_entity_1 = require("./entities/user.entity");
const role_enum_1 = require("../common/enums/role.enum");
const DEV_SEED_ACCOUNTS = [
    { email: 'priya@dezprox.com', role: role_enum_1.Role.ADMIN },
    { email: 'karan@dezprox.com', role: role_enum_1.Role.MANAGER },
    { email: 'neha@dezprox.com', role: role_enum_1.Role.HR },
    { email: 'aarav@dezprox.com', role: role_enum_1.Role.CANDIDATE },
];
let UsersService = UsersService_1 = class UsersService {
    constructor(usersRepository, configService) {
        this.usersRepository = usersRepository;
        this.configService = configService;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async onModuleInit() {
        const nodeEnv = (this.configService.get('NODE_ENV') ?? 'development').trim();
        const forceSeed = this.configService.get('SEED_DEV_LOGIN_USERS') === 'true';
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
                await this.usersRepository.save(this.usersRepository.create({
                    email,
                    password_hash: passwordHash,
                    role: row.role,
                    is_active: true,
                }));
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
            this.logger.warn(`Dev auth bootstrap: created ${created} demo user(s), reset password for ${reset} demo account(s). ` +
                `Sign in: ${DEV_SEED_ACCOUNTS[0].email} / ${devPassword}`);
        }
        const total = await this.usersRepository.count();
        this.logger.log(`Users table row count after bootstrap: ${total}`);
    }
    async findByEmail(email) {
        const cleanEmail = email.trim().toLowerCase();
        return this.usersRepository
            .createQueryBuilder('u')
            .where('LOWER(TRIM(u.email)) = :email', { email: cleanEmail })
            .getOne();
    }
    async findById(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async updateRefreshToken(userId, hashedToken) {
        await this.usersRepository.update(userId, { refresh_token_hash: hashedToken });
    }
    async create(userData) {
        const user = this.usersRepository.create(userData);
        return this.usersRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], UsersService);
//# sourceMappingURL=users.service.js.map