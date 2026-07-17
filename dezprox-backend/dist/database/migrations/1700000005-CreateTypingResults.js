"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTypingResults1700000005 = void 0;
class CreateTypingResults1700000005 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "typing_results" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "assessment_id" UUID NOT NULL UNIQUE REFERENCES "assessments"("id") ON DELETE CASCADE,
        "wpm" INTEGER NOT NULL DEFAULT 0,
        "accuracy" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "time_taken_seconds" INTEGER NOT NULL DEFAULT 0,
        "word_count" INTEGER NOT NULL DEFAULT 0,
        "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
        await queryRunner.query(`CREATE INDEX "idx_typing_assessment_id" ON "typing_results" ("assessment_id");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "typing_results";`);
    }
}
exports.CreateTypingResults1700000005 = CreateTypingResults1700000005;
//# sourceMappingURL=1700000005-CreateTypingResults.js.map