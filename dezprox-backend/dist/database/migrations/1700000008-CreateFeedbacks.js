"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFeedbacks1700000008 = void 0;
class CreateFeedbacks1700000008 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "feedbacks" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "report_id" UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
        "manager_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "comment" TEXT NOT NULL,
        "recommendation" VARCHAR(10) NOT NULL CHECK (recommendation IN ('hire','reject','hold')),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE("report_id", "manager_id")
      );
    `);
        await queryRunner.query(`CREATE INDEX "idx_feedbacks_report_id" ON "feedbacks" ("report_id");`);
        await queryRunner.query(`CREATE INDEX "idx_feedbacks_manager_id" ON "feedbacks" ("manager_id");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "feedbacks";`);
    }
}
exports.CreateFeedbacks1700000008 = CreateFeedbacks1700000008;
//# sourceMappingURL=1700000008-CreateFeedbacks.js.map