import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1700000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "role" VARCHAR(20) NOT NULL CHECK (role IN ('admin','manager','hr','candidate')),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "refresh_token_hash" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email");`);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users";`);
  }
}
