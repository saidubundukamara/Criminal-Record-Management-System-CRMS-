# Multi-Country Deployment Guide

## Overview

CRMS is designed as a **reusable, configurable platform** that any African country can deploy without forking the codebase. This guide explains how to customize CRMS for different countries while maintaining a single, shared codebase.

---

## Core Design Principles

### 1. Configuration Over Code

Instead of hardcoding country-specific values, CRMS uses configuration files that can be swapped based on deployment context.

**Bad Approach (Hardcoded):**
```typescript
const nationalIdLabel = "NIN"; // Only works for Sierra Leone
const currency = "SLE"; // Leone
```

**Good Approach (Configurable):**
```typescript
const nationalIdLabel = config.nationalIdSystem.displayName; // Works for any country
const currency = config.currency; // Configurable per country
```

### 2. Single Codebase, Multiple Deployments

All countries use the same codebase with different configuration files. Benefits:
- **Shared Improvements** - Bug fixes benefit all countries
- **Easier Maintenance** - No need to merge changes across forks
- **Consistent Quality** - Same security standards everywhere
- **Community Support** - Larger contributor base

### 3. Data Sovereignty

Each country hosts its own instance and database. No central server stores data from multiple countries.

---

## Country Configuration Structure

### Configuration Files

Create country-specific configuration in `config/countries/{country-code}.json`:

```
config/
└── countries/
    ├── SLE.json    # Sierra Leone (pilot)
    ├── GHA.json    # Ghana
    ├── NGA.json    # Nigeria
    ├── KEN.json    # Kenya
    ├── ZAF.json    # South Africa
    └── ...
```

### Configuration Schema

```json
{
  "countryCode": "GHA",
  "countryName": "Ghana",
  "capital": "Accra",

  "nationalIdSystem": {
    "type": "GHANA_CARD",
    "displayName": "Ghana Card",
    "format": "GHA-XXXXXXXXX-X",
    "validationRegex": "^GHA-[0-9]{9}-[0-9]$",
    "length": 15
  },

  "language": {
    "default": "en",
    "supported": ["en", "tw", "ee", "ak"],
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "24h"
  },

  "currency": {
    "code": "GHS",
    "symbol": "GH₵",
    "name": "Ghanaian Cedi"
  },

  "policeStructure": {
    "type": "centralized",
    "levels": ["national", "regional", "district", "station"],
    "ranks": [
      "Inspector General of Police (IGP)",
      "Deputy Inspector General (DIG)",
      "Commissioner of Police (COP)",
      "Assistant Commissioner (ACOS)",
      "Superintendent",
      "Inspector",
      "Sergeant",
      "Corporal",
      "Constable"
    ]
  },

  "legalFramework": {
    "dataProtectionAct": "Data Protection Act, 2012 (Act 843)",
    "penalCode": "Criminal Offences Act, 1960 (Act 29)",
    "evidenceAct": "Evidence Act, 1975 (NRCD 323)"
  },

  "offenseCategories": [
    {
      "code": "01",
      "name": "Offences Against the Person",
      "subcategories": ["Murder", "Manslaughter", "Assault", "Kidnapping"]
    },
    {
      "code": "02",
      "name": "Offences Against Property",
      "subcategories": ["Theft", "Robbery", "Burglary", "Arson"]
    },
    {
      "code": "03",
      "name": "Fraud and Economic Crimes",
      "subcategories": ["Fraud", "Embezzlement", "Forgery", "Cyber Crime"]
    }
  ],

  "telecom": {
    "ussdGateways": ["MTN", "Vodafone", "AirtelTigo"],
    "ussdShortcode": "*920#",
    "smsProvider": "africas-talking",
    "smsApiKey": "env:USSD_API_KEY"
  },

  "integrations": {
    "nationalIdRegistry": {
      "enabled": true,
      "apiEndpoint": "https://api.nia.gov.gh/verify",
      "apiKey": "env:NIA_API_KEY"
    },
    "courtSystem": {
      "enabled": false,
      "apiEndpoint": null
    }
  }
}
```

---

## Reference Implementations

### 1. Sierra Leone (Pilot)

**File:** `config/countries/SLE.json`

