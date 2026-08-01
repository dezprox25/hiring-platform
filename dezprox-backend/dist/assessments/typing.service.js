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
exports.TypingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const assessments_service_1 = require("./assessments.service");
const typing_result_entity_1 = require("./entities/typing-result.entity");
const assessment_status_enum_1 = require("./enums/assessment-status.enum");
const question_entity_1 = require("./entities/question.entity");
const question_type_enum_1 = require("./enums/question-type.enum");
let TypingService = class TypingService {
    constructor(typingResultsRepository, questionsRepository, assessmentsService) {
        this.typingResultsRepository = typingResultsRepository;
        this.questionsRepository = questionsRepository;
        this.assessmentsService = assessmentsService;
        this.defaultPassages = [
            'Clear communication helps teams ship reliable software with fewer misunderstandings and faster feedback loops.',
            'A strong developer writes code that is easy to read, easy to maintain, and easy to improve over time.',
            'Hiring decisions improve when technical skill, collaboration, and ownership are reviewed together instead of separately.',
            'Frontend applications should balance user experience, performance, accessibility, and maintainable architecture.',
            'Backend services need predictable validation, helpful errors, and dependable logging to support production systems.',
            'Well scoped features reduce risk because teams can review, test, and release them without large unexpected changes.',
            'Good engineering habits include documenting tradeoffs, naming things clearly, and checking assumptions early.',
            'Code reviews are more effective when comments are specific, respectful, and focused on behavior rather than style.',
            'Reliable systems are built by making failures visible, recoverable, and simple to understand under pressure.',
            'Assessment platforms should evaluate practical thinking, clear structure, and communication rather than trivia alone.',
        ];
    }
    async getPassage(assessmentId, user) {
        const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);
        if (assessment.status !== assessment_status_enum_1.AssessmentStatus.ROUND_2) {
            throw new common_1.BadRequestException('Typing round is not active');
        }
        return { passage: await this.resolvePassage(assessmentId) };
    }
    calculateWpm(typedText, passage, timeTakenSeconds) {
        const trimmed = typedText.trim();
        const wordCount = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
        const wpm = Math.round((wordCount / timeTakenSeconds) * 60);
        let mistakes = 0;
        const comparisonLength = Math.max(typedText.length, passage.length);
        for (let index = 0; index < comparisonLength; index += 1) {
            if ((typedText[index] ?? '') !== (passage[index] ?? '')) {
                mistakes += 1;
            }
        }
        const accuracyBase = passage.length === 0 ? 100 : ((passage.length - mistakes) / passage.length) * 100;
        return {
            wpm,
            accuracy: Number(Math.max(0, accuracyBase).toFixed(2)),
            mistakes,
        };
    }
    async submitTyping(assessmentId, dto, user) {
        const assessment = await this.assessmentsService.getAssessmentForUser(assessmentId, user);
        if (assessment.status !== assessment_status_enum_1.AssessmentStatus.ROUND_2) {
            throw new common_1.BadRequestException('Typing round is not active');
        }
        this.assessmentsService.validateTimeLimit(assessment, 'typing');
        const expectedPassage = await this.resolvePassage(assessmentId);
        const metrics = this.calculateWpm(dto.typedText, expectedPassage, dto.timeTakenSeconds);
        const existing = await this.typingResultsRepository.findOne({ where: { assessmentId } });
        const result = existing ?? this.typingResultsRepository.create({ assessmentId });
        result.passage = expectedPassage;
        result.typedText = dto.typedText;
        result.timeTakenSeconds = dto.timeTakenSeconds;
        result.wpm = metrics.wpm;
        result.accuracy = metrics.accuracy;
        result.mistakes = metrics.mistakes;
        const saved = await this.typingResultsRepository.save(result);
        await this.assessmentsService.saveAssessment(assessment);
        await this.assessmentsService.advanceRound(assessmentId);
        return saved;
    }
    async resolvePassage(assessmentId) {
        const dbPassages = await this.questionsRepository.find({
            where: { type: question_type_enum_1.QuestionType.TYPING, isActive: true },
            order: { id: 'ASC' },
        });
        const list = dbPassages.length > 0 ? dbPassages.map((q) => q.text) : this.defaultPassages;
        const numericSeed = Number.parseInt(assessmentId.replace(/-/g, '').slice(0, 8), 16);
        const index = Number.isNaN(numericSeed) ? 0 : numericSeed % list.length;
        return list[index];
    }
};
exports.TypingService = TypingService;
exports.TypingService = TypingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(typing_result_entity_1.TypingResult)),
    __param(1, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        assessments_service_1.AssessmentsService])
], TypingService);
//# sourceMappingURL=typing.service.js.map