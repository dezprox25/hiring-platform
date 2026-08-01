import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixFeedbacksAndConstraints1700000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Fix feedbacks table migration drift
    await queryRunner.query(`
      ALTER TABLE "feedbacks"
      DROP COLUMN IF EXISTS "comment",
      ADD COLUMN IF NOT EXISTS "overall_rating" INTEGER NOT NULL DEFAULT 5,
      ADD COLUMN IF NOT EXISTS "technical_comment" TEXT,
      ADD COLUMN IF NOT EXISTS "communication_comment" TEXT,
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now();
    `);

    // 2. Add foreign key constraint on mcq_answers.question_id referencing questions table if possible
    // Note: Use DO code block or exception handling in case there are orphan records in dev/demo environments
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_mcq_answers_question_id'
        ) THEN
          ALTER TABLE "mcq_answers" 
          ADD CONSTRAINT "fk_mcq_answers_question_id" 
          FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE;
        END IF;
      EXCEPTION
        WHEN foreign_key_violation THEN
          -- In case existing orphan records violate FK, log and skip or handle accordingly
          NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "mcq_answers" DROP CONSTRAINT IF EXISTS "fk_mcq_answers_question_id";
    `);

    await queryRunner.query(`
      ALTER TABLE "feedbacks"
      DROP COLUMN IF EXISTS "overall_rating",
      DROP COLUMN IF EXISTS "technical_comment",
      DROP COLUMN IF EXISTS "communication_comment",
      DROP COLUMN IF EXISTS "updated_at",
      ADD COLUMN IF NOT EXISTS "comment" TEXT NOT NULL DEFAULT '';
    `);
  }
}
