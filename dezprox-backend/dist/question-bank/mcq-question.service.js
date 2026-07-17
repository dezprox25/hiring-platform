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
exports.McqQuestionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mcq_question_entity_1 = require("./entities/mcq-question.entity");
const difficulty_enum_1 = require("./enums/difficulty.enum");
const question_status_enum_1 = require("./enums/question-status.enum");
let McqQuestionService = class McqQuestionService {
    constructor(mcqQuestionRepository) {
        this.mcqQuestionRepository = mcqQuestionRepository;
    }
    async create(dto) {
        if (!dto.options.includes(dto.correctAnswer)) {
            throw new common_1.BadRequestException('Correct answer must be one of the options');
        }
        const question = this.mcqQuestionRepository.create(dto);
        return this.mcqQuestionRepository.save(question);
    }
    async bulkImport(csvString) {
        const lines = csvString.split(/\r?\n/).filter((line) => line.trim() !== '');
        if (lines.length < 2) {
            throw new common_1.BadRequestException('CSV must include a header and at least one data row');
        }
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const dataRows = lines.slice(1);
        const validQuestions = [];
        const errors = [];
        dataRows.forEach((line, index) => {
            const rowIndex = index + 2;
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.trim().replace(/^"|"$/g, ''));
            if (values.length < 9) {
                errors.push({ row: rowIndex, message: 'Insufficient columns' });
                return;
            }
            const [questionText, option1, option2, option3, option4, correctAnswer, topic, roleApplied, difficultyStr,] = values;
            const options = [option1, option2, option3, option4];
            if (!options.includes(correctAnswer)) {
                errors.push({ row: rowIndex, message: 'Correct answer not in options' });
                return;
            }
            let difficulty = difficulty_enum_1.Difficulty.MEDIUM;
            if (Object.values(difficulty_enum_1.Difficulty).includes(difficultyStr.toLowerCase())) {
                difficulty = difficultyStr.toLowerCase();
            }
            const question = this.mcqQuestionRepository.create({
                questionText,
                options,
                correctAnswer,
                topic,
                roleApplied,
                difficulty,
                status: question_status_enum_1.QuestionStatus.ACTIVE,
            });
            validQuestions.push(question);
        });
        if (validQuestions.length === 0 && errors.length > 0) {
            throw new common_1.BadRequestException('All rows failed validation');
        }
        if (validQuestions.length > 0) {
            await this.mcqQuestionRepository.save(validQuestions);
        }
        return {
            imported: validQuestions.length,
            failed: errors.length,
            errors,
        };
    }
    async findAll(filters) {
        const { status, topic, roleApplied, difficulty, page = 1, limit = 20 } = filters;
        const query = this.mcqQuestionRepository.createQueryBuilder('q');
        query.where('q.isDeleted = :isDeleted', { isDeleted: false });
        if (status)
            query.andWhere('q.status = :status', { status });
        if (topic)
            query.andWhere('LOWER(q.topic) = LOWER(:topic)', { topic });
        if (roleApplied)
            query.andWhere('LOWER(q.roleApplied) = LOWER(:roleApplied)', { roleApplied });
        if (difficulty)
            query.andWhere('q.difficulty = :difficulty', { difficulty });
        const [items, total] = await query
            .orderBy('q.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        const data = items.map(({ correctAnswer, ...rest }) => rest);
        return { data, total, page, limit };
    }
    async findOne(id) {
        const question = await this.mcqQuestionRepository.findOne({
            where: { id, isDeleted: false },
        });
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        return question;
    }
    async findOneSafe(id) {
        const { correctAnswer, ...safeQuestion } = await this.findOne(id);
        return safeQuestion;
    }
    async findForAssessment(roleApplied, limit) {
        return this.mcqQuestionRepository
            .createQueryBuilder('q')
            .where('q.status = :status', { status: question_status_enum_1.QuestionStatus.ACTIVE })
            .andWhere('q.isDeleted = :isDeleted', { isDeleted: false })
            .andWhere('LOWER(q.roleApplied) = LOWER(:role)', { roleApplied })
            .orderBy('RANDOM()')
            .limit(limit)
            .getMany();
    }
    async update(id, dto) {
        const question = await this.findOne(id);
        if (dto.options && dto.correctAnswer) {
            if (!dto.options.includes(dto.correctAnswer)) {
                throw new common_1.BadRequestException('Correct answer must be one of the options');
            }
        }
        else if (dto.options) {
            if (!dto.options.includes(question.correctAnswer)) {
                throw new common_1.BadRequestException('New options must include the existing correct answer');
            }
        }
        else if (dto.correctAnswer) {
            if (!question.options.includes(dto.correctAnswer)) {
                throw new common_1.BadRequestException('New correct answer must be one of the existing options');
            }
        }
        Object.assign(question, dto);
        return this.mcqQuestionRepository.save(question);
    }
    async toggleStatus(id, status) {
        const question = await this.findOne(id);
        question.status = status;
        return this.mcqQuestionRepository.save(question);
    }
    async softDelete(id) {
        const question = await this.findOne(id);
        question.isDeleted = true;
        await this.mcqQuestionRepository.save(question);
    }
};
exports.McqQuestionService = McqQuestionService;
exports.McqQuestionService = McqQuestionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mcq_question_entity_1.McqQuestion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], McqQuestionService);
//# sourceMappingURL=mcq-question.service.js.map