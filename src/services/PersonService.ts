/**
 * Person Service
 *
 * Business logic layer for person management
 * Handles validation, PII encryption, audit logging, and business rules
 */

import {
  IPersonRepository,
  CreatePersonDto,
  UpdatePersonDto,
  PersonFilters,
  PersonWithRelations,
  PersonStatistics,
} from "@/src/domain/interfaces/repositories/IPersonRepository";
import { Person, Gender, EncryptedAddress, PersonType } from "@/src/domain/entities/Person";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";
import { ValidationError, NotFoundError, ForbiddenError } from "@/src/lib/errors";

/**
 * Input for creating a person (service layer)
 */
export interface CreatePersonInput {
  nin?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  alias?: string[];
  dateOfBirth?: string; // ISO string
  gender: Gender;
  nationality?: string;
  placeOfBirth?: string;
  occupation?: string;
  maritalStatus?: string;
  educationLevel?: string;
  tribe?: string;
  religion?: string;
  languagesSpoken?: string[];
  physicalDescription?: string;
  photoUrl?: string;
  addresses?: EncryptedAddress[];
  phoneNumbers?: string[];
  emails?: string[];
  fingerprintHash?: string;
  biometricHash?: string;
  criminalHistory?: string;
  riskLevel?: "low" | "medium" | "high";
  isWanted?: boolean;
  isDeceasedOrMissing?: boolean;
  notes?: string;
  stationId: string;
}

/**
 * Input for updating a person (service layer)
 */
export interface UpdatePersonInput {
  nin?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  alias?: string[];
  dateOfBirth?: string; // ISO string
  gender?: Gender;
  nationality?: string;
  placeOfBirth?: string;
  occupation?: string;
  maritalStatus?: string;
  educationLevel?: string;
  tribe?: string;
  religion?: string;
  languagesSpoken?: string[];
  physicalDescription?: string;
  photoUrl?: string;
  addresses?: EncryptedAddress[];
  phoneNumbers?: string[];
  emails?: string[];
  fingerprintHash?: string;
  biometricHash?: string;
  criminalHistory?: string;
  riskLevel?: "low" | "medium" | "high";
  isWanted?: boolean;
  isDeceasedOrMissing?: boolean;
  notes?: string;
}

/**
 * PersonService class
 */
export class PersonService {
  constructor(
    private readonly personRepo: IPersonRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Validate person data
   */
  private validatePersonData(data: CreatePersonInput | UpdatePersonInput): void {
    // Name validation
    if ("firstName" in data && data.firstName) {
      if (data.firstName.length < 2 || data.firstName.length > 50) {
        throw new ValidationError("First name must be between 2 and 50 characters");
      }
    }

    if ("lastName" in data && data.lastName) {
      if (data.lastName.length < 2 || data.lastName.length > 50) {
        throw new ValidationError("Last name must be between 2 and 50 characters");
      }
    }

    // National ID validation (if provided)
    if ("nin" in data && data.nin) {
      if (!Person.isValidNationalId(data.nin)) {
        throw new ValidationError("Invalid National ID format");
      }
    }

    // Date of birth validation
    if ("dateOfBirth" in data && data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();

      if (age < 0 || age > 150) {
        throw new ValidationError("Invalid date of birth");
      }
    }

    // Gender validation
    if ("gender" in data && data.gender) {
      const validGenders: Gender[] = ["male", "female", "other", "unknown"];
      if (!validGenders.includes(data.gender)) {
        throw new ValidationError("Invalid gender");
      }
    }

    // Phone number validation
    if ("phoneNumbers" in data && data.phoneNumbers) {
      data.phoneNumbers.forEach((phone) => {
        if (!/^\+?[\d\s\-()]+$/.test(phone)) {
          throw new ValidationError(`Invalid phone number format: ${phone}`);
        }
      });
    }

    // Email validation
    if ("emails" in data && data.emails) {
      data.emails.forEach((email) => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new ValidationError(`Invalid email format: ${email}`);
        }
      });
    }

