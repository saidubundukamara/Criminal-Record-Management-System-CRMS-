# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Criminal Record Management System (CRMS)** is a pan-African Digital Public Good (DPG) designed for law enforcement agencies across the African continent. With its pilot implementation in Sierra Leone, CRMS is a Next.js 16 application built as an offline-first, PWA-enabled system for managing criminal records, cases, evidence, and background checks with USSD support for low-connectivity areas common throughout Africa.

**Key Characteristics:**
- **Reusable:** Designed for deployment in any African country
- **Adaptable:** Configurable for different legal frameworks, ID systems, and languages
- **Offline-First:** Works in low-connectivity environments (2G/3G networks)
- **Inclusive:** Supports feature phones via USSD, not just smartphones
- **Open Source:** MIT licensed for maximum adoption and contribution

**Pilot Implementation:** Sierra Leone Police Force (other African countries can deploy and customize)

**Tech Stack:**
- Next.js 16.0.0 (App Router)
- React 19.2.0
- TypeScript 5
- Tailwind CSS 4
- PostgreSQL 15+ with Prisma ORM
- NextAuth.js (authentication)
- Argon2id (password hashing)

**License:** MIT (Digital Public Good)

## Architecture

### Service-Repository Pattern with Clean Architecture

The codebase follows a layered architecture pattern documented in `docs/SERVICE_REPOSITORY_ARCHITECTURE.md`:

```
Presentation Layer (Next.js App Router)
    ↓
API Controllers (Next.js API Routes - THIN)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access via Prisma)
    ↓
Database (PostgreSQL)
```

### Directory Structure (Planned)

```
crms/
├── app/                    # Next.js App Router (presentation)
│   ├── (auth)/            # Auth pages (login, MFA)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── api/               # API routes (thin controllers)
│   ├── layout.tsx
│   └── page.tsx
│
├── src/                   # Core application logic
│   ├── domain/           # Domain entities, interfaces, types
│   │   ├── entities/     # Officer, Case, Person, Evidence entities
│   │   ├── interfaces/   # Repository/Service interfaces
│   │   └── types/        # DTOs and domain types
│   ├── repositories/     # Data access implementations
│   │   ├── base/         # BaseRepository
│   │   └── implementations/
│   ├── services/         # Business logic (AuthService, CaseService, etc.)
│   ├── lib/              # Utilities (encryption, validation, errors)
│   └── di/               # Dependency injection container
│
├── components/           # React UI components
│   ├── ui/              # Shadcn UI components
│   ├── auth/
│   ├── cases/
│   └── layout/
│
├── lib/                  # Next.js specific (auth config, hooks)
├── prisma/              # Database schema and migrations
├── docs/                # Detailed documentation
├── tests/               # Unit, integration, e2e tests
└── public/              # Static assets
```

**IMPORTANT:** As of now, the `src/` directory does not exist yet. The architecture is planned but not implemented. When creating new features, follow the Service-Repository pattern documented in `docs/SERVICE_REPOSITORY_ARCHITECTURE.md`.

## Multi-Country Design & Adaptability

### Core Design Principle

CRMS is built as a **reusable, configurable platform** that any African country can adopt and customize. The Sierra Leone implementation serves as the reference deployment, but the architecture supports country-specific adaptations.

### Key Adaptable Components

#### 1. National Identification Systems
- **Sierra Leone uses:** NIN (National Identification Number)
- **Your country can use:** Any national ID system (e.g., Ghana Card, Nigerian NIN, Kenyan Huduma Namba)
- **Configuration:** Update Prisma schema and validation rules in `src/lib/validation.ts`

#### 2. Legal & Regulatory Frameworks
- **Configurable:** Case categories, severity levels, status workflows
- **Location:** Domain entities and business logic in `src/domain/entities/Case.ts`
- **Example:** Different countries have different crime classifications and legal processes

#### 3. Multi-Language Support
- **Planned:** i18n support for localization
- **Configurable:** UI text, form labels, system messages
- **Languages:** English (default), French, Portuguese, Arabic, Swahili, Amharic, etc.

