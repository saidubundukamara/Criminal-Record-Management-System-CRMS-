# Service-Repository Architecture for CRMS

## 📐 Clean Architecture Overview

This document details the Service-Repository pattern implementation for the CRMS Digital Public Good project.

**Pan-African Design Note:** This architecture is designed to support multi-country deployments with configuration-based customization. Country-specific logic is encapsulated in the **Service Layer**, ensuring the repository layer remains country-agnostic and the domain entities are reusable across different countries.

### Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│         Presentation Layer (Next.js App Router)         │
│  - React Components (pages, forms, lists, etc.)        │
│  - Client-side state management                         │
│  - UI/UX interactions                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         API Controllers (Next.js API Routes)            │
│  - Thin controllers                                      │
│  - Handle HTTP requests/responses                        │
│  - Authentication/authorization checks                   │
│  - Call service layer                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Service Layer (Business Logic)                  │
│  - AuthService, CaseService, PersonService, etc.        │
│  - Validation and business rules                         │
│  - Coordinate multiple repositories                      │
│  - Transaction management                                 │
│  - Domain logic (pure business operations)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Repository Layer (Data Access)                  │
│  - OfficerRepository, CaseRepository, etc.              │
│  - Pure database operations via Prisma                   │
│  - NO business logic                                     │
│  - Map Prisma models → Domain entities                  │
│  - CRUD operations only                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│         Database (PostgreSQL + Prisma ORM)              │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Dependency Inversion**: High-level modules don't depend on low-level modules
3. **Testability**: Easy to mock and test in isolation
4. **Maintainability**: Changes in one layer don't affect others
5. **Reusability**: Services can be used across different API routes

---

## 📁 Updated Project Structure

