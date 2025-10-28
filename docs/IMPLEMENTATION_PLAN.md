# CRMS Digital Public Good - Detailed Implementation Plan

## 📋 Project Overview

**Project Name:** Criminal Record Management System (CRMS) - Pan-African Digital Public Good
**Pilot Implementation:** Sierra Leone Police Force
**Type:** Digital Public Good (DPG)
**License:** MIT License
**Target:** African countries with limited internet connectivity
**Scope:** Reusable, configurable platform for law enforcement agencies across Africa
**Compliance:** GDPR, Malabo Convention, DPG Standard (9 indicators)

**Technology Stack:**
- Frontend: Next.js 15+, React 19+, TypeScript, Tailwind CSS
- Backend: Next.js API Routes, Prisma ORM
- Database: PostgreSQL 15+
- Offline: Service Workers (Workbox), IndexedDB (Dexie.js)
- Authentication: NextAuth.js, Argon2id, JWT
- Storage: S3-compatible (MinIO/AWS S3)
- USSD: Africa's Talking / Twilio

---

## 🎯 Phase 1: Foundation & DPG Compliance Setup (Weeks 1-3)

### Week 1: Project Initialization & Open Source Setup

#### 1.1 Initialize Next.js 15+ Project
```bash
# Initialize project
npx create-next-app@latest crms-sierra-leone \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd crms-sierra-leone
```

#### 1.2 Install Core Dependencies
```bash
# Next.js and React
npm install next@latest react@latest react-dom@latest

# TypeScript
npm install -D typescript @types/node @types/react @types/react-dom

# Styling
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-icons class-variance-authority clsx tailwind-merge

# Database
npm install @prisma/client
npm install -D prisma

# Authentication
npm install next-auth@beta argon2
npm install @types/bcrypt

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Utilities
npm install uuid date-fns
npm install -D @types/uuid
```

#### 1.3 Create Project Structure
```
crms-sierra-leone/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── cases/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── persons/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── evidence/
│   │   │   └── page.tsx
│   │   ├── alerts/
│   │   │   ├── amber/page.tsx
│   │   │   └── wanted/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── cases/route.ts
│   │   ├── persons/route.ts
│   │   ├── evidence/route.ts
│   │   ├── bgcheck/route.ts
│   │   ├── ussd/callback/route.ts
│   │   └── sync/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── form.tsx
│   │   └── ...
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── mfa-prompt.tsx
│   ├── cases/
│   │   ├── case-list.tsx
│   │   ├── case-form.tsx
│   │   └── case-detail.tsx
│   └── layout/
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── footer.tsx
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── encryption.ts
│   ├── permissions.ts
│   ├── audit.ts
│   ├── sync/
│   │   ├── engine.ts
│   │   ├── indexeddb.ts
│   │   └── queue.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── icons/
│   ├── manifest.json
│   └── sw.js
├── types/
│   ├── index.ts
│   └── auth.ts
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── PRIVACY_POLICY.md
├── DATA_PROTECTION_POLICY.md
├── package.json
└── tsconfig.json
```

#### 1.4 Create DPG Essential Files

