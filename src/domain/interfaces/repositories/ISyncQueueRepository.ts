/**
 * SyncQueue Repository Interface
 *
 * Defines the contract for SyncQueue data access operations
 * Handles offline-to-online sync for Case, Person, Evidence entities
 */

export type EntityType = "case" | "person" | "evidence" | "casePerson" | "evidence";
export type SyncOperation = "create" | "update" | "delete";
export type SyncStatus = "pending" | "processing" | "completed" | "failed";

export interface SyncQueueEntry {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: SyncOperation;
  payload: any; // JSON payload with entity data
  status: SyncStatus;
  attempts: number;
  error: string | null;
  createdAt: Date;
  syncedAt: Date | null;
}

export interface CreateSyncQueueDto {
  entityType: EntityType;
  entityId: string;
  operation: SyncOperation;
  payload: any;
}

export interface UpdateSyncQueueDto {
  status: SyncStatus;
  attempts?: number;
  error?: string | null;
  syncedAt?: Date | null;
}

export interface ISyncQueueRepository {
  /**
   * Find sync queue entry by ID
   */
  findById(id: string): Promise<SyncQueueEntry | null>;

  /**
   * Get all pending sync entries
   */
  getPendingEntries(limit?: number): Promise<SyncQueueEntry[]>;

  /**
   * Get failed entries that need retry
   */
  getFailedEntries(maxAttempts?: number, limit?: number): Promise<SyncQueueEntry[]>;

  /**
   * Get entries by entity
   */
  getEntriesByEntity(entityType: EntityType, entityId: string): Promise<SyncQueueEntry[]>;

  /**
   * Create a new sync queue entry
   */
  create(data: CreateSyncQueueDto): Promise<SyncQueueEntry>;

  /**
   * Update sync queue entry
   */
  update(id: string, data: UpdateSyncQueueDto): Promise<SyncQueueEntry>;

  /**
   * Mark entry as completed
   */
  markAsCompleted(id: string): Promise<SyncQueueEntry>;

  /**
   * Mark entry as failed with error
   */
  markAsFailed(id: string, error: string): Promise<SyncQueueEntry>;

  /**
   * Increment retry attempt
   */
  incrementAttempt(id: string): Promise<SyncQueueEntry>;

  /**
   * Delete sync queue entry (after successful sync)
   */
  delete(id: string): Promise<void>;

  /**
   * Delete old completed entries (cleanup)
   */
  deleteCompleted(olderThanDays?: number): Promise<number>;

  /**
   * Count pending entries
   */
  countPending(): Promise<number>;

  /**
   * Count failed entries
   */
  countFailed(): Promise<number>;
}
