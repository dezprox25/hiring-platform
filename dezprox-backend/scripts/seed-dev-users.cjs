/**
 * One-off / repeatable dev seed for demo login accounts.
 * Usage (from dezprox-backend): node scripts/seed-dev-users.cjs
 * Requires .env with DB_* vars (loads dotenv from parent .env).
 */
require('dotenv').config();
const { applyDatabaseUrlEnv } = require('./resolve-db-env.cjs');
applyDatabaseUrlEnv();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

const ACCOUNTS = [
  { email: 'priya@dezprox.com', role: 'admin' },
  { email: 'karan@dezprox.com', role: 'manager' },
  { email: 'neha@dezprox.com', role: 'hr' },
  { email: 'aarav@dezprox.com', role: 'candidate' },
];

const PASSWORD = 'password123';

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'dezprox',
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : undefined,
  });

  await client.connect();
  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const { email, role } of ACCOUNTS) {
    await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
      [email.toLowerCase(), hash, role],
    );
    console.log('OK', email, role);
  }

  const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM users');
  console.log('users row count:', rows[0].n);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