**LICENSE (MIT)**
```text
MIT License

Copyright (c) 2025 CRMS Contributors (Pan-African Digital Public Good)
Pilot Implementation: Sierra Leone Police Force

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Update package.json**
```json
{
  "name": "crms-africa",
  "version": "1.0.0",
  "description": "Criminal Record Management System - A Pan-African Digital Public Good for law enforcement agencies across Africa (Pilot: Sierra Leone)",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/african-digital-goods/crms.git"
  },
  "keywords": [
    "criminal-records",
    "digital-public-good",
    "dpg",
    "pan-african",
    "africa",
    "offline-first",
    "multi-country",
    "interoperability",
    "sierra-leone",
    "police",
    "law-enforcement"
  ],
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test"
  }
}
```

**DPG Alignment:**
- ✅ Indicator #2: Open License (MIT)
- ✅ Indicator #3: Clear Ownership

---

### Week 2: Compliance Documentation

#### 2.1 README.md (Comprehensive)

```markdown
# Criminal Record Management System (CRMS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DPG](https://img.shields.io/badge/Digital%20Public%20Good-Nominated-blue)](https://digitalpublicgoods.net)
[![SDG 16](https://img.shields.io/badge/SDG-16-green)](https://sdgs.un.org/goals/goal16)
[![Pan-African](https://img.shields.io/badge/Scope-Pan--African-orange)](https://github.com/african-digital-goods/crms)

A **Pan-African Digital Public Good** for managing criminal records across the African continent, with offline-first architecture for limited internet connectivity. **Pilot implementation:** Sierra Leone Police Force.

## 🌍 About

CRMS is a **reusable, configurable open-source platform** designed for law enforcement agencies across Africa. With its pilot in Sierra Leone, CRMS can be deployed in any African country with configuration-based customization (no code forking required).

**Key Features:**
- Digitally record and manage complaints, incidents, and criminal cases
- Conduct background checks using any national identification system (NIN, Ghana Card, Huduma Namba, etc.)
- Manage police stations, officers, roles, and permissions
- Issue Amber Alerts and Wanted Notices
- Enable cross-border interoperability for regional security cooperation
- Provide citizen-facing services via USSD for areas with limited internet access
- Support multi-language interfaces (English, French, Portuguese, Arabic, indigenous languages)

**Country-Agnostic Design:**
- Supports any national ID system
- Configurable legal frameworks and case workflows
- Multi-language and multi-currency support
- Adaptable to different police organizational structures

## 🎯 Digital Public Good Alignment

This project aligns with:
- **SDG 16**: Peace, Justice and Strong Institutions (16.3, 16.a)
- **DPG Standard**: Meets all 9 indicators for Digital Public Goods
- **Data Protection**: GDPR and Malabo Convention compliant

## ✨ Features

- 🔐 Secure authentication with Badge + PIN (Argon2id hashing)
- 👥 Role-based access control (6 roles)
- 📱 Progressive Web App (PWA) with offline support
- 🌐 USSD support for feature phones
- 📊 Comprehensive audit logging
- 🔒 End-to-end encryption for sensitive data
- 🚀 Optimized for 2G/3G networks
- 🌍 Multi-language support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

\`\`\`bash
# Clone repository
git clone https://github.com/sierra-leone-police/crms.git
cd crms

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npx prisma db push
npx prisma db seed

# Run development server
npm run dev
\`\`\`

Visit `http://localhost:3000`

### Docker Installation

\`\`\`bash
# Using Docker Compose
docker-compose up -d
\`\`\`

## 📖 Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [User Manual](docs/USER_MANUAL.md)
- [Admin Guide](docs/ADMIN_GUIDE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🏗️ Architecture

- **Frontend**: Next.js 15+, React 19+, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 15+
- **Offline**: Service Workers, IndexedDB (Dexie.js)
- **Authentication**: NextAuth.js, Argon2id, JWT
- **USSD**: Africa's Talking / Twilio

## 🔒 Security

- Argon2id password hashing
- AES-256 encryption for PII
- TLS 1.3 enforcement
- Comprehensive audit logging
- OWASP Top 10 compliant

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

Funded by: [Your Organization]
Supported by: Digital Public Goods Alliance, [Other Partners]

## 📞 Contact

- Website: https://crms.gov.sl
- Email: support@crms.gov.sl
- Issues: https://github.com/sierra-leone-police/crms/issues

## 🌟 Star us on GitHub!

If you find this project useful, please give us a star ⭐
\`\`\`
```

#### 2.2 CONTRIBUTING.md

```markdown
# Contributing to CRMS

Thank you for considering contributing to the Criminal Record Management System!

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/sierra-leone-police/crms/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, versions)

### Suggesting Features

1. Check existing [Issues](https://github.com/sierra-leone-police/crms/issues) and [Discussions](https://github.com/sierra-leone-police/crms/discussions)
2. Create a new discussion describing:
   - Use case and problem it solves
   - Proposed solution
   - Alternative solutions considered
   - Impact on existing functionality

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write or update tests
5. Ensure all tests pass: `npm test`
6. Commit with clear messages: `git commit -m "feat: add feature description"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

#### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Development Setup

\`\`\`bash
# Install dependencies
npm install

# Set up database
npx prisma db push

# Run development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
\`\`\`

### Code Style

- Use TypeScript
- Follow ESLint rules
- Format with Prettier
- Write meaningful variable names
- Add comments for complex logic
- Write unit tests for new features

### Testing

- Write unit tests (Jest)
- Write integration tests for API routes
- Write E2E tests for critical flows (Playwright)
- Aim for 80%+ code coverage

### Documentation

- Update README.md if needed
- Add JSDoc comments for functions
- Update API documentation
- Add examples for new features

## Community Guidelines

- Be respectful and inclusive
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)
- Help others in discussions
- Provide constructive feedback

## Questions?

- Join our [Discussions](https://github.com/sierra-leone-police/crms/discussions)
- Email: dev@crms.gov.sl

Thank you for contributing! 🎉
```

#### 2.3 CODE_OF_CONDUCT.md

```markdown
# Code of Conduct

## Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Our Standards

**Positive behavior includes:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

**Unacceptable behavior includes:**

- Harassment, trolling, or discriminatory comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Enforcement

Instances of abusive behavior may be reported to conduct@crms.gov.sl. All complaints will be reviewed and investigated promptly and fairly.

Project maintainers have the right to remove, edit, or reject comments, commits, code, issues, and other contributions that do not align with this Code of Conduct.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org), version 2.1.
```

#### 2.4 SECURITY.md

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## Security Standards

CRMS implements the following security measures:

### Authentication & Authorization
- Argon2id password hashing (OWASP recommended)
- JWT session management (15-minute expiry)
- Multi-factor authentication (SMS OTP, TOTP)
- Role-based access control (RBAC)
- Account lockout after 5 failed attempts

### Data Protection
- AES-256 encryption for PII at rest
- TLS 1.3 for data in transit
- Column-level encryption in PostgreSQL
- Secure file storage (S3-compatible)

### Privacy Compliance
- GDPR compliant
- Malabo Convention aligned
- Data Protection Impact Assessment (DPIA)
- Privacy by Design principles

### Application Security
- OWASP Top 10 compliant
- Input validation (Zod schemas)
- SQL injection prevention (Prisma ORM)
- XSS protection
- CSRF tokens
- Security headers (Helmet.js)
- Rate limiting

### Audit & Monitoring
- Immutable audit logs
- All actions logged (who, what, when, where)
- Real-time security monitoring
- Automated vulnerability scanning

## Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, email security@crms.gov.sl with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to Expect

1. **Acknowledgment**: Within 48 hours
2. **Assessment**: Within 7 days
3. **Updates**: Every 7 days until resolved
4. **Resolution**: Fix deployed + public disclosure (coordinated)

### Responsible Disclosure

We ask that you:
- Give us reasonable time to fix the issue
- Do not publicly disclose until we've addressed it
- Do not exploit the vulnerability

### Bug Bounty

We currently do not have a bug bounty program but may reward significant findings.

## Security Best Practices for Deployers

### Environment Variables
Never commit `.env` files. Use secure secret management.

### Database
- Use strong passwords
- Enable SSL/TLS connections
- Regular backups
- Principle of least privilege

### Server
- Keep system updated
- Use firewall (UFW/iptables)
- Enable fail2ban
- Disable SSH password auth (use keys)

### Application
- Use HTTPS only (TLS 1.3)
- Set secure headers
- Regular dependency updates
- Security scanning in CI/CD

## Compliance Certifications

- [ ] ISO 27001 (In Progress)
- [ ] SOC 2 Type II (Planned)
- [ ] GDPR Compliance (Complete)
- [ ] Malabo Convention (Complete)

## Contact

- Security Team: security@crms.gov.sl
- PGP Key: [Link to public key]
```

#### 2.5 PRIVACY_POLICY.md

```markdown
# Privacy Policy

**Effective Date**: January 1, 2025
**Last Updated**: January 1, 2025

## 1. Introduction

The Criminal Record Management System (CRMS) is operated by the Sierra Leone Police Force. This Privacy Policy explains how we collect, use, store, and protect personal data.

## 2. Legal Basis

CRMS operates under:
- Sierra Leone Data Protection Act (pending)
- African Union Malabo Convention
- EU General Data Protection Regulation (GDPR) standards
- Law Enforcement Directive (LED) 2016/680

## 3. Data Controller

**Sierra Leone Police Force**
Address: [Address]
Email: dpo@crms.gov.sl
Phone: [Phone]

**Data Protection Officer**: [Name]
Email: dpo@crms.gov.sl

## 4. Personal Data We Collect

### 4.1 From Suspects/Victims/Witnesses
- National Identification Number (NIN)
- Full name, aliases
- Date of birth, gender, nationality
- Address, phone number
- Photographs, fingerprints (biometric data)
- Criminal records, case details

### 4.2 From Police Officers
- Badge number, rank, name
- Station assignment
- Login credentials (hashed)
- Activity logs

### 4.3 From Citizens (Background Checks)
- NIN, date of birth
- Phone number (for OTP)
- Request timestamp, IP address

## 5. How We Use Personal Data

### 5.1 Lawful Purposes
- Crime prevention and investigation
- Case management and prosecution
- Background checks (employment, visa, etc.)
- Statistical analysis (anonymized)
- Legal compliance

### 5.2 Legal Basis
- Legal obligation (criminal justice)
- Public interest (law enforcement)
- Consent (where applicable)

## 6. Data Processing Principles

We follow **Privacy by Design**:
- **Data Minimization**: Collect only necessary data
- **Purpose Limitation**: Use data only for stated purposes
- **Storage Limitation**: Retain only as long as necessary
- **Accuracy**: Ensure data is correct and up-to-date
- **Integrity & Confidentiality**: Secure data with encryption
- **Accountability**: Maintain audit trails

## 7. Data Security

### 7.1 Technical Measures
- AES-256 encryption at rest
- TLS 1.3 encryption in transit
- Argon2id password hashing
- Multi-factor authentication
- Secure data centers

### 7.2 Organizational Measures
- Access control (RBAC)
- Background checks for staff
- Security training
- Incident response plan

### 7.3 Audit Logging
All access to personal data is logged:
- Who accessed data
- When it was accessed
- What data was accessed
- Purpose of access

## 8. Data Sharing

We **do not sell** personal data. Data may be shared with:

- **Courts**: For prosecution
- **Other Law Enforcement**: For investigations
- **Government Agencies**: For legal purposes
- **International Partners**: With data transfer agreements

All sharing complies with legal requirements and data protection laws.

## 9. Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| Active cases | Until case closed + 10 years |
| Criminal records | Indefinite (legal requirement) |
| Background checks | 30 days |
| Audit logs | 7 years |
| Closed cases (minor crimes) | 5 years after closure |
| Officer accounts (inactive) | 2 years after deactivation |

## 10. Your Rights (Data Subjects)

Under GDPR and Malabo Convention, you have the right to:

1. **Access**: Request copy of your data
2. **Rectification**: Correct inaccurate data
3. **Erasure**: Delete data (with limitations for legal obligations)
4. **Restriction**: Limit processing
5. **Object**: Object to certain processing
6. **Data Portability**: Receive data in machine-readable format
7. **Complain**: Lodge complaint with data protection authority

### How to Exercise Rights
Email: dpo@crms.gov.sl
Response time: 30 days

### Limitations
Some rights may be restricted by law enforcement exemptions.

## 11. Children's Privacy

CRMS processes data about minors only for:
- Crime victims
- Amber Alerts (missing children)
- Juvenile cases

Parental consent is obtained where legally required.

## 12. International Data Transfers

Data may be transferred outside Sierra Leone only:
- With adequate safeguards (e.g., Standard Contractual Clauses)
- For law enforcement cooperation
- With consent or legal obligation

## 13. Automated Decision-Making

CRMS does **not** use fully automated decision-making. All decisions are made by human officers.

## 14. Data Breach Notification

In case of a breach:
- Notification to affected individuals: Within 72 hours
- Notification to authorities: Within 72 hours
- Mitigation measures implemented immediately

## 15. Cookies & Tracking

CRMS uses:
- **Essential cookies**: For authentication (required)
- **Analytics cookies**: For usage statistics (anonymized, opt-out available)

No third-party tracking or advertising cookies.

## 16. Changes to This Policy

We may update this policy. Changes will be posted on this page with a new "Last Updated" date.

## 17. Contact Us

**Data Protection Officer**
Email: dpo@crms.gov.sl
Address: [Address]
Phone: [Phone]

**Supervisory Authority**
National Data Protection Commission (Sierra Leone)
Email: [Email]
Website: [Website]
```

#### 2.6 SDG Mapping Document

Create `SDG_MAPPING.md`:

```markdown
# SDG Alignment - CRMS

## Primary SDG: Goal 16 - Peace, Justice and Strong Institutions

### Target 16.3
**Promote the rule of law at the national and international levels and ensure equal access to justice for all**

**How CRMS Contributes:**
- Centralized criminal records enable fair prosecution
- Background checks ensure equal treatment
- Transparent case management
- Audit trails prevent corruption

### Target 16.a
**Strengthen relevant national institutions to prevent violence and combat terrorism and crime**

**How CRMS Contributes:**
- Modernizes police force capabilities
- Improves inter-station coordination
- Enables data-driven decision making
- Enhances evidence management

### Target 16.6
**Develop effective, accountable and transparent institutions at all levels**

**How CRMS Contributes:**
- Complete audit logging (accountability)
- Open source code (transparency)
- RBAC ensures proper authorization
- Statistical reporting for oversight

## Secondary SDGs

### SDG 5: Gender Equality
- Track gender-based violence cases
- Support women victims with privacy protections

### SDG 10: Reduced Inequalities
- USSD access for those without smartphones
- Works in low-connectivity areas
- Free and open source (no cost barriers)

### SDG 17: Partnerships for the Goals
- Open source enables collaboration
- Digital Public Good for global use
- Technology transfer to other countries

## Measurement Indicators

1. **Cases digitized**: Target 10,000+ in Year 1
2. **Background checks processed**: Target 50,000+ annually
3. **Station adoption**: 50+ stations nationwide
4. **Officer training**: 500+ officers trained
5. **System uptime**: 99.5%
6. **Citizen USSD access**: 100,000+ unique users
```

**DPG Alignment:**
- ✅ Indicator #1: SDG Relevance (documented)
- ✅ Indicator #7: Privacy & Legal Compliance
- ✅ Indicator #9: Do No Harm by Design

---

#### 2.7 Multi-Country Deployment Documentation

Create `MULTI_COUNTRY_DEPLOYMENT.md`:

```markdown
# Multi-Country Deployment Guide

## Overview

CRMS is designed as a **reusable, configurable platform** that any African country can deploy without forking the codebase. This guide explains how to customize CRMS for different countries.

## Configuration-Based Customization

### 1. Country Configuration File

Create `config/countries/{country-code}.json`:

\`\`\`json
{
  "countryCode": "GHA",
  "countryName": "Ghana",
  "nationalIdSystem": {
    "type": "GHANA_CARD",
    "displayName": "Ghana Card",
    "format": "GHA-XXXXXXXXX-X",
    "validationRegex": "^GHA-[0-9]{9}-[0-9]$"
  },
  "language": {
    "default": "en",
    "supported": ["en", "tw", "ee"]
  },
  "currency": "GHS",
  "dateFormat": "DD/MM/YYYY",
  "policeStructure": {
    "type": "centralized",
    "levels": ["national", "regional", "district", "station"]
  },
  "legalFramework": {
    "dataProtectionAct": "Data Protection Act, 2012",
    "penalCode": "Criminal Offences Act, 1960 (Act 29)"
  },
  "telecom": {
    "ussdGateways": ["MTN", "Vodafone", "AirtelTigo"],
    "smsProvider": "africas-talking"
  }
}
\`\`\`

### 2. Offense Code Mapping

Map offense codes to national penal codes in `config/countries/{country-code}/offenses.json`.

### 3. Translation Files

Add translations in `locales/{language-code}/common.json`.

### 4. Legal Workflow Configuration

Define case stages in `config/countries/{country-code}/case-workflows.json`.

### 5. Deployment Checklist

- [ ] Create country configuration file
- [ ] Map offense codes to national penal code
- [ ] Translate UI strings
- [ ] Configure telecom gateway
- [ ] Set up national ID integration
- [ ] Customize case workflows
- [ ] Train pilot station officers
- [ ] Conduct security audit
- [ ] Establish data protection compliance

## Reference Implementations

- **Sierra Leone**: Pilot implementation (see `config/countries/SLE.json`)
- **Ghana**: Example configuration (see `config/countries/GHA.json`)
- **Nigeria**: Example configuration (see `config/countries/NGA.json`)

## Support

For deployment assistance, contact: deploy@crms-africa.org
```

**Purpose:**
- Enables any African country to deploy CRMS without forking
- Configuration-based customization (not code changes)
- Reduces maintenance burden
- Accelerates adoption across Africa

---

### Week 3: Development Environment & Documentation

#### 3.1 Git Setup

```bash
# Initialize Git
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Next.js
.next/
out/
build/
dist/

# Environment
.env
.env*.local
.env.production

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Prisma
prisma/*.db
prisma/*.db-journal

# Uploads (local development)
uploads/
public/uploads/

# Certificates
*.pem
*.key
*.crt
EOF

# Initial commit
git add .
git commit -m "chore: initial commit with DPG compliance files"
```

#### 3.2 Configure TypeScript

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### 3.3 Configure Tailwind CSS

`tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

#### 3.4 Environment Variables

`.env.example`:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crms"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Encryption
ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"

# Storage (S3-compatible)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="crms-evidence"
S3_REGION="us-east-1"

# USSD (Africa's Talking)
USSD_API_KEY="your-api-key"
USSD_USERNAME="sandbox"
USSD_SHORTCODE="*123#"

# SMS
SMS_API_KEY="your-api-key"
SMS_SENDER_ID="CRMS"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="60000"

# Session
SESSION_MAX_AGE="900"  # 15 minutes
SESSION_REFRESH_AGE="86400"  # 24 hours

# Feature Flags
ENABLE_MFA="true"
ENABLE_USSD="true"
ENABLE_OFFLINE="true"
```

#### 3.5 ESLint Configuration

`.eslintrc.json`:
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

#### 3.6 Docker Setup

`Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: crms-db
    environment:
      POSTGRES_USER: crms
      POSTGRES_PASSWORD: crms_password
      POSTGRES_DB: crms
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crms"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: crms-storage
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: crms-app
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://crms:crms_password@postgres:5432/crms
      S3_ENDPOINT: http://minio:9000
      S3_ACCESS_KEY: minioadmin
      S3_SECRET_KEY: minioadmin
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

#### 3.7 CI/CD Pipeline

`.github/workflows/ci.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/crms_test

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm audit
      - run: npm audit signatures

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next
```

**DPG Alignment:**
- ✅ Indicator #4: Platform Independence (Docker)
- ✅ Indicator #5: Documentation (comprehensive)
- ✅ Indicator #8: Open Standards (documented)

---

## 🎯 Phase 2: Authentication & RBAC System (Weeks 4-5)

### Week 4: Core Authentication

#### 4.1 Prisma Schema - Authentication Models

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== AUTHENTICATION ====================

model Officer {
  id              String    @id @default(uuid())
  badge           String    @unique
  name            String
  email           String?   @unique
  phone           String?
  pinHash         String    // Argon2id hash
  roleId          String
  role            Role      @relation(fields: [roleId], references: [id])
  stationId       String
  station         Station   @relation(fields: [stationId], references: [id])
  active          Boolean   @default(true)
  lastLogin       DateTime?
  pinChangedAt    DateTime  @default(now())
  failedAttempts  Int       @default(0)
  lockedUntil     DateTime?
  mfaEnabled      Boolean   @default(false)
  mfaSecret       String?   // TOTP secret (encrypted)
  mfaBackupCodes  String[]  // Encrypted backup codes
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  cases           Case[]
  auditLogs       AuditLog[]
  backgroundChecks BackgroundCheck[]
  evidence        Evidence[]
  amberAlerts     AmberAlert[]
  wantedPersons   WantedPerson[]
  persons         Person[]
  sessions        Session[]

  @@index([badge])
  @@index([stationId])
  @@index([roleId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  officerId    String
  officer      Officer  @relation(fields: [officerId], references: [id], onDelete: Cascade)
  deviceInfo   Json?    // Browser, OS, IP
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  @@index([sessionToken])
  @@index([officerId])
}

model Role {
  id          String       @id @default(uuid())
  name        String       @unique
  description String?
  level       Int          // 1=SuperAdmin, 2=Admin, 3=StationCommander, 4=Officer, 5=Clerk, 6=Viewer
  permissions Permission[]
  officers    Officer[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([name])
}

model Permission {
  id       String   @id @default(uuid())
  resource String   // "cases", "persons", "evidence", "officers", "stations", "alerts", "bgcheck", "reports"
  action   String   // "create", "read", "update", "delete", "export"
  scope    String   // "own", "station", "region", "national"
  roles    Role[]

  @@unique([resource, action, scope])
  @@index([resource])
}

// ==================== CORE ENTITIES ====================

model Station {
  id          String    @id @default(uuid())
  name        String
  code        String    @unique  // Country-specific format
  location    String
  district    String?
  region      String?
  countryCode String?             // ISO 3166-1 alpha-3 (for multi-country deployments)
  phone       String?
  email       String?
  latitude    Float?
  longitude   Float?
  active      Boolean   @default(true)
  officers    Officer[]
  cases       Case[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([code])
  @@index([region])
  @@index([countryCode])
}

model Person {
  id              String        @id @default(uuid())
  nationalId      String?       @unique  // Can be NIN, Ghana Card, Huduma Namba, etc.
  idType          String?                // "NIN", "GHANA_CARD", "HUDUMA_NAMBA", "SA_ID", "PASSPORT", etc.
  countryCode     String?                // ISO 3166-1 alpha-3 (e.g., "SLE", "GHA", "NGA", "KEN")
  fullName        String
  aliases         String[]
  dob             DateTime?
  gender          String?
  nationality     String?       @default("SLE")  // ISO 3166-1 alpha-3
  addressEncrypted String?      // AES-256 encrypted
  phoneEncrypted  String?       // AES-256 encrypted
  emailEncrypted  String?       // AES-256 encrypted
  photoUrl        String?
  fingerprintHash String?       // SHA-256 hash
  biometricHash   String?
  createdById     String
  createdBy       Officer       @relation(fields: [createdById], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  cases           CasePerson[]
  wantedPerson    WantedPerson?

  @@index([nationalId])
  @@index([fullName])
  @@index([countryCode])
  @@index([createdById])
}

model Case {
  id            String       @id @default(uuid())
  caseNumber    String       @unique
  title         String
  description   String?
  category      String       // "theft", "assault", "fraud", "murder", "robbery", "kidnapping", etc.
  severity      String       // "minor", "major", "critical"
  status        String       @default("open") // "open", "investigating", "charged", "court", "closed"
  incidentDate  DateTime
  reportedDate  DateTime     @default(now())
  location      String?
  stationId     String
  station       Station      @relation(fields: [stationId], references: [id])
  officerId     String       // Investigating officer
  officer       Officer      @relation(fields: [officerId], references: [id])
  persons       CasePerson[]
  evidence      Evidence[]
  notes         CaseNote[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([caseNumber])
  @@index([stationId])
  @@index([officerId])
  @@index([status])
  @@index([category])
}

model CasePerson {
  id        String   @id @default(uuid())
  caseId    String
  case      Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  personId  String
  person    Person   @relation(fields: [personId], references: [id])
  role      String   // "suspect", "victim", "witness", "informant"
  statement String?  @db.Text
  createdAt DateTime @default(now())

  @@unique([caseId, personId, role])
  @@index([caseId])
  @@index([personId])
}

model CaseNote {
  id        String   @id @default(uuid())
  caseId    String
  case      Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  content   String   @db.Text
  createdAt DateTime @default(now())

  @@index([caseId])
}

model Evidence {
  id              String   @id @default(uuid())
  caseId          String
  case            Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  type            String   // "photo", "document", "video", "physical", "digital"
  description     String?
  qrCode          String   @unique
  storageUrl      String?  // Encrypted S3 URL
  fileHash        String?  // SHA-256 for integrity
  fileName        String?
  fileSize        Int?
  mimeType        String?
  collectedDate   DateTime
  collectedById   String
  collectedBy     Officer  @relation(fields: [collectedById], references: [id])
  chainOfCustody  Json     // Array of custody events
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([caseId])
  @@index([qrCode])
  @@index([collectedById])
}

// ==================== ALERTS ====================

model AmberAlert {
  id               String    @id @default(uuid())
  personName       String
  age              Int?
  gender           String?
  description      String    @db.Text
  photoUrl         String?
  lastSeenLocation String?
  lastSeenDate     DateTime?
  contactPhone     String
  status           String    @default("active") // "active", "found", "expired"
  publishedAt      DateTime?
  expiresAt        DateTime?
  createdById      String
  createdBy        Officer   @relation(fields: [createdById], references: [id])
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([status])
  @@index([createdById])
}

model WantedPerson {
  id          String   @id @default(uuid())
  personId    String?  @unique
  person      Person?  @relation(fields: [personId], references: [id])
  name        String
  aliases     String[]
  charges     String[]
  photoUrl    String?
  description String?  @db.Text
  reward      Decimal? @db.Decimal(10, 2)
  dangerLevel String   @default("medium") // "low", "medium", "high", "extreme"
  status      String   @default("active") // "active", "captured", "expired"
  publishedAt DateTime?
  createdById String
  createdBy   Officer  @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([personId])
  @@index([createdById])
}

// ==================== BACKGROUND CHECKS ====================

model BackgroundCheck {
  id            String    @id @default(uuid())
  nin           String
  requestedById String?
  requestedBy   Officer?  @relation(fields: [requestedById], references: [id])
  requestType   String    // "officer", "citizen", "employer", "visa"
  result        Json      // Full or redacted results
  status        String    @default("pending") // "pending", "completed", "failed"
  issuedAt      DateTime?
  expiresAt     DateTime?
  certificateUrl String?
  phoneNumber   String?   // For citizen requests
  ipAddress     String?
  createdAt     DateTime  @default(now())

  @@index([nin])
  @@index([requestedById])
  @@index([phoneNumber])
  @@index([createdAt])
}

// ==================== AUDIT & SYNC ====================

model AuditLog {
  id         String   @id @default(uuid())
  entityType String
  entityId   String?
  officerId  String?
  officer    Officer? @relation(fields: [officerId], references: [id])
  action     String   // "create", "read", "update", "delete", "login", "logout", "export"
  details    Json
  ipAddress  String?
  userAgent  String?
  stationId  String?
  success    Boolean  @default(true)
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([officerId])
  @@index([action])
  @@index([createdAt])
}

model SyncQueue {
  id         String    @id @default(uuid())
  entityType String
  entityId   String
  operation  String    // "create", "update", "delete"
  payload    Json
  status     String    @default("pending") // "pending", "processing", "completed", "failed"
  attempts   Int       @default(0)
  error      String?
  createdAt  DateTime  @default(now())
  syncedAt   DateTime?

  @@index([status])
  @@index([createdAt])
}
```

#### 4.2 NextAuth Configuration

`lib/auth.ts`:
```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verify } from "argon2";
import { auditLog } from "@/lib/audit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        badge: { label: "Badge Number", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.badge || !credentials?.pin) {
          throw new Error("Badge and PIN are required");
        }

        // Find officer
        const officer = await prisma.officer.findUnique({
          where: { badge: credentials.badge },
          include: { role: { include: { permissions: true } }, station: true },
        });

        if (!officer) {
          await auditLog({
            action: "login",
            success: false,
            details: { badge: credentials.badge, reason: "Officer not found" },
          });
          throw new Error("Invalid credentials");
        }

        // Check if account is active
        if (!officer.active) {
          throw new Error("Account is deactivated");
        }

        // Check if account is locked
        if (officer.lockedUntil && officer.lockedUntil > new Date()) {
          throw new Error("Account is locked. Try again later.");
        }

        // Verify PIN
        const isValidPin = await verify(officer.pinHash, credentials.pin);

        if (!isValidPin) {
          // Increment failed attempts
          const failedAttempts = officer.failedAttempts + 1;
          const lockedUntil = failedAttempts >= 5
            ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
            : null;

          await prisma.officer.update({
            where: { id: officer.id },
            data: {
              failedAttempts,
              lockedUntil,
            },
          });

          await auditLog({
            entityType: "officer",
            entityId: officer.id,
            officerId: officer.id,
            action: "login",
            success: false,
            details: {
              badge: credentials.badge,
              failedAttempts,
              reason: "Invalid PIN"
            },
          });

          throw new Error("Invalid credentials");
        }

        // Reset failed attempts and update last login
        await prisma.officer.update({
          where: { id: officer.id },
          data: {
            failedAttempts: 0,
            lockedUntil: null,
            lastLogin: new Date(),
          },
        });

        await auditLog({
          entityType: "officer",
          entityId: officer.id,
          officerId: officer.id,
          action: "login",
          success: true,
          details: { badge: credentials.badge },
        });

        return {
          id: officer.id,
          badge: officer.badge,
          name: officer.name,
          email: officer.email,
          role: officer.role.name,
          roleLevel: officer.role.level,
          stationId: officer.stationId,
          stationName: officer.station.name,
          permissions: officer.role.permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.badge = user.badge;
        token.role = user.role;
        token.roleLevel = user.roleLevel;
        token.stationId = user.stationId;
        token.stationName = user.stationName;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.badge = token.badge as string;
        session.user.role = token.role as string;
        session.user.roleLevel = token.roleLevel as number;
        session.user.stationId = token.stationId as string;
        session.user.stationName = token.stationName as string;
        session.user.permissions = token.permissions as any[];
      }
      return session;
    },
  },
};
```

`app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

#### 4.3 Permission Checking Utilities

`lib/permissions.ts`:
```typescript
import { Session } from "next-auth";

export type Resource = "cases" | "persons" | "evidence" | "officers" | "stations" | "alerts" | "bgcheck" | "reports";
export type Action = "create" | "read" | "update" | "delete" | "export";
export type Scope = "own" | "station" | "region" | "national";

interface Permission {
  resource: Resource;
  action: Action;
  scope: Scope;
}

export function hasPermission(
  session: Session | null,
  resource: Resource,
  action: Action,
  requiredScope: Scope = "own"
): boolean {
  if (!session?.user) return false;

  const permissions = session.user.permissions as Permission[];

  return permissions.some(
    (p) =>
      p.resource === resource &&
      p.action === action &&
      isScopeSufficient(p.scope, requiredScope)
  );
}

function isScopeSufficient(userScope: Scope, requiredScope: Scope): boolean {
  const scopeHierarchy: Record<Scope, number> = {
    own: 1,
    station: 2,
    region: 3,
    national: 4,
  };

  return scopeHierarchy[userScope] >= scopeHierarchy[requiredScope];
}

export function requirePermission(
  session: Session | null,
  resource: Resource,
  action: Action,
  scope: Scope = "own"
) {
  if (!hasPermission(session, resource, action, scope)) {
    throw new Error("Insufficient permissions");
  }
}

// Role-based helpers
export function isAdmin(session: Session | null): boolean {
  return session?.user?.roleLevel ? session.user.roleLevel <= 2 : false;
}

export function isStationCommander(session: Session | null): boolean {
  return session?.user?.roleLevel === 3;
}

export function canAccessStation(session: Session | null, stationId: string): boolean {
  if (!session?.user) return false;

  // SuperAdmin and Admin can access all stations
  if (isAdmin(session)) return true;

  // Others can only access their own station
  return session.user.stationId === stationId;
}
```

#### 4.4 Authentication Middleware

`middleware.ts`:
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ["/login", "/api/auth", "/api/ussd"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Require authentication
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Check session expiry
  if (token.exp && Date.now() >= token.exp * 1000) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "SessionExpired");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
```

#### 4.5 Database Seed (Initial Roles & Permissions)

`prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create permissions
  const permissions = [
    // Cases
    { resource: "cases", action: "create", scope: "station" },
    { resource: "cases", action: "read", scope: "station" },
    { resource: "cases", action: "update", scope: "station" },
    { resource: "cases", action: "delete", scope: "national" },
    { resource: "cases", action: "export", scope: "station" },

    // Persons
    { resource: "persons", action: "create", scope: "station" },
    { resource: "persons", action: "read", scope: "national" },
    { resource: "persons", action: "update", scope: "station" },
    { resource: "persons", action: "delete", scope: "national" },

    // Evidence
    { resource: "evidence", action: "create", scope: "station" },
    { resource: "evidence", action: "read", scope: "station" },
    { resource: "evidence", action: "update", scope: "own" },
    { resource: "evidence", action: "delete", scope: "national" },

    // Officers
    { resource: "officers", action: "create", scope: "national" },
    { resource: "officers", action: "read", scope: "station" },
    { resource: "officers", action: "update", scope: "national" },
    { resource: "officers", action: "delete", scope: "national" },

    // Stations
    { resource: "stations", action: "create", scope: "national" },
    { resource: "stations", action: "read", scope: "national" },
    { resource: "stations", action: "update", scope: "national" },

    // Alerts
    { resource: "alerts", action: "create", scope: "station" },
    { resource: "alerts", action: "read", scope: "national" },
    { resource: "alerts", action: "update", scope: "station" },

    // Background Checks
    { resource: "bgcheck", action: "create", scope: "station" },
    { resource: "bgcheck", action: "read", scope: "station" },

    // Reports
    { resource: "reports", action: "create", scope: "station" },
    { resource: "reports", action: "read", scope: "station" },
    { resource: "reports", action: "export", scope: "national" },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) =>
      prisma.permission.upsert({
        where: { resource_action_scope: p },
        update: {},
        create: p,
      })
    )
  );

  console.log(`Created ${createdPermissions.length} permissions`);

  // Create roles with permissions
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SuperAdmin" },
    update: {},
    create: {
      name: "SuperAdmin",
      description: "Full system access",
      level: 1,
      permissions: {
        connect: createdPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      description: "Regional/national administration",
      level: 2,
      permissions: {
        connect: createdPermissions
          .filter((p) => ["national", "region", "station"].includes(p.scope))
          .map((p) => ({ id: p.id })),
      },
    },
  });

  const commanderRole = await prisma.role.upsert({
    where: { name: "StationCommander" },
    update: {},
    create: {
      name: "StationCommander",
      description: "Station-level oversight",
      level: 3,
      permissions: {
        connect: createdPermissions
          .filter((p) => ["station", "own"].includes(p.scope))
          .map((p) => ({ id: p.id })),
      },
    },
  });

  const officerRole = await prisma.role.upsert({
    where: { name: "Officer" },
    update: {},
    create: {
      name: "Officer",
      description: "Operational police officer",
      level: 4,
      permissions: {
        connect: createdPermissions
          .filter((p) =>
            (p.resource === "cases" || p.resource === "persons" || p.resource === "evidence" || p.resource === "bgcheck") &&
            ["station", "own"].includes(p.scope)
          )
          .map((p) => ({ id: p.id })),
      },
    },
  });

  const clerkRole = await prisma.role.upsert({
    where: { name: "EvidenceClerk" },
    update: {},
    create: {
      name: "EvidenceClerk",
      description: "Evidence management specialist",
      level: 5,
      permissions: {
        connect: createdPermissions
          .filter((p) => p.resource === "evidence")
          .map((p) => ({ id: p.id })),
      },
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: "Viewer" },
    update: {},
    create: {
      name: "Viewer",
      description: "Read-only access (prosecutors, etc.)",
      level: 6,
      permissions: {
        connect: createdPermissions
          .filter((p) => p.action === "read")
          .map((p) => ({ id: p.id })),
      },
    },
  });

  console.log("Created roles");

  // Create headquarters station
  const hqStation = await prisma.station.upsert({
    where: { code: "HQ-001" },
    update: {},
    create: {
      name: "Police Headquarters",
      code: "HQ-001",
      location: "Freetown",
      district: "Western Area",
      region: "Western",
      phone: "+232-XXX-XXXX",
      email: "hq@police.gov.sl",
    },
  });

  console.log("Created headquarters station");

  // Create SuperAdmin user
  const superAdminPin = await hash("12345678"); // Change in production!

  await prisma.officer.upsert({
    where: { badge: "SA-00001" },
    update: {},
    create: {
      badge: "SA-00001",
      name: "System Administrator",
      email: "admin@police.gov.sl",
      phone: "+232-XXX-XXXX",
      pinHash: superAdminPin,
      roleId: superAdminRole.id,
      stationId: hqStation.id,
      active: true,
    },
  });

  console.log("Created SuperAdmin user");
  console.log("✅ Seeding complete!");
  console.log("\n📝 Default SuperAdmin credentials:");
  console.log("Badge: SA-00001");
  console.log("PIN: 12345678");
  console.log("\n⚠️  Change PIN immediately after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.disconnect();
  });
```

### Week 5: Login UI & Testing

#### 5.1 Login Page

`app/(auth)/login/page.tsx`:
```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [badge, setBadge] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        badge,
        pin,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">CRMS</h1>
          <p className="mt-2 text-gray-600">Criminal Record Management System</p>
          <p className="text-sm text-gray-500">Sierra Leone Police Force</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              {error}
            </Alert>
          )}

          <div>
            <Label htmlFor="badge">Badge Number</Label>
            <Input
              id="badge"
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="SA-00001"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div>
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your 8-digit PIN"
              required
              disabled={loading}
              autoComplete="current-password"
              maxLength={8}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500">
          For security reasons, your account will be locked after 5 failed login attempts.
        </p>
      </div>
    </div>
  );
}
```

---

## 🎯 Phase 3: Offline-First Architecture (Weeks 6-7)

### Week 6: Service Worker & IndexedDB Setup

#### 6.1 Install Offline Dependencies

```bash
# Offline storage and sync
npm install dexie  # IndexedDB wrapper
npm install dexie-react-hooks
npm install workbox-webpack-plugin
npm install next-pwa
```

#### 6.2 IndexedDB Schema

`lib/sync/indexeddb.ts`:
```typescript
import Dexie, { Table } from 'dexie';

export interface PendingCase {
  id: string;
  caseNumber: string;
  title: string;
  description?: string;
  category: string;
  severity: string;
  status: string;
  incidentDate: Date;
  reportedDate: Date;
  location?: string;
  stationId: string;
  officerId: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingPerson {
  id: string;
  nationalId?: string;
  idType?: string;
  countryCode?: string;
  fullName: string;
  aliases: string[];
  dob?: Date;
  gender?: string;
  nationality?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingEvidence {
  id: string;
  caseId: string;
  type: string;
  description?: string;
  qrCode: string;
  collectedDate: Date;
  collectedById: string;
  chainOfCustody: any[];
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  attempts: number;
  lastError?: string;
  createdAt: Date;
}

class CRMSDatabase extends Dexie {
  cases!: Table<PendingCase, string>;
  persons!: Table<PendingPerson, string>;
  evidence!: Table<PendingEvidence, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('crms-offline');

    this.version(1).stores({
      cases: 'id, caseNumber, stationId, officerId, syncStatus, createdAt',
      persons: 'id, nationalId, fullName, syncStatus, createdAt',
      evidence: 'id, caseId, qrCode, syncStatus, createdAt',
      syncQueue: 'id, entityType, syncStatus, createdAt',
    });
  }
}

export const db = new CRMSDatabase();
```

#### 6.3 Sync Engine

`lib/sync/engine.ts`:
```typescript
import { db } from './indexeddb';
import { v4 as uuid } from 'uuid';

export class SyncEngine {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    console.log('✅ Connection restored - starting sync');
    this.startAutoSync();
  };

  private handleOffline = () => {
    this.isOnline = false;
    console.log('⚠️  Connection lost - working offline');
    this.stopAutoSync();
  };

  async addToQueue(
    entityType: string,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    payload: any
  ) {
    const queueItem = {
      id: uuid(),
      entityType,
      entityId,
      operation,
      payload,
      attempts: 0,
      createdAt: new Date(),
    };

    await db.syncQueue.add(queueItem);

    // Try immediate sync if online
    if (this.isOnline) {
      await this.syncSingleItem(queueItem);
    }
  }

  async syncSingleItem(item: any) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: item.entityType,
          entityId: item.entityId,
          operation: item.operation,
          payload: item.payload,
        }),
      });

      if (response.ok) {
        // Remove from queue
        await db.syncQueue.delete(item.id);

        // Update entity sync status
        await this.updateEntitySyncStatus(item.entityType, item.entityId, 'synced');

        console.log(`✅ Synced ${item.entityType}:${item.entityId}`);
        return true;
      } else {
        throw new Error(`Sync failed with status ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Sync failed for ${item.entityType}:${item.entityId}`, error);

      // Increment attempts
      await db.syncQueue.update(item.id, {
        attempts: item.attempts + 1,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      });

      // Update entity sync status
      await this.updateEntitySyncStatus(item.entityType, item.entityId, 'failed');

      return false;
    }
  }

  async syncAll() {
    if (!this.isOnline) {
      console.log('⚠️  Offline - skipping sync');
      return;
    }

    const queueItems = await db.syncQueue.toArray();
    console.log(`🔄 Syncing ${queueItems.length} items...`);

    for (const item of queueItems) {
      await this.syncSingleItem(item);
    }
  }

  private async updateEntitySyncStatus(
    entityType: string,
    entityId: string,
    status: 'pending' | 'synced' | 'failed'
  ) {
    switch (entityType) {
      case 'case':
        await db.cases.update(entityId, { syncStatus: status });
        break;
      case 'person':
        await db.persons.update(entityId, { syncStatus: status });
        break;
      case 'evidence':
        await db.evidence.update(entityId, { syncStatus: status });
        break;
    }
  }

  startAutoSync(intervalMs: number = 30000) {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  getQueueCount = async () => {
    return await db.syncQueue.count();
  };

  cleanup() {
    this.stopAutoSync();
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }
}

export const syncEngine = new SyncEngine();
```

#### 6.4 Sync API Route

`app/api/sync/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { entityType, entityId, operation, payload } = body;

    // Validate
    if (!entityType || !entityId || !operation || !payload) {
      return NextResponse.json({ error: 'Invalid sync request' }, { status: 400 });
    }

    // Process sync based on entity type
    let result;
    switch (entityType) {
      case 'case':
        result = await syncCase(operation, payload, session.user.id);
        break;
      case 'person':
        result = await syncPerson(operation, payload, session.user.id);
        break;
      case 'evidence':
        result = await syncEvidence(operation, payload, session.user.id);
        break;
      default:
        return NextResponse.json({ error: 'Unknown entity type' }, { status: 400 });
    }

    // Log to sync queue
    await prisma.syncQueue.create({
      data: {
        entityType,
        entityId,
        operation,
        payload,
        status: 'completed',
        syncedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

async function syncCase(operation: string, payload: any, officerId: string) {
  switch (operation) {
    case 'create':
      return await prisma.case.create({
        data: {
          ...payload,
          officerId,
        },
      });
    case 'update':
      return await prisma.case.update({
        where: { id: payload.id },
        data: payload,
      });
    case 'delete':
      return await prisma.case.delete({
        where: { id: payload.id },
      });
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

async function syncPerson(operation: string, payload: any, officerId: string) {
  switch (operation) {
    case 'create':
      return await prisma.person.create({
        data: {
          ...payload,
          createdById: officerId,
        },
      });
    case 'update':
      return await prisma.person.update({
        where: { id: payload.id },
        data: payload,
      });
    case 'delete':
      return await prisma.person.delete({
        where: { id: payload.id },
      });
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

async function syncEvidence(operation: string, payload: any, officerId: string) {
  switch (operation) {
    case 'create':
      return await prisma.evidence.create({
        data: {
          ...payload,
          collectedById: officerId,
        },
      });
    case 'update':
      return await prisma.evidence.update({
        where: { id: payload.id },
        data: payload,
      });
    case 'delete':
      return await prisma.evidence.delete({
        where: { id: payload.id },
      });
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
```

### Week 7: PWA Manifest & Offline UI

#### 7.1 PWA Configuration

`next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
};

// PWA configuration
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA(nextConfig);
```

`public/manifest.json`:
```json
{
  "name": "CRMS - Criminal Record Management System",
  "short_name": "CRMS",
  "description": "Sierra Leone Police Force - Criminal Record Management",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e40af",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

#### 7.2 Offline Indicator Component

`components/layout/offline-indicator.tsx`:
```typescript
"use client";

import { useEffect, useState } from 'react';
import { syncEngine } from '@/lib/sync/engine';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    const updateQueueCount = async () => {
      const count = await syncEngine.getQueueCount();
      setQueueCount(count);
    };

    updateOnlineStatus();
    updateQueueCount();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const interval = setInterval(updateQueueCount, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await syncEngine.syncAll();
    const count = await syncEngine.getQueueCount();
    setQueueCount(count);
    setSyncing(false);
  };

  if (isOnline && queueCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
        {!isOnline ? (
          <>
            <WifiOff className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-semibold text-sm">Working Offline</p>
              <p className="text-xs text-gray-500">
                {queueCount} item{queueCount !== 1 ? 's' : ''} pending sync
              </p>
            </div>
          </>
        ) : (
          <>
            <Wifi className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-semibold text-sm">Connected</p>
              <p className="text-xs text-gray-500">
                {queueCount} item{queueCount !== 1 ? 's' : ''} to sync
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                'Sync Now'
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## 🎯 Phase 4: Case, Person, Evidence Management (Weeks 8-10)

### Week 8: Case Management

#### 8.1 Case List Page

`app/(dashboard)/cases/page.tsx`:
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CaseList } from '@/components/cases/case-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function CasesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const cases = await prisma.case.findMany({
    where: {
      stationId: session.user.stationId,
    },
    include: {
      officer: {
        select: {
          name: true,
          badge: true,
        },
      },
      persons: {
        include: {
          person: {
            select: {
              fullName: true,
            },
          },
        },
      },
      _count: {
        select: {
          evidence: true,
          notes: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Cases</h1>
          <p className="text-gray-600">Manage criminal cases and investigations</p>
        </div>
        <Link href="/cases/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
        </Link>
      </div>

      <CaseList cases={cases} />
    </div>
  );
}
```

#### 8.2 Case Form Component

`components/cases/case-form.tsx`:
```typescript
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const caseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  severity: z.enum(['minor', 'major', 'critical']),
  incidentDate: z.string().min(1, 'Incident date is required'),
  location: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseSchema>;

export function CaseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      severity: 'major',
    },
  });

  const onSubmit = async (data: CaseFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const { case: newCase } = await response.json();
        router.push(`/cases/${newCase.id}`);
      } else {
        throw new Error('Failed to create case');
      }
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Case Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief description of the case" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of the incident"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="assault">Assault</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="murder">Murder</SelectItem>
                    <SelectItem value="robbery">Armed Robbery</SelectItem>
                    <SelectItem value="kidnapping">Kidnapping</SelectItem>
                    <SelectItem value="drug">Drug Offense</SelectItem>
                    <SelectItem value="cybercrime">Cybercrime</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="incidentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incident Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Where did this occur?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Case'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

#### 8.3 Cases API Route

`app/api/cases/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session, 'cases', 'create', 'station')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, category, severity, incidentDate, location } = body;

    // Generate case number
    const year = new Date().getFullYear();
    const station = await prisma.station.findUnique({
      where: { id: session.user.stationId },
    });

    const caseCount = await prisma.case.count({
      where: {
        stationId: session.user.stationId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });

    const caseNumber = `${station?.code}-${year}-${String(caseCount + 1).padStart(6, '0')}`;

    // Create case
    const newCase = await prisma.case.create({
      data: {
        id: uuid(),
        caseNumber,
        title,
        description,
        category,
        severity,
        incidentDate: new Date(incidentDate),
        location,
        stationId: session.user.stationId,
        officerId: session.user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'case',
        entityId: newCase.id,
        officerId: session.user.id,
        action: 'create',
        details: { caseNumber: newCase.caseNumber, title: newCase.title },
        success: true,
      },
    });

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session, 'cases', 'read', 'station')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const cases = await prisma.case.findMany({
      where: {
        stationId: session.user.stationId,
        ...(status && { status }),
        ...(category && { category }),
      },
      include: {
        officer: {
          select: {
            name: true,
            badge: true,
          },
        },
        _count: {
          select: {
            persons: true,
            evidence: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}
```

### Week 9: Person Management

#### 9.1 Person Form with NIN Validation

`components/persons/person-form.tsx`:
```typescript
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const personSchema = z.object({
  nationalId: z.string().regex(/^[0-9]{11}$/, 'NIN must be 11 digits'),
  idType: z.string().default('NIN'),
  countryCode: z.string().default('SLE'),
  fullName: z.string().min(2, 'Full name is required'),
  aliases: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  nationality: z.string().default('SLE'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

type PersonFormData = z.infer<typeof personSchema>;

export function PersonForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const form = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      idType: 'NIN',
      countryCode: 'SLE',
      nationality: 'SLE',
    },
  });

  const verifyNIN = async () => {
    const nin = form.getValues('nationalId');
    if (!nin || nin.length !== 11) {
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(`/api/persons/verify-nin?nin=${nin}`);
      if (response.ok) {
        const { person } = await response.json();
        if (person) {
          form.setValue('fullName', person.fullName);
          form.setValue('dob', person.dob);
          form.setValue('gender', person.gender);
        }
      }
    } catch (error) {
      console.error('NIN verification error:', error);
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = async (data: PersonFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          aliases: data.aliases ? data.aliases.split(',').map(a => a.trim()) : [],
        }),
      });

      if (response.ok) {
        const { person } = await response.json();
        router.push(`/persons/${person.id}`);
      } else {
        throw new Error('Failed to create person');
      }
    } catch (error) {
      console.error('Error creating person:', error);
      alert('Failed to create person. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nationalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>National Identification Number (NIN)</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    placeholder="12345678901"
                    maxLength={11}
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={verifyNIN}
                  disabled={verifying || field.value?.length !== 11}
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
              <FormDescription>
                11-digit National ID number for Sierra Leone citizens
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="aliases"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aliases (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Comma-separated aliases" {...field} />
              </FormControl>
              <FormDescription>
                Enter known aliases separated by commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field}) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Street address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+232 XX XXX XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Person'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### Week 10: Evidence Management

#### 10.1 Evidence Upload Component

`components/evidence/evidence-upload.tsx`:
```typescript
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileIcon } from 'lucide-react';

const evidenceSchema = z.object({
  type: z.enum(['photo', 'document', 'video', 'physical', 'digital']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  collectedDate: z.string().min(1, 'Collection date is required'),
  file: z.any().optional(),
});

type EvidenceFormData = z.infer<typeof evidenceSchema>;

interface EvidenceUploadProps {
  caseId: string;
  onSuccess?: () => void;
}

export function EvidenceUpload({ caseId, onSuccess }: EvidenceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceSchema),
  });

  const onSubmit = async (data: EvidenceFormData) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('caseId', caseId);
      formData.append('type', data.type);
      formData.append('description', data.description);
      formData.append('collectedDate', data.collectedDate);

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch('/api/evidence', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        form.reset();
        setSelectedFile(null);
        onSuccess?.();
      } else {
        throw new Error('Failed to upload evidence');
      }
    } catch (error) {
      console.error('Error uploading evidence:', error);
      alert('Failed to upload evidence. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Evidence Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="physical">Physical Item</SelectItem>
                  <SelectItem value="digital">Digital Evidence</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of the evidence"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="collectedDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection Date/Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-2 border-dashed rounded-lg p-6">
          <Input
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="mb-4"
          />
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileIcon className="h-4 w-4" />
              <span>{selectedFile.name}</span>
              <span className="text-gray-400">
                ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          )}
        </div>

        <Button type="submit" disabled={uploading}>
          {uploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-pulse" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Evidence
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 🎯 Phase 5: Audit Logging & Security (Weeks 11-12)

### Week 11: Comprehensive Audit System

#### 11.1 Audit Service

`lib/audit.ts`:
```typescript
import { prisma } from './db';

export interface AuditLogParams {
  entityType: string;
  entityId?: string;
  officerId?: string;
  action: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  stationId?: string;
  success?: boolean;
}

export async function auditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        officerId: params.officerId,
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        stationId: params.stationId,
        success: params.success ?? true,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit failures shouldn't break app functionality
  }
}

export async function getAuditLogs(filters: {
  entityType?: string;
  entityId?: string;
  officerId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  return await prisma.auditLog.findMany({
    where: {
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.entityId && { entityId: filters.entityId }),
      ...(filters.officerId && { officerId: filters.officerId }),
      ...(filters.action && { action: filters.action }),
      ...(filters.startDate && {
        createdAt: {
          gte: filters.startDate,
          ...(filters.endDate && { lte: filters.endDate }),
        },
      }),
    },
    include: {
      officer: {
        select: {
          name: true,
          badge: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filters.limit || 100,
  });
}
```

#### 11.2 Encryption Utilities

`lib/encryption.ts`:
```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');

if (KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function hashSHA256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
```

### Week 12: Rate Limiting & Security Headers

#### 12.1 Rate Limiting Middleware

`lib/rate-limit.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
}) {
  return async (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    const key = `${ip}:${request.nextUrl.pathname}`;

    const now = Date.now();
    const record = store[key];

    if (!record || now > record.resetAt) {
      store[key] = {
        count: 1,
        resetAt: now + options.windowMs,
      };
      return null;
    }

    if (record.count >= options.maxRequests) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        },
        { status: 429 }
      );
    }

    record.count++;
    return null;
  };
}
```

#### 12.2 Security Headers

`middleware.ts` (enhanced):
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  );
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ["/login", "/api/auth", "/api/ussd"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return response;
  }

  // Require authentication
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Check session expiry
  if (token.exp && Date.now() >= token.exp * 1000) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "SessionExpired");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
