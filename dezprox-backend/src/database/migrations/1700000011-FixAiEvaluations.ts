import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAiEvaluations1700000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Update strengths and weaknesses from JSONB to TEXT[]
    // 2. Add missing columns: coding_analysis, communication_analysis, overall_score, raw_response, error_message, last_evaluated_at, created_at, updated_at
    // 3. Update status check constraint to include 'running'
    // 4. Remove skill_scores column
    
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

    // Update status constraint
    await queryRunner.query(`
      ALTER TABLE "ai_evaluations" DROP CONSTRAINT IF EXISTS "ai_evaluations_status_check";
      ALTER TABLE "ai_evaluations" ADD CONSTRAINT "ai_evaluations_status_check" 
      CHECK (status IN ('pending', 'running', 'completed', 'failed'));
    `);

    // Rename evaluated_at to last_evaluated_at if it exists and last_evaluated_at is null
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Basic rollback (might not be perfect but covers the essentials)
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
