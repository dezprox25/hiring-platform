# Dezprox Hiring Platform - Database Guide

This document covers database initialization, migrations, and production recommendations.

## Overview

- **Engine**: PostgreSQL 15+
- **ORM**: TypeORM
- **Migration Strategy**: Explicit migrations (no `synchronize: true`)

## Initialization

When starting the platform for the first time:

1.  **Ensure PostgreSQL is running**: The database must exist (created via `DB_NAME` environment variable).
2.  **Run Migrations**: 
    ```bash
    cd dezprox-backend
    npm run migration:run
    ```
    In Docker, this can be automated in the startup script or run manually once.

## Common Commands

- **Run pending migrations**: `npm run migration:run`
- **Revert last migration**: `npm run migration:revert`
- **Generate new migration**: `npm run migration:generate src/database/migrations/YourMigrationName`
- **Create empty migration**: `npm run migration:create src/database/migrations/YourMigrationName`

## Production Recommendations

### 1. Connection Pooling
TypeORM uses a connection pool by default. For production:
- Ensure `DB_MAX_CONNECTIONS` (if implemented) is tuned to your server resources.
- For high-scale, consider using a tool like **PgBouncer** between the backend and the database.

### 2. Backup Strategy
- **Daily Backups**: Use `pg_dump` for daily logical backups.
- **WAL Archiving**: For point-in-time recovery (PITR).
- **Automation**: Use a cron job or a managed service backup feature (e.g., AWS RDS Snapshots).

Example backup command:
```bash
docker exec postgres pg_dump -U postgres dezprox > backup_$(date +%Y%m%d).sql
```

### 3. Monitoring
- Monitor slow queries using `pg_stat_statements`.
- Track disk usage for the `postgres_data` volume.
- Set up alerts for high CPU or memory usage on the DB host.

### 4. Security
- Never use the `postgres` user for the application. Create a dedicated user with limited permissions.
- Ensure `DB_SSL=true` is enabled for cloud database connections.
- Keep PostgreSQL patched to the latest stable version.
