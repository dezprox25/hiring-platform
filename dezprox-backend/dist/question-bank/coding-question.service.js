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
exports.CodingQuestionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const coding_question_entity_1 = require("./entities/coding-question.entity");
const question_status_enum_1 = require("./enums/question-status.enum");
let CodingQuestionService = class CodingQuestionService {
    constructor(codingQuestionRepository) {
        this.codingQuestionRepository = codingQuestionRepository;
    }
    async create(dto) {
        const question = this.codingQuestionRepository.create(dto);
        return this.codingQuestionRepository.save(question);
    }
    async findAll(filters) {
        const { status, language, difficulty, page = 1, limit = 20 } = filters;
        const query = this.codingQuestionRepository.createQueryBuilder('q');
        query.where('q.isDeleted = :isDeleted', { isDeleted: false });
        if (status)
            query.andWhere('q.status = :status', { status });
        if (language)
            query.andWhere('q.language = :language', { language });
        if (difficulty)
            query.andWhere('q.difficulty = :difficulty', { difficulty });
        const [data, total] = await query
            .orderBy('q.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total, page, limit };
    }
    async findOne(id) {
        const question = await this.codingQuestionRepository.findOne({
            where: { id, isDeleted: false },
        });
        if (!question)
            throw new common_1.NotFoundException('Coding question not found');
        return question;
    }
    async findOneActive(language) {
        return this.codingQuestionRepository.findOne({
            where: {
                language,
                status: question_status_enum_1.QuestionStatus.ACTIVE,
                isDeleted: false,
            },
            order: { createdAt: 'DESC' },
        });
    }
    async update(id, dto) {
        const question = await this.findOne(id);
        Object.assign(question, dto);
        return this.codingQuestionRepository.save(question);
    }
    async toggleStatus(id, status) {
        const question = await this.findOne(id);
        question.status = status;
        return this.codingQuestionRepository.save(question);
    }
    async softDelete(id) {
        const question = await this.findOne(id);
        question.isDeleted = true;
        await this.codingQuestionRepository.save(question);
    }
};
exports.CodingQuestionService = CodingQuestionService;
exports.CodingQuestionService = CodingQuestionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(coding_question_entity_1.CodingQuestion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CodingQuestionService);
//# sourceMappingURL=coding-question.service.js.map