#### 4. Telecom Integration (USSD)
- **Country-specific:** Each country has different telecom providers and USSD codes
- **Configuration:** Environment variables for USSD gateway credentials
- **Examples:**
  - Sierra Leone: Orange, Africell
  - Kenya: Safaricom, Airtel
  - Nigeria: MTN, Glo, Airtel, 9mobile

#### 5. Station/Region Naming & Hierarchy
- **Configurable:** Station codes, district names, regional structures
- **Location:** Database seeding in `prisma/seed.ts` and Station management
- **Example:** Each country has different administrative divisions

#### 6. Data Protection Compliance
- **Base:** GDPR and Malabo Convention standards
- **Adaptable:** Country-specific data protection laws
- **Location:** Privacy policies and encryption configurations

### Deployment Considerations for Different Countries

When deploying CRMS in a new country:

1. **Configuration Changes:**
   - Update `.env` with country-specific settings
   - Customize telecom provider integrations
   - Adapt case categories and severity levels to local laws

2. **Database Seeding:**
   - Create country-specific stations, regions, districts
   - Set up initial admin users with country-appropriate badge formats
   - Configure roles to match local police hierarchies

3. **Localization:**
   - Translate UI components to local languages
   - Adapt date/time formats and currency (if applicable)
   - Customize terminology (e.g., "station" vs "precinct")

4. **Legal Compliance:**
   - Review and adapt data retention policies
   - Ensure compliance with local data protection laws
   - Customize audit logging for local requirements

5. **Integration Points:**
   - Connect to national ID registries (if available)
   - Integrate with local court systems (if applicable)
   - Set up local SMS/USSD gateways

### Customization Without Forking

The architecture supports configuration-based customization, meaning countries can adapt CRMS without forking the codebase:

- **Configuration files** for country-specific settings
- **Environment variables** for integration credentials
- **Database seeding** for organizational structure
- **Feature flags** to enable/disable functionality

This ensures all countries benefit from core improvements while maintaining local customizations.

## Development Commands

### Essential Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Build & Production
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint (eslint command)

# Database (when Prisma is set up)
npx prisma db push       # Push schema to database
npx prisma db seed       # Seed database with initial data
npx prisma studio        # Open Prisma Studio GUI
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create and apply migration

