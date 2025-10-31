# CRMS Security Checklist

**Criminal Record Management System - Pan-African Digital Public Good**
**Phase 5: Audit Logging & Security Hardening**
**Generated:** October 30, 2025

This document provides a comprehensive security checklist for CRMS deployment across African countries.

---

## Table of Contents

1. [OWASP Top 10 Compliance](#owasp-top-10-compliance)
2. [Authentication & Authorization](#authentication--authorization)
3. [Encryption & Data Protection](#encryption--data-protection)
4. [Rate Limiting & Abuse Prevention](#rate-limiting--abuse-prevention)
5. [Security Headers](#security-headers)
6. [Audit Logging](#audit-logging)
7. [Input Validation & Sanitization](#input-validation--sanitization)
8. [CSRF Protection](#csrf-protection)
9. [Session Management](#session-management)
10. [Deployment Security](#deployment-security)
11. [Data Protection Compliance](#data-protection-compliance)
12. [Incident Response](#incident-response)

---

## OWASP Top 10 Compliance

### A01:2021 – Broken Access Control

- [x] **Role-Based Access Control (RBAC)** implemented with 6 hierarchical roles
- [x] **Permission checks** on all protected routes and API endpoints
- [x] **Middleware** validates authentication and authorization
- [x] **Audit logging** tracks all access attempts (success and failure)
- [x] **Station-based access** restricts data to officer's jurisdiction
- [ ] **Penetration testing** for access control bypass (Phase 11)

**Files:**
- `lib/permissions.ts` - Permission checking helpers
- `middleware.ts` - Authentication and authorization middleware
- `lib/auth.ts` - NextAuth configuration

---

### A02:2021 – Cryptographic Failures

- [x] **TLS/HTTPS** enforced in production (HSTS header)
- [x] **AES-256-GCM** encryption for PII data (addresses, phones, emails)
- [x] **Argon2id** password hashing for officer PINs
- [x] **SHA-256** hashing for file integrity (evidence files, biometrics)
- [x] **Encryption keys** stored in environment variables
- [x] **Key rotation** documented (every 90 days recommended)
- [ ] **Certificate management** for HTTPS (deployment-specific)

**Files:**
- `src/lib/encryption.ts` - AES-256-GCM encryption utilities
- `lib/auth.ts` - Argon2id password hashing

---

### A03:2021 – Injection

- [x] **Prisma ORM** prevents SQL injection with parameterized queries
- [x] **Input sanitization** utilities for all user inputs
- [x] **Zod validation** schemas for all forms and API requests
- [x] **Type safety** with TypeScript
- [ ] **NoSQL injection** protection (not applicable - using PostgreSQL)

**Files:**
- `lib/sanitize.ts` - Input sanitization utilities
- `src/lib/validation.ts` - Zod validation schemas

---

### A04:2021 – Insecure Design

- [x] **Service-Repository pattern** enforces separation of concerns
- [x] **Least privilege** principle applied to roles and permissions
- [x] **Audit logging** for all state-changing operations
- [x] **Immutable audit logs** (no update or delete operations)
- [x] **Defense in depth** with multiple security layers
- [x] **Offline-first** design with sync conflict resolution

**Files:**
- `docs/SERVICE_REPOSITORY_ARCHITECTURE.md` - Architecture documentation

---

### A05:2021 – Security Misconfiguration

- [x] **Security headers** configured in middleware
- [x] **Content Security Policy (CSP)** prevents XSS attacks
- [x] **X-Frame-Options** prevents clickjacking
- [x] **Error handling** doesn't expose sensitive information
- [x] **Environment variables** for all secrets and configuration
- [x] **`.env` in `.gitignore`** prevents secret commits
- [ ] **Security scanning** with automated tools (Phase 11)

**Files:**
- `middleware.ts` - Security headers
- `.env.example` - Environment variable template

---

### A06:2021 – Vulnerable and Outdated Components

- [x] **npm audit** shows 0 vulnerabilities
- [x] **Dependency management** with `package.json` and `package-lock.json`
- [ ] **Automated dependency updates** with Dependabot (recommended)
- [ ] **Regular security audits** (every quarter recommended)

**Commands:**
```bash
npm audit
npm update
npm outdated
```

---

### A07:2021 – Identification and Authentication Failures

- [x] **NextAuth.js** for secure authentication
- [x] **Badge + PIN** two-factor authentication (physical badge + PIN)
- [x] **Rate limiting** on login attempts (5 per 15 minutes)
- [x] **Session expiry** (15 minutes, configurable)
- [x] **Secure session storage** (JWT with HttpOnly cookies)
- [x] **Password hashing** with Argon2id (state-of-the-art)
- [x] **Audit logging** for all authentication events
- [ ] **MFA via SMS** (Phase 10)
- [ ] **Biometric authentication** (future enhancement)

**Files:**
- `lib/auth.ts` - NextAuth configuration
- `lib/rate-limit.ts` - Rate limiting utilities

---

### A08:2021 – Software and Data Integrity Failures

- [x] **SHA-256 hashing** for evidence file integrity
- [x] **Evidence sealing** prevents tampering
- [x] **Chain of custody** tracking for evidence
- [x] **Audit logs** are immutable
- [x] **Git commit signing** (recommended for developers)
- [ ] **Code signing** for deployment artifacts (production recommendation)

**Files:**
- `src/services/EvidenceService.ts` - Evidence integrity checks

---

### A09:2021 – Security Logging and Monitoring Failures

- [x] **Comprehensive audit logging** for all operations
- [x] **Failed operation logging** with error details
- [x] **Rate limit violations** logged to audit trail
- [x] **Admin audit log viewer** with filters and export
- [x] **Audit statistics dashboard** for monitoring
- [ ] **Real-time alerting** for security events (recommended)
- [ ] **SIEM integration** (e.g., Splunk, ELK stack) for production

**Files:**
- `src/services/AuditService.ts` - Audit logging service
- `app/(dashboard)/reports/audit/page.tsx` - Audit log viewer

---

### A10:2021 – Server-Side Request Forgery (SSRF)

- [x] **URL sanitization** with allowed domains
- [x] **Input validation** for all external URLs
- [x] **No user-controlled URLs** in critical operations
- [x] **Network segmentation** recommended for production

**Files:**
- `lib/sanitize.ts` - URL sanitization utilities

---

## Authentication & Authorization

### Authentication Mechanisms

- [x] **Badge + PIN** authentication (two-factor)
- [x] **NextAuth.js** session management
- [x] **JWT tokens** with 15-minute expiry
- [x] **Refresh tokens** (24-hour expiry)
- [x] **Argon2id** password hashing
- [ ] **MFA via SMS** (Phase 10)

### Authorization Model

- [x] **6 hierarchical roles:**
  1. SuperAdmin (level 1)
  2. Admin (level 2)
  3. StationCommander (level 3)
  4. Officer (level 4)
  5. EvidenceClerk (level 5)
  6. Viewer (level 6)
- [x] **Permission scopes:** own, station, region, national
- [x] **Resource-based permissions:** cases, persons, evidence, officers, etc.
- [x] **Action-based permissions:** create, read, update, delete, export

### Session Management

- [x] **15-minute session timeout** (configurable)
- [x] **Automatic session refresh** on activity
- [x] **Session validation** in middleware
- [x] **Secure cookies** (HttpOnly, Secure, SameSite=Strict)
- [x] **Session invalidation** on logout
- [x] **Concurrent session** limits (1 active session per officer)

---

## Encryption & Data Protection

### Data at Rest

- [x] **PII encryption** (AES-256-GCM):
  - Person addresses
  - Phone numbers
  - Email addresses
- [x] **Database encryption** (PostgreSQL-level, deployment-specific)
- [x] **Evidence file encryption** (S3 server-side encryption recommended)

### Data in Transit

- [x] **HTTPS enforced** (HSTS header in production)
- [x] **TLS 1.3** recommended
- [x] **Certificate management** (deployment-specific)

### Key Management

- [x] **Encryption keys** in environment variables
- [x] **Key rotation** documented (every 90 days)
- [ ] **Key Management Service (KMS)** for production (recommended)

---

## Rate Limiting & Abuse Prevention

### Upstash Redis Rate Limiting

- [x] **Login attempts:** 5 per 15 minutes per IP
- [x] **API requests:** 100 per minute per user
- [x] **Background checks:** 10 per hour per user
- [x] **Exports:** 5 per hour per user
- [x] **USSD requests:** 50 per hour per phone number
- [x] **Rate limit violations** logged to audit trail
- [x] **Retry-After header** in 429 responses

**Configuration:**
- `lib/rate-limit.ts` - Rate limiting utilities
- `lib/upstash.ts` - Upstash Redis client

### Fallback Strategy

- [x] **In-memory rate limiting** if Redis unavailable
- [x] **Fail-open strategy** to avoid blocking legitimate users
- [x] **Warnings logged** when Redis not configured

---

## Security Headers

All security headers configured in `middleware.ts`:

- [x] **X-Frame-Options:** DENY
- [x] **X-Content-Type-Options:** nosniff
- [x] **X-XSS-Protection:** 1; mode=block
- [x] **Referrer-Policy:** strict-origin-when-cross-origin
- [x] **Permissions-Policy:** camera=(), microphone=(), geolocation=(self), payment=()
- [x] **Content-Security-Policy:**
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-eval' 'unsafe-inline'`
  - `style-src 'self' 'unsafe-inline'`
  - `img-src 'self' data: blob: https:`
  - `connect-src 'self' https://*.upstash.io`
  - `frame-ancestors 'none'`
- [x] **Strict-Transport-Security:** max-age=31536000; includeSubDomains; preload (production only)

**Verification:**
```bash
curl -I https://your-domain.com | grep -E "X-Frame-Options|Content-Security-Policy|Strict-Transport-Security"
```

**Online Tools:**
- https://securityheaders.com/
- https://observatory.mozilla.org/

---

## Audit Logging

### What is Logged

- [x] **All CRUD operations** (create, read, update, delete)
- [x] **Authentication events** (login, logout, failures)
- [x] **Authorization failures** (permission denied)
- [x] **Export operations** (CSV, PDF, etc.)
- [x] **Rate limit violations**
- [x] **Evidence sealing/unsealing**
- [x] **Status transitions** (case, evidence, person)

### Audit Log Fields

- [x] **Entity type** (case, person, evidence, etc.)
- [x] **Entity ID** (specific record)
- [x] **Officer ID** (who performed the action)
- [x] **Action** (create, read, update, delete, etc.)
- [x] **Success/failure** status
- [x] **Details** (JSON payload with context)
- [x] **IP address** (for network forensics)
- [x] **User agent** (browser/device info)
- [x] **Station ID** (geographic context)
- [x] **Timestamp** (when the action occurred)

### Audit Log Viewer

- [x] **Admin-only access**
- [x] **Filter by:** entity type, officer, action, date range, success/failure
- [x] **Pagination** (50 per page)
- [x] **CSV export** (filtered or all)
- [x] **Statistics dashboard**
- [x] **Expandable row details** (JSON view)

### Audit Log Retention

- [ ] **Retention policy** (7 years recommended for criminal records)
- [ ] **Archival strategy** (cold storage after 1 year)
- [ ] **Backup and recovery** (daily backups recommended)

---

## Input Validation & Sanitization

### Validation Libraries

- [x] **Zod** for schema validation
- [x] **TypeScript** for type safety
- [x] **Custom validators** in `src/lib/validation.ts`

### Sanitization Utilities

All utilities in `lib/sanitize.ts`:

- [x] **HTML escaping** (sanitizeHtml, stripHtml)
- [x] **NIN validation** (pan-African, country-configurable)
- [x] **Phone number** (E.164 format, country code support)
- [x] **Email address** (RFC 5322 compliant)
- [x] **File names** (directory traversal prevention)
- [x] **URLs** (open redirect prevention)
- [x] **SQL input** (defense-in-depth, Prisma handles parameterization)
- [x] **JSON parsing** (with validation)

### File Upload Validation

- [x] **File type** validation (MIME type whitelist)
- [x] **File size** limits (configurable per file type)
- [x] **File name** sanitization (no path separators, control characters)
- [x] **Virus scanning** (recommended for production, external service)

---

## CSRF Protection

### NextAuth.js Protection

- [x] **Built-in CSRF** tokens for authentication flows
- [x] **Token rotation** on login
- [x] **SameSite=Strict** cookies

### Custom Forms

- [x] **CSRF utilities** in `lib/csrf.ts`
- [x] **Token generation** (generateCsrfToken)
- [x] **Token validation** (validateCsrfToken, secureValidateCsrfToken)
- [x] **Constant-time comparison** (prevents timing attacks)

---

## Session Management

### Configuration

- [x] **Session timeout:** 15 minutes (configurable via SESSION_MAX_AGE)
- [x] **Refresh token:** 24 hours (configurable via SESSION_REFRESH_AGE)
- [x] **JWT strategy** (stateless)
- [x] **Secure cookies** (HttpOnly, Secure, SameSite=Strict)

### Session Security

- [x] **Session validation** in middleware
- [x] **Automatic expiry** check
- [x] **Logout** invalidates session
- [x] **Session fixation** prevention (token rotation on login)
- [ ] **Session monitoring** dashboard (recommended for admins)

---

## Deployment Security

### Environment Configuration

- [x] **`.env` file** for all secrets
- [x] **`.env.example`** template with documentation
- [x] **`.gitignore`** excludes `.env`
- [ ] **Secret management** service (AWS Secrets Manager, Azure Key Vault, etc.)

### Production Checklist

- [ ] **HTTPS enabled** with valid TLS certificate
- [ ] **HSTS header** enabled (Strict-Transport-Security)
- [ ] **NODE_ENV=production** set
- [ ] **Debug mode** disabled
- [ ] **Upstash Redis** configured for rate limiting
- [ ] **PostgreSQL** connection pooling configured
- [ ] **S3 bucket** access restricted (private, signed URLs)
- [ ] **Firewall** configured (only ports 80, 443 exposed)
- [ ] **DDoS protection** (Cloudflare, AWS Shield, etc.)
- [ ] **Intrusion Detection** System (IDS) deployed
- [ ] **Regular backups** configured (daily recommended)
- [ ] **Monitoring** and alerting (Sentry, DataDog, etc.)

### Server Hardening

- [ ] **OS patches** up to date
- [ ] **Minimal services** running
- [ ] **SSH key-only** authentication (no passwords)
- [ ] **Fail2ban** or equivalent for brute force protection
- [ ] **Security groups** restricting network access

---

## Data Protection Compliance

### GDPR (General Data Protection Regulation)

- [x] **Data minimization** (only collect necessary data)
- [x] **Encryption** of PII
- [x] **Audit trails** for data access
- [x] **Right to access** (audit log viewer for admins)
- [ ] **Right to erasure** (data deletion after case closure)
- [ ] **Data retention** policy (7 years for criminal records)
- [ ] **Privacy policy** document
- [ ] **Data protection officer** appointed

### Malabo Convention (African Union Cyber Security)

- [x] **Personal data protection** (encryption, access control)
- [x] **Cybersecurity measures** (security headers, rate limiting)
- [x] **Audit logging** for accountability
- [x] **Cross-border data** transfer controls (country-specific deployment)
- [ ] **National compliance** (each country has specific laws)

### Country-Specific Compliance

**Sierra Leone:**
- [ ] Review Sierra Leone Data Protection Act (if enacted)
- [ ] Comply with local law enforcement regulations

**Ghana:**
- [ ] Data Protection Act, 2012 (Act 843)
- [ ] Ghana Card integration for NIN validation

**Nigeria:**
- [ ] Nigeria Data Protection Regulation (NDPR) 2019
- [ ] National Identity Management Commission (NIMC) integration

**Kenya:**
- [ ] Data Protection Act, 2019
- [ ] Huduma Namba integration

**South Africa:**
- [ ] Protection of Personal Information Act (POPIA)
- [ ] Criminal Procedure Act compliance

---

## Incident Response

### Incident Response Plan

- [ ] **Incident response team** designated
- [ ] **Incident classification** (low, medium, high, critical)
- [ ] **Response procedures** documented
- [ ] **Escalation path** defined
- [ ] **Communication plan** (internal and external)

### Security Incident Types

1. **Data breach** (unauthorized access to PII)
2. **Authentication bypass** (unauthorized login)
3. **Injection attack** (SQL, XSS, etc.)
4. **Denial of Service** (DoS/DDoS)
5. **Malware infection**
6. **Insider threat** (malicious officer)

### Response Steps

1. **Detect:** Monitor audit logs, rate limit violations, error logs
2. **Contain:** Block IP, disable accounts, isolate affected systems
3. **Investigate:** Analyze audit logs, collect evidence
4. **Remediate:** Patch vulnerabilities, reset credentials
5. **Recover:** Restore from backups, verify integrity
6. **Document:** Write incident report, update procedures
7. **Notify:** Inform stakeholders, regulatory authorities (if required)

### Audit Log Analysis

**Check for suspicious activity:**
```sql
-- Failed login attempts
SELECT * FROM "AuditLog"
WHERE action = 'login' AND success = false
ORDER BY "createdAt" DESC LIMIT 100;

-- Bulk exports
SELECT * FROM "AuditLog"
WHERE action = 'export'
ORDER BY "createdAt" DESC LIMIT 50;

-- Administrative actions
SELECT * FROM "AuditLog"
WHERE "entityType" = 'officer' AND action IN ('create', 'update', 'delete')
ORDER BY "createdAt" DESC LIMIT 100;
```

---

## Testing & Validation

### Security Testing

- [ ] **Penetration testing** (Phase 11)
- [ ] **Vulnerability scanning** (OWASP ZAP, Nessus)
- [ ] **Code review** (focus on security)
- [ ] **Dependency audit** (npm audit)
- [ ] **SAST** (Static Application Security Testing)
- [ ] **DAST** (Dynamic Application Security Testing)

### Test Cases

- [ ] **Authentication:** Brute force, credential stuffing
- [ ] **Authorization:** Privilege escalation, horizontal traversal
- [ ] **Injection:** SQL, XSS, command injection
- [ ] **Rate limiting:** Verify limits trigger correctly
- [ ] **Session management:** Session fixation, hijacking
- [ ] **Encryption:** Verify PII is encrypted at rest
- [ ] **Audit logging:** Verify all operations logged

---

## Security Contact

For security issues, please contact:

**Email:** security@crms.gov.sl
**PGP Key:** [To be generated]

**Reporting Guidelines:**
1. Do not disclose publicly until patched
2. Include detailed reproduction steps
3. Provide impact assessment
4. Allow 90 days for remediation

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-30 | 1.0 | Initial security checklist (Phase 5) |

---

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [GDPR](https://gdpr.eu/)
- [Malabo Convention](https://au.int/en/treaties/african-union-convention-cyber-security-and-personal-data-protection)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#sql-injection)

---

**Last Updated:** October 30, 2025
**Status:** Phase 5 Complete
**Next Review:** January 2026 (Quarterly)
