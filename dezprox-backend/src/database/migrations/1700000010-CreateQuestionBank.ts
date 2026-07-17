import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQuestionBank1700000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "question_bank_questions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" VARCHAR(20) NOT NULL CHECK (type IN ('mcq','coding')),
        "topic" VARCHAR(100) NOT NULL,
        "difficulty" VARCHAR(10) NOT NULL DEFAULT 'medium' 
          CHECK (difficulty IN ('easy','medium','hard')),
        "question_text" TEXT NOT NULL,
        "options" JSONB,
        "correct_answer" VARCHAR(255),
        "coding_prompt" TEXT,
        "role_tag" VARCHAR(100),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_qb_type" ON "question_bank_questions" ("type");`);
    await queryRunner.query(`CREATE INDEX "idx_qb_topic" ON "question_bank_questions" ("topic");`);
    await queryRunner.query(`CREATE INDEX "idx_qb_difficulty" ON "question_bank_questions" ("difficulty");`);
    await queryRunner.query(`CREATE INDEX "idx_qb_role_tag" ON "question_bank_questions" ("role_tag");`);
    await queryRunner.query(`CREATE INDEX "idx_qb_is_active" ON "question_bank_questions" ("is_active");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "question_bank_questions";`);
  }
}