```

---

## 🎯 Phase 6: Background Checks & Alerts (Weeks 13-14)

### Week 13: Background Check System

#### 13.1 Background Check API

`app/api/bgcheck/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { auditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session, 'bgcheck', 'create', 'station')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { nin, requestType } = body;

    // Validate NIN
    if (!nin || !/^[0-9]{11}$/.test(nin)) {
      return NextResponse.json({ error: 'Invalid NIN' }, { status: 400 });
    }

    // Search for person
    const person = await prisma.person.findUnique({
      where: { nationalId: nin },
      include: {
        cases: {
          include: {
            case: {
              select: {
                caseNumber: true,
                title: true,
                category: true,
                severity: true,
                status: true,
                incidentDate: true,
              },
            },
          },
        },
      },
    });

    let result: any;

    if (!person) {
      result = {
        status: 'clear',
        message: 'No criminal record found',
        nin,
      };
    } else {
      const suspectCases = person.cases.filter((c) => c.role === 'suspect');

      if (suspectCases.length === 0) {
        result = {
          status: 'clear',
          message: 'No criminal record found',
          nin,
        };
      } else {
        result = {
          status: 'record_found',
          message: 'Criminal record exists',
          nin,
          recordCount: suspectCases.length,
          cases: suspectCases.map((c) => ({
            caseNumber: c.case.caseNumber,
            title: c.case.title,
            category: c.case.category,
            severity: c.case.severity,
            status: c.case.status,
            incidentDate: c.case.incidentDate,
          })),
        };
      }
    }

    // Create background check record
    const bgCheck = await prisma.backgroundCheck.create({
      data: {
        nin,
        requestedById: session.user.id,
        requestType,
        result,
        status: 'completed',
        issuedAt: new Date(),
      },
    });

    // Audit log
    await auditLog({
      entityType: 'bgcheck',
      entityId: bgCheck.id,
      officerId: session.user.id,
      action: 'create',
      details: { nin, result: result.status },
      success: true,
    });

    return NextResponse.json({ bgCheck }, { status: 201 });
  } catch (error) {
    console.error('Error processing background check:', error);
    return NextResponse.json(
      { error: 'Failed to process background check' },
      { status: 500 }
    );
  }
}
```

### Week 14: Amber Alerts & Wanted Persons

#### 14.1 Amber Alert Component

`components/alerts/amber-alert-form.tsx`:
```typescript
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const amberAlertSchema = z.object({
  personName: z.string().min(2, 'Name is required'),
  age: z.number().min(0).max(18),
  gender: z.string().min(1, 'Gender is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  lastSeenLocation: z.string().min(5, 'Last seen location is required'),
  lastSeenDate: z.string().min(1, 'Last seen date is required'),
  contactPhone: z.string().min(10, 'Contact phone is required'),
  photoUrl: z.string().optional(),
});

type AmberAlertFormData = z.infer<typeof amberAlertSchema>;

export function AmberAlertForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<AmberAlertFormData>({
    resolver: zodResolver(amberAlertSchema),
  });

  const onSubmit = async (data: AmberAlertFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts/amber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push('/alerts/amber');
      } else {
        throw new Error('Failed to create Amber Alert');
      }
    } catch (error) {
      console.error('Error creating Amber Alert:', error);
      alert('Failed to create Amber Alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Amber Alert:</strong> Used for missing children cases. Alerts will be broadcast
            to all stations and via USSD.
          </p>
        </div>

        <FormField
          control={form.control}
          name="personName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Child's Name</FormLabel>
              <FormControl>
                <Input placeholder="Full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Age"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <Input placeholder="Gender" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Physical description, clothing, distinguishing features"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lastSeenLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Seen Location</FormLabel>
                <FormControl>
                  <Input placeholder="Location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastSeenDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Seen Date/Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+232 XX XXX XXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700">
            {loading ? 'Creating Alert...' : 'Issue Amber Alert'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

## 🎯 Phase 7: USSD Integration (Weeks 15-16)

### Week 15: USSD Menu System

#### 15.1 USSD Handler

`app/api/ussd/callback/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const sessionId = body.get('sessionId')?.toString();
    const serviceCode = body.get('serviceCode')?.toString();
    const phoneNumber = body.get('phoneNumber')?.toString();
    const text = body.get('text')?.toString() || '';

    if (!sessionId || !phoneNumber) {
      return new NextResponse('CON Invalid request', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const textParts = text.split('*');
    const userInput = textParts[textParts.length - 1];

    let response = '';

    if (text === '') {
      // Main menu
      response = `CON Welcome to CRMS
1. Background Check
2. Report Crime
3. Check Alert Status
4. Police Station Locator`;
    } else if (textParts[0] === '1') {
      // Background Check flow
      if (textParts.length === 1) {
        response = `CON Enter National ID Number (NIN):`;
      } else if (textParts.length === 2) {
        const nin = textParts[1];

        // Validate NIN
        if (!/^[0-9]{11}$/.test(nin)) {
          response = `END Invalid NIN. Please try again.`;
        } else {
          // Process background check
          const result = await processBackgroundCheck(nin, phoneNumber);
          response = `END ${result}`;
        }
      }
    } else if (textParts[0] === '2') {
      // Report Crime flow
      if (textParts.length === 1) {
        response = `CON Select Crime Type:
1. Theft
2. Assault
3. Fraud
4. Emergency`;
      } else if (textParts.length === 2) {
        response = `CON Describe the incident (keep it brief):`;
      } else if (textParts.length === 3) {
        const crimeType = textParts[1];
        const description = textParts[2];

        // Create case report
        const caseNumber = await createCaseReport(phoneNumber, crimeType, description);
        response = `END Thank you. Your report has been received.
Case Number: ${caseNumber}
An officer will contact you soon.`;
      }
    } else if (textParts[0] === '3') {
      // Check alerts
      response = await checkAlerts();
    } else if (textParts[0] === '4') {
      // Station locator
      if (textParts.length === 1) {
        response = `CON Enter your district:`;
      } else {
        const district = textParts[1];
        const stations = await findStations(district);
        response = `END Nearest Police Stations:\n${stations}`;
      }
    } else {
      response = `CON Invalid selection. Please try again.
1. Background Check
2. Report Crime
3. Check Alert Status
4. Police Station Locator`;
    }

    return new NextResponse(response, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('USSD error:', error);
    return new NextResponse('END An error occurred. Please try again later.', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function processBackgroundCheck(nin: string, phoneNumber: string) {
  const person = await prisma.person.findUnique({
    where: { nationalId: nin },
    include: {
      cases: {
        where: { role: 'suspect' },
        include: { case: { select: { category: true } } },
      },
    },
  });

  // Create background check record
  await prisma.backgroundCheck.create({
    data: {
      nin,
      requestType: 'citizen',
      result: person
        ? { status: 'record_exists', count: person.cases.length }
        : { status: 'clear' },
      status: 'completed',
      phoneNumber,
      issuedAt: new Date(),
    },
  });

  if (!person || person.cases.length === 0) {
    return 'Clear - No criminal record found.';
  } else {
    return `Record Found - ${person.cases.length} case(s) on file. Visit your nearest police station for details.`;
  }
}

async function createCaseReport(
  phoneNumber: string,
  crimeType: string,
  description: string
) {
  const station = await prisma.station.findFirst({
    where: { code: 'HQ-001' }, // Default to HQ
  });

  const year = new Date().getFullYear();
  const caseCount = await prisma.case.count();
  const caseNumber = `USSD-${year}-${String(caseCount + 1).padStart(6, '0')}`;

  await prisma.case.create({
    data: {
      caseNumber,
      title: `USSD Report - ${getCrimeTypeName(crimeType)}`,
      description: `Phone: ${phoneNumber}\n\n${description}`,
      category: getCrimeTypeName(crimeType).toLowerCase(),
      severity: 'major',
      incidentDate: new Date(),
      stationId: station!.id,
      officerId: station!.officers[0]?.id || '', // Assign to first officer
    },
  });

  return caseNumber;
}

async function checkAlerts() {
  const activeAlerts = await prisma.amberAlert.findMany({
    where: { status: 'active' },
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  if (activeAlerts.length === 0) {
    return 'END No active alerts at this time.';
  }

  let alertText = 'END Active Amber Alerts:\n\n';
  activeAlerts.forEach((alert, i) => {
    alertText += `${i + 1}. ${alert.personName}, Age ${alert.age}\n`;
    alertText += `   Last seen: ${alert.lastSeenLocation}\n\n`;
  });

  return alertText;
}

async function findStations(district: string) {
  const stations = await prisma.station.findMany({
    where: {
      district: { contains: district, mode: 'insensitive' },
    },
    take: 3,
  });

  if (stations.length === 0) {
    return 'No stations found in that area.';
  }

  return stations
    .map((s) => `${s.name}\n${s.location}\nPhone: ${s.phone}`)
    .join('\n\n');
}

function getCrimeTypeName(code: string): string {
  const types: Record<string, string> = {
    '1': 'Theft',
    '2': 'Assault',
    '3': 'Fraud',
    '4': 'Emergency',
  };
  return types[code] || 'Other';
}
```

### Week 16: USSD Testing & Optimization

#### 16.1 USSD Session Management

`lib/ussd-session.ts`:
```typescript
import { prisma } from './db';

export class USSDSessionManager {
  async saveSession(
    sessionId: string,
    phoneNumber: string,
    currentMenu: string,
    data: any
  ) {
    // Store in Redis or in-memory cache for production
    // For now, we'll use a simple Map
    const session = {
      sessionId,
      phoneNumber,
      currentMenu,
      data,
      lastActivity: new Date(),
    };

    // Save to cache (implement cache layer in production)
    return session;
  }

  async getSession(sessionId: string) {
    // Retrieve from cache
    return null;
  }

  async clearSession(sessionId: string) {
    // Remove from cache
  }
}
```

---

## 🎯 Phase 8: Dashboards & Reporting (Weeks 17-18)

### Week 17: Analytics Dashboard

#### 17.1 Dashboard Page

`app/(dashboard)/dashboard/page.tsx`:
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { BarChart, TrendingUp, Users, AlertTriangle } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  // Fetch dashboard stats
  const [totalCases, activeCases, totalPersons, activeAlerts] = await Promise.all([
    prisma.case.count({ where: { stationId: session.user.stationId } }),
    prisma.case.count({
      where: {
        stationId: session.user.stationId,
        status: { in: ['open', 'investigating'] },
      },
    }),
    prisma.person.count(),
    prisma.amberAlert.count({ where: { status: 'active' } }),
  ]);

  // Recent cases
  const recentCases = await prisma.case.findMany({
    where: { stationId: session.user.stationId },
    include: {
      officer: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Case statistics by category
  const casesByCategory = await prisma.case.groupBy({
    by: ['category'],
    where: { stationId: session.user.stationId },
    _count: true,
    orderBy: {
      _count: {
        category: 'desc',
      },
    },
    take: 5,
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cases</p>
              <p className="text-3xl font-bold">{totalCases}</p>
            </div>
            <BarChart className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Cases</p>
              <p className="text-3xl font-bold">{activeCases}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Persons</p>
              <p className="text-3xl font-bold">{totalPersons}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-3xl font-bold">{activeAlerts}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Cases</h2>
          <div className="space-y-3">
            {recentCases.map((c) => (
              <div key={c.id} className="border-b pb-3">
                <p className="font-medium">{c.caseNumber}</p>
                <p className="text-sm text-gray-600">{c.title}</p>
                <p className="text-xs text-gray-500">
                  Officer: {c.officer.name} • {c.status}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Cases by Category */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Cases by Category</h2>
          <div className="space-y-3">
            {casesByCategory.map((cat) => (
              <div key={cat.category} className="flex justify-between items-center">
                <span className="capitalize">{cat.category}</span>
                <span className="font-semibold">{cat._count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
```

### Week 18: Report Generation

*(Implementation details for PDF report generation, CSV exports, etc.)*

---

## 🎯 Phase 9: PWA Optimization (Weeks 19-20)

### Week 19: Service Worker Enhancement

*(Implementation details for caching strategies, background sync)*

### Week 20: PWA Testing

*(Testing on various devices, performance optimization)*

---

## 🎯 Phase 10: MFA Implementation (Week 21)

### Week 21: Two-Factor Authentication

#### 21.1 MFA Setup Component

`components/auth/mfa-setup.tsx`:
```typescript
"use client";

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MFASetup({ officerId }: { officerId: string }) {
  const [secret, setSecret] = useState('');
  const [qrCode, setQRCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const enableMFA = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setSecret(data.secret);
        setQRCode(data.qrCode);
      }
    } catch (error) {
      console.error('Error enabling MFA:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyMFA = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (response.ok) {
        alert('MFA enabled successfully!');
      } else {
        alert('Invalid code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying MFA:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!qrCode ? (
        <Button onClick={enableMFA} disabled={loading}>
          Enable Two-Factor Authentication
        </Button>
      ) : (
        <>
          <div className="text-center">
            <p className="mb-4">Scan this QR code with your authenticator app:</p>
            <QRCodeSVG value={qrCode} size={200} />
            <p className="mt-4 text-sm text-gray-600">
              Or enter this code manually: <code>{secret}</code>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Enter verification code:
            </label>
            <Input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
            />
            <Button
              onClick={verifyMFA}
              disabled={loading || verificationCode.length !== 6}
              className="mt-4 w-full"
            >
              Verify and Enable MFA
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 🎯 Phase 11: Testing & QA (Weeks 22-23)

### Week 22: Unit & Integration Tests

#### 22.1 Test Setup

`jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Week 23: E2E Tests

`tests/e2e/login.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('officer can log in', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await page.fill('input[name="badge"]', 'SA-00001');
  await page.fill('input[name="pin"]', '12345678');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/.*dashboard/);
});
```

---

## 🎯 Phase 12: DPG Submission & Deployment (Weeks 24-26)

### Week 24: DPG Application Preparation

#### 24.1 DPG Checklist

- [ ] All 9 DPG indicators documented
- [ ] Open source license (MIT) ✅
- [ ] Clear ownership ✅
- [ ] Platform independence (Docker) ✅
- [ ] Documentation complete ✅
- [ ] Mechanism for extracting data ✅
- [ ] Privacy & applicable laws ✅
- [ ] Standards & best practices ✅
- [ ] Do no harm assessment ✅

### Week 25: Production Deployment

#### 25.1 Deployment Checklist

```bash
# Pre-deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Backup system configured
- [ ] Monitoring setup (e.g., Sentry, DataDog)
- [ ] Load balancer configured
- [ ] CDN configured for static assets

# Deployment
docker-compose -f docker-compose.prod.yml up -d

# Post-deployment
- [ ] Health checks passing
- [ ] Test all critical user flows
- [ ] Monitor error logs
- [ ] Performance metrics baseline
- [ ] User acceptance testing with pilot station
```

### Week 26: Training & Handover

- Officer training sessions
- Admin training
- Documentation walkthroughs
- Support ticketing system setup
- Maintenance schedule establishment

---

## 📊 Project Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1 | 3 weeks | Foundation, DPG docs, Docker |
| 2 | 2 weeks | Auth, RBAC, permissions |
| 3 | 2 weeks | Offline-first architecture |
| 4 | 3 weeks | Case, Person, Evidence management |
| 5 | 2 weeks | Audit logging, security |
| 6 | 2 weeks | Background checks, alerts |
| 7 | 2 weeks | USSD integration |
| 8 | 2 weeks | Dashboards, reporting |
| 9 | 2 weeks | PWA optimization |
| 10 | 1 week | MFA implementation |
| 11 | 2 weeks | Testing & QA |
| 12 | 3 weeks | DPG submission, deployment |
| **Total** | **26 weeks** | **Production-ready DPG** |

---

## 🚀 Getting Started

### Quick Start Commands

```bash
# 1. Clone and setup
git clone https://github.com/sierra-leone-police/crms.git
cd crms
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Setup database
docker-compose up -d postgres
npx prisma db push
npx prisma db seed

# 4. Run development
npm run dev

# 5. Access application
# URL: http://localhost:3000
# Badge: SA-00001
# PIN: 12345678
```

---

## 📖 Next Steps

1. Review and approve this implementation plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews
5. Prepare for DPG submission

---

## 🤝 Support

- **Documentation**: See `docs/` folder
- **Issues**: https://github.com/sierra-leone-police/crms/issues
- **Discussions**: https://github.com/sierra-leone-police/crms/discussions
- **Email**: dev@crms.gov.sl

---

**Last Updated**: January 2025
**Version**: 1.0
**Status**: Ready for Implementation
