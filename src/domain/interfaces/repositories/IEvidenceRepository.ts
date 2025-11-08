/**
 * Evidence Repository Interface
 *
 * Defines the contract for Evidence data access operations
 * Implementations will handle Prisma operations and entity mapping
 */

import { Evidence, EvidenceType, EvidenceStatus, CustodyEvent } from "@/src/domain/entities/Evidence";

/**
 * DTO for creating new evidence
 */
export interface CreateEvidenceDto {
  qrCode: string; // Generated unique QR code
  caseId: string;
  type: EvidenceType;
  description: string;
  status: EvidenceStatus;
  collectedDate: Date;
  collectedLocation: string;
  collectedBy: string;
  fileUrl?: string | null;
  fileKey?: string | null; // S3 key for file operations
  fileName?: string | null;
  fileSize?: number | null;
  fileMimeType?: string | null;
  fileHash?: string | null;
  storageLocation?: string | null;
  chainOfCustody: CustodyEvent[];
  tags?: string[];
  notes?: string | null;
  isSealed?: boolean;
  sealedAt?: Date | null;
  sealedBy?: string | null;
  stationId: string;
}

/**
 * DTO for updating evidence
 */
export interface UpdateEvidenceDto {
  type?: EvidenceType;
  description?: string;
  collectedLocation?: string | null;
  status?: EvidenceStatus;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileMimeType?: string | null;
  fileHash?: string | null;
  storageLocation?: string | null;
  tags?: string[];
  notes?: string | null;
  isSealed?: boolean;
  sealedAt?: Date | null;
  sealedBy?: string | null;
}

/**
 * Filters for searching evidence
 */
export interface EvidenceFilters {
  search?: string; // Search by description, QR code
  caseId?: string;
  type?: EvidenceType;
  status?: EvidenceStatus;
  collectedBy?: string;
  isSealed?: boolean;
  isDigital?: boolean; // Has file attached
  stationId?: string;
  tags?: string[]; // Filter by tags
  collectedAfter?: Date;
  collectedBefore?: Date;
  collectedLocation?: string;
}

/**
 * Evidence with case information
 */
export interface EvidenceWithCase extends Evidence {
  case: {
    caseNumber: string;
    title: string;
    status: string;
  };
}

/**
 * Evidence statistics
 */
export interface EvidenceStatistics {
  total: number;
  byType: Record<EvidenceType, number>;
  byStatus: Record<EvidenceStatus, number>;
  sealed: number;
  digital: number;
  physical: number;
  stale: number;
  critical: number;
  totalFileSize: number; // In bytes
}

/**
 * Evidence Repository Interface
 */
export interface IEvidenceRepository {
  /**
   * Find evidence by ID
   */
  findById(id: string): Promise<Evidence | null>;

  /**
   * Find evidence by QR code
   */
  findByQRCode(qrCode: string): Promise<Evidence | null>;

  /**
   * Find evidence by ID with case information
   */
  findByIdWithCase(id: string): Promise<EvidenceWithCase | null>;

  /**
   * Find all evidence matching filters
   */
  findAll(filters?: EvidenceFilters, limit?: number, offset?: number): Promise<Evidence[]>;

  /**
   * Find evidence by case ID
   */
  findByCaseId(caseId: string): Promise<Evidence[]>;

  /**
   * Find evidence by officer (collected by)
   */
  findByOfficer(officerId: string, limit?: number): Promise<Evidence[]>;

  /**
   * Search evidence by description or QR code
   */
  search(query: string, limit?: number): Promise<Evidence[]>;

  /**
   * Get stale evidence (old and not in court/destroyed)
   */
  getStaleEvidence(maxDays?: number, stationId?: string): Promise<Evidence[]>;

  /**
   * Get evidence ready for destruction (retention period passed)
   */
  getDestroyableEvidence(retentionDays?: number, stationId?: string): Promise<Evidence[]>;

  /**
   * Get critical evidence (biological, high-value, weapons)
   */
  getCriticalEvidence(stationId?: string): Promise<Evidence[]>;

  /**
   * Create new evidence
   */
  create(data: CreateEvidenceDto): Promise<Evidence>;

  /**
   * Update existing evidence
   */
  update(id: string, data: UpdateEvidenceDto): Promise<Evidence>;

  /**
   * Delete evidence
   */
  delete(id: string): Promise<void>;

  /**
   * Update evidence status
   */
  updateStatus(id: string, status: EvidenceStatus): Promise<Evidence>;

  /**
   * Add custody event to chain
   */
  addCustodyEvent(id: string, event: CustodyEvent): Promise<Evidence>;

  /**
   * Seal evidence (mark as tamper-evident)
   */
  sealEvidence(id: string, sealedBy: string): Promise<Evidence>;

  /**
   * Add tag to evidence
   */
  addTag(id: string, tag: string): Promise<Evidence>;

  /**
   * Remove tag from evidence
   */
  removeTag(id: string, tag: string): Promise<Evidence>;

  /**
   * Count evidence matching filters
   */
  count(filters?: EvidenceFilters): Promise<number>;

  /**
   * Get evidence statistics
   */
  getStatistics(stationId?: string): Promise<EvidenceStatistics>;

  /**
   * Check if QR code already exists
   */
  existsByQRCode(qrCode: string): Promise<boolean>;

  /**
   * Generate unique QR code
   */
  generateQRCode(stationCode: string): Promise<string>;

  /**
   * Get evidence by file hash (for duplicate detection)
   */
  findByFileHash(fileHash: string): Promise<Evidence[]>;

  /**
   * Get recently added evidence
   */
  getRecentlyAdded(stationId?: string, limit?: number): Promise<Evidence[]>;

  /**
   * Get evidence by storage location
   */
  findByStorageLocation(location: string): Promise<Evidence[]>;
}
