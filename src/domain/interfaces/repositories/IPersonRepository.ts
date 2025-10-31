/**
 * Person Repository Interface
 *
 * Defines the contract for Person data access operations
 * Implementations will handle Prisma operations and entity mapping
 */

import { Person, Gender, EncryptedAddress, PersonType } from "@/src/domain/entities/Person";

/**
 * DTO for creating a new person
 */
export interface CreatePersonDto {
  nin?: string | null;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  alias?: string[];
  dateOfBirth?: Date | null;
  gender: Gender;
  nationality?: string | null;
  placeOfBirth?: string | null;
  occupation?: string | null;
  maritalStatus?: string | null;
  educationLevel?: string | null;
  tribe?: string | null;
  religion?: string | null;
  languagesSpoken?: string[];
  physicalDescription?: string | null;
  photoUrl?: string | null;
  addresses?: EncryptedAddress[];
  phoneNumbers?: string[];
  emails?: string[];
  fingerprintHash?: string | null;
  biometricHash?: string | null;
  criminalHistory?: string | null;
  riskLevel?: "low" | "medium" | "high" | null;
  isWanted?: boolean;
  isDeceasedOrMissing?: boolean;
  notes?: string | null;
  stationId: string;
  createdBy: string;
}

/**
 * DTO for updating an existing person
 */
export interface UpdatePersonDto {
  nin?: string | null;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  alias?: string[];
  dateOfBirth?: Date | null;
  gender?: Gender;
  nationality?: string | null;
  placeOfBirth?: string | null;
  occupation?: string | null;
  maritalStatus?: string | null;
  educationLevel?: string | null;
  tribe?: string | null;
  religion?: string | null;
  languagesSpoken?: string[];
  physicalDescription?: string | null;
  photoUrl?: string | null;
  addresses?: EncryptedAddress[];
  phoneNumbers?: string[];
  emails?: string[];
  fingerprintHash?: string | null;
  biometricHash?: string | null;
  criminalHistory?: string | null;
  riskLevel?: "low" | "medium" | "high" | null;
  isWanted?: boolean;
  isDeceasedOrMissing?: boolean;
  notes?: string | null;
  updatedBy: string;
}

/**
 * Filters for searching persons
 */
export interface PersonFilters {
  search?: string; // Search by name, NIN, alias
  nin?: string;
  gender?: Gender;
  nationality?: string;
  ageMin?: number;
  ageMax?: number;
  riskLevel?: "low" | "medium" | "high";
  isWanted?: boolean;
  isDeceasedOrMissing?: boolean;
  stationId?: string;
  tribe?: string;
  hasFingerprints?: boolean;
  hasBiometrics?: boolean;
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Person with related case information
 */
export interface PersonWithRelations extends Person {
  cases: {
    caseId: string;
    caseNumber: string;
    caseTitle: string;
    role: PersonType;
    addedAt: Date;
  }[];
  casesCount: number;
}

/**
 * Statistics for persons
 */
export interface PersonStatistics {
  total: number;
  byGender: {
    male: number;
    female: number;
    other: number;
    unknown: number;
  };
  byRiskLevel: {
    low: number;
    medium: number;
    high: number;
    unassessed: number;
  };
  wanted: number;
  withBiometrics: number;
  minors: number;
  withCompleteId: number;
}

/**
 * Person Repository Interface
 */
export interface IPersonRepository {
  /**
   * Find person by ID
   */
  findById(id: string): Promise<Person | null>;

  /**
   * Find person by NIN (National Identification Number)
   */
  findByNIN(nin: string): Promise<Person | null>;

  /**
   * Find person by fingerprint hash
   */
  findByFingerprintHash(hash: string): Promise<Person | null>;

  /**
   * Find person by ID with related cases
   */
  findByIdWithRelations(id: string): Promise<PersonWithRelations | null>;

  /**
   * Find all persons matching filters
   */
  findAll(filters?: PersonFilters, limit?: number, offset?: number): Promise<Person[]>;

  /**
   * Find persons by case ID
   */
  findByCaseId(caseId: string): Promise<PersonWithRelations[]>;

  /**
   * Search persons by name or alias (full-text search)
   */
  searchByName(query: string, limit?: number): Promise<Person[]>;

  /**
   * Get wanted persons
   */
  getWantedPersons(stationId?: string): Promise<Person[]>;

  /**
   * Get persons with high risk level
   */
  getHighRiskPersons(stationId?: string): Promise<Person[]>;

  /**
   * Create a new person
   */
  create(data: CreatePersonDto): Promise<Person>;

  /**
   * Update an existing person
   */
  update(id: string, data: UpdatePersonDto): Promise<Person>;

  /**
   * Delete a person (soft delete recommended)
   */
  delete(id: string): Promise<void>;

  /**
   * Mark person as wanted
   */
  markAsWanted(id: string, updatedBy: string): Promise<Person>;

  /**
   * Mark person as deceased or missing
   */
  markAsDeceasedOrMissing(id: string, updatedBy: string): Promise<Person>;

  /**
   * Set wanted status for a person (used by AlertService)
   * More flexible than markAsWanted - can set true or false
   */
  setWantedStatus(
    id: string,
    isWanted: boolean,
    updatedBy: string
  ): Promise<Person>;

  /**
   * Update risk level
   */
  updateRiskLevel(
    id: string,
    riskLevel: "low" | "medium" | "high",
    updatedBy: string
  ): Promise<Person>;

  /**
   * Add alias to person
   */
  addAlias(id: string, alias: string, updatedBy: string): Promise<Person>;

  /**
   * Remove alias from person
   */
  removeAlias(id: string, alias: string, updatedBy: string): Promise<Person>;

  /**
   * Count persons matching filters
   */
  count(filters?: PersonFilters): Promise<number>;

  /**
   * Get person statistics
   */
  getStatistics(stationId?: string): Promise<PersonStatistics>;

  /**
   * Check if NIN already exists (for validation)
   */
  existsByNIN(nin: string): Promise<boolean>;

  /**
   * Get persons created by a specific officer
   */
  findByCreator(officerId: string, limit?: number): Promise<Person[]>;

  /**
   * Get recently updated persons
   */
  getRecentlyUpdated(stationId?: string, limit?: number): Promise<Person[]>;

  /**
   * Get persons with incomplete data (for data quality monitoring)
   */
  getIncompleteRecords(threshold?: number, limit?: number): Promise<Person[]>;
}