# Testing (when configured)
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:e2e         # E2E tests with Playwright
```

## Key Development Principles

### 1. Always Follow Service-Repository Pattern

When implementing features:

1. **Create domain entity** in `src/domain/entities/`
   - Pure business objects with domain logic
   - No database or framework dependencies

2. **Define repository interface** in `src/domain/interfaces/repositories/`
   - Contract for data access
   - Include DTOs for create/update operations

3. **Implement repository** in `src/repositories/implementations/`
   - Pure database operations via Prisma
   - Map Prisma models to domain entities
   - Extend BaseRepository

4. **Create service** in `src/services/`
   - Business logic and validation
   - Coordinate multiple repositories
   - Transaction management
   - Audit logging

5. **Wire up in DI container** (`src/di/container.ts`)
   - Register repository and service instances
   - Handle dependency injection

6. **Create thin API route** in `app/api/`
   - Authentication/authorization checks
   - HTTP request/response handling
   - Call service methods
   - Error handling

**Example:** See `docs/SERVICE_REPOSITORY_ARCHITECTURE.md` lines 217-886 for complete OfficerRepository example and lines 1196-1381 for AuthService example.

### 2. Separation of Concerns

- **Controllers (API routes):** HTTP concerns only - NO business logic
- **Services:** Business logic, validation, coordination - NO database calls
- **Repositories:** Database access only - NO business logic
- **Entities:** Domain model with domain methods - NO dependencies

### 3. Authentication & Authorization

- Use NextAuth.js with custom credentials provider (Badge + PIN)
- PIN stored as Argon2id hash
- Session strategy: JWT (15-minute expiry)
- RBAC system with 6 roles:
  1. SuperAdmin (level 1)
  2. Admin (level 2)
  3. StationCommander (level 3)
  4. Officer (level 4)
  5. EvidenceClerk (level 5)
  6. Viewer (level 6)

- Check permissions using `lib/permissions.ts` helper functions
- Middleware enforces authentication on all routes except public ones

**Default credentials (for seeding):**
- Badge: SA-00001
- PIN: 12345678

### 4. Database & Prisma

- Database: PostgreSQL 15+
- ORM: Prisma
- Schema location: `prisma/schema.prisma`
- Key models:
  - Officer (with role, station, MFA)
  - Role, Permission (RBAC)
  - Station
  - Person (with NIN, encrypted PII)
  - Case, CasePerson (many-to-many)
  - Evidence (with chain of custody)
  - AmberAlert, WantedPerson
  - BackgroundCheck
  - AuditLog (immutable)
  - SyncQueue (for offline sync)

**Data encryption:**
- PII fields (addresses, phone, email) encrypted with AES-256
- Use `src/lib/encryption.ts` utilities (to be created)

### 5. Error Handling

Create custom error classes in `src/lib/errors/`:
- `AppError` (base)
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)

Services throw domain errors, controllers catch and convert to HTTP responses.

### 6. Audit Logging

**CRITICAL:** Every state-changing operation MUST be audited.

Use `AuditLogRepository` or `AuditService`:
```typescript
await auditRepo.create({
  entityType: "case",
  entityId: caseId,
  officerId: session.user.id,
  action: "create", // "create", "read", "update", "delete", "login", etc.
  success: true,
  details: { /* contextual info */ },
  ipAddress: request.ip,
});
```

Audit logs are immutable and track:
- Who (officerId)
- What (entityType, entityId, action)
- When (createdAt)
- Where (stationId, ipAddress)
- Details (JSON payload)

### 7. Testing

- **Unit tests:** Test services in isolation by mocking repositories
- **Integration tests:** Test API routes with mocked services
- **E2E tests:** Test full user flows with Playwright

Place tests in:
- `tests/unit/services/`
- `tests/unit/repositories/`
- `tests/integration/api/`
- `tests/e2e/`

See examples in `docs/SERVICE_REPOSITORY_ARCHITECTURE.md` lines 1908-2221.

## Domain-Specific Knowledge

### Case Management

- **Case Number Format:** `{StationCode}-{Year}-{SequentialNumber}`
  - Example (Sierra Leone): `HQ-2025-000001`
  - Generated automatically in CaseRepository
  - **Adaptable:** Station code format can be customized per country

- **Case Status Flow:**
  ```
  open → investigating → charged → court → closed
         ↓
      closed (can close from any state except closed)
  ```
  - **Note:** Status flows can be adapted to match local legal processes

- **Status Transition Logic:** Implemented in `Case.canTransitionTo()` domain method

- **Case Severity Levels:** minor, major, critical
  - **Adaptable:** Can be customized per country's classification system

- **Case Categories:** theft, assault, fraud, murder, robbery, kidnapping, etc.
  - **Adaptable:** Categories should align with each country's penal code

### Person Records

- **National ID Field:** Primary identifier for persons
  - **Sierra Leone:** NIN (National Identification Number)
  - **Adaptable:** Can be configured for any national ID system (Ghana Card, Nigerian NIN, etc.)
  - **Database field:** `nin` in Person model (can be renamed or aliased per country)
- **Aliases:** Array of known aliases
- **Encrypted PII:** Addresses, phone numbers, emails
- **Biometrics:** Fingerprint hash (SHA-256), biometric hash
- **Relations:** Linked to cases via CasePerson (role: suspect, victim, witness, informant)

### Evidence Management

- **QR Code:** Unique identifier for physical evidence
- **Chain of Custody:** JSON array tracking all custody events
  ```typescript
  [
    { officerId, action, timestamp, location },
    ...
  ]
  ```
- **File Storage:** S3-compatible (MinIO/AWS S3)
- **File Integrity:** SHA-256 hash stored for verification

### Background Checks

- **Request Types:** officer, citizen, employer, visa
- **Citizen Requests:** Redacted results ("Clear" or "Record exists - visit station")
- **Officer Requests:** Full detailed results with audit logging
- **USSD Support:** Background checks available via USSD for feature phones

### RBAC Permissions

**Permission Structure:**
```typescript
{
  resource: "cases" | "persons" | "evidence" | "officers" | "stations" | "alerts" | "bgcheck" | "reports",
  action: "create" | "read" | "update" | "delete" | "export",
  scope: "own" | "station" | "region" | "national"
}
```

**Scope Hierarchy:** own < station < region < national

**Permission Checking:**
```typescript
import { hasPermission } from "@/lib/permissions";

