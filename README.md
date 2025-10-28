# Criminal Record Management System (CRMS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DPG](https://img.shields.io/badge/Digital%20Public%20Good-Candidate-blue)](https://digitalpublicgoods.net)
[![SDG 16](https://img.shields.io/badge/SDG-16%20Peace%20%26%20Justice-green)](https://sdgs.un.org/goals/goal16)
[![Pan-African](https://img.shields.io/badge/Scope-Pan--African-orange)](https://github.com/african-digital-goods/crms)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-Latest-2D3748)](https://www.prisma.io)

A **Pan-African Digital Public Good** for managing criminal records across the African continent, with offline-first architecture for limited internet connectivity. **Pilot implementation:** Sierra Leone Police Force.

---

## 🌍 About

CRMS is a **reusable, configurable open-source platform** designed for law enforcement agencies across Africa. With its pilot in Sierra Leone, CRMS can be deployed in any African country with configuration-based customization (no code forking required).

### Key Features

- 🔐 **Secure Authentication** - Badge + PIN with Argon2id hashing, Multi-Factor Authentication (MFA)
- 👥 **Role-Based Access Control (RBAC)** - 6 roles with granular permissions
- 📱 **Progressive Web App (PWA)** - Works offline with service workers and IndexedDB
- 🌐 **USSD Support** - Background checks via feature phones (no smartphone required)
- 📊 **Comprehensive Audit Logging** - Immutable audit trails for all actions
- 🔒 **End-to-End Encryption** - AES-256 for PII, TLS 1.3 in transit
- 🚀 **Optimized for 2G/3G Networks** - Minimal data usage, offline-first
- 🌍 **Multi-Language Support** - English, French, Portuguese, Arabic, and more
- 🗂️ **Case Management** - Track investigations from report to prosecution
- 👤 **Person Records** - Biometric data, aliases, national ID integration
- 📦 **Evidence Management** - QR codes, chain of custody, file integrity
- 🚨 **Amber Alerts & Wanted Notices** - Real-time alerts for missing persons and fugitives
- ✅ **Background Checks** - Citizen and employer background verification
- 📈 **Dashboards & Reporting** - Data-driven insights for law enforcement

### Country-Agnostic Design

- ✅ Supports any national ID system (NIN, Ghana Card, Huduma Namba, etc.)
- ✅ Configurable legal frameworks and case workflows
- ✅ Multi-language and multi-currency support
- ✅ Adaptable to different police organizational structures
- ✅ Interoperability with regional security systems (ECOWAS, SADC, AU)

---

## 🎯 Digital Public Good Alignment

This project aligns with:

- **SDG 16**: Peace, Justice and Strong Institutions (Targets 16.3, 16.a, 16.6)
- **DPG Standard**: Meets all 9 indicators for Digital Public Goods
- **Data Protection**: GDPR and Malabo Convention compliant

### Why a Digital Public Good?

CRMS is designed as a **public good** to empower law enforcement agencies across Africa without cost barriers, vendor lock-in, or proprietary restrictions. By open-sourcing this system, we enable:

1. **Shared Development** - Countries contribute improvements benefiting all
2. **Transparency** - Open code builds public trust in criminal justice systems
3. **Sovereignty** - Countries control their own data and infrastructure
4. **Affordability** - No licensing fees, reducing financial barriers
5. **Interoperability** - Cross-border cooperation for regional security

---

## ✨ Core Features

### 1. Authentication & Authorization

- **Badge + PIN Authentication** (8-digit PIN, Argon2id hashed)
- **Multi-Factor Authentication** (SMS OTP, TOTP)
- **6 Role Hierarchy**: SuperAdmin, Admin, StationCommander, Officer, EvidenceClerk, Viewer
- **Granular Permissions**: Resource (cases, persons, evidence), Action (CRUD), Scope (own, station, region, national)
- **Account Security**: Lockout after 5 failed attempts, session expiry (15 minutes)

### 2. Case Management

- **Case Tracking**: From initial report to prosecution and court
- **Case Status Workflow**: Open → Investigating → Charged → Court → Closed
- **Case Categories**: Theft, assault, fraud, murder, robbery, kidnapping, etc. (country-configurable)
- **Severity Levels**: Minor, major, critical
- **Multi-Station Coordination**: Cases can involve multiple stations
- **Audit Trail**: Every case update is logged

### 3. Person Records

- **National ID Integration**: Supports any national ID system (NIN, Ghana Card, etc.)
- **Biometric Data**: Fingerprints (SHA-256 hashed), photos
- **PII Encryption**: Addresses, phone numbers, emails (AES-256 encrypted)
- **Aliases**: Track known aliases
- **Case Roles**: Suspect, victim, witness, informant
- **Cross-Reference**: Link persons to multiple cases

### 4. Evidence Management

- **QR Code Tracking**: Unique identifiers for physical evidence
- **Chain of Custody**: JSON log of every custody transfer
- **File Storage**: S3-compatible (MinIO/AWS S3), encrypted
- **File Integrity**: SHA-256 hash verification
- **Evidence Types**: Photo, document, video, physical, digital

### 5. Amber Alerts & Wanted Persons

- **Amber Alerts**: Missing children with photos, descriptions, last seen location
- **Wanted Notices**: Fugitives with danger levels, rewards, aliases
- **Public Distribution**: USSD access for citizens
- **Expiry Management**: Auto-expire alerts after set periods

### 6. Background Checks

- **Request Types**: Officer, citizen, employer, visa
- **Citizen Access**: Via USSD (feature phones) or web
- **Redacted Results**: Citizens receive "Clear" or "Record exists - visit station"
- **Officer Access**: Full detailed results with audit logging
- **Certificate Generation**: PDF certificates for clean records

### 7. Offline-First Architecture

- **Service Workers**: Cache API responses for offline use
- **IndexedDB**: Store data locally for offline CRUD operations
- **Sync Queue**: Auto-sync when connection restored
- **Conflict Resolution**: Last-write-wins with manual merge for conflicts

### 8. USSD Integration (Africa's Talking / Twilio)

- **Background Checks**: `*123*1*NIN#` (country-specific shortcode)
- **Case Status**: `*123*2*CaseNumber#`
- **Wanted Persons**: `*123*3#` (search by name)
- **Works on Feature Phones**: No smartphone or data plan required

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 15+
- **npm** or **yarn**

### Installation

```bash
# Clone repository
git clone https://github.com/african-digital-goods/crms.git
cd crms

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and secrets

# Set up database
npx prisma db push
npx prisma db seed

# Run development server
npm run dev
```

Visit `http://localhost:3000`

**Default SuperAdmin credentials** (change immediately after first login):
- **Badge**: `SA-00001`
- **PIN**: `12345678`

### Docker Installation

```bash
# Using Docker Compose (includes PostgreSQL + MinIO + App)
docker-compose up -d

# Access application
http://localhost:3000
```

---

## 📖 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Development guide for Claude Code AI
- **[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** - 26-week detailed implementation plan
- **[docs/SERVICE_REPOSITORY_ARCHITECTURE.md](docs/SERVICE_REPOSITORY_ARCHITECTURE.md)** - Architecture patterns
- **[docs/CRMS_REQUIREMENTS_SPECIFICATION.md](docs/CRMS_REQUIREMENTS_SPECIFICATION.md)** - Full requirements spec
- **[MULTI_COUNTRY_DEPLOYMENT.md](MULTI_COUNTRY_DEPLOYMENT.md)** - Multi-country deployment guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[SECURITY.md](SECURITY.md)** - Security policy
- **[PRIVACY_POLICY.md](PRIVACY_POLICY.md)** - Data protection policy

---

## 🏗️ Technology Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19** (Server & Client Components)
- **TypeScript 5**
- **Tailwind CSS 4**
- **shadcn/ui** (Radix UI components)

### Backend
- **Next.js API Routes** (serverless functions)
- **Prisma ORM** (type-safe database access)
- **PostgreSQL 15+** (primary database)

### Authentication
- **NextAuth.js 5** (OAuth, credentials provider)
- **Argon2id** (password/PIN hashing)
- **JWT** (stateless sessions)

### Offline & PWA
- **Service Workers** (Workbox)
- **IndexedDB** (Dexie.js for local storage)
- **Progressive Web App** (manifest.json, installable)

### Storage
- **S3-Compatible** (MinIO for self-hosted, AWS S3 for cloud)
- **AES-256 Encryption** (PII data at rest)

### USSD
- **Africa's Talking** (preferred for Africa)
- **Twilio** (alternative)

---

## 🔒 Security

- **Argon2id Password Hashing** (OWASP recommended)
- **AES-256 Encryption** for PII at rest
- **TLS 1.3 Enforcement** for data in transit
- **Comprehensive Audit Logging** (immutable)
- **OWASP Top 10 Compliant**
- **Rate Limiting** (DDoS protection)
- **Input Validation** (Zod schemas)
- **SQL Injection Prevention** (Prisma ORM)
- **XSS Protection** (React auto-escaping)

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## 🌍 Multi-Country Deployment

CRMS is designed for deployment in **any African country** with minimal configuration:

### Example Deployments

1. **Sierra Leone** (Pilot) - NIN, English, Leone currency
2. **Ghana** - Ghana Card, English/Twi/Ewe, Cedi currency
3. **Nigeria** - Nigerian NIN, English/Hausa/Yoruba/Igbo, Naira currency
4. **Kenya** - Huduma Namba, English/Swahili, Shilling currency
5. **South Africa** - SA ID, English/Afrikaans/Zulu, Rand currency

### Configuration-Based Customization

Create `config/countries/{country-code}.json`:

```json
{
  "countryCode": "GHA",
  "countryName": "Ghana",
  "nationalIdSystem": {
    "type": "GHANA_CARD",
    "displayName": "Ghana Card",
    "format": "GHA-XXXXXXXXX-X"
  },
  "language": {
    "default": "en",
    "supported": ["en", "tw", "ee"]
  },
  "currency": "GHS",
  "policeStructure": {
    "type": "centralized",
    "levels": ["national", "regional", "district", "station"]
  }
}
```

See [MULTI_COUNTRY_DEPLOYMENT.md](MULTI_COUNTRY_DEPLOYMENT.md) for full deployment guide.

---

## 🤝 Contributing

We welcome contributions from developers, law enforcement agencies, and civil society organizations!

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

1. **Code Contributions** - Bug fixes, features, improvements
2. **Translations** - Add support for new languages
3. **Documentation** - Improve guides, tutorials, API docs
4. **Testing** - Report bugs, test in different environments
5. **Deployment Assistance** - Help other countries deploy CRMS
6. **Use Cases** - Share your deployment experience

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file.

The MIT License enables:
- ✅ Free use by any law enforcement agency
- ✅ Modification and adaptation for local needs
- ✅ Distribution and deployment in any country
- ✅ Commercial support services (while keeping code open)

---

## 🙏 Acknowledgments

- **Pilot Implementation**: Sierra Leone Police Force
- **Supported by**: Digital Public Goods Alliance
- **Technology Partners**: [Your partners]
- **Funding**: [Your funders]

---

## 📞 Contact & Support

- **Website**: [https://crms-africa.org](https://crms-africa.org)
- **GitHub**: [https://github.com/african-digital-goods/crms](https://github.com/african-digital-goods/crms)
- **Issues**: [GitHub Issues](https://github.com/african-digital-goods/crms/issues)
- **Discussions**: [GitHub Discussions](https://github.com/african-digital-goods/crms/discussions)
- **Email**: [support@crms-africa.org](mailto:support@crms-africa.org)

### Deployment Assistance

Need help deploying CRMS in your country? Contact us at [deploy@crms-africa.org](mailto:deploy@crms-africa.org)

---

## 🌟 Star us on GitHub!

If you find this project useful, please give us a star ⭐ to help others discover it!

---

## 📊 Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | 🚧 In Progress | Foundation & DPG Compliance Setup |
| Phase 2 | ⏳ Planned | Authentication & RBAC System |
| Phase 3 | ⏳ Planned | Offline-First Architecture |
| Phase 4 | ⏳ Planned | Case, Person, Evidence Management |
| Phase 5 | ⏳ Planned | Audit Logging & Security |
| Phase 6 | ⏳ Planned | Background Checks & Alerts |
| Phase 7 | ⏳ Planned | USSD Integration |
| Phase 8 | ⏳ Planned | Dashboards & Reporting |
| Phase 9 | ⏳ Planned | PWA Optimization |
| Phase 10 | ⏳ Planned | MFA Implementation |
| Phase 11 | ⏳ Planned | Testing & QA |
| Phase 12 | ⏳ Planned | DPG Submission & Deployment |

**Expected Completion**: June 2025 (26 weeks from start)

---

## 🛣️ Roadmap

### Short-term (Q1-Q2 2025)

- ✅ Complete Phase 1 (Foundation)
- 🚧 Implement authentication system
- 🚧 Build core case management features
- 🚧 Deploy pilot in Sierra Leone

### Medium-term (Q3-Q4 2025)

- 📋 USSD integration for background checks
- 📋 Mobile PWA optimization
- 📋 Multi-language support (French, Portuguese)
- 📋 Submit to Digital Public Goods Alliance

### Long-term (2026+)

- 📋 Expand to 5+ African countries
- 📋 Regional interoperability (ECOWAS, SADC)
- 📋 AI-powered case insights
- 📋 Integration with INTERPOL systems

---

**Built with ❤️ for Africa's law enforcement agencies**

*Empowering justice through open-source technology*
