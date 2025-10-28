---
title: Criminal Record Management System (CRMS) – Pan-African Digital Public Good
---

# Criminal Record Management System (CRMS) – Requirements Specification

## Document Version
- **Version:** 2.0
- **Date:** 2025-10-28
- **Scope:** Pan-African Digital Public Good (Pilot: Sierra Leone)

---

## 1. Overview

The **Criminal Record Management System (CRMS)** is a **pan-African Digital Public Good (DPG)** designed to help law enforcement agencies across the African continent:

- Digitally record and manage complaints, incidents, and criminal cases
- Conduct **background checks** using national identification systems
- Manage police stations, officers, roles, and permissions
- Issue **Amber Alerts** and **Wanted Notices**
- Provide citizen-facing services via **USSD** for areas with limited internet access
- Enable **cross-border interoperability** for regional security cooperation

The system is built with **Next.js (frontend + backend APIs)**, **PostgreSQL (database)**, and **Prisma ORM**, ensuring scalability, security, and modern developer experience.

### 1.1 Pan-African Design Principle

CRMS is designed as a **reusable, configurable platform** that any African country can adopt and customize without forking the codebase. The **Sierra Leone Police Force** serves as the pilot implementation and reference deployment.

**Key Design Characteristics:**
- **Country-agnostic architecture** with configuration-based customization
- **Adaptable to different legal frameworks** and criminal justice systems
- **National ID system federation** (supports any country's ID system)
- **Multi-language support** (English, French, Portuguese, Arabic, indigenous languages)
- **Offline-first** for low-connectivity environments common across Africa
- **Feature phone support** via USSD (not just smartphones)

---

## 2. Objectives

1. **Centralize** all criminal records in a secure database
2. **Standardize** how police stations record complaints, evidence, and cases across different countries
3. **Enable background checks** via national identification numbers with officer login and USSD support
4. **Improve coordination** of wanted/amber alerts within countries and across borders
5. **Ensure privacy & data protection** with encryption and audit logs compliant with GDPR and African data protection laws (e.g., Malabo Convention)
6. **Support regional security cooperation** through standardized interoperability APIs
7. **Provide Digital Public Good** that strengthens rule of law and SDG 16 (Peace, Justice, Strong Institutions)

---

## 3. Multi-Country Adaptability

### 3.1 Configurable Components

CRMS supports country-specific configurations in the following areas:

#### 3.1.1 National Identification Systems
The system uses a **federated identity model** that supports any national ID system:

- **Sierra Leone:** NIN (National Identification Number)
- **Ghana:** Ghana Card Number
- **Nigeria:** NIN (National Identification Number)
- **Kenya:** Huduma Namba
- **South Africa:** South African ID Number
- **Rwanda:** National ID (Indangamuntu)
- **Passport numbers** for countries without universal national IDs

**Implementation:** The `Person` entity includes a flexible `nationalId` field with `type` and `countryCode` attributes to support any ID system.

#### 3.1.2 Legal & Justice System Frameworks
Different countries have different:
- **Case lifecycle stages** (e.g., investigation, prosecution, court procedures)
- **Criminal offense classifications** (based on national penal codes)
- **Data retention policies** (dictated by national data protection laws)
- **Court integration requirements**

**Implementation:** Case workflows, offense taxonomies, and retention policies are stored in configuration files that can be customized per deployment.

#### 3.1.3 Multi-Language Support
CRMS includes built-in internationalization (i18n):
- **English** (default)
- **French** (Francophone Africa)
- **Portuguese** (Lusophone Africa)
- **Arabic** (North Africa)
- Additional languages via configuration

**Implementation:** All UI strings, USSD menus, and API responses use i18n libraries with language packs.

#### 3.1.4 Telecom Integration
Each country has different telecom providers for USSD/SMS:
- **Sierra Leone:** Orange, Africell
- **Ghana:** MTN, Vodafone, AirtelTigo
- **Nigeria:** MTN, Glo, Airtel, 9mobile
- **Kenya:** Safaricom, Airtel, Telkom

**Implementation:** Telecom gateway configurations are externalized, with adapters for different USSD/SMS APIs.

#### 3.1.5 Police Structure
Police organizational structures vary by country:
- **Centralized** (e.g., national police force)
- **Decentralized** (regional/provincial police)
- **Hybrid** (federal + state police)

**Implementation:** The `Station` hierarchy supports multiple organizational models with configurable levels (national/regional/district/station).

#### 3.1.6 Currency & Units
Different countries use different currencies and measurement systems:
- **Bail amounts, fines:** Country-specific currency
- **Addresses:** Different postal systems
- **Date/time formats:** Region-specific

**Implementation:** Locale-aware formatting with country configuration files.

### 3.2 Deployment Models

CRMS supports three deployment models:

1. **National Instance:** Single deployment for one country (e.g., Sierra Leone)
2. **Regional Hub:** Multi-tenant deployment for a regional bloc (e.g., ECOWAS countries)
3. **Hybrid:** National instances with cross-border interoperability APIs

---

## 4. Key Features

### 4.1 User & Role Management

**Role-Based Access Control (RBAC)** with six standard roles:

- **SuperAdmin** – manage national-level stations, officers, global settings
- **Admin** – add stations, configure roles, manage officer accounts
- **Station Commander** – manage station-level activities
- **Officer/Investigator** – create/update cases, run background checks
- **Evidence Clerk** – manage evidence chain-of-custody
- **Prosecutor/Viewer** – read-only access to cases

**Authentication:**
- Officer login with **badge number + PIN**
- **NextAuth.js** with custom credentials provider
- Optional MFA (OTP via SMS/email)
- Configurable password policies per country

**Country-Specific Notes:**
- Badge numbering schemes differ by country (configurable format)
- Some countries may require additional authentication factors (e.g., biometrics)

### 4.2 Case Management

- Register complaints/FIRs (First Information Reports)
- Track suspects, victims, witnesses (linked to national ID if available)
- Case lifecycle: `Open → Under Investigation → Charged → Court → Closed` (configurable stages)
- Attach evidence files securely
- Cross-reference related cases

**Country-Specific Adaptations:**
- Case numbering format configured per country
- Offense classifications mapped to national penal codes
- Court integration varies by judicial system

### 4.3 Person / Criminal Records

- **Master Person Index** keyed by national ID (type varies by country)
- Store aliases, biometrics (hashed), known associates
- Fast search by national ID, name, fingerprint hash, phone
- Support for multiple ID types per person (passport, driver's license, etc.)

**Example: Sierra Leone Implementation**
```prisma
model Person {
  id          String   @id @default(uuid())
  nationalId  String?  @unique  // NIN in Sierra Leone
  idType      String?            // "NIN" for Sierra Leone
  countryCode String?            // "SLE" (ISO 3166-1 alpha-3)
  fullName    String
  dob         DateTime?
  gender      String?
  // ... other fields
}
```

**Example: Multi-Country Deployment**
```prisma
model Person {
  nationalId  String?  @unique  // Can be NIN, Ghana Card, Huduma Namba, etc.
  idType      String?            // "NIN", "GHANA_CARD", "HUDUMA_NAMBA", etc.
  countryCode String?            // ISO 3166-1 alpha-3 code
  // ...
}
```

### 4.4 Evidence Management

- Upload digital evidence (photos, docs, videos) → encrypted S3-compatible storage
- Generate **QR/barcodes** for physical evidence
- Track full chain-of-custody with audit trail
- Support for various evidence types (forensic, documentary, physical)

### 4.5 Background Checks

**Officer-facing:**
- Detailed results with full criminal history
- Audit logging of all checks (who checked whom, when, why)

**Citizen-facing (USSD):**
- Redacted results: "Clear / Record exists – visit station for details"
- Privacy-preserving design

**Country-Specific Notes:**
- Some countries may require different disclosure levels
- Retention periods for background check records vary by jurisdiction

### 4.6 Alerts & Notices

**Amber Alerts:**
- Broadcast missing child information via SMS/USSD
- Cross-border alerts (if countries opt-in to interoperability)

**Wanted Persons:**
- Publish to dashboard + optional citizen access
- Support for Interpol Red Notices (international wanted persons)

### 4.7 USSD Support

- Integrated via telecom aggregators (country-specific providers)
- Next.js API routes handle **USSD callbacks**
- Services:
  - Background check by national ID
  - Wanted list (top wanted persons)
  - Report missing person
  - Crime tips (anonymous reporting)

**Example USSD Flows:**

**Sierra Leone:** `*123*77#` (Orange/Africell)
**Ghana:** `*920*77#` (MTN) – *configured per country*
**Nigeria:** `*737*77#` (example) – *configured per telecom*

### 4.8 Audit & Reporting

- **Immutable audit logs** of all actions (who did what, when)
- Officer activity tracking
- Station performance reports
- National crime statistics dashboards
- Compliance reports for data protection authorities

### 4.9 Cross-Border Interoperability

CRMS includes APIs for secure cross-border data exchange:

- **Wanted persons** broadcasting
- **Amber alerts** across borders
- **Background checks** with consent
- **Case coordination** for transnational crimes
- **Evidence sharing** with chain-of-custody preservation

**Security:** mTLS authentication, JWT tokens, encrypted payloads, audit trails

See `docs/INTEROPERABILITY.md` for full technical specifications.

---

## 5. Functional Requirements

### 5.1 Authentication

- Badge + PIN login (PIN stored as Argon2 hash)
- JWT sessions (NextAuth strategy: `jwt`)
- Short-lived tokens with refresh support
- Configurable PIN complexity rules per country

### 5.2 Case Entity

- Fields: complainant, suspects, victims, evidence list, status
- Must support linking multiple persons by role (suspect/victim/witness)
- Support for case transfers between stations
- Hierarchical case numbering (station/region/national)

### 5.3 Person Entity

- National ID (primary identifier – type varies by country)
- Encrypted fields: addresses, phone numbers, biometrics
- Support for multiple aliases and identifiers
- GDPR-compliant data minimization

### 5.4 Evidence Entity

- QR/barcode identifier (format configurable)
- Chain-of-custody events (officer, timestamp, action, location)
- Support for large file uploads (videos, high-res images)
- Integrity verification (cryptographic hashes)

### 5.5 USSD Flows

**Background Check:**
- Input national ID → "Clear / Record exists"
- Multi-language menu support

**Wanted List:**
- Display top wanted persons (name, photo, crime)

**Report Missing Person:**
- Collect details → forward to station dashboard

**Crime Tips:**
- Anonymous tip submission

### 5.6 API Integrations

- **National ID Registry** (country-specific, future)
- **SMS/USSD Gateway** (telecom-specific)
- **Biometric Systems** (optional, varies by country)
- **Court Management Systems** (country-specific)
- **Interpol I-24/7** (optional, for cross-border cases)

---

## 6. Non-Functional Requirements

### 6.1 Security

- End-to-end TLS (minimum TLS 1.3)
- Encryption at rest (Postgres column-level + storage encryption)
- Immutable audit logs (append-only)
- RBAC with least privilege principle
- Regular security audits and penetration testing

### 6.2 Availability

- **99.5% uptime SLA** for critical services
- Offline-first support for station devices (sync when connectivity restored)
- Graceful degradation (USSD fallback if internet unavailable)

### 6.3 Scalability

- **Initial:** 50+ stations (pilot country)
- **Target:** Nationwide deployment with millions of records
- **Pan-African:** Multi-tenant support for regional deployments

### 6.4 Performance

- Background checks: <10 seconds
- Case registration: <30 seconds
- USSD response: <5 seconds
- Search queries: <2 seconds for person lookup

### 6.5 Compliance

**International Standards:**
- **GDPR** (for countries with similar laws)
- **Malabo Convention** (African Union data protection)
- **FBI/BJA RMS standards** (US criminal justice best practices)
- **Interpol standards** (for cross-border cooperation)

**Country-Specific:**
- **Sierra Leone:** Align with Data Protection Act (when enacted)
- **Ghana:** Data Protection Act, 2012
- **Nigeria:** NDPR (Nigeria Data Protection Regulation)
- **Kenya:** Data Protection Act, 2019
- **South Africa:** POPIA (Protection of Personal Information Act)

### 6.6 Accessibility

- **WCAG 2.1 Level AA** compliance for web interfaces
- **USSD support** for feature phones (no smartphone required)
- Multi-language interfaces
- Support for low-literacy users (visual icons, voice prompts)

---

## 7. Data Model (Simplified with Prisma)

```prisma
model Person {
  id          String   @id @default(uuid())
  nationalId  String?  @unique  // Type varies by country (NIN, Ghana Card, etc.)
  idType      String?            // "NIN", "GHANA_CARD", "HUDUMA_NAMBA", "PASSPORT", etc.
  countryCode String?            // ISO 3166-1 alpha-3 (e.g., "SLE", "GHA", "NGA")
  fullName    String
  dob         DateTime?
  gender      String?
  aliases     String[]
  addresses   String[]           // Encrypted
  photoUrl    String?
  fingerprintHash String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  cases       CasePerson[]
}

model Case {
  id          String   @id @default(uuid())
  caseNumber  String   @unique  // Format varies by country
  title       String
  description String?
  incidentDate DateTime
  stationId   String
  officerId   String
  status      String             // Configurable workflow stages
  offenseCode String?            // Mapped to national penal code
  evidence    Evidence[]
  persons     CasePerson[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model CasePerson {
  id        String  @id @default(uuid())
  caseId    String
  personId  String
  role      String  // "suspect", "victim", "witness", "complainant"
}

model Evidence {
  id          String   @id @default(uuid())
  caseId      String
  type        String
  description String?
  qrCode      String   @unique
  storageUrl  String?  // Encrypted storage
  chainOfCustody Json  // Array of custody events
  createdAt   DateTime @default(now())
}

model Station {
  id          String   @id @default(uuid())
  code        String   @unique  // Country-specific format
  name        String
  location    String
  contact     String?
  countryCode String?  // For multi-country deployments
  regionCode  String?  // For hierarchical structures
  officers    Officer[]
  cases       Case[]
}

model Officer {
  id         String   @id @default(uuid())
  badge      String   @unique  // Format varies by country
  name       String
  rank       String
  role       String             // RBAC role
  stationId  String
  pinHash    String             // Argon2 hash
  lastLogin  DateTime?
  active     Boolean  @default(true)
  countryCode String?
}

model AuditLog {
  id          String   @id @default(uuid())
  entityType  String
  entityId    String
  officerId   String
  action      String
  details     Json
  ipAddress   String?
  createdAt   DateTime @default(now())
}

model Alert {
  id          String   @id @default(uuid())
  type        String             // "AMBER", "WANTED"
  personId    String?
  caseId      String?
  title       String
  description String
  issuedBy    String             // Officer ID
  issuedAt    DateTime @default(now())
  expiresAt   DateTime?
  broadcast   Boolean  @default(false)  // Cross-border broadcast
  countryCode String?            // Origin country
}
```

---

## 8. Example Next.js API Routes

- `/api/auth/login` → Officer login (badge + PIN)
- `/api/persons` → Manage persons (CRUD)
- `/api/cases` → Create/update cases
- `/api/evidence` → Upload evidence
- `/api/bgcheck` → Background checks (officer-facing)
- `/api/alerts/amber` → Amber alerts
- `/api/alerts/wanted` → Wanted notices
- `/api/ussd/callback` → USSD request handler
- `/api/interop/*` → Cross-border interoperability APIs (see `INTEROPERABILITY.md`)

---

## 9. Implementation Roadmap

### Phase 1 – MVP (Weeks 1-8)
- Next.js auth with badge + PIN
- Basic Person & Case registry
- Background check (API + USSD)
- Audit logging
- **Country configuration system**

### Phase 2 – Evidence & Alerts (Weeks 9-16)
- Evidence uploads + QR/barcodes
- Amber & Wanted Alerts
- Reporting dashboards
- **Multi-language support**

### Phase 3 – Interoperability (Weeks 17-22)
- National ID registry integration (country-specific)
- Biometric support (optional)
- Cross-border APIs
- Prosecutor portal

### Phase 4 – Nationwide Rollout (Weeks 23-26+)
- Training programs
- Security audit & compliance certification
- Scale to all police stations
- **Documentation for multi-country deployment**

**Note:** See `docs/IMPLEMENTATION_PLAN.md` for detailed week-by-week plan.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Unauthorized access** | Strong RBAC + audit logging + MFA |
| **Data leakage** | End-to-end encryption, minimal USSD output, access controls |
| **Connectivity issues** | Offline-first design, USSD fallback |
| **Legal gaps** | Coordinate with national data protection authorities |
| **Cross-country compatibility** | Configuration-based design, extensive documentation |
| **Resistance to adoption** | Training programs, phased rollout, stakeholder engagement |
| **Vendor lock-in** | Open-source stack, standard APIs, DPG compliance |

---

## 11. Success Metrics

### Operational Efficiency
- **50% faster** case registration compared to paper-based systems
- Background checks completed in **<10 seconds**
- **90% reduction** in missing case files

### Adoption
- **Nationwide adoption** in pilot country within 18 months
- **Additional countries** deployed within 24 months

### Security
- **Zero major data breaches**
- **100% audit trail** coverage for sensitive operations

### Compliance
- **DPG certification** (9 indicators)
- **Data protection compliance** in all deployed countries

### Social Impact
- **SDG 16** contribution: Strengthen rule of law and reduce crime
- **Reduced wrongful arrests** through accurate background checks
- **Faster justice** for victims through efficient case management

---

## 12. Country-Specific Deployment Checklist

When deploying CRMS in a new country, complete the following:

- [ ] Configure national ID system integration
- [ ] Map offense codes to national penal code
- [ ] Set up telecom gateway for USSD/SMS
- [ ] Customize case workflow stages
- [ ] Configure police organizational structure
- [ ] Translate UI/USSD menus to local languages
- [ ] Establish data protection compliance (DPA coordination)
- [ ] Configure currency and locale settings
- [ ] Set up regional/national admin accounts
- [ ] Conduct security audit
- [ ] Train pilot station officers
- [ ] Establish support infrastructure

---

## Appendix A: Glossary

- **DPG:** Digital Public Good – open-source software that supports SDGs
- **NIN:** National Identification Number (varies by country)
- **FIR:** First Information Report (initial complaint)
- **RBAC:** Role-Based Access Control
- **USSD:** Unstructured Supplementary Service Data (feature phone interface)
- **mTLS:** Mutual TLS (certificate-based authentication)
- **Malabo Convention:** African Union Convention on Cybersecurity and Personal Data Protection
- **SDG 16:** Sustainable Development Goal 16 (Peace, Justice, Strong Institutions)

---

## Appendix B: Reference Implementations

### Sierra Leone (Pilot)
- **ID System:** NIN (National Identification Number)
- **Telecom:** Orange, Africell
- **Language:** English
- **Legal Framework:** Data Protection Act (draft)
- **Police Structure:** Centralized (Sierra Leone Police Force)

### Future Deployments (Examples)

**Ghana:**
- **ID System:** Ghana Card
- **Telecom:** MTN, Vodafone, AirtelTigo
- **Language:** English
- **Legal Framework:** Data Protection Act, 2012

**Nigeria:**
- **ID System:** NIN (National Identification Number)
- **Telecom:** MTN, Glo, Airtel, 9mobile
- **Language:** English
- **Legal Framework:** NDPR (Nigeria Data Protection Regulation)
- **Police Structure:** Hybrid (Nigeria Police Force + state police in some states)

**Kenya:**
- **ID System:** Huduma Namba
- **Telecom:** Safaricom, Airtel, Telkom
- **Language:** English, Swahili
- **Legal Framework:** Data Protection Act, 2019

---

**Document Control:**
- This requirements specification should be reviewed and updated as new countries deploy CRMS
- Country-specific annexes can be added as separate documents
- For technical architecture details, see `docs/SERVICE_REPOSITORY_ARCHITECTURE.md`
- For interoperability specifications, see `docs/INTEROPERABILITY.md`
