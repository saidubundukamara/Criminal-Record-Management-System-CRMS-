/**
 * IBackgroundCheckRepository
 *
 * Repository interface for BackgroundCheck entity
 * Defines contract for data access operations
 *
 * Pan-African Design:
 * - NIN field is flexible (works with any national ID system)
 * - Country-agnostic data access layer
 */

import {
  BackgroundCheck,
  BackgroundCheckStatus,
  BackgroundCheckRequestType,
  BackgroundCheckResult,
} from "@/src/domain/entities/BackgroundCheck";

/**
 * DTO for creating a new background check
 */
export interface CreateBackgroundCheckDto {
  nin: string;
  requestedById: string | null; // Null for citizen USSD requests
  requestType: BackgroundCheckRequestType;
  result: BackgroundCheckResult;
  status: BackgroundCheckStatus;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
  certificateUrl?: string | null;
  phoneNumber?: string | null;
  ipAddress?: string | null;
}

/**
 * DTO for updating a background check
 */
export interface UpdateBackgroundCheckDto {
  status?: BackgroundCheckStatus;
  result?: BackgroundCheckResult;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
  certificateUrl?: string | null;
}

/**
 * Filters for querying background checks
 */
export interface BackgroundCheckFilters {
  nin?: string;
  requestedById?: string;
  requestType?: BackgroundCheckRequestType;
  status?: BackgroundCheckStatus;
  phoneNumber?: string;
  hasRecord?: boolean; // Filter by result.status === "record_found"
  fromDate?: Date;
  toDate?: Date;
  isExpired?: boolean;
}

/**
 * Background check statistics
 */
export interface BackgroundCheckStatistics {
  total: number;
  byStatus: Record<BackgroundCheckStatus, number>;
  byRequestType: Record<BackgroundCheckRequestType, number>;
  withRecords: number;
  clear: number;
  pending: number;
  failed: number;
  expired: number;
  last30Days: number;
}

/**
 * BackgroundCheck Repository Interface
 *
 * Defines all data access operations for background checks
 */
export interface IBackgroundCheckRepository {
  /**
   * Find background check by ID
   */
  findById(id: string): Promise<BackgroundCheck | null>;

  /**
   * Find all background checks matching filters
   */
  findAll(
    filters?: BackgroundCheckFilters,
    limit?: number,
    offset?: number
  ): Promise<BackgroundCheck[]>;

  /**
   * Find background checks by NIN
   */
  findByNIN(nin: string, limit?: number): Promise<BackgroundCheck[]>;

  /**
   * Find most recent background check for a NIN
   */
  findMostRecentByNIN(nin: string): Promise<BackgroundCheck | null>;

  /**
   * Find background checks requested by officer
   */
  findByOfficer(
    officerId: string,
    limit?: number,
    offset?: number
  ): Promise<BackgroundCheck[]>;

  /**
   * Find background checks by phone number (USSD requests)
   */
  findByPhoneNumber(
    phoneNumber: string,
    limit?: number
  ): Promise<BackgroundCheck[]>;

  /**
   * Find expired background checks
   */
  findExpired(limit?: number): Promise<BackgroundCheck[]>;

  /**
   * Find background checks expiring soon (within days)
   */
  findExpiringSoon(withinDays?: number, limit?: number): Promise<BackgroundCheck[]>;

  /**
   * Find background checks with criminal records
   */
  findWithRecords(limit?: number, offset?: number): Promise<BackgroundCheck[]>;

  /**
   * Create new background check
   */
  create(data: CreateBackgroundCheckDto): Promise<BackgroundCheck>;

  /**
   * Update background check
   */
  update(id: string, data: UpdateBackgroundCheckDto): Promise<BackgroundCheck>;

  /**
   * Update status
   */
  updateStatus(
    id: string,
    status: BackgroundCheckStatus
  ): Promise<BackgroundCheck>;

  /**
   * Update certificate URL
   */
  updateCertificate(id: string, certificateUrl: string): Promise<BackgroundCheck>;

  /**
   * Delete background check
   */
  delete(id: string): Promise<void>;

  /**
   * Count background checks matching filters
   */
  count(filters?: BackgroundCheckFilters): Promise<number>;

  /**
   * Get statistics
   */
  getStatistics(fromDate?: Date, toDate?: Date): Promise<BackgroundCheckStatistics>;

  /**
   * Check if NIN has been checked recently (within hours)
   */
  hasRecentCheck(nin: string, withinHours?: number): Promise<boolean>;

  /**
   * Get check history for a NIN (for audit trail)
   */
  getCheckHistory(
    nin: string,
    limit?: number
  ): Promise<BackgroundCheck[]>;
}
