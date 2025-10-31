/**
 * IWantedPersonRepository
 *
 * Repository interface for WantedPerson entity
 * Defines contract for data access operations
 *
 * Pan-African Design:
 * - Country-agnostic wanted persons management
 * - Supports regional/cross-border alerts
 * - NIN-based linkage to Person entity
 */

import {
  WantedPerson,
  WantedPersonStatus,
  DangerLevel,
  CriminalCharge,
} from "@/src/domain/entities/WantedPerson";

/**
 * DTO for creating a new Wanted Person
 */
export interface CreateWantedPersonDto {
  personId: string;
  personName: string;
  nin?: string | null;
  charges: CriminalCharge[];
  dangerLevel: DangerLevel;
  status?: WantedPersonStatus;
  warrantNumber: string;
  issuedDate: Date;
  expiresAt?: Date | null;
  lastSeenLocation?: string | null;
  lastSeenDate?: Date | null;
  physicalDescription: string;
  photoUrl?: string | null;
  rewardAmount?: number | null;
  contactPhone: string;
  isRegionalAlert?: boolean;
  createdById: string;
}

/**
 * DTO for updating a Wanted Person
 */
export interface UpdateWantedPersonDto {
  charges?: CriminalCharge[];
  dangerLevel?: DangerLevel;
  lastSeenLocation?: string | null;
  lastSeenDate?: Date | null;
  physicalDescription?: string;
  photoUrl?: string | null;
  rewardAmount?: number | null;
  contactPhone?: string;
  isRegionalAlert?: boolean;
  expiresAt?: Date | null;
}

/**
 * Filters for querying Wanted Persons
 */
export interface WantedPersonFilters {
  status?: WantedPersonStatus;
  dangerLevel?: DangerLevel;
  personId?: string;
  nin?: string;
  createdById?: string;
  isRegionalAlert?: boolean;
  warrantNumber?: string;
  hasReward?: boolean;
  minReward?: number;
  fromDate?: Date;
  toDate?: Date;
  isActive?: boolean;
  isExpired?: boolean;
  chargeCategory?: string; // Filter by charge category
  chargeSeverity?: "minor" | "major" | "critical";
}

/**
 * Wanted Person statistics
 */
export interface WantedPersonStatistics {
  total: number;
  active: number;
  captured: number;
  expired: number;
  byDangerLevel: Record<DangerLevel, number>;
  withRewards: number;
  regionalAlerts: number;
  last30Days: number;
  averageDaysToCapture: number | null;
  totalRewardAmount: number;
}

/**
 * Wanted Person with Person details
 */
export interface WantedPersonWithPerson {
  wantedPerson: WantedPerson;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    nin: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    nationality: string | null;
  };
}

/**
 * WantedPerson Repository Interface
 *
 * Defines all data access operations for Wanted Persons
 */
export interface IWantedPersonRepository {
  /**
   * Find Wanted Person by ID
   */
  findById(id: string): Promise<WantedPerson | null>;

  /**
   * Find Wanted Person with Person details
   */
  findByIdWithPerson(id: string): Promise<WantedPersonWithPerson | null>;

  /**
   * Find all Wanted Persons matching filters
   */
  findAll(
    filters?: WantedPersonFilters,
    limit?: number,
    offset?: number
  ): Promise<WantedPerson[]>;

  /**
   * Find active wanted persons (status = active, not expired)
   */
  findActive(limit?: number): Promise<WantedPerson[]>;

  /**
   * Find by status
   */
  findByStatus(
    status: WantedPersonStatus,
    limit?: number,
    offset?: number
  ): Promise<WantedPerson[]>;

  /**
   * Find by danger level
   */
  findByDangerLevel(
    dangerLevel: DangerLevel,
    limit?: number
  ): Promise<WantedPerson[]>;

  /**
   * Find by Person ID
   */
  findByPersonId(personId: string): Promise<WantedPerson[]>;

  /**
   * Find by NIN
   */
  findByNIN(nin: string): Promise<WantedPerson[]>;

  /**
   * Find by warrant number
   */
  findByWarrantNumber(warrantNumber: string): Promise<WantedPerson | null>;

  /**
   * Find regional alerts (cross-border)
   */
  findRegionalAlerts(limit?: number): Promise<WantedPerson[]>;

  /**
   * Find wanted persons with rewards
   */
  findWithRewards(limit?: number): Promise<WantedPerson[]>;

  /**
   * Find expired wanted persons
   */
  findExpired(limit?: number): Promise<WantedPerson[]>;

  /**
   * Find wanted persons expiring soon (within days)
   */
  findExpiringSoon(withinDays?: number, limit?: number): Promise<WantedPerson[]>;

  /**
   * Find recently captured (within days)
   */
  findRecentlyCaptured(withinDays?: number, limit?: number): Promise<WantedPerson[]>;

  /**
   * Find high priority (sorted by priority score)
   */
  findHighPriority(limit?: number): Promise<WantedPerson[]>;

  /**
   * Search by name (fuzzy search)
   */
  searchByName(name: string, limit?: number): Promise<WantedPerson[]>;

  /**
   * Create new Wanted Person
   */
  create(data: CreateWantedPersonDto): Promise<WantedPerson>;

  /**
   * Update Wanted Person
   */
  update(id: string, data: UpdateWantedPersonDto): Promise<WantedPerson>;

  /**
   * Update status
   */
  updateStatus(
    id: string,
    status: WantedPersonStatus
  ): Promise<WantedPerson>;

  /**
   * Mark as captured
   */
  markCaptured(id: string): Promise<WantedPerson>;

  /**
   * Expire warrant
   */
  expireWarrant(id: string): Promise<WantedPerson>;

  /**
   * Update last seen information
   */
  updateLastSeen(
    id: string,
    location: string,
    date: Date
  ): Promise<WantedPerson>;

  /**
   * Delete Wanted Person
   */
  delete(id: string): Promise<void>;

  /**
   * Count wanted persons matching filters
   */
  count(filters?: WantedPersonFilters): Promise<number>;

  /**
   * Get statistics
   */
  getStatistics(fromDate?: Date, toDate?: Date): Promise<WantedPersonStatistics>;

  /**
   * Get wanted persons that should be auto-expired
   */
  findShouldAutoExpire(maxDaysActive?: number): Promise<WantedPerson[]>;

  /**
   * Bulk expire warrants
   */
  bulkExpire(ids: string[]): Promise<number>;

  /**
   * Check if person is wanted (by Person ID)
   */
  isPersonWanted(personId: string): Promise<boolean>;

  /**
   * Get active wanted count for Person
   */
  getActiveWantedCount(personId: string): Promise<number>;
}
