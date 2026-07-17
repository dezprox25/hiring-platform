"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCodingQuestionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_coding_question_dto_1 = require("./create-coding-question.dto");
class UpdateCodingQuestionDto extends (0, mapped_types_1.PartialType)(create_coding_question_dto_1.CreateCodingQuestionDto) {
}
exports.UpdateCodingQuestionDto = UpdateCodingQuestionDto;
//# sourceMappingURL=update-coding-question.dto.js.map