"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUsers1700000001 = void 0;
class CreateUsers1700000001 {
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "users";`);
    }
}
exports.CreateUsers1700000001 = CreateUsers1700000001;
//# sourceMappingURL=1700000001-CreateUsers.js.map