    // Risk level validation
    if ("riskLevel" in data && data.riskLevel) {
      const validRiskLevels = ["low", "medium", "high"];
      if (!validRiskLevels.includes(data.riskLevel)) {
        throw new ValidationError("Invalid risk level");
      }
    }
  }

  /**
   * Get person by ID
   */
  async getPersonById(id: string, requestingOfficerId: string): Promise<Person> {
    const person = await this.personRepo.findById(id);

    if (!person) {
      throw new NotFoundError("Person not found");
    }

    // Audit read operation
    await this.auditRepo.create({
      entityType: "person",
      entityId: id,
      officerId: requestingOfficerId,
      action: "read",
      success: true,
      details: { personName: person.getFullName() },
    });

    return person;
  }

  /**
   * Get person with relations
   */
  async getPersonWithRelations(
    id: string,
    requestingOfficerId: string
  ): Promise<PersonWithRelations> {
    const person = await this.personRepo.findByIdWithRelations(id);

    if (!person) {
      throw new NotFoundError("Person not found");
    }

    // Audit read operation
    await this.auditRepo.create({
      entityType: "person",
      entityId: id,
      officerId: requestingOfficerId,
      action: "read",
      success: true,
      details: { personName: person.getFullName(), casesCount: person.casesCount },
    });

    return person;
  }

  /**
   * Search persons
   */
  async searchPersons(
    filters: PersonFilters,
    requestingOfficerId: string,
    limit = 100,
    offset = 0
  ): Promise<{ persons: Person[]; total: number }> {
    const [persons, total] = await Promise.all([
      this.personRepo.findAll(filters, limit, offset),
      this.personRepo.count(filters),
    ]);

    return { persons, total };
  }

  /**
   * Search by National ID
   */
  async findByNIN(nin: string, requestingOfficerId: string): Promise<Person | null> {
    const person = await this.personRepo.findByNationalId(nin);

    if (person) {
      // Audit National ID search
      await this.auditRepo.create({
        entityType: "person",
        entityId: person.id,
        officerId: requestingOfficerId,
        action: "read",
        success: true,
        details: { searchType: "nationalId", nin },
      });
    }

    return person;
  }

  /**
   * Search by fingerprint
   */
  async findByFingerprint(
    fingerprintHash: string,
    requestingOfficerId: string
  ): Promise<Person | null> {
    const person = await this.personRepo.findByFingerprintHash(fingerprintHash);

    if (person) {
      // Audit fingerprint search
      await this.auditRepo.create({
        entityType: "person",
        entityId: person.id,
        officerId: requestingOfficerId,
        action: "read",
        success: true,
        details: { searchType: "fingerprint" },
      });
    }

    return person;
  }

  /**
   * Create a new person
   */
  async createPerson(
    input: CreatePersonInput,
    createdBy: string,
    ipAddress?: string
  ): Promise<Person> {
    // Validate input
    this.validatePersonData(input);

    // Check for duplicate National ID
    if (input.nin) {
      const existing = await this.personRepo.existsByNationalId(input.nin);
      if (existing) {
        throw new ValidationError(`Person with National ID ${input.nin} already exists`);
      }
    }

    // Prepare DTO
    const dto: CreatePersonDto = {
      nationalId: input.nin || null,
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName || null,
      aliases: input.alias || [],
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender,
      nationality: input.nationality || null,
      placeOfBirth: input.placeOfBirth || null,
      occupation: input.occupation || null,
      maritalStatus: input.maritalStatus || null,
      educationLevel: input.educationLevel || null,
      tribe: input.tribe || null,
      religion: input.religion || null,
      languagesSpoken: input.languagesSpoken || [],
      physicalDescription: input.physicalDescription || null,
      photoUrl: input.photoUrl || null,
      addresses: input.addresses || [],
      phoneNumbers: input.phoneNumbers || [],
      emails: input.emails || [],
      fingerprintHash: input.fingerprintHash || null,
      biometricHash: input.biometricHash || null,
      criminalHistory: input.criminalHistory || null,
      riskLevel: input.riskLevel || null,
      isWanted: input.isWanted || false,
      isDeceasedOrMissing: input.isDeceasedOrMissing || false,
      notes: input.notes || null,
      stationId: input.stationId,
      createdBy,
    };

    // Create person
    const person = await this.personRepo.create(dto);

    // Audit creation
    await this.auditRepo.create({
      entityType: "person",
      entityId: person.id,
      officerId: createdBy,
      action: "create",
      success: true,
      details: {
        personName: person.getFullName(),
        nationalId: person.nationalId,
        hasFingerprints: person.hasBiometricData(),
      },
      ipAddress,
    });

    return person;
  }

  /**
   * Update an existing person
   */
  async updatePerson(
    id: string,
    input: UpdatePersonInput,
    updatedBy: string,
    ipAddress?: string
  ): Promise<Person> {
    // Check if person exists
    const existing = await this.personRepo.findById(id);
    if (!existing) {
      throw new NotFoundError("Person not found");
    }

    // Validate input
    this.validatePersonData(input);

    // Check for duplicate National ID (if changing National ID)
    if (input.nin && input.nin !== existing.nationalId) {
      const nationalIdExists = await this.personRepo.existsByNationalId(input.nin);
      if (nationalIdExists) {
        throw new ValidationError(`Person with National ID ${input.nin} already exists`);
      }
    }

    // Prepare DTO
    const dto: UpdatePersonDto = {
      ...(input.nin !== undefined && { nationalId: input.nin || null }),
      ...(input.firstName && { firstName: input.firstName }),
      ...(input.lastName && { lastName: input.lastName }),
      ...(input.middleName !== undefined && { middleName: input.middleName || null }),
      ...(input.alias && { aliases: input.alias }),
      ...(input.dateOfBirth !== undefined && {
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      }),
      ...(input.gender && { gender: input.gender }),
      ...(input.nationality !== undefined && { nationality: input.nationality || null }),
      ...(input.placeOfBirth !== undefined && { placeOfBirth: input.placeOfBirth || null }),
      ...(input.occupation !== undefined && { occupation: input.occupation || null }),
      ...(input.maritalStatus !== undefined && { maritalStatus: input.maritalStatus || null }),
      ...(input.educationLevel !== undefined && {
        educationLevel: input.educationLevel || null,
      }),
      ...(input.tribe !== undefined && { tribe: input.tribe || null }),
      ...(input.religion !== undefined && { religion: input.religion || null }),
      ...(input.languagesSpoken && { languagesSpoken: input.languagesSpoken }),
      ...(input.physicalDescription !== undefined && {
        physicalDescription: input.physicalDescription || null,
      }),
      ...(input.photoUrl !== undefined && { photoUrl: input.photoUrl || null }),
      ...(input.addresses && { addresses: input.addresses }),
      ...(input.phoneNumbers && { phoneNumbers: input.phoneNumbers }),
      ...(input.emails && { emails: input.emails }),
      ...(input.fingerprintHash !== undefined && {
        fingerprintHash: input.fingerprintHash || null,
      }),
      ...(input.biometricHash !== undefined && { biometricHash: input.biometricHash || null }),
      ...(input.criminalHistory !== undefined && {
        criminalHistory: input.criminalHistory || null,
      }),
      ...(input.riskLevel !== undefined && { riskLevel: input.riskLevel || null }),
      ...(input.isWanted !== undefined && { isWanted: input.isWanted }),
      ...(input.isDeceasedOrMissing !== undefined && {
        isDeceasedOrMissing: input.isDeceasedOrMissing,
      }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
      updatedBy,
    };

    // Update person
    const person = await this.personRepo.update(id, dto);

    // Audit update
    await this.auditRepo.create({
      entityType: "person",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        personName: person.getFullName(),
        updatedFields: Object.keys(input),
      },
      ipAddress,
    });

    return person;
  }

  /**
   * Delete a person
   */
  async deletePerson(id: string, deletedBy: string, ipAddress?: string): Promise<void> {
    // Check if person exists
    const person = await this.personRepo.findById(id);
    if (!person) {
      throw new NotFoundError("Person not found");
    }

    // Check if person is linked to any cases
    const withRelations = await this.personRepo.findByIdWithRelations(id);
    if (withRelations && withRelations.casesCount > 0) {
      throw new ForbiddenError(
        `Cannot delete person linked to ${withRelations.casesCount} case(s)`
      );
    }

    // Delete person
    await this.personRepo.delete(id);

    // Audit deletion
    await this.auditRepo.create({
      entityType: "person",
      entityId: id,
      officerId: deletedBy,
      action: "delete",
      success: true,
      details: {
        personName: person.getFullName(),
        nationalId: person.nationalId,
      },
      ipAddress,
    });
  }

  /**
   * Mark person as wanted
   */
  async markAsWanted(
    id: string,
    updatedBy: string,
    reason?: string,
    ipAddress?: string
  ): Promise<Person> {
    const person = await this.personRepo.findById(id);
    if (!person) {
      throw new NotFoundError("Person not found");
    }

    // Validate using domain logic
    const check = person.canBeMarkedAsWanted();
    if (!check.allowed) {
      throw new ForbiddenError(check.reason!);
    }

    // Mark as wanted
    const updatedPerson = await this.personRepo.markAsWanted(id, updatedBy);

    // Audit
    await this.auditRepo.create({
      entityType: "person",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        personName: person.getFullName(),
        markedAsWanted: true,
        reason,
      },
      ipAddress,
    });

    return updatedPerson;
  }

  /**
   * Update risk level
   */
  async updateRiskLevel(
    id: string,
    riskLevel: "low" | "medium" | "high",
    updatedBy: string,
    reason?: string,
    ipAddress?: string
  ): Promise<Person> {
    const person = await this.personRepo.findById(id);
    if (!person) {
      throw new NotFoundError("Person not found");
    }

    const updatedPerson = await this.personRepo.updateRiskLevel(id, riskLevel, updatedBy);

    // Audit
    await this.auditRepo.create({
      entityType: "person",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        personName: person.getFullName(),
        previousRiskLevel: person.riskLevel,
        newRiskLevel: riskLevel,
        reason,
      },
      ipAddress,
    });

    return updatedPerson;
  }

  /**
   * Add alias
   */
  async addAlias(
    id: string,
    alias: string,
    updatedBy: string,
    ipAddress?: string
  ): Promise<Person> {
    if (!alias || alias.length < 2) {
      throw new ValidationError("Alias must be at least 2 characters");
    }

    const person = await this.personRepo.addAlias(id, alias, updatedBy);

    // Audit
    await this.auditRepo.create({
      entityType: "person",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        personName: person.getFullName(),
        addedAlias: alias,
      },
      ipAddress,
    });

    return person;
  }

  /**
   * Remove alias
   */
  async removeAlias(
    id: string,
    alias: string,
    updatedBy: string,
    ipAddress?: string
  ): Promise<Person> {
    const person = await this.personRepo.removeAlias(id, alias, updatedBy);

    // Audit
    await this.auditRepo.create({
      entityType: "person",
      entityId: id,
      officerId: updatedBy,
      action: "update",
      success: true,
      details: {
        personName: person.getFullName(),
        removedAlias: alias,
      },
      ipAddress,
    });

    return person;
  }

  /**
   * Get wanted persons
   */
  async getWantedPersons(stationId?: string): Promise<Person[]> {
    return this.personRepo.getWantedPersons(stationId);
  }

  /**
   * Get high-risk persons
   */
  async getHighRiskPersons(stationId?: string): Promise<Person[]> {
    return this.personRepo.getHighRiskPersons(stationId);
  }

  /**
   * Get statistics
   */
  async getStatistics(stationId?: string): Promise<PersonStatistics> {
    return this.personRepo.getStatistics(stationId);
  }

  /**
   * Get incomplete records (for data quality monitoring)
   */
  async getIncompleteRecords(threshold = 50, limit = 50): Promise<Person[]> {
    return this.personRepo.getIncompleteRecords(threshold, limit);
  }

  /**
   * Get persons by case
   */
  async getPersonsByCase(caseId: string): Promise<PersonWithRelations[]> {
    return this.personRepo.findByCaseId(caseId);
  }
}