```
crms-sierra-leone/
├── app/                          # Next.js App Router (Presentation)
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── cases/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── persons/
│   │   ├── evidence/
│   │   └── layout.tsx
│   ├── api/                      # API Controllers (thin)
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── cases/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── persons/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── evidence/route.ts
│   │   ├── bgcheck/route.ts
│   │   └── sync/route.ts
│   ├── layout.tsx
│   └── page.tsx
│
├── src/                          # Core Application Logic
│   │
│   ├── domain/                   # Domain Layer
│   │   ├── entities/            # Domain Entities (Business Objects)
│   │   │   ├── Officer.ts
│   │   │   ├── Case.ts
│   │   │   ├── Person.ts
│   │   │   ├── Evidence.ts
│   │   │   ├── Station.ts
│   │   │   └── AuditLog.ts
│   │   │
│   │   ├── interfaces/          # Contracts/Interfaces
│   │   │   ├── repositories/    # Repository Interfaces
│   │   │   │   ├── IOfficerRepository.ts
│   │   │   │   ├── ICaseRepository.ts
│   │   │   │   ├── IPersonRepository.ts
│   │   │   │   ├── IEvidenceRepository.ts
│   │   │   │   ├── IAuditLogRepository.ts
│   │   │   │   └── IStationRepository.ts
│   │   │   │
│   │   │   └── services/        # Service Interfaces (optional)
│   │   │       ├── IAuthService.ts
│   │   │       ├── ICaseService.ts
│   │   │       └── IBackgroundCheckService.ts
│   │   │
│   │   └── types/               # Domain Types & DTOs
│   │       ├── auth.types.ts
│   │       ├── case.types.ts
│   │       ├── person.types.ts
│   │       ├── evidence.types.ts
│   │       └── common.types.ts
│   │
│   ├── repositories/             # Repository Implementations
│   │   ├── base/
│   │   │   └── BaseRepository.ts
│   │   │
│   │   ├── implementations/
│   │   │   ├── OfficerRepository.ts
│   │   │   ├── CaseRepository.ts
│   │   │   ├── PersonRepository.ts
│   │   │   ├── EvidenceRepository.ts
│   │   │   ├── AuditLogRepository.ts
│   │   │   ├── StationRepository.ts
│   │   │   ├── RoleRepository.ts
│   │   │   ├── PermissionRepository.ts
│   │   │   ├── AmberAlertRepository.ts
│   │   │   ├── WantedPersonRepository.ts
│   │   │   ├── BackgroundCheckRepository.ts
│   │   │   └── SyncQueueRepository.ts
│   │   │
│   │   └── index.ts              # Export all repositories
│   │
│   ├── services/                 # Service Implementations (Business Logic)
│   │   ├── AuthService.ts
│   │   ├── CaseService.ts
│   │   ├── PersonService.ts
│   │   ├── EvidenceService.ts
│   │   ├── BackgroundCheckService.ts
│   │   ├── AlertService.ts
│   │   ├── AuditService.ts
│   │   ├── SyncService.ts
│   │   ├── USSDService.ts
│   │   ├── NotificationService.ts
│   │   └── index.ts              # Export all services
│   │
│   ├── lib/                      # Utilities & Infrastructure
│   │   ├── prisma.ts            # Prisma Client singleton
│   │   ├── encryption.ts        # Encryption utilities
│   │   ├── validation.ts        # Zod schemas
│   │   ├── permissions.ts       # Permission helpers
│   │   ├── errors/              # Custom error classes
│   │   │   ├── AppError.ts
│   │   │   ├── ValidationError.ts
│   │   │   ├── UnauthorizedError.ts
│   │   │   ├── ForbiddenError.ts
│   │   │   └── NotFoundError.ts
│   │   └── utils.ts             # General utilities
│   │
│   └── di/                       # Dependency Injection
│       ├── container.ts          # DI Container
│       └── providers.ts          # Service/Repository providers
│
├── components/                   # React UI Components
│   ├── ui/                      # Shadcn UI components
│   ├── auth/
│   ├── cases/
│   ├── persons/
│   └── layout/
│
├── lib/                          # Next.js specific lib (kept for compatibility)
│   ├── auth.ts                  # NextAuth config
│   └── hooks/                   # React hooks
│
├── tests/                        # Testing
│   ├── unit/
│   │   ├── domain/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   └── api/
│   ├── e2e/
│   └── mocks/
│       ├── repositories/
│       └── prisma.mock.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── docs/
├── public/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎯 Layer 1: Domain Layer

### Domain Entities

Domain entities are pure business objects with **domain logic only** (no database logic).

**`src/domain/entities/Officer.ts`:**

```typescript
export class Officer {
  constructor(
    public readonly id: string,
    public readonly badge: string,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly roleId: string,
    public readonly stationId: string,
    public readonly active: boolean,
    public readonly lastLogin: Date | null,
    public readonly pinChangedAt: Date,
    public readonly failedAttempts: number,
    public readonly lockedUntil: Date | null,
    public readonly mfaEnabled: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Domain logic methods
  isLocked(): boolean {
    return this.lockedUntil !== null && this.lockedUntil > new Date();
  }

  isPinExpired(maxAgeDays: number = 90): boolean {
    const daysSinceChange = Math.floor(
      (Date.now() - this.pinChangedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceChange > maxAgeDays;
  }

  canLogin(): { allowed: boolean; reason?: string } {
    if (!this.active) {
      return { allowed: false, reason: "Account is deactivated" };
    }
    if (this.isLocked()) {
      return { allowed: false, reason: "Account is locked" };
    }
    if (this.isPinExpired()) {
      return { allowed: false, reason: "PIN has expired. Please reset your PIN." };
    }
    return { allowed: true };
  }

  shouldRequireMFA(): boolean {
    return this.mfaEnabled;
  }
}
```

**`src/domain/entities/Case.ts`:**

```typescript
export class Case {
  constructor(
    public readonly id: string,
    public readonly caseNumber: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly category: string,
    public readonly severity: string,
    public readonly status: string,
    public readonly incidentDate: Date,
    public readonly reportedDate: Date,
    public readonly location: string | null,
    public readonly stationId: string,
    public readonly officerId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Domain logic
  isOpen(): boolean {
    return this.status === "open" || this.status === "investigating";
  }

  isClosed(): boolean {
    return this.status === "closed";
  }

  canTransitionTo(newStatus: string): boolean {
    const statusTransitions: Record<string, string[]> = {
      open: ["investigating", "closed"],
      investigating: ["charged", "closed"],
      charged: ["court", "closed"],
      court: ["closed"],
      closed: [], // Cannot transition from closed
    };

    return statusTransitions[this.status]?.includes(newStatus) ?? false;
  }

  requiresCourtApproval(): boolean {
    return this.severity === "critical" && this.status === "charged";
  }

  getDaysSinceIncident(): number {
    return Math.floor(
      (Date.now() - this.incidentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }
}
```

**`src/domain/entities/Person.ts`:**

```typescript
export class Person {
  constructor(
    public readonly id: string,
    public readonly nationalId: string | null,      // Can be NIN, Ghana Card, Huduma Namba, etc.
    public readonly idType: string | null,          // "NIN", "GHANA_CARD", "HUDUMA_NAMBA", "PASSPORT", etc.
    public readonly countryCode: string | null,     // ISO 3166-1 alpha-3
    public readonly fullName: string,
    public readonly aliases: string[],
    public readonly dob: Date | null,
    public readonly gender: string | null,
    public readonly nationality: string,
    public readonly addressEncrypted: string | null,
    public readonly phoneEncrypted: string | null,
    public readonly emailEncrypted: string | null,
    public readonly photoUrl: string | null,
    public readonly fingerprintHash: string | null,
    public readonly biometricHash: string | null,
    public readonly createdById: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Domain logic
  getAge(): number | null {
    if (!this.dob) return null;
    const today = new Date();
    let age = today.getFullYear() - this.dob.getFullYear();
    const monthDiff = today.getMonth() - this.dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dob.getDate())) {
      age--;
    }
    return age;
  }

  isMinor(): boolean {
    const age = this.getAge();
    return age !== null && age < 18;
  }

  hasNationalId(): boolean {
    return this.nationalId !== null && this.nationalId.length > 0;
  }

  getNationalIdDisplay(): string {
    if (!this.nationalId || !this.idType) {
      return "No ID";
    }
    return `${this.idType}: ${this.nationalId}`;
  }

  hasBiometrics(): boolean {
    return this.fingerprintHash !== null || this.biometricHash !== null;
  }

  getDisplayName(): string {
    if (this.aliases.length > 0) {
      return `${this.fullName} (aka ${this.aliases.join(", ")})`;
    }
    return this.fullName;
  }
}
```

### Repository Interfaces

**`src/domain/interfaces/repositories/IOfficerRepository.ts`:**

```typescript
import { Officer } from "@/src/domain/entities/Officer";

export interface CreateOfficerDto {
  badge: string;
  name: string;
  email?: string;
  phone?: string;
  pinHash: string;
  roleId: string;
  stationId: string;
}

export interface UpdateOfficerDto {
  name?: string;
  email?: string;
  phone?: string;
  pinHash?: string;
  roleId?: string;
  stationId?: string;
  active?: boolean;
  mfaEnabled?: boolean;
  mfaSecret?: string;
}

export interface IOfficerRepository {
  // Queries
  findById(id: string): Promise<Officer | null>;
  findByBadge(badge: string): Promise<Officer | null>;
  findByEmail(email: string): Promise<Officer | null>;
  findByStationId(stationId: string): Promise<Officer[]>;
  findAll(filters?: OfficerFilters): Promise<Officer[]>;
  count(filters?: OfficerFilters): Promise<number>;

  // Commands
  create(data: CreateOfficerDto): Promise<Officer>;
  update(id: string, data: UpdateOfficerDto): Promise<Officer>;
  delete(id: string): Promise<void>;

  // Specific operations
  incrementFailedAttempts(id: string): Promise<void>;
  resetFailedAttempts(id: string): Promise<void>;
  lockAccount(id: string, until: Date): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
  updatePinHash(id: string, pinHash: string): Promise<void>;
}

export interface OfficerFilters {
  active?: boolean;
  roleId?: string;
  stationId?: string;
  search?: string; // Search by name, badge, email
}
```

**`src/domain/interfaces/repositories/ICaseRepository.ts`:**

```typescript
import { Case } from "@/src/domain/entities/Case";

export interface CreateCaseDto {
  title: string;
  description?: string;
  category: string;
  severity: string;
  incidentDate: Date;
  location?: string;
  stationId: string;
  officerId: string;
}

export interface UpdateCaseDto {
  title?: string;
  description?: string;
  category?: string;
  severity?: string;
  status?: string;
  incidentDate?: Date;
  location?: string;
  officerId?: string;
}

export interface CaseFilters {
  status?: string;
  category?: string;
  severity?: string;
  officerId?: string;
  stationId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export interface ICaseRepository {
  // Queries
  findById(id: string): Promise<Case | null>;
  findByCaseNumber(caseNumber: string): Promise<Case | null>;
  findByStationId(stationId: string, filters?: CaseFilters): Promise<Case[]>;
  findByOfficerId(officerId: string, filters?: CaseFilters): Promise<Case[]>;
  findAll(filters?: CaseFilters): Promise<Case[]>;
  count(filters?: CaseFilters): Promise<number>;
  search(query: string, filters?: CaseFilters): Promise<Case[]>;

  // Commands
  create(data: CreateCaseDto): Promise<Case>;
  update(id: string, data: UpdateCaseDto): Promise<Case>;
  delete(id: string): Promise<void>;
  updateStatus(id: string, status: string): Promise<Case>;

  // Relations
  addPerson(caseId: string, personId: string, role: string, statement?: string): Promise<void>;
  removePerson(caseId: string, personId: string, role: string): Promise<void>;
  addNote(caseId: string, content: string): Promise<void>;
}
```

**`src/domain/interfaces/repositories/IPersonRepository.ts`:**

```typescript
import { Person } from "@/src/domain/entities/Person";

export interface CreatePersonDto {
  nationalId?: string;                    // Can be NIN, Ghana Card, etc.
  idType?: string;                        // "NIN", "GHANA_CARD", "HUDUMA_NAMBA", etc.
  countryCode?: string;                   // ISO 3166-1 alpha-3
  fullName: string;
  aliases?: string[];
  dob?: Date;
  gender?: string;
  nationality?: string;
  addressEncrypted?: string;
  phoneEncrypted?: string;
  emailEncrypted?: string;
  photoUrl?: string;
  fingerprintHash?: string;
  biometricHash?: string;
  createdById: string;
}

export interface UpdatePersonDto {
  nationalId?: string;
  idType?: string;
  countryCode?: string;
  fullName?: string;
  aliases?: string[];
  dob?: Date;
  gender?: string;
  nationality?: string;
  addressEncrypted?: string;
  phoneEncrypted?: string;
  emailEncrypted?: string;
  photoUrl?: string;
  fingerprintHash?: string;
  biometricHash?: string;
}

export interface PersonFilters {
  gender?: string;
  nationality?: string;
  countryCode?: string;                   // Filter by country
  idType?: string;                        // Filter by ID type
  ageMin?: number;
  ageMax?: number;
  search?: string;
}

export interface IPersonRepository {
  // Queries
  findById(id: string): Promise<Person | null>;
  findByNationalId(nationalId: string): Promise<Person | null>;
  findByFingerprintHash(hash: string): Promise<Person | null>;
  findAll(filters?: PersonFilters): Promise<Person[]>;
  search(query: string): Promise<Person[]>;
  count(filters?: PersonFilters): Promise<number>;

  // Commands
  create(data: CreatePersonDto): Promise<Person>;
  update(id: string, data: UpdatePersonDto): Promise<Person>;
  delete(id: string): Promise<void>;
}
```

### Domain Types & DTOs

**`src/domain/types/common.types.ts`:**

```typescript
export type UUID = string;

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditInfo {
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

## 🎯 Layer 2: Repository Layer

### Base Repository

**`src/repositories/base/BaseRepository.ts`:**

```typescript
import { PrismaClient } from "@prisma/client";

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  /**
   * Handle Prisma errors and convert to domain errors
   */
  protected handleError(error: any): never {
    // Log error for debugging
    console.error("Repository error:", error);

    if (error.code === "P2002") {
      throw new Error("Unique constraint violation");
    }
    if (error.code === "P2025") {
      throw new Error("Record not found");
    }

    throw new Error("Database operation failed");
  }
}
```

### Repository Implementations

**`src/repositories/implementations/OfficerRepository.ts`:**

```typescript
import { PrismaClient } from "@prisma/client";
import {
  IOfficerRepository,
  CreateOfficerDto,
  UpdateOfficerDto,
  OfficerFilters,
} from "@/src/domain/interfaces/repositories/IOfficerRepository";
import { Officer } from "@/src/domain/entities/Officer";
import { BaseRepository } from "../base/BaseRepository";

export class OfficerRepository extends BaseRepository implements IOfficerRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<Officer | null> {
    try {
      const officer = await this.prisma.officer.findUnique({
        where: { id },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
      });

      return officer ? this.toDomain(officer) : null;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findByBadge(badge: string): Promise<Officer | null> {
    try {
      const officer = await this.prisma.officer.findUnique({
        where: { badge },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
      });

      return officer ? this.toDomain(officer) : null;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findByEmail(email: string): Promise<Officer | null> {
    try {
      const officer = await this.prisma.officer.findUnique({
        where: { email },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
      });

      return officer ? this.toDomain(officer) : null;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findByStationId(stationId: string): Promise<Officer[]> {
    try {
      const officers = await this.prisma.officer.findMany({
        where: { stationId },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
        orderBy: { name: "asc" },
      });

      return officers.map((o) => this.toDomain(o));
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAll(filters?: OfficerFilters): Promise<Officer[]> {
    try {
      const officers = await this.prisma.officer.findMany({
        where: {
          ...(filters?.active !== undefined && { active: filters.active }),
          ...(filters?.roleId && { roleId: filters.roleId }),
          ...(filters?.stationId && { stationId: filters.stationId }),
          ...(filters?.search && {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { badge: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
            ],
          }),
        },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
        orderBy: { name: "asc" },
      });

      return officers.map((o) => this.toDomain(o));
    } catch (error) {
      this.handleError(error);
    }
  }

  async count(filters?: OfficerFilters): Promise<number> {
    try {
      return await this.prisma.officer.count({
        where: {
          ...(filters?.active !== undefined && { active: filters.active }),
          ...(filters?.roleId && { roleId: filters.roleId }),
          ...(filters?.stationId && { stationId: filters.stationId }),
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async create(data: CreateOfficerDto): Promise<Officer> {
    try {
      const officer = await this.prisma.officer.create({
        data: {
          badge: data.badge,
          name: data.name,
          email: data.email,
          phone: data.phone,
          pinHash: data.pinHash,
          roleId: data.roleId,
          stationId: data.stationId,
          active: true,
          failedAttempts: 0,
          mfaEnabled: false,
        },
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
      });

      return this.toDomain(officer);
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, data: UpdateOfficerDto): Promise<Officer> {
    try {
      const officer = await this.prisma.officer.update({
        where: { id },
        data,
        include: {
          role: { include: { permissions: true } },
          station: true,
        },
      });

      return this.toDomain(officer);
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.officer.delete({ where: { id } });
    } catch (error) {
      this.handleError(error);
    }
  }

  async incrementFailedAttempts(id: string): Promise<void> {
    try {
      await this.prisma.officer.update({
        where: { id },
        data: { failedAttempts: { increment: 1 } },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async resetFailedAttempts(id: string): Promise<void> {
    try {
      await this.prisma.officer.update({
        where: { id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    try {
      await this.prisma.officer.update({
        where: { id },
        data: { lockedUntil: until },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      await this.prisma.officer.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async updatePinHash(id: string, pinHash: string): Promise<void> {
    try {
      await this.prisma.officer.update({
        where: { id },
        data: { pinHash, pinChangedAt: new Date() },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Map Prisma model to Domain entity
   */
  private toDomain(data: any): Officer {
    return new Officer(
      data.id,
      data.badge,
      data.name,
      data.email,
      data.phone,
      data.roleId,
      data.stationId,
      data.active,
      data.lastLogin,
      data.pinChangedAt,
      data.failedAttempts,
      data.lockedUntil,
      data.mfaEnabled,
      data.createdAt,
      data.updatedAt
    );
  }
}
```

**`src/repositories/implementations/CaseRepository.ts`:**

```typescript
import { PrismaClient } from "@prisma/client";
import {
  ICaseRepository,
  CreateCaseDto,
  UpdateCaseDto,
  CaseFilters,
} from "@/src/domain/interfaces/repositories/ICaseRepository";
import { Case } from "@/src/domain/entities/Case";
import { BaseRepository } from "../base/BaseRepository";

export class CaseRepository extends BaseRepository implements ICaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<Case | null> {
    try {
      const caseData = await this.prisma.case.findUnique({
        where: { id },
        include: {
          station: true,
          officer: true,
          persons: { include: { person: true } },
          evidence: true,
          notes: true,
        },
      });

      return caseData ? this.toDomain(caseData) : null;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findByCaseNumber(caseNumber: string): Promise<Case | null> {
    try {
      const caseData = await this.prisma.case.findUnique({
        where: { caseNumber },
        include: {
          station: true,
          officer: true,
          persons: { include: { person: true } },
          evidence: true,
        },
      });

      return caseData ? this.toDomain(caseData) : null;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findByStationId(stationId: string, filters?: CaseFilters): Promise<Case[]> {
    try {
      const cases = await this.prisma.case.findMany({
        where: {
          stationId,
          ...this.buildWhereClause(filters),
        },
        include: {
          station: true,
          officer: true,
          persons: { include: { person: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return cases.map((c) => this.toDomain(c));
    } catch (error) {
      this.handleError(error);
    }
  }

  async findByOfficerId(officerId: string, filters?: CaseFilters): Promise<Case[]> {
    try {
      const cases = await this.prisma.case.findMany({
        where: {
          officerId,
          ...this.buildWhereClause(filters),
        },
        include: {
          station: true,
          officer: true,
          persons: { include: { person: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return cases.map((c) => this.toDomain(c));
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAll(filters?: CaseFilters): Promise<Case[]> {
    try {
      const cases = await this.prisma.case.findMany({
        where: this.buildWhereClause(filters),
        include: {
          station: true,
          officer: true,
          persons: { include: { person: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return cases.map((c) => this.toDomain(c));
    } catch (error) {
      this.handleError(error);
    }
  }

  async count(filters?: CaseFilters): Promise<number> {
    try {
      return await this.prisma.case.count({
        where: this.buildWhereClause(filters),
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async search(query: string, filters?: CaseFilters): Promise<Case[]> {
    try {
      const cases = await this.prisma.case.findMany({
        where: {
          ...this.buildWhereClause(filters),
          OR: [
            { caseNumber: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          station: true,
          officer: true,
          persons: { include: { person: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return cases.map((c) => this.toDomain(c));
    } catch (error) {
      this.handleError(error);
    }
  }

  async create(data: CreateCaseDto): Promise<Case> {
    try {
      const caseNumber = await this.generateCaseNumber(data.stationId);

      const caseData = await this.prisma.case.create({
        data: {
          caseNumber,
          title: data.title,
          description: data.description,
          category: data.category,
          severity: data.severity,
          incidentDate: data.incidentDate,
          location: data.location,
          stationId: data.stationId,
          officerId: data.officerId,
          status: "open",
          reportedDate: new Date(),
        },
        include: {
          station: true,
          officer: true,
        },
      });

      return this.toDomain(caseData);
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, data: UpdateCaseDto): Promise<Case> {
    try {
      const caseData = await this.prisma.case.update({
        where: { id },
        data,
        include: {
          station: true,
          officer: true,
          persons: { include: { person: true } },
        },
      });

      return this.toDomain(caseData);
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.case.delete({ where: { id } });
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateStatus(id: string, status: string): Promise<Case> {
    return this.update(id, { status });
  }

  async addPerson(caseId: string, personId: string, role: string, statement?: string): Promise<void> {
    try {
      await this.prisma.casePerson.create({
        data: { caseId, personId, role, statement },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async removePerson(caseId: string, personId: string, role: string): Promise<void> {
    try {
      await this.prisma.casePerson.deleteMany({
        where: { caseId, personId, role },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async addNote(caseId: string, content: string): Promise<void> {
    try {
      await this.prisma.caseNote.create({
        data: { caseId, content },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Generate unique case number
   */
  private async generateCaseNumber(stationId: string): Promise<string> {
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      throw new Error("Station not found");
    }

    const count = await this.prisma.case.count({
      where: { stationId },
    });

    const year = new Date().getFullYear();
    return `${station.code}-${year}-${String(count + 1).padStart(6, "0")}`;
  }

  /**
   * Build where clause from filters
   */
  private buildWhereClause(filters?: CaseFilters): any {
    if (!filters) return {};

    return {
      ...(filters.status && { status: filters.status }),
      ...(filters.category && { category: filters.category }),
      ...(filters.severity && { severity: filters.severity }),
      ...(filters.officerId && { officerId: filters.officerId }),
      ...(filters.stationId && { stationId: filters.stationId }),
      ...(filters.fromDate && { incidentDate: { gte: filters.fromDate } }),
      ...(filters.toDate && { incidentDate: { lte: filters.toDate } }),
    };
  }

  /**
   * Map Prisma model to Domain entity
   */
  private toDomain(data: any): Case {
    return new Case(
      data.id,
      data.caseNumber,
      data.title,
      data.description,
      data.category,
      data.severity,
      data.status,
      data.incidentDate,
      data.reportedDate,
      data.location,
      data.stationId,
      data.officerId,
      data.createdAt,
      data.updatedAt
    );
  }
}
```

---

## 🎯 Layer 3: Service Layer

### Services with Business Logic

**`src/services/AuthService.ts`:**

```typescript
import { IOfficerRepository } from "@/src/domain/interfaces/repositories/IOfficerRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { Officer } from "@/src/domain/entities/Officer";
import { verify, hash } from "argon2";
import { ValidationError, UnauthorizedError } from "@/src/lib/errors";

export class AuthService {
  constructor(
    private readonly officerRepo: IOfficerRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  async authenticateOfficer(
    badge: string,
    pin: string,
    ipAddress?: string
  ): Promise<Officer> {
    // Validation
    if (!badge || !pin) {
      throw new ValidationError("Badge and PIN are required");
    }

    // Find officer
    const officer = await this.officerRepo.findByBadge(badge);
    if (!officer) {
      await this.auditRepo.create({
        entityType: "officer",
        action: "login",
        success: false,
        details: { badge, reason: "Officer not found" },
        ipAddress,
      });
      throw new UnauthorizedError("Invalid credentials");
    }

    // Check if can login (uses domain logic)
    const loginCheck = officer.canLogin();
    if (!loginCheck.allowed) {
      await this.auditRepo.create({
        entityType: "officer",
        entityId: officer.id,
        officerId: officer.id,
        action: "login",
        success: false,
        details: { badge, reason: loginCheck.reason },
        ipAddress,
      });
      throw new UnauthorizedError(loginCheck.reason!);
    }

    // Verify PIN
    const officerData = await this.officerRepo.findById(officer.id); // Get full data including pinHash
    if (!officerData) {
      throw new UnauthorizedError("Officer not found");
    }

    const isValidPin = await verify((officerData as any).pinHash, pin);
    if (!isValidPin) {
      await this.handleFailedLogin(officer.id, badge, ipAddress);
      throw new UnauthorizedError("Invalid credentials");
    }

    // Success
    await this.officerRepo.resetFailedAttempts(officer.id);
    await this.officerRepo.updateLastLogin(officer.id);

    await this.auditRepo.create({
      entityType: "officer",
      entityId: officer.id,
      officerId: officer.id,
      action: "login",
      success: true,
      details: { badge },
      ipAddress,
    });

    return officer;
  }

  async changePin(officerId: string, oldPin: string, newPin: string): Promise<void> {
    // Validate PIN strength
    this.validatePinStrength(newPin);

    // Verify old PIN
    const officer = await this.officerRepo.findById(officerId);
    if (!officer) {
      throw new UnauthorizedError("Officer not found");
    }

    const isValidOldPin = await verify((officer as any).pinHash, oldPin);
    if (!isValidOldPin) {
      throw new UnauthorizedError("Invalid current PIN");
    }

    // Hash new PIN
    const newPinHash = await hash(newPin);

    // Update
    await this.officerRepo.updatePinHash(officerId, newPinHash);

    await this.auditRepo.create({
      entityType: "officer",
      entityId: officerId,
      officerId,
      action: "pin_change",
      success: true,
      details: {},
    });
  }

  async resetPin(officerId: string, newPin: string, adminId: string): Promise<void> {
    // Validate PIN strength
    this.validatePinStrength(newPin);

    // Hash new PIN
    const newPinHash = await hash(newPin);

    // Update
    await this.officerRepo.updatePinHash(officerId, newPinHash);

    await this.auditRepo.create({
      entityType: "officer",
      entityId: officerId,
      officerId: adminId,
      action: "pin_reset",
      success: true,
      details: { targetOfficerId: officerId },
    });
  }

  private validatePinStrength(pin: string): void {
    if (pin.length < 8) {
      throw new ValidationError("PIN must be at least 8 digits");
    }

    if (!/^\d+$/.test(pin)) {
      throw new ValidationError("PIN must contain only digits");
    }

    if (/^(\d)\1+$/.test(pin)) {
      throw new ValidationError("PIN cannot be all the same digit");
    }

    const commonPins = ["12345678", "87654321", "11111111", "00000000"];
    if (commonPins.includes(pin)) {
      throw new ValidationError("PIN is too common");
    }
  }

  private async handleFailedLogin(
    officerId: string,
    badge: string,
    ipAddress?: string
  ): Promise<void> {
    await this.officerRepo.incrementFailedAttempts(officerId);

    const officer = await this.officerRepo.findById(officerId);
    if (!officer) return;

    const failedAttempts = officer.failedAttempts + 1;

    // Lock account after 5 failed attempts
    if (failedAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await this.officerRepo.lockAccount(officerId, lockUntil);
    }

    await this.auditRepo.create({
      entityType: "officer",
      entityId: officerId,
      officerId,
      action: "login",
      success: false,
      details: {
        badge,
        failedAttempts,
        reason: "Invalid PIN",
      },
      ipAddress,
    });
  }
}
```

**`src/services/CaseService.ts`:**

```typescript
import { ICaseRepository } from "@/src/domain/interfaces/repositories/ICaseRepository";
import { IPersonRepository } from "@/src/domain/interfaces/repositories/IPersonRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { Case } from "@/src/domain/entities/Case";
import { ValidationError, ForbiddenError, NotFoundError } from "@/src/lib/errors";

export interface CreateCaseInput {
  title: string;
  description?: string;
  category: string;
  severity: string;
  incidentDate: Date;
  location?: string;
  suspects?: string[]; // Person IDs
  victims?: string[]; // Person IDs
  witnesses?: string[]; // Person IDs
}

export class CaseService {
  constructor(
    private readonly caseRepo: ICaseRepository,
    private readonly personRepo: IPersonRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  async createCase(
    data: CreateCaseInput,
    officerId: string,
    stationId: string
  ): Promise<Case> {
    // Validation
    if (!data.title || !data.incidentDate) {
      throw new ValidationError("Title and incident date are required");
    }

    if (data.incidentDate > new Date()) {
      throw new ValidationError("Incident date cannot be in the future");
    }

    // Validate persons exist
    if (data.suspects?.length) {
      await this.validatePersonsExist(data.suspects);
    }
    if (data.victims?.length) {
      await this.validatePersonsExist(data.victims);
    }
    if (data.witnesses?.length) {
      await this.validatePersonsExist(data.witnesses);
    }

    // Create case
    const newCase = await this.caseRepo.create({
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      incidentDate: data.incidentDate,
      location: data.location,
      officerId,
      stationId,
    });

    // Add related persons
    if (data.suspects?.length) {
      for (const personId of data.suspects) {
        await this.caseRepo.addPerson(newCase.id, personId, "suspect");
      }
    }

    if (data.victims?.length) {
      for (const personId of data.victims) {
        await this.caseRepo.addPerson(newCase.id, personId, "victim");
      }
    }

    if (data.witnesses?.length) {
      for (const personId of data.witnesses) {
        await this.caseRepo.addPerson(newCase.id, personId, "witness");
      }
    }

    // Audit
    await this.auditRepo.create({
      entityType: "case",
      entityId: newCase.id,
      officerId,
      action: "create",
      success: true,
      details: {
        caseNumber: newCase.caseNumber,
        title: data.title,
        category: data.category,
      },
    });

    return newCase;
  }

  async updateCaseStatus(
    caseId: string,
    newStatus: string,
    officerId: string
  ): Promise<Case> {
    // Find existing case
    const existingCase = await this.caseRepo.findById(caseId);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    // Validate status transition (uses domain logic)
    if (!existingCase.canTransitionTo(newStatus)) {
      throw new ValidationError(
        `Cannot transition from ${existingCase.status} to ${newStatus}`
      );
    }

    // Update
    const updatedCase = await this.caseRepo.updateStatus(caseId, newStatus);

    // Audit
    await this.auditRepo.create({
      entityType: "case",
      entityId: caseId,
      officerId,
      action: "update",
      success: true,
      details: {
        field: "status",
        oldValue: existingCase.status,
        newValue: newStatus,
      },
    });

    return updatedCase;
  }

  async addNote(caseId: string, content: string, officerId: string): Promise<void> {
    // Validate case exists
    const existingCase = await this.caseRepo.findById(caseId);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    // Check if case is closed
    if (existingCase.isClosed()) {
      throw new ForbiddenError("Cannot add notes to closed cases");
    }

    await this.caseRepo.addNote(caseId, content);

    await this.auditRepo.create({
      entityType: "case",
      entityId: caseId,
      officerId,
      action: "add_note",
      success: true,
      details: {},
    });
  }

  async getCasesByStation(stationId: string, filters?: any): Promise<Case[]> {
    return this.caseRepo.findByStationId(stationId, filters);
  }

  async getCaseById(caseId: string, officerId: string): Promise<Case> {
    const caseData = await this.caseRepo.findById(caseId);
    if (!caseData) {
      throw new NotFoundError("Case not found");
    }

    // Audit access
    await this.auditRepo.create({
      entityType: "case",
      entityId: caseId,
      officerId,
      action: "read",
      success: true,
      details: {},
    });

    return caseData;
  }

  private async validatePersonsExist(personIds: string[]): Promise<void> {
    for (const personId of personIds) {
      const person = await this.personRepo.findById(personId);
      if (!person) {
        throw new ValidationError(`Person with ID ${personId} not found`);
      }
    }
  }
}
```

---

## 🌍 Country-Specific Adaptations in Service Layer

The CRMS architecture supports **pan-African deployment** through configuration-based customization. Country-specific logic is handled in the **Service Layer**, keeping the repository and domain layers country-agnostic.

### Design Principles for Multi-Country Support

1. **Repository Layer**: Country-agnostic - uses flexible fields (`nationalId`, `idType`, `countryCode`)
2. **Service Layer**: Country-aware - loads country configuration and applies country-specific business rules
3. **Domain Layer**: Universal - entities represent concepts that apply across all countries

### Country Configuration Service

**`src/services/CountryConfigService.ts`:**

```typescript
export interface CountryConfig {
  countryCode: string;
  countryName: string;
  nationalIdSystem: {
    type: string;
    displayName: string;
    format: string;
    validationRegex: string;
  };
  language: {
    default: string;
    supported: string[];
  };
  currency: string;
  dateFormat: string;
  policeStructure: {
    type: "centralized" | "decentralized" | "hybrid";
    levels: string[];
  };
  legalFramework: {
    dataProtectionAct: string;
    penalCode: string;
  };
  caseWorkflow: {
    statuses: string[];
    transitions: Record<string, string[]>;
  };
}

export class CountryConfigService {
  private configs: Map<string, CountryConfig> = new Map();

  constructor() {
    this.loadConfigurations();
  }

  private loadConfigurations(): void {
    // Load from config/countries/*.json
    // Example: Sierra Leone
    this.configs.set("SLE", {
      countryCode: "SLE",
      countryName: "Sierra Leone",
      nationalIdSystem: {
        type: "NIN",
        displayName: "National Identification Number",
        format: "NIN-XXXXXXXXX",
        validationRegex: "^NIN-[0-9]{9}$",
      },
      language: { default: "en", supported: ["en"] },
      currency: "SLL",
      dateFormat: "DD/MM/YYYY",
      policeStructure: {
        type: "centralized",
        levels: ["national", "regional", "district", "station"],
      },
      legalFramework: {
        dataProtectionAct: "Data Protection Act (Draft)",
        penalCode: "Criminal Procedure Act 1965",
      },
      caseWorkflow: {
        statuses: ["open", "investigating", "charged", "court", "closed"],
        transitions: {
          open: ["investigating", "closed"],
          investigating: ["charged", "closed"],
          charged: ["court", "closed"],
          court: ["closed"],
          closed: [],
        },
      },
    });

    // Example: Ghana
    this.configs.set("GHA", {
      countryCode: "GHA",
      countryName: "Ghana",
      nationalIdSystem: {
        type: "GHANA_CARD",
        displayName: "Ghana Card",
        format: "GHA-XXXXXXXXX-X",
        validationRegex: "^GHA-[0-9]{9}-[0-9]$",
      },
      language: { default: "en", supported: ["en", "tw", "ee"] },
      currency: "GHS",
      dateFormat: "DD/MM/YYYY",
      policeStructure: {
        type: "centralized",
        levels: ["national", "regional", "district", "station"],
      },
      legalFramework: {
        dataProtectionAct: "Data Protection Act, 2012",
        penalCode: "Criminal Offences Act, 1960 (Act 29)",
      },
      caseWorkflow: {
        statuses: ["open", "investigating", "charged", "court", "closed"],
        transitions: {
          open: ["investigating", "closed"],
          investigating: ["charged", "closed"],
          charged: ["court", "closed"],
          court: ["closed"],
          closed: [],
        },
      },
    });
  }

  getConfig(countryCode: string): CountryConfig {
    const config = this.configs.get(countryCode);
    if (!config) {
      throw new Error(`Country configuration not found: ${countryCode}`);
    }
    return config;
  }

  validateNationalId(nationalId: string, countryCode: string): boolean {
    const config = this.getConfig(countryCode);
    const regex = new RegExp(config.nationalIdSystem.validationRegex);
    return regex.test(nationalId);
  }

  canTransitionCaseStatus(
    currentStatus: string,
    newStatus: string,
    countryCode: string
  ): boolean {
    const config = this.getConfig(countryCode);
    return config.caseWorkflow.transitions[currentStatus]?.includes(newStatus) ?? false;
  }
}
```

### Using Country Configuration in Services

**Example: PersonService with Country-Aware Validation**

```typescript
export class PersonService {
  constructor(
    private readonly personRepo: IPersonRepository,
    private readonly auditRepo: IAuditLogRepository,
    private readonly countryConfig: CountryConfigService
  ) {}

  async createPerson(
    data: CreatePersonInput,
    officerId: string,
    countryCode: string
  ): Promise<Person> {
    // Country-specific validation
    if (data.nationalId) {
      const isValid = this.countryConfig.validateNationalId(
        data.nationalId,
        countryCode
      );
      if (!isValid) {
        const config = this.countryConfig.getConfig(countryCode);
        throw new ValidationError(
          `Invalid ${config.nationalIdSystem.displayName} format. Expected: ${config.nationalIdSystem.format}`
        );
      }
    }

    // Create person with country context
    const person = await this.personRepo.create({
      ...data,
      countryCode,
      createdById: officerId,
    });

    await this.auditRepo.create({
      entityType: "person",
      entityId: person.id,
      officerId,
      action: "create",
      success: true,
      details: { countryCode },
    });

    return person;
  }
}
```

**Example: CaseService with Country-Aware Workflow**

```typescript
export class CaseService {
  constructor(
    private readonly caseRepo: ICaseRepository,
    private readonly personRepo: IPersonRepository,
    private readonly auditRepo: IAuditLogRepository,
    private readonly countryConfig: CountryConfigService
  ) {}

  async updateCaseStatus(
    caseId: string,
    newStatus: string,
    officerId: string,
    countryCode: string
  ): Promise<Case> {
    const existingCase = await this.caseRepo.findById(caseId);
    if (!existingCase) {
      throw new NotFoundError("Case not found");
    }

    // Use country-specific workflow validation
    const canTransition = this.countryConfig.canTransitionCaseStatus(
      existingCase.status,
      newStatus,
      countryCode
    );

    if (!canTransition) {
      const config = this.countryConfig.getConfig(countryCode);
      throw new ValidationError(
        `Cannot transition from ${existingCase.status} to ${newStatus} in ${config.countryName}`
      );
    }

    const updatedCase = await this.caseRepo.updateStatus(caseId, newStatus);

    await this.auditRepo.create({
      entityType: "case",
      entityId: caseId,
      officerId,
      action: "update",
      success: true,
      details: {
        field: "status",
        oldValue: existingCase.status,
        newValue: newStatus,
        countryCode,
      },
    });

    return updatedCase;
  }
}
```

### Benefits of This Approach

1. **No Code Forking**: New countries deploy the same codebase with different config files
2. **Centralized Logic**: Business rules are in services, not scattered across the app
3. **Easy Testing**: Mock `CountryConfigService` to test different country scenarios
4. **Maintainability**: Country-specific changes only affect config files
5. **Scalability**: Add new countries by creating new config files
6. **DPG Compliance**: Reusable platform that respects local contexts

### Example: Deployment in Nigeria

To deploy CRMS in Nigeria:

1. Create `config/countries/NGA.json`:
```json
{
  "countryCode": "NGA",
  "countryName": "Nigeria",
  "nationalIdSystem": {
    "type": "NIN",
    "displayName": "National Identification Number",
    "format": "XXXXXXXXXXX",
    "validationRegex": "^[0-9]{11}$"
  },
  "language": { "default": "en", "supported": ["en", "ha", "ig", "yo"] },
  "currency": "NGN",
  "policeStructure": {
    "type": "hybrid",
    "levels": ["federal", "state", "local", "station"]
  },
  "legalFramework": {
    "dataProtectionAct": "NDPR (Nigeria Data Protection Regulation)",
    "penalCode": "Criminal Code Act"
  }
}
```

2. Set environment variable: `DEPLOYMENT_COUNTRY=NGA`

3. System automatically loads Nigerian configuration

4. All validation, workflows, and UI adapt to Nigerian context

---

## 🎯 Layer 4: Dependency Injection

**`src/di/container.ts`:**

```typescript
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

// Repositories
import { OfficerRepository } from "@/src/repositories/implementations/OfficerRepository";
import { CaseRepository } from "@/src/repositories/implementations/CaseRepository";
import { PersonRepository } from "@/src/repositories/implementations/PersonRepository";
import { EvidenceRepository } from "@/src/repositories/implementations/EvidenceRepository";
import { AuditLogRepository } from "@/src/repositories/implementations/AuditLogRepository";
import { StationRepository } from "@/src/repositories/implementations/StationRepository";

// Services
import { AuthService } from "@/src/services/AuthService";
import { CaseService } from "@/src/services/CaseService";
import { PersonService } from "@/src/services/PersonService";
import { BackgroundCheckService } from "@/src/services/BackgroundCheckService";
import { AlertService } from "@/src/services/AlertService";

/**
 * Dependency Injection Container
 * Singleton pattern for managing dependencies
 */
class DIContainer {
  private static instance: DIContainer;
  private prismaClient: PrismaClient;

  // Repository instances
  public readonly officerRepository: OfficerRepository;
  public readonly caseRepository: CaseRepository;
  public readonly personRepository: PersonRepository;
  public readonly evidenceRepository: EvidenceRepository;
  public readonly auditLogRepository: AuditLogRepository;
  public readonly stationRepository: StationRepository;

  // Service instances
  public readonly authService: AuthService;
  public readonly caseService: CaseService;
  public readonly personService: PersonService;
  public readonly backgroundCheckService: BackgroundCheckService;
  public readonly alertService: AlertService;

  private constructor() {
    // Initialize Prisma
    this.prismaClient = prisma;

    // Initialize repositories
    this.officerRepository = new OfficerRepository(this.prismaClient);
    this.caseRepository = new CaseRepository(this.prismaClient);
    this.personRepository = new PersonRepository(this.prismaClient);
    this.evidenceRepository = new EvidenceRepository(this.prismaClient);
    this.auditLogRepository = new AuditLogRepository(this.prismaClient);
    this.stationRepository = new StationRepository(this.prismaClient);

    // Initialize services (inject repositories)
    this.authService = new AuthService(
      this.officerRepository,
      this.auditLogRepository
    );

    this.caseService = new CaseService(
      this.caseRepository,
      this.personRepository,
      this.auditLogRepository
    );

    this.personService = new PersonService(
      this.personRepository,
      this.auditLogRepository
    );

    this.backgroundCheckService = new BackgroundCheckService(
      this.personRepository,
      this.caseRepository,
      this.auditLogRepository
    );

    this.alertService = new AlertService(
      // inject repositories
    );
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * For testing: create instance with mock repositories
   */
  public static createTestInstance(mocks: Partial<DIContainer>): DIContainer {
    const instance = Object.create(DIContainer.prototype);
    Object.assign(instance, mocks);
    return instance;
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    await this.prismaClient.$disconnect();
  }
}

/**
 * Export singleton instance
 */
export const container = DIContainer.getInstance();

/**
 * Cleanup on process exit
 */
process.on("beforeExit", async () => {
  await container.cleanup();
});
```

---

## 🎯 Layer 5: API Controllers (Thin)

**`app/api/cases/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { ValidationError, ForbiddenError } from "@/src/lib/errors";

/**
 * GET /api/cases - List cases
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "cases", "read", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;

    // Call service (business logic)
    const cases = await container.caseService.getCasesByStation(
      session.user.stationId,
      { status, category }
    );

    return NextResponse.json({ cases });
  } catch (error: any) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases - Create case
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, "cases", "create", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Call service (business logic & validation handled there)
    const newCase = await container.caseService.createCase(
      body,
      session.user.id,
      session.user.stationId
    );

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating case:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**`app/api/cases/[id]/route.ts`:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";
import { NotFoundError, ValidationError } from "@/src/lib/errors";

/**
 * GET /api/cases/:id - Get case by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, "cases", "read", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const caseData = await container.caseService.getCaseById(
      params.id,
      session.user.id
    );

    return NextResponse.json({ case: caseData });
  } catch (error: any) {
    console.error("Error fetching case:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cases/:id - Update case
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, "cases", "update", "station")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // If updating status, use specific service method
    if (body.status) {
      const updatedCase = await container.caseService.updateCaseStatus(
        params.id,
        body.status,
        session.user.id
      );
      return NextResponse.json({ case: updatedCase });
    }

    // Otherwise, general update (implement in service)
    return NextResponse.json(
      { error: "Update not implemented" },
      { status: 501 }
    );
  } catch (error: any) {
    console.error("Error updating case:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests - Service Layer

**`tests/unit/services/AuthService.test.ts`:**

```typescript
import { AuthService } from "@/src/services/AuthService";
import { IOfficerRepository } from "@/src/domain/interfaces/repositories/IOfficerRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { Officer } from "@/src/domain/entities/Officer";
import { hash } from "argon2";
import { UnauthorizedError, ValidationError } from "@/src/lib/errors";

// Mock repositories
const mockOfficerRepo: jest.Mocked<IOfficerRepository> = {
  findById: jest.fn(),
  findByBadge: jest.fn(),
  findByEmail: jest.fn(),
  findByStationId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  incrementFailedAttempts: jest.fn(),
  resetFailedAttempts: jest.fn(),
  lockAccount: jest.fn(),
  updateLastLogin: jest.fn(),
  updatePinHash: jest.fn(),
};

const mockAuditRepo: jest.Mocked<IAuditLogRepository> = {
  create: jest.fn(),
  findByEntityId: jest.fn(),
  findByOfficerId: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
};

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockOfficerRepo, mockAuditRepo);
    jest.clearAllMocks();
  });

  describe("authenticateOfficer", () => {
    it("should authenticate officer with valid credentials", async () => {
      const pinHash = await hash("12345678");
      const mockOfficer = new Officer(
        "1",
        "SA-00001",
        "Test Officer",
        "test@test.com",
        null,
        "role-1",
        "station-1",
        true,
        null,
        new Date(),
        0,
        null,
        false,
        new Date(),
        new Date()
      );

      mockOfficerRepo.findByBadge.mockResolvedValue(mockOfficer);
      mockOfficerRepo.findById.mockResolvedValue({
        ...mockOfficer,
        pinHash,
      } as any);

      const result = await authService.authenticateOfficer(
        "SA-00001",
        "12345678"
      );

      expect(result).toBeDefined();
      expect(result.badge).toBe("SA-00001");
      expect(mockOfficerRepo.resetFailedAttempts).toHaveBeenCalledWith("1");
      expect(mockOfficerRepo.updateLastLogin).toHaveBeenCalledWith("1");
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "login",
          success: true,
        })
      );
    });

    it("should throw error for invalid badge", async () => {
      mockOfficerRepo.findByBadge.mockResolvedValue(null);

      await expect(
        authService.authenticateOfficer("INVALID", "12345678")
      ).rejects.toThrow(UnauthorizedError);

      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "login",
          success: false,
        })
      );
    });

    it("should throw error for locked account", async () => {
      const lockedOfficer = new Officer(
        "1",
        "SA-00001",
        "Test Officer",
        "test@test.com",
        null,
        "role-1",
        "station-1",
        true,
        null,
        new Date(),
        0,
        new Date(Date.now() + 30 * 60 * 1000), // Locked for 30 minutes
        false,
        new Date(),
        new Date()
      );

      mockOfficerRepo.findByBadge.mockResolvedValue(lockedOfficer);

      await expect(
        authService.authenticateOfficer("SA-00001", "12345678")
      ).rejects.toThrow(UnauthorizedError);
    });

    it("should lock account after 5 failed attempts", async () => {
      const pinHash = await hash("12345678");
      const mockOfficer = new Officer(
        "1",
        "SA-00001",
        "Test Officer",
        "test@test.com",
        null,
        "role-1",
        "station-1",
        true,
        null,
        new Date(),
        4, // 4 failed attempts
        null,
        false,
        new Date(),
        new Date()
      );

      mockOfficerRepo.findByBadge.mockResolvedValue(mockOfficer);
      mockOfficerRepo.findById.mockResolvedValue({
        ...mockOfficer,
        pinHash,
      } as any);

      await expect(
        authService.authenticateOfficer("SA-00001", "wrongpin")
      ).rejects.toThrow(UnauthorizedError);

      expect(mockOfficerRepo.incrementFailedAttempts).toHaveBeenCalledWith("1");
      expect(mockOfficerRepo.lockAccount).toHaveBeenCalled();
    });
  });

  describe("changePin", () => {
    it("should change PIN with valid old PIN", async () => {
      const oldPinHash = await hash("12345678");
      const mockOfficer = new Officer(
        "1",
        "SA-00001",
        "Test Officer",
        "test@test.com",
        null,
        "role-1",
        "station-1",
        true,
        null,
        new Date(),
        0,
        null,
        false,
        new Date(),
        new Date()
      );

      mockOfficerRepo.findById.mockResolvedValue({
        ...mockOfficer,
        pinHash: oldPinHash,
      } as any);

      await authService.changePin("1", "12345678", "87654321");

      expect(mockOfficerRepo.updatePinHash).toHaveBeenCalledWith(
        "1",
        expect.any(String)
      );
      expect(mockAuditRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "pin_change",
          success: true,
        })
      );
    });

    it("should reject weak PIN", async () => {
      await expect(
        authService.changePin("1", "12345678", "1234")
      ).rejects.toThrow(ValidationError);

      await expect(
        authService.changePin("1", "12345678", "11111111")
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

### Integration Tests - API Routes

**`tests/integration/api/cases.test.ts`:**

```typescript
import { POST, GET } from "@/app/api/cases/route";
import { getServerSession } from "next-auth";
import { container } from "@/src/di/container";
import { Case } from "@/src/domain/entities/Case";

jest.mock("next-auth");
jest.mock("@/src/di/container");

describe("POST /api/cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a case with valid data", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: "officer-1",
        stationId: "station-1",
        permissions: [{ resource: "cases", action: "create", scope: "station" }],
      },
    });

    const mockCase = new Case(
      "case-1",
      "HQ-2025-000001",
      "Test Case",
      "Test Description",
      "theft",
      "minor",
      "open",
      new Date(),
      new Date(),
      "Test Location",
      "station-1",
      "officer-1",
      new Date(),
      new Date()
    );

    (container.caseService.createCase as jest.Mock).mockResolvedValue(mockCase);

    const request = new Request("http://localhost/api/cases", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Case",
        category: "theft",
        severity: "minor",
        incidentDate: new Date().toISOString(),
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.case).toBeDefined();
    expect(data.case.caseNumber).toBe("HQ-2025-000001");
  });

  it("should return 401 for unauthenticated request", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost/api/cases", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(401);
  });

  it("should return 403 for insufficient permissions", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: "officer-1",
        stationId: "station-1",
        permissions: [], // No permissions
      },
    });

    const request = new Request("http://localhost/api/cases", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(403);
  });
});
```

---

## 📊 Benefits of Service-Repository Architecture

### 1. **Separation of Concerns**
- **Repositories**: Pure data access
- **Services**: Business logic
- **Controllers**: HTTP handling
- **Entities**: Domain model

### 2. **Testability**
- Easy to mock repositories in service tests
- Easy to mock services in controller tests
- Domain logic can be tested in isolation

### 3. **Maintainability**
- Changes to database don't affect business logic
- Changes to business logic don't affect API routes
- Clear responsibility boundaries

### 4. **Reusability**
- Services can be used across different API routes
- Repositories can be used across different services
- Domain entities are framework-agnostic

### 5. **Scalability**
- Easy to add new features without touching existing code
- Easy to switch databases (just replace repositories)
- Easy to add caching layer

### 6. **DPG Compliance**
- Clean, well-documented architecture
- Easy for others to understand and contribute
- Follows industry best practices (SOLID principles)

---

## 🚀 Migration Path

### Step 1: Set up folder structure
```bash
mkdir -p src/{domain/{entities,interfaces/{repositories,services},types},repositories/{base,implementations},services,lib/errors,di}
```

### Step 2: Create domain entities (one at a time)
- Officer
- Case
- Person
- Evidence

### Step 3: Create repository interfaces
- IOfficerRepository
- ICaseRepository
- IPersonRepository
- IEvidenceRepository

### Step 4: Implement repositories
- OfficerRepository
- CaseRepository
- PersonRepository
- EvidenceRepository

### Step 5: Create services
- AuthService
- CaseService
- PersonService

### Step 6: Set up DI container
- Create container.ts
- Wire up dependencies

### Step 7: Refactor API routes
- Replace direct Prisma calls with service calls
- Keep controllers thin

### Step 8: Add tests
- Unit tests for services
- Integration tests for API routes

---

## 📚 Best Practices

1. **Keep controllers thin** - Only handle HTTP concerns
2. **Put business logic in services** - Not in repositories or controllers
3. **Use domain entities** - Not Prisma models directly
4. **Dependency injection** - Inject interfaces, not concrete implementations
5. **Error handling** - Use custom error classes
6. **Validation** - In service layer, not controllers
7. **Transactions** - In service layer when coordinating multiple repositories
8. **Audit logging** - In service layer, always
9. **Testing** - Mock repositories, test services in isolation

---

**Status**: Ready for Implementation
**Architecture**: Service-Repository Pattern with Clean Architecture
**Benefit**: Testable, Maintainable, Scalable, DPG-Compliant
