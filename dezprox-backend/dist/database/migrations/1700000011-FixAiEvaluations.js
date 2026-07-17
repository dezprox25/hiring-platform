"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixAiEvaluations1700000011 = void 0;
class FixAiEvaluations1700000011 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "ai_evaluations" 
      DROP COLUMN IF EXISTS "skill_scores",
      DROP COLUMN IF EXISTS "strengths",
      DROP COLUMN IF EXISTS "weaknesses",
      ADD COLUMN "strengths" TEXT[] NOT NULL DEFAULT '{}',
      ADD COLUMN "weaknesses" TEXT[] NOT NULL DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "coding_analysis" JSONB,
      ADD COLUMN IF NOT EXISTS "communication_analysis" JSONB,
      ADD COLUMN IF NOT EXISTS "overall_score" DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS "raw_response" TEXT,
      ADD COLUMN IF NOT EXISTS "error_message" TEXT,
      ADD COLUMN IF NOT EXISTS "last_evaluated_at" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now();
    `);
        await queryRunner.query(`
      ALTER TABLE "ai_evaluations" DROP CONSTRAINT IF EXISTS "ai_evaluations_status_check";
      ALTER TABLE "ai_evaluations" ADD CONSTRAINT "ai_evaluations_status_check" 
      CHECK (status IN ('pending', 'running', 'completed', 'failed'));
    `);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_evaluations' AND column_name='evaluated_at') THEN
          UPDATE "ai_evaluations" SET "last_evaluated_at" = "evaluated_at" WHERE "last_evaluated_at" IS NULL;
          ALTER TABLE "ai_evaluations" DROP COLUMN "evaluated_at";
        END IF;
      END $$;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "ai_evaluations" 
      DROP COLUMN IF EXISTS "coding_analysis",
      DROP COLUMN IF EXISTS "communication_analysis",
      DROP COLUMN IF EXISTS "overall_score",
      DROP COLUMN IF EXISTS "raw_response",
      DROP COLUMN IF EXISTS "error_message",
      DROP COLUMN IF EXISTS "last_evaluated_at",
      DROP COLUMN IF EXISTS "created_at",
      DROP COLUMN IF EXISTS "updated_at";
    `);
    }
}
exports.FixAiEvaluations1700000011 = FixAiEvaluations1700000011;
//# sourceMappingURL=1700000011-FixAiEvaluations.js.map