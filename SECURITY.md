# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| < 1.0   | ❌ No (Pre-release)|

## Security Standards

CRMS implements comprehensive security measures to protect sensitive criminal justice data:

### Authentication & Authorization

- **Argon2id Password Hashing** - OWASP recommended, resistant to GPU cracking attacks
- **JWT Session Management** - 15-minute expiry with secure httpOnly cookies
- **Multi-Factor Authentication** - SMS OTP and TOTP support (Phase 10)
- **Role-Based Access Control (RBAC)** - 6 roles with granular permissions
- **Account Lockout** - After 5 failed login attempts (30-minute lockout)
- **Session Management** - Automatic expiry, device tracking, concurrent session limits

### Data Protection

- **AES-256 Encryption** - PII (addresses, phone numbers, emails) encrypted at rest
- **TLS 1.3 Enforcement** - All data in transit encrypted
- **Column-Level Encryption** - Sensitive fields encrypted in PostgreSQL
- **Secure File Storage** - Evidence files encrypted in S3-compatible storage (MinIO/AWS S3)
- **Key Management** - Environment variable-based key storage (rotate regularly)

### Privacy Compliance

- **GDPR Compliant** - Right to access, rectification, erasure, data portability
- **Malabo Convention Aligned** - African Union Cyber Security and Data Protection standards
- **Data Protection Impact Assessment (DPIA)** - Performed and documented
- **Privacy by Design** - Minimal data collection, purpose limitation, storage limitation

### Application Security

- **OWASP Top 10 Compliant** - Protection against common web vulnerabilities
- **Input Validation** - Zod schemas for all inputs
- **SQL Injection Prevention** - Prisma ORM with parameterized queries
- **XSS Protection** - React auto-escaping, Content Security Policy (CSP) headers
- **CSRF Protection** - Next.js built-in CSRF tokens
- **Security Headers** - Helmet.js configuration (Phase 5)
- **Rate Limiting** - Prevent brute force and DDoS attacks (Phase 5)
- **Dependency Scanning** - Automated vulnerability scanning in CI/CD

### Audit & Monitoring

- **Immutable Audit Logs** - All state-changing operations logged (who, what, when, where)
- **Real-Time Security Monitoring** - Suspicious activity detection
- **Failed Login Tracking** - Multiple failed attempts trigger alerts
- **Access Logging** - Every data access logged with context
- **Automated Vulnerability Scanning** - npm audit, Snyk, GitHub Dependabot

---

## Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Security vulnerabilities should be reported privately to allow us to address them before public disclosure.

### How to Report

Email: **security@crms-africa.org**

Include in your report:

1. **Description** - Clear explanation of the vulnerability
2. **Steps to Reproduce** - Detailed reproduction steps
3. **Potential Impact** - Who/what is affected, severity assessment
4. **Suggested Fix** - If you have a proposed solution (optional)
5. **Your Contact Info** - Email for follow-up questions

### What to Expect

| Timeline | Action |
|----------|--------|
| **Within 48 hours** | Acknowledgment of your report |
| **Within 7 days** | Initial assessment (severity, impact, timeline) |
| **Every 7 days** | Progress updates until resolved |
| **Upon fix** | Coordinated public disclosure, credit in release notes |

### Responsible Disclosure

We ask that you:

1. **Give us reasonable time** to fix the issue before public disclosure (typically 90 days)
2. **Do not publicly disclose** the vulnerability until we've addressed it
3. **Do not exploit** the vulnerability beyond what's necessary to demonstrate it
4. **Do not access, modify, or delete** other users' data
5. **Follow local laws** and respect user privacy

### Bug Bounty

We currently do not have a formal bug bounty program, but we may provide:

- **Public recognition** in release notes and acknowledgments
- **Swag** (CRMS stickers, t-shirts) for significant findings
- **Future consideration** for paid bounty program (when funding available)

---

## Security Best Practices for Deployers

### Environment Variables

**Never commit** `.env` files to version control.

```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -hex 32     # For ENCRYPTION_KEY
```

