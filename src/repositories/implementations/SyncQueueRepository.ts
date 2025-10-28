/**
 * SyncQueue Repository Implementation
 *
 * Handles offline sync queue operations using Prisma
 * Manages pending entries, retry logic, and cleanup
 */
import { BaseRepository } from "../base/BaseRepository";
import {
  ISyncQueueRepository,
  SyncQueueEntry,
  CreateSyncQueueDto,
  UpdateSyncQueueDto,
  EntityType,
  SyncOperation,
  SyncStatus,
} from "@/src/domain/interfaces/repositories/ISyncQueueRepository";

export class SyncQueueRepository extends BaseRepository implements ISyncQueueRepository {
  /**
   * Map Prisma SyncQueue model to domain SyncQueueEntry
   */
  private toDomain(data: any): SyncQueueEntry {
    return {
      id: data.id,
      entityType: data.entityType as EntityType,
      entityId: data.entityId,
      operation: data.operation as SyncOperation,
      payload: data.payload,
      status: data.status as SyncStatus,
      attempts: data.attempts,
      error: data.error,
      createdAt: data.createdAt,
      syncedAt: data.syncedAt,
    };
  }

  /**
   * Find sync queue entry by ID
   */
  async findById(id: string): Promise<SyncQueueEntry | null> {
    const data = await this.prisma.syncQueue.findUnique({
      where: { id },
    });

    if (!data) return null;
    return this.toDomain(data);
  }

  /**
   * Get all pending sync entries
   * Ordered by creation time (FIFO)
   */
  async getPendingEntries(limit?: number): Promise<SyncQueueEntry[]> {
    const data = await this.prisma.syncQueue.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return data.map((entry) => this.toDomain(entry));
  }

  /**
   * Get failed entries that need retry
   * Only returns entries below max attempt threshold
   */
  async getFailedEntries(maxAttempts: number = 3, limit?: number): Promise<SyncQueueEntry[]> {
    const data = await this.prisma.syncQueue.findMany({
      where: {
        status: "failed",
        attempts: { lt: maxAttempts },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return data.map((entry) => this.toDomain(entry));
  }

  /**
   * Get entries by entity (for debugging/tracking)
   */
  async getEntriesByEntity(
    entityType: EntityType,
    entityId: string
  ): Promise<SyncQueueEntry[]> {
    const data = await this.prisma.syncQueue.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((entry) => this.toDomain(entry));
  }

  /**
   * Create a new sync queue entry
   */
  async create(dto: CreateSyncQueueDto): Promise<SyncQueueEntry> {
    const data = await this.prisma.syncQueue.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        operation: dto.operation,
        payload: dto.payload,
        status: "pending",
        attempts: 0,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Update sync queue entry
   */
  async update(id: string, dto: UpdateSyncQueueDto): Promise<SyncQueueEntry> {
    const data = await this.prisma.syncQueue.update({
      where: { id },
      data: {
        status: dto.status,
        attempts: dto.attempts,
        error: dto.error,
        syncedAt: dto.syncedAt,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Mark entry as completed
   */
  async markAsCompleted(id: string): Promise<SyncQueueEntry> {
    const data = await this.prisma.syncQueue.update({
      where: { id },
      data: {
        status: "completed",
        syncedAt: new Date(),
        error: null,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Mark entry as failed with error message
   */
  async markAsFailed(id: string, error: string): Promise<SyncQueueEntry> {
    const entry = await this.prisma.syncQueue.findUnique({ where: { id } });
    if (!entry) {
      throw new Error(`SyncQueue entry ${id} not found`);
    }

    const data = await this.prisma.syncQueue.update({
      where: { id },
      data: {
        status: "failed",
        error,
        attempts: entry.attempts + 1,
      },
    });

    return this.toDomain(data);
  }

  /**
   * Increment retry attempt
   */
  async incrementAttempt(id: string): Promise<SyncQueueEntry> {
    const entry = await this.prisma.syncQueue.findUnique({ where: { id } });
    if (!entry) {
      throw new Error(`SyncQueue entry ${id} not found`);
    }

    const data = await this.prisma.syncQueue.update({
      where: { id },
      data: {
        attempts: entry.attempts + 1,
        status: "pending", // Reset to pending for retry
      },
    });

    return this.toDomain(data);
  }

  /**
   * Delete sync queue entry (after successful sync)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.syncQueue.delete({
      where: { id },
    });
  }

  /**
   * Delete old completed entries (cleanup)
   * Default: entries older than 7 days
   */
  async deleteCompleted(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.syncQueue.deleteMany({
      where: {
        status: "completed",
        syncedAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Count pending entries
   */
  async countPending(): Promise<number> {
    return await this.prisma.syncQueue.count({
      where: { status: "pending" },
    });
  }

  /**
   * Count failed entries
   */
  async countFailed(): Promise<number> {
    return await this.prisma.syncQueue.count({
      where: { status: "failed" },
    });
  }
}
