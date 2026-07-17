"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
function applyDatabaseUrlFromEnv() {
    const url = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
    if (!url)
        return;
    const parsed = new URL(url);
    process.env.DB_HOST = parsed.hostname;
    process.env.DB_PORT = parsed.port || '5432';
    process.env.DB_USER = decodeURIComponent(parsed.username);
    process.env.DB_PASS = decodeURIComponent(parsed.password);
    process.env.DB_NAME = parsed.pathname.replace(/^\//, '') || 'railway';
    const host = parsed.hostname.toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === 'postgres';
    process.env.DB_SSL = isLocal ? 'false' : 'true';
}
exports.default = (0, config_1.registerAs)('database', () => {
    applyDatabaseUrlFromEnv();
    const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'];
    required.forEach((key) => {
        if (!process.env[key]) {
            throw new Error(`Missing required env var: ${key}. Set DB_* or DATABASE_PUBLIC_URL (Railway TCP proxy URL for local dev).`);
        }
    });
    return {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true',
    };
});
//# sourceMappingURL=database.config.js.map