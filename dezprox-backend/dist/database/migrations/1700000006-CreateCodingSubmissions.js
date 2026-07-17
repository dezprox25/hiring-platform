"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCodingSubmissions1700000006 = void 0;
class CreateCodingSubmissions1700000006 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "coding_submissions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "assessment_id" UUID NOT NULL UNIQUE REFERENCES "assessments"("id") ON DELETE CASCADE,
        "draft_code" TEXT,
        "submitted_code" TEXT,
        "language" VARCHAR(50) NOT NULL DEFAULT 'javascript' 
          CHECK (language IN ('javascript','typescript','python','java','cpp','csharp')),
        "manager_score" INTEGER CHECK (manager_score BETWEEN 0 AND 100),
        "manager_notes" TEXT,
        "submitted_at" TIMESTAMPTZ,
        "reviewed_at" TIMESTAMPTZ
      );
    `);
        await queryRunner.query(`CREATE INDEX "idx_coding_assessment_id" ON "coding_submissions" ("assessment_id");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "coding_submissions";`);
    }
}
exports.CreateCodingSubmissions1700000006 = CreateCodingSubmissions1700000006;
//# sourceMappingURL=1700000006-CreateCodingSubmissions.js.map