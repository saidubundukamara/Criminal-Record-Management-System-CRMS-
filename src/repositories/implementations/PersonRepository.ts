/**
 * Person Repository Implementation
 *
 * Implements IPersonRepository with Prisma ORM
 * Handles PII encryption/decryption and entity mapping
 */

import { BaseRepository } from "../base/BaseRepository";
import {
  IPersonRepository,
  CreatePersonDto,
  UpdatePersonDto,
  PersonFilters,
  PersonWithRelations,
  PersonStatistics,
} from "@/src/domain/interfaces/repositories/IPersonRepository";
import { Person, Gender, EncryptedAddress, PersonType } from "@/src/domain/entities/Person";
import { encryptPII, decryptPII } from "@/src/lib/encryption";
import { Prisma } from "@prisma/client";

/**
 * Type for Prisma Person with relations
 */
type PrismaPersonWithRelations = any;

/**
 * PersonRepository implementation using Prisma
 */
export class PersonRepository extends BaseRepository implements IPersonRepository {
  /**
   * Safely decrypt and parse PII field with error handling
   * Returns default value if decryption or parsing fails
   *
   * Handles both formats:
   * - JSON arrays: ["value1", "value2"] or [{"field": "value"}]
   * - Legacy plain strings: "value" (converted to ["value"] for string arrays)
   */
  private safeDecryptAndParse<T>(
    encryptedValue: string | null | undefined,
    defaultValue: T,
    personId?: string,
    fieldName?: string
  ): T {
    if (!encryptedValue) {
      return defaultValue;
    }

    try {
      const decrypted = decryptPII(encryptedValue);
      if (!decrypted) {
        return defaultValue;
      }

      // Try to parse as JSON first
      try {
        return JSON.parse(decrypted) as T;
      } catch (jsonError) {
        // If JSON parsing fails, check if we're dealing with legacy plain-text data
        // For string arrays (phone, email), wrap the plain string in an array
        if (Array.isArray(defaultValue)) {
          // If default is an empty array and decrypted is a non-empty string,
          // treat it as a legacy plain-text value
          if (typeof decrypted === 'string' && decrypted.trim()) {
            console.warn(
              `[PersonRepository] Converting legacy plain-text ${fieldName || "PII field"} for person ${personId || "unknown"} to array format`
            );
            return [decrypted] as T;
          }
        }

        // If we can't handle the format, throw the original error
        throw jsonError;
      }
    } catch (error) {
      // Log error for debugging but don't crash the application
      console.error(
        `[PersonRepository] Failed to decrypt/parse ${fieldName || "PII field"} for person ${personId || "unknown"}:`,
        error instanceof Error ? error.message : error
      );
      return defaultValue;
    }
  }

  /**
   * Map Prisma Person to domain entity
   */
  private toDomain(data: any): Person {
    // Safely decrypt and parse encrypted PII fields with error handling
    const addresses: EncryptedAddress[] = this.safeDecryptAndParse(
      data.addressEncrypted,
      [],
      data.id,
      "addressEncrypted"
    );
    const phoneNumbers: string[] = this.safeDecryptAndParse(
      data.phoneEncrypted,
      [],
      data.id,
      "phoneEncrypted"
    );
    const emails: string[] = this.safeDecryptAndParse(
      data.emailEncrypted,
      [],
      data.id,
      "emailEncrypted"
    );

    return new Person(
      data.id,
      data.nationalId, // Prisma: nationalId -> Domain: nin
      data.firstName,
      data.lastName,
      data.middleName,
      data.aliases as string[], // Prisma: aliases (plural)
      data.dob ? new Date(data.dob) : null, // Prisma: dob -> Domain: dateOfBirth
      data.gender as Gender,
      data.nationality,
      null, // placeOfBirth - not in current schema
      null, // occupation - not in current schema
      null, // maritalStatus - not in current schema
      null, // educationLevel - not in current schema
      null, // tribe - not in current schema
      null, // religion - not in current schema
      [], // languagesSpoken - not in current schema
      null, // physicalDescription - not in current schema
      data.photoUrl,
      addresses, // Parsed from addressEncrypted
      phoneNumbers, // Parsed from phoneEncrypted
      emails, // Parsed from emailEncrypted
      data.fingerprintHash,
      data.biometricHash,
      null, // criminalHistory - not in current schema
      data.riskLevel as "low" | "medium" | "high" | null,
      data.isWanted,
      data.isDeceasedOrMissing,
      null, // notes - not in current schema
      "", // stationId - not on Person in schema, but domain entity expects it
      data.createdById, // Prisma: createdById -> Domain: createdBy
      null, // updatedBy - not in current schema
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );
  }

