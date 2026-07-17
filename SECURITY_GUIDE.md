# Dezprox Hiring Platform - Security Guide

This document outlines the security measures implemented in the platform.

## 1. Authentication & Authorization
- **JWT (JSON Web Tokens)**: Used for stateless authentication.
  - Access Tokens: Short-lived (15m).
  - Refresh Tokens: Long-lived (7d) for session persistence.
  - Storage: Access tokens are kept in memory/localStorage (Frontend); Refresh tokens are handled via secure API calls.
- **Role-Based Access Control (RBAC)**: Enforced using `@Roles()` decorator and `RolesGuard`.
  - Roles: `CANDIDATE`, `HR`, `MANAGER`, `ADMIN`.

## 2. API Security
- **Helmet**: Middleware used to set various HTTP headers for security (HSTS, CSP, XSS protection, etc.).
- **CORS**: Restricted to the `FRONTEND_URL`. Only authorized origins can make requests.
- **Rate Limiting**: `ThrottlerModule` prevents brute-force attacks by limiting requests to 100 per minute per IP.
- **Validation**: Strict input validation using `ValidationPipe` and `Zod`. Non-whitelisted properties are stripped.

## 3. Real-time Security
- **WebSocket Auth**: `WsJwtGuard` ensures only authenticated users can connect to the `/assessment` namespace.
- **Room Isolation**: Users can only join rooms they are explicitly authorized for (e.g., their own assessment).

## 4. Infrastructure Security
- **Network Isolation**: Backend and data services are in an isolated Docker network.
- **Non-Root User**: Docker containers run as the `node` user instead of `root`.
- **Nginx Proxy**: Acts as a buffer, handles SSL termination (recommended in production), and hides internal architecture.

## 5. Data Protection
- **Password Hashing**: (Verify in code if Bcrypt is used).
- **Sensitive Logs**: Pino is configured to redact `Authorization` headers and passwords from logs.
- **Sentry**: Used for monitoring but configured not to capture sensitive user data.

## Production Hardening Checklist
- [ ] Change all default passwords (`DB_PASS`, `REDIS_PASSWORD`).
- [ ] Generate strong, unique `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- [ ] Enable `DB_SSL=true` for cloud databases.
- [ ] Ensure `NODE_ENV=production`.
- [ ] Use HTTPS for all production domains.
- [ ] Regularly update Docker images to patch vulnerabilities.
- [ ] Use a Secret Manager (AWS Secrets Manager, HashiCorp Vault) instead of plain `.env` files in production.
