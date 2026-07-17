import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssessments1700000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "assessments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "candidate_id" UUID NOT NULL UNIQUE REFERENCES "candidates"("id") ON DELETE RESTRICT,
        "status" VARCHAR(30) NOT NULL DEFAULT 'not_started' 
          CHECK (status IN ('not_started','round_1','round_2','round_3','completed')),
        "started_at" TIMESTAMPTZ,
        "round2_started_at" TIMESTAMPTZ,
        "round3_started_at" TIMESTAMPTZ,
        "completed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_assessments_candidate_id" ON "assessments" ("candidate_id");`);
    await queryRunner.query(`CREATE INDEX "idx_assessments_status" ON "assessments" ("status");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "assessments";`);
  }
}
