"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReports1700000007 = void 0;
class CreateReports1700000007 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "candidate_id" UUID NOT NULL UNIQUE REFERENCES "candidates"("id") ON DELETE RESTRICT,
        "assessment_id" UUID NOT NULL UNIQUE REFERENCES "assessments"("id") ON DELETE RESTRICT,
        "mcq_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "mcq_correct" INTEGER NOT NULL DEFAULT 0,
        "mcq_total" INTEGER NOT NULL DEFAULT 0,
        "mcq_topic_breakdown" JSONB NOT NULL DEFAULT '{}',
        "typing_wpm" INTEGER NOT NULL DEFAULT 0,
        "typing_accuracy" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "coding_manager_score" DECIMAL(5,2),
        "coding_ai_score" DECIMAL(5,2),
        "total_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "is_result_released" BOOLEAN NOT NULL DEFAULT false,
        "is_shortlisted" BOOLEAN NOT NULL DEFAULT false,
        "recommendation" VARCHAR(10) CHECK (recommendation IN ('hire','reject','hold')),
        "notes" TEXT,
        "generated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
        await queryRunner.query(`CREATE INDEX "idx_reports_candidate_id" ON "reports" ("candidate_id");`);
        await queryRunner.query(`CREATE INDEX "idx_reports_is_result_released" ON "reports" ("is_result_released");`);
        await queryRunner.query(`CREATE INDEX "idx_reports_total_score" ON "reports" ("total_score");`);
        await queryRunner.query(`CREATE INDEX "idx_reports_recommendation" ON "reports" ("recommendation");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "reports";`);
    }
}
exports.CreateReports1700000007 = CreateReports1700000007;
//# sourceMappingURL=1700000007-CreateReports.js.map