  /**
   * Map Prisma Person with relations to domain entity with relations
   */
  private toWithRelations(data: PrismaPersonWithRelations): PersonWithRelations {
    const person = this.toDomain(data);

    const cases = data.casePeople.map((cp: any) => ({
      caseId: cp.caseId,
      caseNumber: cp.case.caseNumber,
      caseTitle: cp.case.title,
      role: cp.role as PersonType,
      addedAt: new Date(cp.addedAt),
    }));

    return {
      ...person,
      cases,
      casesCount: cases.length,
    } as PersonWithRelations;
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(filters?: PersonFilters): any {
    if (!filters) return {};

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { middleName: { contains: filters.search, mode: "insensitive" } },
        { nationalId: { contains: filters.search, mode: "insensitive" } },
        { aliases: { has: filters.search } },
      ];
    }

    if (filters.nin) {
      where.nationalId = filters.nin;
    }

    if (filters.gender) {
      where.gender = filters.gender;
    }

    if (filters.nationality) {
      where.nationality = filters.nationality;
    }

    if (filters.riskLevel) {
      where.riskLevel = filters.riskLevel;
    }

    if (filters.isWanted !== undefined) {
      where.isWanted = filters.isWanted;
    }

    if (filters.isDeceasedOrMissing !== undefined) {
      where.isDeceasedOrMissing = filters.isDeceasedOrMissing;
    }

    if (filters.stationId) {
      where.createdBy = {
        stationId: filters.stationId,
      };
    }

    if (filters.tribe) {
      where.tribe = filters.tribe;
    }

    if (filters.hasFingerprints !== undefined) {
      where.fingerprintHash = filters.hasFingerprints ? { not: null } : null;
    }

    if (filters.hasBiometrics !== undefined) {
      where.biometricHash = filters.hasBiometrics ? { not: null } : null;
    }

    if (filters.createdBy) {
      where.createdById = filters.createdBy;
    }

    if (filters.createdAfter) {
      where.createdAt = { gte: filters.createdAfter };
    }