if (!hasPermission(session, "cases", "update", "station")) {
  throw new ForbiddenError("Insufficient permissions");
}
```

## Digital Public Good (DPG) Compliance

This project is designed as a pan-African DPG with reusability and adaptability at its core. Key compliance requirements:

1. **Open License:** MIT License (compliant) - enables any country to adopt freely
2. **Documentation:** Comprehensive README, CONTRIBUTING, SECURITY docs
3. **SDG Alignment:** SDG 16 (Peace, Justice, Strong Institutions) - relevant across Africa
4. **Data Protection:** GDPR, Malabo Convention compliant (base standards)
5. **Platform Independence:** Docker support, open standards, no vendor lock-in
6. **Offline-First:** Service Workers, IndexedDB for offline operation
7. **Low-Bandwidth Optimization:** USSD support for 2G/3G networks common across Africa
8. **Reusability:** Configuration-based customization without forking
9. **Localization:** Multi-language support for African languages

### Pan-African Design Principles

When implementing features, always consider:

**Connectivity:**
- Works with intermittent connectivity (common across Africa)
- Minimal data usage for 2G/3G networks
- Offline sync capabilities

**Accessibility:**
- Accessible via feature phones (USSD), not just smartphones
- Multi-language support for linguistic diversity
- Low-tech deployment options

**Adaptability:**
- Configuration-based, not hardcoded assumptions
- Support for different national ID systems
- Flexible legal/regulatory frameworks
- Country-specific integrations (telecoms, courts, etc.)

**Privacy & Security:**
- Privacy by design
- Security by default
- Compliance with local data protection laws
- Audit trails for accountability

### Multi-Country Considerations

When developing new features:
1. **Avoid hardcoding** country-specific values (use configuration)
2. **Design for localization** (support i18n from the start)
3. **Document customization points** (help other countries adapt)
4. **Test with different configurations** (ensure flexibility works)
5. **Consider various legal contexts** (not all countries work the same way)

## Implementation Roadmap

Current status: **Phase 5 - Audit Logging & Security (COMPLETE)**

Planned phases (from `docs/IMPLEMENTATION_PLAN.md`):
1. ✅ Foundation & Project Setup (Weeks 1-3)
2. ✅ Authentication & RBAC (Weeks 4-5)
3. ✅ Offline-First Architecture (Weeks 6-7)
4. ✅ Case, Person, Evidence Management (Weeks 8-10)
5. ✅ Audit Logging & Security (Weeks 11-12) - **COMPLETED October 30, 2025**
6. ⏳ Background Checks & Alerts (Weeks 13-14)
7. USSD Integration (Weeks 15-16)
8. Dashboards & Reporting (Weeks 17-18)
9. PWA Optimization (Weeks 19-20)
10. MFA Implementation (Week 21)
11. Testing & QA (Weeks 22-23)
12. DPG Submission & Deployment (Weeks 24-26)

**When implementing a new phase:**
1. Review detailed specs in `docs/IMPLEMENTATION_PLAN.md`
2. Follow Service-Repository pattern
3. Add comprehensive tests
4. Update documentation

## Common Pitfalls to Avoid

1. ❌ **DO NOT** put business logic in API routes (controllers)
   - ✅ Business logic belongs in services

2. ❌ **DO NOT** use Prisma models directly in services
   - ✅ Map to domain entities in repositories

3. ❌ **DO NOT** skip audit logging
   - ✅ Every state change must be audited

4. ❌ **DO NOT** store plain text PINs or passwords
   - ✅ Use Argon2id hashing

5. ❌ **DO NOT** expose full person details in citizen-facing APIs
   - ✅ Redact sensitive info for non-officer requests

6. ❌ **DO NOT** bypass permission checks
   - ✅ Always verify permissions before operations

7. ❌ **DO NOT** create repositories without interfaces
   - ✅ Define interface first in `src/domain/interfaces/`

8. ❌ **DO NOT** hardcode secrets or credentials
   - ✅ Use environment variables via `.env`

9. ❌ **DO NOT** hardcode country-specific values (Sierra Leone terms, formats, etc.)
   - ✅ Use configuration files and environment variables for country-specific settings

10. ❌ **DO NOT** assume all deployments have the same infrastructure
    - ✅ Design for low-connectivity, offline-first scenarios across Africa

## Environment Variables

Required environment variables (see `.env.example`):

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

# USSD (Africa's Talking / Twilio)
USSD_API_KEY="your-api-key"
USSD_USERNAME="sandbox"
USSD_SHORTCODE="*123#"

# Feature Flags
ENABLE_MFA="true"
ENABLE_USSD="true"
ENABLE_OFFLINE="true"
```