**Secure secret management:**
- Use environment variables (not hardcoded in code)
- Rotate secrets regularly (every 90 days recommended)
- Use secret management tools (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- Limit access to secrets (principle of least privilege)

### Database Security

- **Use strong passwords** (16+ characters, alphanumeric + symbols)
- **Enable SSL/TLS** connections to PostgreSQL
- **Regular backups** (automated, encrypted, tested restore procedures)
- **Principle of least privilege** (app user should not have DROP/ALTER permissions)
- **Network isolation** (database not publicly accessible)
- **Audit logging** enabled in PostgreSQL

Example PostgreSQL hardening:

```bash
# In postgresql.conf:
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
password_encryption = scram-sha-256

# Create application user with limited privileges:
CREATE USER crms_app WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE crms TO crms_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crms_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

### Server Hardening

- **Keep system updated** - Regular security patches (unattended-upgrades on Ubuntu)
- **Use firewall** - UFW/iptables to restrict ports
- **Enable fail2ban** - Prevent brute force SSH attacks
- **Disable SSH password auth** - Use SSH keys only
- **Use non-root user** - Run application as dedicated user
- **Limit file permissions** - 600 for secrets, 644 for config

Example UFW firewall setup:

```bash
# Allow SSH (change port if non-standard)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL only from app server (if separate)
sudo ufw allow from 10.0.0.5 to any port 5432

# Enable firewall
sudo ufw enable
```

### Application Security

- **Use HTTPS only** (TLS 1.3, no HTTP fallback)
- **Set secure headers** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- **Regular dependency updates** (npm audit, dependabot)
- **Security scanning in CI/CD** (SAST, DAST tools)
- **Container security** (scan Docker images for vulnerabilities)

Example Next.js security headers (in `next.config.ts`):

```typescript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
];
```

### Backup & Disaster Recovery

- **Automated backups** - Daily database backups, retained for 30 days
- **Encrypted backups** - Use encryption at rest (AES-256)
- **Off-site storage** - Store backups in different region/location
- **Test restores** - Quarterly restore testing to verify backup integrity
- **Incident response plan** - Documented procedures for security incidents

---

## Compliance Certifications

| Certification | Status |
|---------------|--------|
| ISO 27001 | 📋 In Progress |
| SOC 2 Type II | 📋 Planned |
| GDPR Compliance | ✅ Complete |
| Malabo Convention | ✅ Complete |

---

## Security Audits

| Audit Type | Last Performed | Next Scheduled |
|------------|----------------|----------------|
| Code Review | - | Phase 11 (Q2 2025) |
| Penetration Testing | - | Phase 11 (Q2 2025) |
| Vulnerability Scan | Weekly (automated) | Ongoing |
| Dependency Audit | Daily (CI/CD) | Ongoing |

---

## Known Security Limitations

We believe in transparency. Current limitations include:

1. **MFA Not Yet Implemented** - Coming in Phase 10 (Q2 2025)
2. **No Rate Limiting Yet** - Coming in Phase 5 (Q1 2025)
3. **Basic Audit Logging** - Enhanced logging in Phase 5 (Q1 2025)
4. **No Intrusion Detection** - Planned for Phase 12 (Q2 2025)

We will update this section as these features are implemented.

---

## Security Contact

- **Email**: security@crms-africa.org
- **PGP Key**: [Link to public key] (to be added)
- **Response SLA**: 48 hours for acknowledgment

---

## Security Updates

Security updates are released as patch versions (e.g., 1.0.1) and announced via:

1. **GitHub Security Advisories** - https://github.com/african-digital-goods/crms/security/advisories
2. **Release Notes** - https://github.com/african-digital-goods/crms/releases
3. **Email Notifications** - Subscribe at security@crms-africa.org

**Critical vulnerabilities** are patched within 7 days and announced immediately.

---

## Attribution

This security policy is inspired by:

- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [GitHub Security Lab](https://securitylab.github.com/)
- [Contributor Covenant Security Policy](https://www.contributor-covenant.org/)

---

**Last Updated:** October 2025
**Version:** 1.0

---

🔒 **Security is a shared responsibility.** By working together, we can build a secure system that protects sensitive criminal justice data across Africa.
