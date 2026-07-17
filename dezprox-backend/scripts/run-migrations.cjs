/**
 * Run TypeORM migrations (bypasses strict migration class name checks in newer TypeORM).
 * Usage: npm run migration:run
 */
require('dotenv').config();
const { applyDatabaseUrlEnv } = require('./resolve-db-env.cjs');
applyDatabaseUrlEnv();
const fs = require('fs');
const path = require('path');
const { DataSource } = require('typeorm');

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing env: ${key}`);
    process.exit(1);
  }
}

const migrationsDir = path.join(__dirname, '../dist/database/migrations');

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await dataSource.initialize();

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS "migrations" (
      "id" SERIAL PRIMARY KEY,
      "timestamp" BIGINT NOT NULL,
      "name" VARCHAR NOT NULL
    );
  `);

  const applied = await dataSource.query(`SELECT name FROM migrations`);
  const appliedNames = new Set(applied.map((r) => r.name));

  /** Legacy dev DB: users table created outside migrations — mark baseline as applied. */
  const usersReg = await dataSource.query(`SELECT to_regclass('public.users') AS reg`);
  if (usersReg[0]?.reg && !appliedNames.has('CreateUsers1700000001')) {
    await dataSource.query(`INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`, [
      1700000001,
      'CreateUsers1700000001',
    ]);
    appliedNames.add('CreateUsers1700000001');
    console.log('Stamped existing users table as CreateUsers1700000001');
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.js') && !f.endsWith('.map'))
    .sort();

  for (const file of files) {
    const mod = require(path.join(migrationsDir, file));
    const MigrationClass = Object.values(mod).find(
      (v) => typeof v === 'function' && v.prototype && typeof v.prototype.up === 'function',
    );
    if (!MigrationClass) {
      console.warn('Skip (no Migration class):', file);
      continue;
    }

    const instance = new MigrationClass();
    const name = MigrationClass.name;
    if (appliedNames.has(name)) {
      console.log('Skip (already applied):', name);
      continue;
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await instance.up(queryRunner);
      const ts = parseInt(file.split('-')[0], 10) || Date.now();
      await queryRunner.query(
        `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
        [ts, name],
      );
      await queryRunner.commitTransaction();
      appliedNames.add(name);
      console.log('Applied:', name);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === '42P07') {
        console.warn('Skip (already exists):', name);
        const ts = parseInt(file.split('-')[0], 10) || Date.now();
        await dataSource.query(`INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`, [
          ts,
          name,
        ]);
        appliedNames.add(name);
        continue;
      }
      console.error('Failed:', name, err.message);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  await dataSource.destroy();
  console.log('Migrations complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