**Security Note:** Never commit `.env` files. Always use `.env.example` as a template.

## Quick Start for New Features

Example: Adding a new "Report" feature

1. **Create domain entity** (`src/domain/entities/Report.ts`):
```typescript
export class Report {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly type: string,
    // ... other properties
  ) {}

  // Domain logic
  isPublished(): boolean {
    return this.status === "published";
  }
}
```

2. **Define repository interface** (`src/domain/interfaces/repositories/IReportRepository.ts`):
```typescript
export interface IReportRepository {
  findById(id: string): Promise<Report | null>;
  create(data: CreateReportDto): Promise<Report>;
  // ... other methods
}
```

3. **Implement repository** (`src/repositories/implementations/ReportRepository.ts`):
```typescript
export class ReportRepository extends BaseRepository implements IReportRepository {
  async findById(id: string): Promise<Report | null> {
    const data = await this.prisma.report.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }
  // ... implement all interface methods
}
```

4. **Create service** (`src/services/ReportService.ts`):
```typescript
export class ReportService {
  constructor(
    private readonly reportRepo: IReportRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  async createReport(data: CreateReportInput, officerId: string): Promise<Report> {
    // Validation
    // Business logic
    const report = await this.reportRepo.create(data);
    // Audit
    await this.auditRepo.create({ ... });
    return report;
  }
}
```

5. **Register in DI container** (`src/di/container.ts`):
```typescript
this.reportRepository = new ReportRepository(this.prismaClient);
this.reportService = new ReportService(this.reportRepository, this.auditLogRepository);
```

6. **Create API route** (`app/api/reports/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasPermission(session, "reports", "create", "station")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const report = await container.reportService.createReport(body, session.user.id);
  return NextResponse.json({ report }, { status: 201 });
}
```

7. **Add tests** (`tests/unit/services/ReportService.test.ts`)

## Additional Resources

- **Comprehensive Docs:** `docs/` directory
  - `docs/Criminal Record Management System (CRMS) – Sierra Leone (1).md` - Full requirements spec
  - `docs/IMPLEMENTATION_PLAN.md` - 26-week detailed implementation plan
  - `docs/SERVICE_REPOSITORY_ARCHITECTURE.md` - Complete architecture guide with code examples

- **Prisma Schema:** `prisma/schema.prisma` - Database models and relationships
- **README:** `README.md` - Standard Next.js project info
- **Package Config:** `package.json` - Dependencies and scripts

## Support & Contribution

For questions or issues:
- Review documentation in `docs/`
- Check Service-Repository architecture patterns
- Follow DPG compliance guidelines
- Ensure all changes include tests and audit logging

**Remember:** This is a pan-African Digital Public Good serving law enforcement agencies across the continent, many in low-resource, low-connectivity settings.

When contributing:
- **Think continental, not country-specific** - Your code should work for any African country
- **Prioritize adaptability** - Make features configurable rather than hardcoded
- **Design for low-resource environments** - Offline-first, minimal bandwidth, accessible via feature phones
- **Security and privacy are paramount** - This system handles sensitive criminal justice data
- **Document customization points** - Help other countries understand how to adapt features

The goal is a robust, reusable system that empowers law enforcement across Africa while respecting each country's unique legal frameworks, languages, and infrastructure.
