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
   * Map Prisma Person to domain entity
   */
  private toDomain(data: any): Person {
    return new Person(
      data.id,
      data.nationalId,
      data.firstName,
      data.lastName,
      data.middleName,
      data.aliases as string[],
      data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      data.gender as Gender,
      data.nationality,
      data.placeOfBirth,
      data.occupation,
      data.maritalStatus,
      data.educationLevel,
      data.tribe,
      data.religion,
      data.languagesSpoken as string[],
      data.physicalDescription,
      data.photoUrl,
      data.addresses as EncryptedAddress[],
      data.phoneNumbers as string[],
      data.emails as string[],
      data.fingerprintHash,
      data.biometricHash,
      data.criminalHistory,
      data.riskLevel as "low" | "medium" | "high" | null,
      data.isWanted,
      data.isDeceasedOrMissing,
      data.notes,
      data.stationId,
      data.createdBy,
      data.updatedBy,
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

    if (filters.nationalId) {
      where.nationalId = filters.nationalId;
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
      where.stationId = filters.stationId;
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
      where.createdBy = filters.createdBy;
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
        where.dateOfBirth = { lte: maxDob };
      }

      if (filters.ageMax !== undefined) {
        const minDob = new Date(
          today.getFullYear() - filters.ageMax - 1,
          today.getMonth(),
          today.getDate()
        );
        where.dateOfBirth = { ...where.dateOfBirth, gte: minDob };
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
   * Find person by National ID
   */
  async findByNationalId(nationalId: string): Promise<Person | null> {
    const data = await this.prisma.person.findUnique({
      where: { nationalId } as any,
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
      where.stationId = stationId;
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
      where.stationId = stationId;
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
        nationalId: dto.nationalId || null,
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName || null,
        aliases: dto.aliases || [],
        dateOfBirth: dto.dateOfBirth || null,
        gender: dto.gender,
        nationality: dto.nationality || null,
        placeOfBirth: dto.placeOfBirth || null,
        occupation: dto.occupation || null,
        maritalStatus: dto.maritalStatus || null,
        educationLevel: dto.educationLevel || null,
        tribe: dto.tribe || null,
        religion: dto.religion || null,
        languagesSpoken: dto.languagesSpoken || [],
        physicalDescription: dto.physicalDescription || null,
        photoUrl: dto.photoUrl || null,
        addresses: dto.addresses || [],
        phoneNumbers: dto.phoneNumbers || [],
        emails: dto.emails || [],
        fingerprintHash: dto.fingerprintHash || null,
        biometricHash: dto.biometricHash || null,
        criminalHistory: dto.criminalHistory || null,
        riskLevel: dto.riskLevel || null,
        isWanted: dto.isWanted || false,
        isDeceasedOrMissing: dto.isDeceasedOrMissing || false,
        notes: dto.notes || null,
        stationId: dto.stationId,
        createdBy: dto.createdBy,
      } as any,
    });

    return this.toDomain(data);
  }

  /**
   * Update an existing person
   */
  async update(id: string, dto: UpdatePersonDto): Promise<Person> {
    const data = await this.prisma.person.update({
      where: { id },
      data: {
        ...(dto.nationalId !== undefined && { nationalId: dto.nationalId }),
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.middleName !== undefined && { middleName: dto.middleName }),
        ...(dto.aliases && { aliases: dto.aliases }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth }),
        ...(dto.gender && { gender: dto.gender }),
        ...(dto.nationality !== undefined && { nationality: dto.nationality }),
        ...(dto.placeOfBirth !== undefined && { placeOfBirth: dto.placeOfBirth }),
        ...(dto.occupation !== undefined && { occupation: dto.occupation }),
        ...(dto.maritalStatus !== undefined && { maritalStatus: dto.maritalStatus }),
        ...(dto.educationLevel !== undefined && { educationLevel: dto.educationLevel }),
        ...(dto.tribe !== undefined && { tribe: dto.tribe }),
        ...(dto.religion !== undefined && { religion: dto.religion }),
        ...(dto.languagesSpoken && { languagesSpoken: dto.languagesSpoken }),
        ...(dto.physicalDescription !== undefined && {
          physicalDescription: dto.physicalDescription,
        }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
        ...(dto.addresses && { addresses: dto.addresses }),
        ...(dto.phoneNumbers && { phoneNumbers: dto.phoneNumbers }),
        ...(dto.emails && { emails: dto.emails }),
        ...(dto.fingerprintHash !== undefined && { fingerprintHash: dto.fingerprintHash }),
        ...(dto.biometricHash !== undefined && { biometricHash: dto.biometricHash }),
        ...(dto.criminalHistory !== undefined && { criminalHistory: dto.criminalHistory }),
        ...(dto.riskLevel !== undefined && { riskLevel: dto.riskLevel }),
        ...(dto.isWanted !== undefined && { isWanted: dto.isWanted }),
        ...(dto.isDeceasedOrMissing !== undefined && {
          isDeceasedOrMissing: dto.isDeceasedOrMissing,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedBy: dto.updatedBy,
      } as any,
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
        updatedBy,
      } as any,
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
        updatedBy,
      } as any,
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
        updatedBy,
      } as any,
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
        updatedBy,
      } as any,
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
        updatedBy,
      } as any,
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
        updatedBy,
      } as any,
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
    const where: any = stationId ? { stationId } : {};

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
          dateOfBirth: true,
          nationalId: true,
          nationality: true,
          addresses: true,
        },
      } as any),
    ]);

    // Calculate minors and complete ID records
    const today = new Date();
    let minors = 0;
    let withCompleteId = 0;

    allPersons.forEach((person: any) => {
      if (person.dateOfBirth) {
        const birthDate = new Date(person.dateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          minors++;
        }
      }

      if (
        person.nationalId &&
        person.dateOfBirth &&
        person.nationality &&
        (person.addresses as any[]).length > 0
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
   * Check if National ID already exists
   */
  async existsByNationalId(nationalId: string): Promise<boolean> {
    const count = await this.prisma.person.count({
      where: { nationalId } as any,
    });
    return count > 0;
  }

  /**
   * Get persons created by a specific officer
   */
  async findByCreator(officerId: string, limit = 50): Promise<Person[]> {
    const data = await this.prisma.person.findMany({
      where: { createdBy: officerId } as any,
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
    const where: any = stationId ? { stationId } : {};

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
