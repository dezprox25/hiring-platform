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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const candidate_entity_1 = require("./entities/candidate.entity");
const candidate_status_enum_1 = require("./enums/candidate-status.enum");
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
const role_enum_1 = require("../common/enums/role.enum");
const ownership_helper_1 = require("../common/helpers/ownership.helper");
const user_entity_1 = require("../users/entities/user.entity");
const assessment_gateway_1 = require("../gateway/assessment.gateway");
let CandidatesService = class CandidatesService {
    constructor(candidateRepository, usersService, mailService, dataSource, gateway) {
        this.candidateRepository = candidateRepository;
        this.usersService = usersService;
        this.mailService = mailService;
        this.dataSource = dataSource;
        this.gateway = gateway;
    }
    async create(dto, createdBy) {
        const existingUser = await this.usersService.findByEmail(dto.email);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            let user = existingUser;
            let password = '';
            if (!user) {
                password = Math.random().toString(36).slice(-8);
                const passwordHash = await bcrypt.hash(password, 10);
                user = queryRunner.manager.create(user_entity_1.User, {
                    email: dto.email.trim().toLowerCase(),
                    password_hash: passwordHash,
                    role: role_enum_1.Role.CANDIDATE,
                    is_active: true,
                });
                user = await queryRunner.manager.save(user);
            }
            else {
                const existingCandidate = await queryRunner.manager.findOne(candidate_entity_1.Candidate, {
                    where: { user: { id: user.id } },
                });
                if (existingCandidate && !existingCandidate.isDeleted) {
                    throw new common_1.ConflictException('A candidate with this email already exists');
                }
                if (existingCandidate && existingCandidate.isDeleted) {
                    existingCandidate.isDeleted = false;
                    existingCandidate.fullName = dto.fullName;
                    existingCandidate.phone = dto.phone;
                    existingCandidate.roleApplied = dto.roleApplied;
                    existingCandidate.status = candidate_status_enum_1.CandidateStatus.INVITED;
                    const savedCandidate = await queryRunner.manager.save(existingCandidate);
                    await queryRunner.commitTransaction();
                    return this.findOneResponse(savedCandidate.id, createdBy);
                }
            }
            const candidate = queryRunner.manager.create(candidate_entity_1.Candidate, {
                fullName: dto.fullName,
                phone: dto.phone,
                roleApplied: dto.roleApplied,
                notes: dto.notes,
                user: user,
                status: candidate_status_enum_1.CandidateStatus.INVITED,
            });
            const savedCandidate = await queryRunner.manager.save(candidate);
            await queryRunner.commitTransaction();
            if (password) {
                try {
                    await this.mailService.sendInvite(dto.email, dto.fullName, password);
                }
                catch {
                }
            }
            return this.findOneResponse(savedCandidate.id, createdBy);
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            if (err instanceof common_1.ConflictException || err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException('Failed to create candidate');
        }
        finally {
            await queryRunner.release();
        }
    }
    async findAll(params, user) {
        const { status, roleApplied, search, page = 1, limit = 10 } = params;
        const query = this.candidateRepository.createQueryBuilder('candidate')
            .leftJoinAndSelect('candidate.user', 'user')
            .leftJoinAndSelect('candidate.assessment', 'assessment')
            .leftJoinAndSelect('candidate.report', 'report')
            .where('candidate.isDeleted = :isDeleted', { isDeleted: false });
        if (status) {
            query.andWhere('candidate.status = :status', { status });
        }
        if (roleApplied) {
            query.andWhere('candidate.roleApplied = :roleApplied', { roleApplied });
        }
        if (search) {
            query.andWhere('(candidate.fullName ILIKE :search OR user.email ILIKE :search)', {
                search: `%${search}%`,
            });
        }
        const [data, total] = await query
            .orderBy('candidate.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return {
            data: data.map(c => this.mapToResponse(c, user.role)),
            total,
        };
    }
    async findOne(id, requestingUser) {
        const candidate = await this.candidateRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['user', 'assessment', 'report', 'aiEvaluation'],
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        (0, ownership_helper_1.assertOwnership)(requestingUser.sub, candidate.user.id, requestingUser.role);
        return this.mapToResponse(candidate, requestingUser.role);
    }
    async findMe(user) {
        const candidate = await this.candidateRepository.findOne({
            where: { user: { id: user.sub }, isDeleted: false },
            relations: ['user', 'assessment', 'report'],
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate record not found');
        }
        return this.mapToResponse(candidate, user.role);
    }
    async update(id, dto, user) {
        const candidate = await this.candidateRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['user'],
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        (0, ownership_helper_1.assertOwnership)(user.sub, candidate.user.id, user.role);
        Object.assign(candidate, dto);
        const saved = await this.candidateRepository.save(candidate);
        return this.mapToResponse(saved, user.role);
    }
    async updateStatus(id, dto, user) {
        const candidate = await this.candidateRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['user'],
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        this.validateStatusTransition(candidate.status, dto.status, user.role);
        candidate.status = dto.status;
        const saved = await this.candidateRepository.save(candidate);
        this.gateway.emitStatusUpdate(id, saved.status);
        return this.mapToResponse(saved, user.role);
    }
    async resendInvite(id) {
        const candidate = await this.candidateRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['user'],
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        const password = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(password, 10);
        await this.candidateRepository.manager.update(user_entity_1.User, candidate.user.id, {
            password_hash: passwordHash,
        });
        await this.mailService.sendInvite(candidate.user.email, candidate.fullName, password);
    }
    async softDelete(id) {
        const candidate = await this.candidateRepository.findOne({
            where: { id, isDeleted: false },
        });
        if (!candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        candidate.isDeleted = true;
        await this.candidateRepository.save(candidate);
    }
    validateStatusTransition(current, next, role) {
        const transitions = {
            [candidate_status_enum_1.CandidateStatus.INVITED]: [candidate_status_enum_1.CandidateStatus.ACTIVE],
            [candidate_status_enum_1.CandidateStatus.ACTIVE]: [candidate_status_enum_1.CandidateStatus.SUBMITTED],
            [candidate_status_enum_1.CandidateStatus.SUBMITTED]: [candidate_status_enum_1.CandidateStatus.EVALUATED],
            [candidate_status_enum_1.CandidateStatus.EVALUATED]: [candidate_status_enum_1.CandidateStatus.HIRED, candidate_status_enum_1.CandidateStatus.REJECTED],
            [candidate_status_enum_1.CandidateStatus.HIRED]: [],
            [candidate_status_enum_1.CandidateStatus.REJECTED]: [candidate_status_enum_1.CandidateStatus.HIRED],
        };
        const allowed = transitions[current].includes(next);
        if (!allowed) {
            throw new common_1.BadRequestException('Invalid status transition');
        }
        if (next === candidate_status_enum_1.CandidateStatus.HIRED && role !== role_enum_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Only Admin can hire a candidate');
        }
    }
    async findOneResponse(id, requestingUser) {
        const c = await this.candidateRepository.findOne({
            where: { id, isDeleted: false },
            relations: ['user', 'assessment', 'report', 'aiEvaluation'],
        });
        return this.mapToResponse(c, requestingUser.role);
    }
    mapToResponse(candidate, role) {
        if (!candidate)
            return null;
        const response = {
            ...candidate,
            userId: candidate.user?.id,
            user: candidate.user
                ? {
                    id: candidate.user.id,
                    email: candidate.user.email,
                }
                : null,
            assessment: candidate.assessment
                ? {
                    id: candidate.assessment.id,
                    status: candidate.assessment.status,
                }
                : null,
        };
        delete response.report;
        delete response.aiEvaluation;
        if (role !== role_enum_1.Role.CANDIDATE) {
            if (candidate.report) {
                response.report = {
                    totalScore: candidate.report.totalScore != null ? Number(candidate.report.totalScore) : null,
                    mcqPercentage: candidate.report.mcqPercentage != null ? Number(candidate.report.mcqPercentage) : null,
                    isShortlisted: candidate.report.isShortlisted,
                };
            }
            if (candidate.aiEvaluation) {
                response.aiRecommendation = candidate.aiEvaluation.recommendation;
            }
        }
        else {
            delete response.notes;
        }
        return response;
    }
};
exports.CandidatesService = CandidatesService;
exports.CandidatesService = CandidatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(candidate_entity_1.Candidate)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => assessment_gateway_1.AssessmentGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        mail_service_1.MailService,
        typeorm_2.DataSource,
        assessment_gateway_1.AssessmentGateway])
], CandidatesService);
//# sourceMappingURL=candidates.service.js.map