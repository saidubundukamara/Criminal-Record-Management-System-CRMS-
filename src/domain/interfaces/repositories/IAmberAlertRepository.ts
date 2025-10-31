/**
 * IAmberAlertRepository
 *
 * Repository interface for AmberAlert entity
 * Defines contract for data access operations
 *
 * Pan-African Design:
 * - Country-agnostic alert management
 * - Supports multi-language descriptions
 * - USSD-compatible queries
 */

import {
  AmberAlert,
  AmberAlertStatus,
  Gender,
} from "@/src/domain/entities/AmberAlert";

/**
 * DTO for creating a new Amber Alert
 */
export interface CreateAmberAlertDto {
  personName: string;
  age: number | null;
  gender: Gender | null;
  description: string;
  photoUrl?: string | null;
  lastSeenLocation?: string | null;
  lastSeenDate?: Date | null;
  contactPhone: string;
  status?: AmberAlertStatus;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
  createdById: string;
}

/**
 * DTO for updating an Amber Alert
 */
export interface UpdateAmberAlertDto {
  personName?: string;
  age?: number | null;
  gender?: Gender | null;
  description?: string;
  photoUrl?: string | null;
  lastSeenLocation?: string | null;
  lastSeenDate?: Date | null;
  contactPhone?: string;
}

/**
 * Filters for querying Amber Alerts
 */
export interface AmberAlertFilters {
  status?: AmberAlertStatus;
  createdById?: string;
  gender?: Gender | null;
  minAge?: number;
  maxAge?: number;
  fromDate?: Date;
  toDate?: Date;
  isActive?: boolean;
  isExpired?: boolean;
  urgencyLevel?: "critical" | "high" | "medium";
}

/**
 * Amber Alert statistics
 */
export interface AmberAlertStatistics {
  total: number;
  active: number;
  found: number;
  expired: number;
  last30Days: number;
  byUrgency: {
    critical: number;
    high: number;
    medium: number;
  };
  averageDaysToResolution: number | null;
}

/**
 * AmberAlert Repository Interface
 *
 * Defines all data access operations for Amber Alerts
 */
export interface IAmberAlertRepository {
  /**
   * Find Amber Alert by ID
   */
  findById(id: string): Promise<AmberAlert | null>;

  /**
   * Find all Amber Alerts matching filters
   */
  findAll(
    filters?: AmberAlertFilters,
    limit?: number,
    offset?: number
  ): Promise<AmberAlert[]>;

  /**
   * Find active alerts (not expired, status = active)
   */
  findActive(limit?: number): Promise<AmberAlert[]>;

  /**
   * Find alerts by status
   */
  findByStatus(
    status: AmberAlertStatus,
    limit?: number,
    offset?: number
  ): Promise<AmberAlert[]>;

  /**
   * Find alerts created by officer
   */
  findByOfficer(
    officerId: string,
    limit?: number,
    offset?: number
  ): Promise<AmberAlert[]>;

  /**
   * Find expired alerts
   */
  findExpired(limit?: number): Promise<AmberAlert[]>;

  /**
   * Find alerts expiring soon (within days)
   */
  findExpiringSoon(withinDays?: number, limit?: number): Promise<AmberAlert[]>;

  /**
   * Find critical/urgent alerts (first 48 hours)
   */
  findCritical(limit?: number): Promise<AmberAlert[]>;

  /**
   * Find recently resolved alerts (found in last N days)
   */
  findRecentlyResolved(withinDays?: number, limit?: number): Promise<AmberAlert[]>;

  /**
   * Search alerts by name (fuzzy search)
   */
  searchByName(name: string, limit?: number): Promise<AmberAlert[]>;

  /**
   * Create new Amber Alert
   */
  create(data: CreateAmberAlertDto): Promise<AmberAlert>;

  /**
   * Update Amber Alert
   */
  update(id: string, data: UpdateAmberAlertDto): Promise<AmberAlert>;

  /**
   * Update alert status
   */
  updateStatus(
    id: string,
    status: AmberAlertStatus
  ): Promise<AmberAlert>;

  /**
   * Publish/activate an alert
   */
  publishAlert(id: string): Promise<AmberAlert>;

  /**
   * Resolve alert (mark as found)
   */
  resolveAlert(id: string): Promise<AmberAlert>;

  /**
   * Expire alert
   */
  expireAlert(id: string): Promise<AmberAlert>;

  /**
   * Delete Amber Alert
   */
  delete(id: string): Promise<void>;

  /**
   * Count alerts matching filters
   */
  count(filters?: AmberAlertFilters): Promise<number>;

  /**
   * Get statistics
   */
  getStatistics(fromDate?: Date, toDate?: Date): Promise<AmberAlertStatistics>;

  /**
   * Get alerts that should be auto-expired
   */
  findShouldAutoExpire(maxDaysActive?: number): Promise<AmberAlert[]>;

  /**
   * Bulk expire alerts
   */
  bulkExpire(ids: string[]): Promise<number>;
}
