/**
 * Maps DATABASE_PUBLIC_URL or DATABASE_URL into DB_* env vars for local scripts.
 * Railway private host (RAILWAY_PRIVATE_DOMAIN:5432) only works inside Railway;
 * from your laptop use the TCP proxy URL from the Postgres service → Connect tab.
 */
function applyDatabaseUrlEnv() {
  const url =
    process.env.DATABASE_PUBLIC_URL ||
    process.env.DATABASE_URL ||
    '';

  if (!url) {
    return;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    console.error('Invalid DATABASE_PUBLIC_URL / DATABASE_URL');
    process.exit(1);
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    console.error('Database URL must use postgresql:// or postgres://');
    process.exit(1);
  }

  process.env.DB_HOST = parsed.hostname;
  process.env.DB_PORT = parsed.port || '5432';
  process.env.DB_USER = decodeURIComponent(parsed.username);
  process.env.DB_PASS = decodeURIComponent(parsed.password);
  process.env.DB_NAME = parsed.pathname.replace(/^\//, '') || 'railway';

  const host = parsed.hostname.toLowerCase();
  const isLocal =
    host === 'localhost' || host === '127.0.0.1' || host === 'postgres';
  process.env.DB_SSL = isLocal ? 'false' : 'true';
}

module.exports = { applyDatabaseUrlEnv };
