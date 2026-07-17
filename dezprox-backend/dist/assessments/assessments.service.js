"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const candidate_entity_1 = require("../candidates/entities/candidate.entity");
const candidate_status_enum_1 = require("../candidates/enums/candidate-status.enum");
const ownership_helper_1 = require("../common/helpers/ownership.helper");
const assessment_entity_1 = require("./entities/assessment.entity");
const assessment_status_enum_1 = require("./enums/assessment-status.enum");
const reports_service_1 = require("../reports/reports.service");
const assessment_gateway_1 = require("../gateway/assessment.gateway");
const assessment_constants_1 = require("./assessment.constants");
let AssessmentsService = class AssessmentsService {
    constructor(assessmentsRepository, candidatesRepository, reportsService, dataSource, gateway) {
        this.assessmentsRepository = assessmentsRepository;
        this.candidatesRepository = candidatesRepository;
        this.reportsService = reportsService;
        this.dataSource = dataSource;
        this.gateway = gateway;
    }
    async create(candidateId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const candidate = await queryRunner.manager.findOne(candidate_entity_1.Candidate, {
                where: { id: candidateId, isDeleted: false },
            });
            if (!candidate) {
                throw new common_1.NotFoundException('Candidate not found');
            }
            const assessment = queryRunner.manager.create(assessment_entity_1.Assessment, {
                candidateId,
                status: assessment_status_enum_1.AssessmentStatus.NOT_STARTED,
                startedAt: null,
                completedAt: null,
            });
            const savedAssessment = await queryRunner.manager.save(assessment);
            candidate.assessment = savedAssessment;
            await queryRunner.manager.save(candidate);
            await queryRunner.commitTransaction();
            return savedAssessment;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            if (err instanceof common_1.NotFoundException)
                throw err;
            throw new common_1.InternalServerErrorException('Failed to create assessment');
        }
        finally {
            await queryRunner.release();
        }
    }
    async start(assessmentId, user) {
        const assessment = await this.getAssessmentForUser(assessmentId, user);
        if (assessment.status !== assessment_status_enum_1.AssessmentStatus.NOT_STARTED) {
            throw new common_1.BadRequestException('Assessment has already started');
        }
        assessment.status = assessment_status_enum_1.AssessmentStatus.ROUND_1;
        assessment.startedAt = new Date();
        return this.assessmentsRepository.save(assessment);
    }
    async getStatus(assessmentId, user) {
        const assessment = await this.getAssessmentForUser(assessmentId, user);
        return {
            status: assessment.status,
            currentRound: assessment.status,
            timeRemaining: this.calculateTimeRemainingSeconds(assessment),
        };
    }
    async advanceRound(assessmentId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const assessment = await queryRunner.manager.findOne(assessment_entity_1.Assessment, {
                where: { id: assessmentId },
                relations: ['candidate'],
            });
            if (!assessment) {
                throw new common_1.NotFoundException('Assessment not found');
            }
            if (assessment.status === assessment_status_enum_1.AssessmentStatus.ROUND_1) {
                assessment.status = assessment_status_enum_1.AssessmentStatus.ROUND_2;
                assessment.round2StartedAt = new Date();
            }
            else if (assessment.status === assessment_status_enum_1.AssessmentStatus.ROUND_2) {
                assessment.status = assessment_status_enum_1.AssessmentStatus.ROUND_3;
                assessment.round3StartedAt = new Date();
            }
            else if (assessment.status === assessment_status_enum_1.AssessmentStatus.ROUND_3) {
                assessment.status = assessment_status_enum_1.AssessmentStatus.COMPLETED;
                assessment.completedAt = new Date();
                const candidate = await queryRunner.manager.findOne(candidate_entity_1.Candidate, {
                    where: { id: assessment.candidateId, isDeleted: false },
                });
                if (candidate) {
                    candidate.status = candidate_status_enum_1.CandidateStatus.SUBMITTED;
                    await queryRunner.manager.save(candidate);
                }
                await this.reportsService.generateWithManager(assessment.id, queryRunner.manager);
            }
            const savedAssessment = await queryRunner.manager.save(assessment);
            await queryRunner.commitTransaction();
            this.gateway.emitRoundAdvanced(assessmentId, savedAssessment.status);
            return savedAssessment;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            if (err instanceof common_1.NotFoundException)
                throw err;
            throw new common_1.InternalServerErrorException('Failed to advance round');
        }
        finally {
            await queryRunner.release();
        }
    }
    validateTimeLimit(assessment, round) {
        const timeRemaining = this.calculateTimeRemainingSeconds(assessment, round);
        if (timeRemaining < -5) {
            throw new common_1.BadRequestException('Time limit exceeded');
        }
    }
    async getAssessmentForUser(assessmentId, user) {
        const assessment = await this.assessmentsRepository.findOne({
            where: { id: assessmentId },
            relations: ['candidate', 'candidate.user'],
        });
        if (!assessment) {
            throw new common_1.NotFoundException('Assessment not found');
        }
        (0, ownership_helper_1.assertOwnership)(user.sub, assessment.candidate.user.id, user.role);
        return assessment;
    }
    async saveAssessment(assessment) {
        return this.assessmentsRepository.save(assessment);
    }
    calculateTimeRemainingSeconds(assessment, round) {
        if (!assessment.startedAt) {
            return 0;
        }
        const activeRound = round ?? this.getRoundKeyFromStatus(assessment.status);
        if (!activeRound) {
            return 0;
        }
        const startedAt = this.getRoundStartedAt(assessment, activeRound).getTime();
        const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
        const durationSeconds = this.getRoundDurationSeconds(assessment, activeRound);
        return durationSeconds - elapsedSeconds;
    }
    getRoundKeyFromStatus(status) {
        if (status === assessment_status_enum_1.AssessmentStatus.ROUND_1) {
            return 'mcq';
        }
        if (status === assessment_status_enum_1.AssessmentStatus.ROUND_2) {
            return 'typing';
        }
        if (status === assessment_status_enum_1.AssessmentStatus.ROUND_3) {
            return 'coding';
        }
        return null;
    }
    getRoundStartedAt(assessment, round) {
        const startedAt = assessment.startedAt ?? new Date();
        if (round === 'mcq') {
            return startedAt;
        }
        if (round === 'typing') {
            return assessment.round2StartedAt ?? assessment.createdAt ?? startedAt;
        }
        return assessment.round3StartedAt ?? assessment.createdAt ?? startedAt;
    }
    getRoundDurationSeconds(assessment, round) {
        if (round === 'mcq') {
            return assessment_constants_1.ASSESSMENT_ROUND_DURATIONS.mcq * 60;
        }
        if (round === 'typing') {
            return assessment_constants_1.ASSESSMENT_ROUND_DURATIONS.typing * 60;
        }
        return assessment_constants_1.ASSESSMENT_ROUND_DURATIONS.coding * 60;
    }
};
exports.AssessmentsService = AssessmentsService;
exports.AssessmentsService = AssessmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(assessment_entity_1.Assessment)),
    __param(1, (0, typeorm_1.InjectRepository)(candidate_entity_1.Candidate)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => assessment_gateway_1.AssessmentGateway))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        reports_service_1.ReportsService,
        typeorm_2.DataSource,
        assessment_gateway_1.AssessmentGateway])
], AssessmentsService);
//# sourceMappingURL=assessments.service.js.map