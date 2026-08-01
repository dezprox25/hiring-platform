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
exports.McqService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const assessments_service_1 = require("./assessments.service");
const assessment_status_enum_1 = require("./enums/assessment-status.enum");
const mcq_answer_entity_1 = require("./entities/mcq-answer.entity");
const question_entity_1 = require("./entities/question.entity");
const question_type_enum_1 = require("./enums/question-type.enum");
const mcq_question_service_1 = require("../question-bank/mcq-question.service");
let McqService = class McqService {
    constructor(questionsRepository, mcqAnswersRepository, assessmentsService, cacheManager, mcqQuestionService) {
        this.questionsRepository = questionsRepository;
        this.mcqAnswersRepository = mcqAnswersRepository;
        this.assessmentsService = assessmentsService;
        this.cacheManager = cacheManager;
        this.mcqQuestionService = mcqQuestionService;
    }
    async getQuestions(assessmentId, user) {
        const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);
        if (assessment.status !== assessment_status_enum_1.AssessmentStatus.ROUND_1) {
            throw new common_1.BadRequestException('MCQ round is not active');
        }
        const category = assessment.candidate.roleApplied;
        let bankQuestions = [];
        try {
            bankQuestions = await this.mcqQuestionService.findForAssessment(category, 15);
        }
        catch {
        }
        let questions;
        if (bankQuestions.length > 0) {
            for (const bq of bankQuestions) {
                const existing = await this.questionsRepository.findOne({ where: { id: bq.id } });
                if (!existing) {
                    await this.questionsRepository.save(this.questionsRepository.create({
                        id: bq.id,
                        type: question_type_enum_1.QuestionType.MCQ,
                        category: bq.topic || category,
                        difficulty: bq.difficulty,
                        text: bq.questionText,
                        options: bq.options,
                        correctAnswer: bq.correctAnswer,
                        isActive: true,
                    }));
                }
            }
            questions = this.shuffle([...bankQuestions]).map(q => ({
                id: q.id,
                type: question_type_enum_1.QuestionType.MCQ,
                category: q.topic || category,
                difficulty: q.difficulty,
                text: q.questionText,
                options: q.options,
                correctAnswer: q.correctAnswer,
                codeStarter: null,
                createdAt: q.createdAt,
                updatedAt: q.updatedAt,
            }));
        }
        else {
            let rawQuestions = await this.questionsRepository
                .createQueryBuilder('question')
                .where('question.type = :type', { type: question_type_enum_1.QuestionType.MCQ })
                .andWhere('question.isActive = :isActive', { isActive: true })
                .andWhere('LOWER(question.category) = LOWER(:category)', { category })
                .orderBy('RANDOM()')
                .take(15)
                .getMany();
            if (rawQuestions.length === 0) {
                rawQuestions = await this.questionsRepository
                    .createQueryBuilder('question')
                    .where('question.type = :type', { type: question_type_enum_1.QuestionType.MCQ })
                    .andWhere('question.isActive = :isActive', { isActive: true })
                    .orderBy('RANDOM()')
                    .take(15)
                    .getMany();
            }
            questions = rawQuestions;
        }
        const cacheEntry = {};
        const response = this.shuffle([...questions]).map((question) => {
            const shuffledOptions = this.shuffle([...(question.options ?? [])]);
            cacheEntry[question.id] = shuffledOptions;
            return {
                id: question.id,
                type: question.type,
                category: question.category,
                difficulty: question.difficulty,
                text: question.text,
                options: shuffledOptions,
                codeStarter: question.codeStarter,
                createdAt: question.createdAt,
                updatedAt: question.updatedAt,
            };
        });
        await this.cacheManager.set(`mcq_options:${assessmentId}`, cacheEntry, 7200);
        return response;
    }
    async submitAnswers(assessmentId, dto, user) {
        const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);
        if (assessment.status !== assessment_status_enum_1.AssessmentStatus.ROUND_1) {
            throw new common_1.BadRequestException('MCQ round is not active');
        }
        this.assessmentsService.validateTimeLimit(assessment, 'mcq');
        const cachedOptions = await this.cacheManager.get(`mcq_options:${assessmentId}`) ?? {};
        let correctCount = 0;
        for (const answer of dto.answers) {
            const question = await this.questionsRepository.findOne({
                where: { id: answer.questionId, type: question_type_enum_1.QuestionType.MCQ, isActive: true },
            });
            if (!question) {
                throw new common_1.NotFoundException('Question not found');
            }
            const originalOptions = question.options ?? [];
            const displayedOptions = cachedOptions[question.id] ?? originalOptions;
            const selectedIndex = Number(answer.selectedOption);
            const selectedValue = displayedOptions[selectedIndex] ?? null;
            const correctValue = question.correctAnswer === null
                ? null
                : originalOptions[Number(question.correctAnswer)] ?? null;
            const isCorrect = selectedValue !== null &&
                correctValue !== null &&
                selectedValue === correctValue;
            if (isCorrect) {
                correctCount += 1;
            }
            const savedAnswer = this.mcqAnswersRepository.create({
                assessmentId,
                questionId: question.id,
                topic: question.category,
                selectedOption: answer.selectedOption,
                isCorrect,
            });
            await this.mcqAnswersRepository.save(savedAnswer);
        }
        const total = dto.answers.length;
        const percentage = total === 0 ? 0 : Number(((correctCount / total) * 100).toFixed(2));
        await this.assessmentsService.saveAssessment(assessment);
        await this.assessmentsService.advanceRound(assessmentId);
        await this.cacheManager.del(`mcq_options:${assessmentId}`);
        return {
            score: correctCount,
            total,
            percentage,
        };
    }
    shuffle(items) {
        for (let index = items.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
        }
        return items;
    }
};
exports.McqService = McqService;
exports.McqService = McqService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(1, (0, typeorm_1.InjectRepository)(mcq_answer_entity_1.McqAnswer)),
    __param(3, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        assessments_service_1.AssessmentsService, Object, mcq_question_service_1.McqQuestionService])
], McqService);
//# sourceMappingURL=mcq.service.js.map