```json
{
  "countryCode": "SLE",
  "countryName": "Sierra Leone",
  "capital": "Freetown",

  "nationalIdSystem": {
    "type": "NIN",
    "displayName": "National Identification Number (NIN)",
    "format": "XXXX-XXXX-XXXX",
    "validationRegex": "^[0-9]{4}-[0-9]{4}-[0-9]{4}$",
    "length": 14
  },

  "language": {
    "default": "en",
    "supported": ["en", "kri"],
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "12h"
  },

  "currency": {
    "code": "SLE",
    "symbol": "Le",
    "name": "Sierra Leonean Leone"
  },

  "policeStructure": {
    "type": "centralized",
    "levels": ["national", "regional", "district", "station"],
    "ranks": [
      "Inspector General (IG)",
      "Deputy Inspector General (DIG)",
      "Assistant Inspector General (AIG)",
      "Chief Superintendent (CSP)",
      "Superintendent (SP)",
      "Assistant Superintendent (ASP)",
      "Inspector (INS)",
      "Sergeant (SGT)",
      "Corporal (CPL)",
      "Constable (PC)"
    ]
  },

  "legalFramework": {
    "dataProtectionAct": "Data Protection Act, 2023",
    "penalCode": "The Criminal Procedure Act, 1965",
    "evidenceAct": "Evidence Act, 1965"
  },

  "telecom": {
    "ussdGateways": ["Orange", "Africell", "Qcell"],
    "ussdShortcode": "*456#",
    "smsProvider": "africas-talking"
  }
}
```

### 2. Ghana

**File:** `config/countries/GHA.json`

(See Configuration Schema above for full example)

### 3. Nigeria

**File:** `config/countries/NGA.json`

```json
{
  "countryCode": "NGA",
  "countryName": "Nigeria",
  "capital": "Abuja",

  "nationalIdSystem": {
    "type": "NIN",
    "displayName": "National Identification Number",
    "format": "XXXXXXXXXXX",
    "validationRegex": "^[0-9]{11}$",
    "length": 11
  },

  "language": {
    "default": "en",
    "supported": ["en", "ha", "yo", "ig"],
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "24h"
  },

  "currency": {
    "code": "NGN",
    "symbol": "₦",
    "name": "Nigerian Naira"
  },

  "policeStructure": {
    "type": "federal",
    "levels": ["national", "zonal", "state", "area", "division", "station"]
  },

  "telecom": {
    "ussdGateways": ["MTN", "Glo", "Airtel", "9mobile"],
    "ussdShortcode": "*347#"
  }
}
```

### 4. Kenya

**File:** `config/countries/KEN.json`

```json
{
  "countryCode": "KEN",
  "countryName": "Kenya",
  "capital": "Nairobi",

  "nationalIdSystem": {
    "type": "HUDUMA_NAMBA",
    "displayName": "Huduma Namba",
    "format": "XXXXXXXX",
    "validationRegex": "^[0-9]{8}$",
    "length": 8
  },

  "language": {
    "default": "en",
    "supported": ["en", "sw"],
    "dateFormat": "DD/MM/YYYY",
    "timeFormat": "24h"
  },

  "currency": {
    "code": "KES",
    "symbol": "KSh",
    "name": "Kenyan Shilling"
  },

  "telecom": {
    "ussdGateways": ["Safaricom", "Airtel", "Telkom"],
    "ussdShortcode": "*483#"
  }
}
```

### 5. South Africa

**File:** `config/countries/ZAF.json`

```json
{
  "countryCode": "ZAF",
  "countryName": "South Africa",
  "capital": "Pretoria",

  "nationalIdSystem": {
    "type": "SA_ID",
    "displayName": "South African ID Number",
    "format": "YYMMDDGSSSCAZ",
    "validationRegex": "^[0-9]{13}$",
    "length": 13
  },

  "language": {
    "default": "en",
    "supported": ["en", "af", "zu", "xh", "st", "tn", "ts", "ss", "ve", "nr", "nd"],
    "dateFormat": "YYYY/MM/DD",
    "timeFormat": "24h"
  },

  "currency": {
    "code": "ZAR",
    "symbol": "R",
    "name": "South African Rand"
  },

  "policeStructure": {
    "type": "national",
    "levels": ["national", "provincial", "cluster", "station"]
  }
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Review country config** - Create or customize `config/countries/{COUNTRY_CODE}.json`
- [ ] **Legal review** - Ensure compliance with local data protection laws
- [ ] **Infrastructure assessment** - Evaluate connectivity, hosting options
- [ ] **Stakeholder buy-in** - Get approval from law enforcement leadership
- [ ] **Budget allocation** - Plan for hosting, training, support

### Infrastructure Setup

- [ ] **Provision servers** - Cloud (AWS, Azure, GCP) or on-premise
- [ ] **Database setup** - PostgreSQL 15+ with SSL, backups
- [ ] **Storage setup** - S3-compatible (MinIO self-hosted or AWS S3)
- [ ] **Network configuration** - Firewalls, VPN, load balancers
- [ ] **SSL certificates** - Let's Encrypt or commercial SSL
- [ ] **Monitoring setup** - Uptime monitoring, error tracking

### Application Configuration

- [ ] **Clone repository** - `git clone https://github.com/african-digital-goods/crms.git`
- [ ] **Install dependencies** - `npm install`
- [ ] **Create .env file** - Copy from `.env.example`, fill in country-specific values
- [ ] **Set COUNTRY_CODE** - `COUNTRY_CODE=GHA` in `.env`
- [ ] **Database migration** - `npx prisma db push`
- [ ] **Seed initial data** - `npx prisma db seed` (roles, permissions, first admin)
- [ ] **Build application** - `npm run build`
- [ ] **Test locally** - `npm run dev` and verify configuration

