import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiEvaluations1700000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ai_evaluations" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "candidate_id" UUID NOT NULL UNIQUE REFERENCES "candidates"("id") ON DELETE RESTRICT,
        "assessment_id" UUID NOT NULL UNIQUE REFERENCES "assessments"("id") ON DELETE RESTRICT,
        "strengths" JSONB NOT NULL DEFAULT '[]',
        "weaknesses" JSONB NOT NULL DEFAULT '[]',
        "skill_scores" JSONB NOT NULL DEFAULT '{}',
        "summary" TEXT,
        "recommendation" VARCHAR(10) CHECK (recommendation IN ('hire','reject','hold')),
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending' 
          CHECK (status IN ('pending','completed','failed')),
        "evaluated_at" TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_ai_candidate_id" ON "ai_evaluations" ("candidate_id");`);
    await queryRunner.query(`CREATE INDEX "idx_ai_status" ON "ai_evaluations" ("status");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ai_evaluations";`);
  }
}
