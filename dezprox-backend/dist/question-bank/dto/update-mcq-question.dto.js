"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMcqQuestionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_mcq_question_dto_1 = require("./create-mcq-question.dto");
class UpdateMcqQuestionDto extends (0, mapped_types_1.PartialType)(create_mcq_question_dto_1.CreateMcqQuestionDto) {
}
exports.UpdateMcqQuestionDto = UpdateMcqQuestionDto;
//# sourceMappingURL=update-mcq-question.dto.js.map