    if (filters.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: filters.createdBefore };
    }

    // Age filtering requires calculating from date of birth
    if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
      const today = new Date();

      if (filters.ageMin !== undefined) {
        const maxDob = new Date(
          today.getFullYear() - filters.ageMin,
          today.getMonth(),
          today.getDate()
        );
        where.dob = { lte: maxDob };
      }

      if (filters.ageMax !== undefined) {
        const minDob = new Date(
          today.getFullYear() - filters.ageMax - 1,
          today.getMonth(),
          today.getDate()
        );
        where.dob = { ...where.dob, gte: minDob };
      }
    }

    return where;
  }

  /**
   * Find person by ID
   */
  async findById(id: string): Promise<Person | null> {
    const data = await this.prisma.person.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  /**
   * Find person by NIN
   */
  async findByNIN(nin: string): Promise<Person | null> {
    const data = await this.prisma.person.findUnique({
      where: { nationalId: nin },
    });

    return data ? this.toDomain(data) : null;
  }

  /**
   * Find person by fingerprint hash
   */
  async findByFingerprintHash(hash: string): Promise<Person | null> {
    const data = await this.prisma.person.findFirst({
      where: { fingerprintHash: hash },
    });

    return data ? this.toDomain(data) : null;
  }

  /**
   * Find person by ID with related cases
   */
  async findByIdWithRelations(id: string): Promise<PersonWithRelations | null> {
    const data = await this.prisma.person.findUnique({
      where: { id },
      include: {
        casePeople: {
          include: {
            case: true,
          },
          orderBy: {
            addedAt: "desc",
          },
        },
      },
    } as any);

    return data ? this.toWithRelations(data) : null;
  }

  /**
   * Find all persons matching filters
   */
  async findAll(filters?: PersonFilters, limit = 100, offset = 0): Promise<Person[]> {
    const where = this.buildWhereClause(filters);

    const data = await this.prisma.person.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: "desc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Find persons by case ID
   */
  async findByCaseId(caseId: string): Promise<PersonWithRelations[]> {
    const data = await this.prisma.person.findMany({
      where: {
        casePeople: {
          some: {
            caseId,
          },
        },
      },
      include: {
        casePeople: {
          include: {
            case: true,
          },
        },
      },
    } as any);

    return data.map((d) => this.toWithRelations(d));
  }

  /**
   * Search persons by name or alias
   */
  async searchByName(query: string, limit = 20): Promise<Person[]> {
    const data = await this.prisma.person.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { middleName: { contains: query, mode: "insensitive" } },
          { aliases: { has: query } },
        ],
      } as any,
      take: limit,
      orderBy: [
        { isWanted: "desc" },
        { riskLevel: "desc" },
        { lastName: "asc" },
      ] as any,
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Get wanted persons
   */
  async getWantedPersons(stationId?: string): Promise<Person[]> {
    const where: any = {
      isWanted: true,
      isDeceasedOrMissing: false,
    };

    if (stationId) {
      where.createdBy = {
        stationId: stationId,
      };
    }

    const data = await this.prisma.person.findMany({
      where,
      orderBy: [
        { riskLevel: "desc" },
        { updatedAt: "desc" },
      ] as any,
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Get persons with high risk level
   */
  async getHighRiskPersons(stationId?: string): Promise<Person[]> {
    const where: any = {
      riskLevel: "high",
      isDeceasedOrMissing: false,
    };

    if (stationId) {
      where.createdBy = {
        stationId: stationId,
      };
    }

    const data = await this.prisma.person.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Create a new person
   */
  async create(dto: CreatePersonDto): Promise<Person> {
    const data = await this.prisma.person.create({
      data: {
        nationalId: dto.nin || null,
        countryCode: "SLE", // Default to Sierra Leone (can be made configurable)
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName || null,
        aliases: dto.alias || [],
        dob: dto.dateOfBirth || null,
        gender: dto.gender,
        nationality: dto.nationality || "SLE", // Default to Sierra Leone
        addressEncrypted:
          dto.addresses && dto.addresses.length > 0
            ? encryptPII(JSON.stringify(dto.addresses))
            : null,
        phoneEncrypted:
          dto.phoneNumbers && dto.phoneNumbers.length > 0
            ? encryptPII(JSON.stringify(dto.phoneNumbers))
            : null,
        emailEncrypted:
          dto.emails && dto.emails.length > 0
            ? encryptPII(JSON.stringify(dto.emails))
            : null,
        photoUrl: dto.photoUrl || null,
        fingerprintHash: dto.fingerprintHash || null,
        biometricHash: dto.biometricHash || null,
        riskLevel: dto.riskLevel || null,
        isWanted: dto.isWanted || false,
        isDeceasedOrMissing: dto.isDeceasedOrMissing || false,
        createdById: dto.createdBy,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Update an existing person
   */
  async update(id: string, dto: UpdatePersonDto): Promise<Person> {
    const updateData: any = {};

    // Map DTO fields to Prisma schema fields
    if (dto.nin !== undefined) updateData.nationalId = dto.nin;
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.middleName !== undefined) updateData.middleName = dto.middleName;
    if (dto.alias) updateData.aliases = dto.alias;
    if (dto.dateOfBirth !== undefined) updateData.dob = dto.dateOfBirth;
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.nationality !== undefined) updateData.nationality = dto.nationality;
    if (dto.photoUrl !== undefined) updateData.photoUrl = dto.photoUrl;
    if (dto.addresses)
      updateData.addressEncrypted = encryptPII(JSON.stringify(dto.addresses));
    if (dto.phoneNumbers)
      updateData.phoneEncrypted = encryptPII(JSON.stringify(dto.phoneNumbers));
    if (dto.emails)
      updateData.emailEncrypted = encryptPII(JSON.stringify(dto.emails));
    if (dto.fingerprintHash !== undefined)
      updateData.fingerprintHash = dto.fingerprintHash;
    if (dto.biometricHash !== undefined)
      updateData.biometricHash = dto.biometricHash;
    if (dto.riskLevel !== undefined) updateData.riskLevel = dto.riskLevel;
    if (dto.isWanted !== undefined) updateData.isWanted = dto.isWanted;
    if (dto.isDeceasedOrMissing !== undefined)
      updateData.isDeceasedOrMissing = dto.isDeceasedOrMissing;

    const data = await this.prisma.person.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(data);
  }

  /**
   * Delete a person
   */
  async delete(id: string): Promise<void> {
    await this.prisma.person.delete({
      where: { id },
    });
  }

  /**
   * Mark person as wanted
   */
  async markAsWanted(id: string, updatedBy: string): Promise<Person> {
    const data = await this.prisma.person.update({
      where: { id },
      data: {
        isWanted: true,
        wantedSince: new Date(),
      },
    });

    return this.toDomain(data);
  }

  /**
   * Mark person as deceased or missing
   */
  async markAsDeceasedOrMissing(id: string, updatedBy: string): Promise<Person> {
    const data = await this.prisma.person.update({
      where: { id },
      data: {
        isDeceasedOrMissing: true,
        isWanted: false, // Cannot be wanted if deceased/missing
        wantedSince: null,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Set wanted status for a person
   * Used by AlertService when creating/capturing wanted persons
   */
  async setWantedStatus(
    id: string,
    isWanted: boolean,
    updatedBy: string
  ): Promise<Person> {
    const data = await this.prisma.person.update({
      where: { id },
      data: {
        isWanted,
        wantedSince: isWanted ? new Date() : null,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Update risk level
   */
  async updateRiskLevel(
    id: string,
    riskLevel: "low" | "medium" | "high",
    updatedBy: string
  ): Promise<Person> {
    const data = await this.prisma.person.update({
      where: { id },
      data: {
        riskLevel,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Add alias to person
   */
  async addAlias(id: string, alias: string, updatedBy: string): Promise<Person> {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) {
      throw new Error("Person not found");
    }

    const currentAliases = person.aliases as string[];
    if (currentAliases.includes(alias)) {
      return this.toDomain(person); // Already exists
    }

    const data = await this.prisma.person.update({
      where: { id },
      data: {
        aliases: [...currentAliases, alias],
      },
    });

    return this.toDomain(data);
  }

  /**
   * Remove alias from person
   */
  async removeAlias(id: string, alias: string, updatedBy: string): Promise<Person> {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) {
      throw new Error("Person not found");
    }

    const currentAliases = person.aliases as string[];
    const newAliases = currentAliases.filter((a) => a !== alias);

    const data = await this.prisma.person.update({
      where: { id },
      data: {
        aliases: newAliases,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Count persons matching filters
   */
  async count(filters?: PersonFilters): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.person.count({ where });
  }

  /**
   * Get person statistics
   */
  async getStatistics(stationId?: string): Promise<PersonStatistics> {
    const where: any = stationId
      ? {
          createdBy: {
            stationId: stationId,
          },
        }
      : {};

    const [
      total,
      male,
      female,
      other,
      unknown,
      lowRisk,
      mediumRisk,
      highRisk,
      wanted,
      withFingerprints,
      withBiometrics,
      allPersons,
    ] = await Promise.all([
      this.prisma.person.count({ where }),
      this.prisma.person.count({ where: { ...where, gender: "male" } }),
      this.prisma.person.count({ where: { ...where, gender: "female" } }),
      this.prisma.person.count({ where: { ...where, gender: "other" } }),
      this.prisma.person.count({ where: { ...where, gender: "unknown" } }),
      this.prisma.person.count({ where: { ...where, riskLevel: "low" } }),
      this.prisma.person.count({ where: { ...where, riskLevel: "medium" } }),
      this.prisma.person.count({ where: { ...where, riskLevel: "high" } }),
      this.prisma.person.count({ where: { ...where, isWanted: true } }),
      this.prisma.person.count({ where: { ...where, fingerprintHash: { not: null } } }),
      this.prisma.person.count({ where: { ...where, biometricHash: { not: null } } }),
      this.prisma.person.findMany({
        where,
        select: {
          dob: true,
          nationalId: true,
          nationality: true,
          addressEncrypted: true,
        },
      }),
    ]);

    // Calculate minors and complete ID records
    const today = new Date();
    let minors = 0;
    let withCompleteId = 0;

    allPersons.forEach((person: any) => {
      if (person.dob) {
        const birthDate = new Date(person.dob);
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          minors++;
        }
      }

      if (
        person.nationalId &&
        person.dob &&
        person.nationality &&
        person.addressEncrypted
      ) {
        withCompleteId++;
      }
    });

    return {
      total,
      byGender: {
        male,
        female,
        other,
        unknown,
      },
      byRiskLevel: {
        low: lowRisk,
        medium: mediumRisk,
        high: highRisk,
        unassessed: total - lowRisk - mediumRisk - highRisk,
      },
      wanted,
      withBiometrics: Math.max(withFingerprints, withBiometrics),
      minors,
      withCompleteId,
    };
  }

  /**
   * Check if NIN already exists
   */
  async existsByNIN(nin: string): Promise<boolean> {
    const count = await this.prisma.person.count({
      where: { nationalId: nin },
    });
    return count > 0;
  }

  /**
   * Get persons created by a specific officer
   */
  async findByCreator(officerId: string, limit = 50): Promise<Person[]> {
    const data = await this.prisma.person.findMany({
      where: { createdById: officerId },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Get recently updated persons
   */
  async getRecentlyUpdated(stationId?: string, limit = 20): Promise<Person[]> {
    const where: any = stationId
      ? {
          createdBy: {
            stationId: stationId,
          },
        }
      : {};

    const data = await this.prisma.person.findMany({
      where,
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
    });

    return data.map((d) => this.toDomain(d));
  }

  /**
   * Get persons with incomplete data
   */
  async getIncompleteRecords(threshold = 50, limit = 50): Promise<Person[]> {
    // Fetch persons and calculate completeness in memory
    // Note: In production, this could be optimized with a computed field in the database
    const data = await this.prisma.person.findMany({
      take: limit * 2, // Fetch more to filter
      orderBy: {
        createdAt: "desc",
      },
    });

    const persons = data.map((d) => this.toDomain(d));
    const incomplete = persons.filter(
      (p) => p.getDataCompletenessPercentage() < threshold
    );

    return incomplete.slice(0, limit);
  }
}