### Integration Setup

- [ ] **National ID integration** - Connect to national ID registry API (if available)
- [ ] **Telecom integration** - Set up USSD gateway (Africa's Talking, Twilio)
- [ ] **SMS provider** - Configure SMS OTP for MFA
- [ ] **Email service** - Configure SMTP for notifications
- [ ] **Court system** - Integrate with court case management (if applicable)

### Data Migration (if upgrading from existing system)

- [ ] **Export old data** - Extract from legacy system (Excel, SQL, paper)
- [ ] **Data cleaning** - Standardize formats, remove duplicates
- [ ] **Create migration scripts** - Map old schema to CRMS schema
- [ ] **Pilot migration** - Test with sample data (100 cases, 50 persons)
- [ ] **Full migration** - Migrate all historical data
- [ ] **Verification** - Audit data integrity (spot checks, checksums)

### Training & Rollout

- [ ] **Train trainers** - 5-10 officers become CRMS experts
- [ ] **Station commander training** - All station commanders trained first
- [ ] **Officer training** - All operational officers trained (in phases)
- [ ] **User manual** - Country-specific user guide (screenshots, workflows)
- [ ] **Pilot station** - Deploy to 1-3 pilot stations first (2-4 weeks)
- [ ] **Evaluate pilot** - Gather feedback, fix issues
- [ ] **Phased rollout** - Deploy to 5-10 stations per month

### Security & Compliance

- [ ] **Security audit** - Penetration testing, vulnerability scanning
- [ ] **Data protection compliance** - Align with local laws (GDPR, Malabo Convention)
- [ ] **Backup strategy** - Automated daily backups, tested restore procedure
- [ ] **Incident response plan** - Document procedures for breaches
- [ ] **Access control** - Review permissions, deactivate test accounts
- [ ] **Audit logging** - Verify all actions are logged

### Post-Deployment

- [ ] **Monitoring** - Set up alerts for downtime, errors, security events
- [ ] **Support** - Establish helpdesk (phone, email, WhatsApp group)
- [ ] **Documentation** - Update country-specific deployment notes
- [ ] **Feedback loop** - Monthly user surveys, quarterly reviews
- [ ] **Performance tuning** - Optimize slow queries, caching
- [ ] **Feature requests** - Prioritize country-specific enhancements

---

## Environment Variables

### Required Variables (All Countries)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/crms"

# NextAuth
NEXTAUTH_URL="https://crms.police.gov.{country-tld}"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Encryption
ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"

# Application
NODE_ENV="production"
COUNTRY_CODE="GHA"  # ISO 3166-1 alpha-3 code
```

### Country-Specific Variables

```bash
# National ID Integration (Ghana example)
NIA_API_ENDPOINT="https://api.nia.gov.gh/verify"
NIA_API_KEY="your-api-key"

# USSD Gateway
USSD_API_KEY="your-africas-talking-api-key"
USSD_USERNAME="your-africas-talking-username"
USSD_SHORTCODE="*920#"

# SMS Provider
SMS_API_KEY="your-sms-api-key"
SMS_SENDER_ID="CRMS-GHA"

# Storage (S3-compatible)
S3_ENDPOINT="https://s3.crms.gov.gh"  # Or AWS S3
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_BUCKET="crms-evidence-gha"
S3_REGION="us-east-1"
```

---

## Customization Points

### 1. National ID Validation

**File:** `src/lib/validation/national-id.ts`

```typescript
import { getCountryConfig } from "@/lib/config";

export function validateNationalId(nin: string, countryCode: string): boolean {
  const config = getCountryConfig(countryCode);
  const regex = new RegExp(config.nationalIdSystem.validationRegex);
  return regex.test(nin);
}
```

### 2. Offense Categories

**Database:** `offenseCategories` table seeded from country config

```typescript
// prisma/seed.ts
const countryConfig = getCountryConfig(process.env.COUNTRY_CODE);
for (const category of countryConfig.offenseCategories) {
  await prisma.offenseCategory.create({
    data: { code: category.code, name: category.name }
  });
}
```

### 3. Case Number Format

**Repository:** `src/repositories/implementations/CaseRepository.ts`

```typescript
async generateCaseNumber(stationCode: string): Promise<string> {
  const year = new Date().getFullYear();
  // Format: {StationCode}-{Year}-{SequentialNumber}
  // Example: HQ-2025-000001 (Sierra Leone)
  // Example: GPS-2025-000001 (Ghana)
  const lastCase = await this.findLastCaseByStation(stationCode, year);
  const nextNumber = (lastCase?.sequentialNumber || 0) + 1;
  return `${stationCode}-${year}-${String(nextNumber).padStart(6, "0")}`;
}
```

### 4. UI Translations

**Files:** `locales/{language-code}/common.json`

```json
{
  "auth": {
    "login": "Login",
    "badge": "Badge Number",
    "pin": "PIN"
  },
  "case": {
    "create": "Create Case",
    "title": "Case Title",
    "description": "Description",
    "category": "Category"
  }
}
```

---

## Regional Interoperability

### Cross-Border Data Sharing (Future Phase)

CRMS will support regional crime intelligence sharing through:

1. **Standard Data Format** - Common JSON schema for person, case data
2. **Encrypted APIs** - TLS 1.3, mutual authentication
3. **Access Control** - Treaty-based permissions (e.g., ECOWAS members)
4. **Audit Trail** - All cross-border queries logged

**Example:** Nigeria requests wanted person from Ghana

```typescript
// Request from Nigeria to Ghana
POST https://crms.police.gov.gh/api/v1/interpol/wanted-persons/search
Authorization: Bearer {regional-api-token}
X-Country: NGA
X-Treaty: ECOWAS

{
  "nationalId": "12345678901",
  "fullName": "John Doe",
  "reason": "Interpol Red Notice #2025-12345"
}

// Response from Ghana
{
  "match": true,
  "wantedPerson": {
    "id": "uuid",
    "fullName": "John Doe",
    "aliases": ["Johnny"],
    "charges": ["Armed Robbery", "Assault"],
    "photoUrl": "encrypted-url",
    "lastKnownLocation": "Accra, Ghana",
    "dangerLevel": "high"
  },
  "auditLogId": "uuid"  // Logged in both systems
}
```

---

## Support & Resources

### Deployment Assistance

Need help deploying CRMS in your country? Contact:
- **Email**: deploy@crms-africa.org
- **WhatsApp**: +232-XX-XXXXXX (Sierra Leone pilot team)
- **GitHub Discussions**: https://github.com/african-digital-goods/crms/discussions

### Training Materials

- **User Manual**: `docs/USER_MANUAL.md` (coming in Phase 8)
- **Admin Guide**: `docs/ADMIN_GUIDE.md` (coming in Phase 8)
- **Video Tutorials**: YouTube channel (coming soon)
- **Workshop Materials**: Slide decks, exercises (available on request)

### Community

- **Monthly Calls**: First Friday of each month, 10:00 GMT
- **Slack Channel**: #crms-deployment (join at crms-africa.slack.com)
- **Annual Conference**: Pan-African CRMS Summit (planned 2026)

---

## Success Stories (Future)

### Sierra Leone Pilot (2025)

**Context:** [To be documented]
**Challenges:** [To be documented]
**Outcomes:** [To be documented]
**Lessons Learned:** [To be documented]

---

## FAQ

**Q: Can we customize the UI colors/logo?**
A: Yes! See `tailwind.config.ts` for theme colors and `public/` for logos.

**Q: Can we add custom fields to cases?**
A: Yes! Use Prisma migrations to add fields. Contribute back if useful to others.

**Q: Do we need to fork the repository?**
A: No! Use configuration files. Forking defeats the DPG model.

**Q: What if our country uses a different police rank structure?**
A: Add your ranks to the country config. The system is flexible.

**Q: Can we host on-premise instead of cloud?**
A: Absolutely! CRMS is self-hostable. Docker Compose makes it easy.

**Q: Is USSD required?**
A: No, it's optional. Disable it in the config if not needed.

---

**Last Updated:** October 2025
**Version:** 1.0

---

🌍 **One codebase, many nations, shared progress**

*Empowering Africa's law enforcement through collaborative open-source technology*
