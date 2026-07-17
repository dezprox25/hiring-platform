import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCandidates1700000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "candidates" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE RESTRICT,
        "full_name" VARCHAR(255) NOT NULL,
        "phone" VARCHAR(30),
        "role_applied" VARCHAR(100) NOT NULL,
        "status" VARCHAR(30) NOT NULL DEFAULT 'invited' 
          CHECK (status IN ('invited','active','submitted','evaluated','hired','rejected')),
        "notes" TEXT,
        "is_deleted" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_candidates_user_id" ON "candidates" ("user_id");`);
    await queryRunner.query(`CREATE INDEX "idx_candidates_status" ON "candidates" ("status");`);
    await queryRunner.query(`CREATE INDEX "idx_candidates_is_deleted" ON "candidates" ("is_deleted");`);
    await queryRunner.query(`CREATE INDEX "idx_candidates_full_name" ON "candidates" ("full_name");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "candidates";`);
  }
}
