import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixEverythingElse1700000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Fix coding_submissions
    await queryRunner.query(`
      ALTER TABLE "coding_submissions" 
      RENAME COLUMN "submitted_code" TO "code";
    `);
    await queryRunner.query(`
      ALTER TABLE "coding_submissions" 
      RENAME COLUMN "manager_notes" TO "manager_feedback";
    `);
    await queryRunner.query(`
      ALTER TABLE "coding_submissions" 
      RENAME COLUMN "reviewed_at" TO "manager_reviewed_at";
    `);
    await queryRunner.query(`
      ALTER TABLE "coding_submissions"
      ADD COLUMN IF NOT EXISTS "question_id" UUID,
      ADD COLUMN IF NOT EXISTS "time_taken_seconds" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "ai_score" INTEGER,
      ADD COLUMN IF NOT EXISTS "ai_analysis" JSONB,
      ADD COLUMN IF NOT EXISTS "ai_analysed_at" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now();
    `);

    // 2. Fix typing_results
    await queryRunner.query(`
      ALTER TABLE "typing_results"
      ADD COLUMN IF NOT EXISTS "passage" TEXT,
      ADD COLUMN IF NOT EXISTS "typed_text" TEXT,
      ADD COLUMN IF NOT EXISTS "mistakes" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ NOT NULL DEFAULT now();
    `);

    // 3. Create mcq_questions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mcq_questions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "question_text" TEXT NOT NULL,
        "options" TEXT[] NOT NULL DEFAULT '{}',
        "correct_answer" TEXT NOT NULL,
        "topic" VARCHAR(100) NOT NULL,
        "role_applied" VARCHAR(100) NOT NULL,
        "difficulty" VARCHAR(20) NOT NULL DEFAULT 'medium',
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 4. Create coding_questions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coding_questions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "prompt" TEXT NOT NULL,
        "language" VARCHAR(50) NOT NULL,
        "difficulty" VARCHAR(20) NOT NULL DEFAULT 'medium',
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    
    // 5. Create questions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "questions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" VARCHAR(20) NOT NULL,
        "category" VARCHAR(100) NOT NULL,
        "difficulty" VARCHAR(20) NOT NULL,
        "text" TEXT NOT NULL,
        "options" JSONB,
        "correct_answer" TEXT,
        "code_starter" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_by_id" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
