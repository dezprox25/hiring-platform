"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMcqAnswers1700000004 = void 0;
class CreateMcqAnswers1700000004 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "mcq_answers" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "assessment_id" UUID NOT NULL REFERENCES "assessments"("id") ON DELETE CASCADE,
        "question_id" UUID NOT NULL,
        "selected_option" VARCHAR(255) NOT NULL,
        "is_correct" BOOLEAN NOT NULL DEFAULT false,
        "topic" VARCHAR(100) NOT NULL,
        "answered_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE("assessment_id", "question_id")
      );
    `);
        await queryRunner.query(`CREATE INDEX "idx_mcq_assessment_id" ON "mcq_answers" ("assessment_id");`);
        await queryRunner.query(`CREATE INDEX "idx_mcq_topic" ON "mcq_answers" ("topic");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "mcq_answers";`);
    }
}
exports.CreateMcqAnswers1700000004 = CreateMcqAnswers1700000004;
//# sourceMappingURL=1700000004-CreateMcqAnswers.js.map