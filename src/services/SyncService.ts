/**
 * SyncService
 *
 * Orchestrates offline-to-online synchronization
 * Processes sync queue entries and handles conflicts
 */
import {
  ISyncQueueRepository,
  CreateSyncQueueDto,
  EntityType,
  SyncOperation,
  SyncQueueEntry,
} from "@/src/domain/interfaces/repositories/ISyncQueueRepository";
import { IAuditLogRepository } from "@/src/domain/interfaces/repositories/IAuditLogRepository";

export interface QueueSyncInput {
  entityType: EntityType;
  entityId: string;
  operation: SyncOperation;
  payload: any;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: { entryId: string; error: string }[];
}

export interface SyncStats {
  pending: number;
  failed: number;
  lastSyncAt: Date | null;
}

export class SyncService {
  private readonly maxRetries = 3;

  constructor(
    private readonly syncQueueRepo: ISyncQueueRepository,
    private readonly auditRepo: IAuditLogRepository
  ) {}

  /**
   * Queue an offline change for later sync
   */
  async queueChange(input: QueueSyncInput): Promise<SyncQueueEntry> {
    const dto: CreateSyncQueueDto = {
      entityType: input.entityType,
      entityId: input.entityId,
      operation: input.operation,
      payload: input.payload,
    };

    const entry = await this.syncQueueRepo.create(dto);
    return entry;
  }

  /**
   * Process pending sync entries
   * Returns summary of sync results
   */
  async processPendingSync(limit?: number): Promise<SyncResult> {
    const pendingEntries = await this.syncQueueRepo.getPendingEntries(limit);

    if (pendingEntries.length === 0) {
      return {
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      };
    }

    let synced = 0;
    let failed = 0;
    const errors: { entryId: string; error: string }[] = [];

    for (const entry of pendingEntries) {
      try {
        // Mark as processing
        await this.syncQueueRepo.update(entry.id, { status: "processing" });

        // Execute sync operation
        await this.executeSyncOperation(entry);

        // Mark as completed
        await this.syncQueueRepo.markAsCompleted(entry.id);
        synced++;

        // Log successful sync
        await this.auditRepo.create({
          entityType: "syncQueue",
          entityId: entry.id,
          officerId: "system",
          action: "sync",
          success: true,
          details: {
            entityType: entry.entityType,
            entityId: entry.entityId,
            operation: entry.operation,
          },
        });
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
        errors.push({ entryId: entry.id, error: errorMessage });

        // Mark as failed with error
        await this.syncQueueRepo.markAsFailed(entry.id, errorMessage);

        // Log failed sync
        await this.auditRepo.create({
          entityType: "syncQueue",
          entityId: entry.id,
          officerId: "system",
          action: "sync",
          success: false,
          details: {
            entityType: entry.entityType,
            entityId: entry.entityId,
            operation: entry.operation,
            error: errorMessage,
          },
        });
      }
    }

    return {
      success: failed === 0,
      synced,
      failed,
      errors,
    };
  }

  /**
   * Retry failed sync entries
   */
  async retryFailedSync(limit?: number): Promise<SyncResult> {
    const failedEntries = await this.syncQueueRepo.getFailedEntries(this.maxRetries, limit);

    if (failedEntries.length === 0) {
      return {
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      };
    }

    let synced = 0;
    let failed = 0;
    const errors: { entryId: string; error: string }[] = [];

    for (const entry of failedEntries) {
      try {
        // Reset to pending and increment attempt
        await this.syncQueueRepo.incrementAttempt(entry.id);

        // Try to sync again
        await this.executeSyncOperation(entry);

        // Mark as completed
        await this.syncQueueRepo.markAsCompleted(entry.id);
        synced++;
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
        errors.push({ entryId: entry.id, error: errorMessage });

        await this.syncQueueRepo.markAsFailed(entry.id, errorMessage);
      }
    }

    return {
      success: failed === 0,
      synced,
      failed,
      errors,
    };
  }

  /**
   * Execute sync operation based on entity type and operation
   * This is where we call the actual service methods to persist data
   */
  private async executeSyncOperation(entry: SyncQueueEntry): Promise<void> {
    const { entityType, operation, payload } = entry;

    // In a real implementation, we would:
    // 1. Import Case/Person/Evidence services from DI container
    // 2. Call appropriate service methods based on operation
    // 3. Handle conflicts (e.g., entity already exists, version mismatch)

    // For now, we'll implement the structure and placeholders
    switch (entityType) {
      case "case":
        await this.syncCase(operation, payload);
        break;

      case "person":
        await this.syncPerson(operation, payload);
        break;

      case "evidence":
        await this.syncEvidence(operation, payload);
        break;

      case "casePerson":
        await this.syncCasePerson(operation, payload);
        break;

      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  /**
   * Sync case entity
   */
  private async syncCase(operation: SyncOperation, payload: any): Promise<void> {
    // Implementation will call CaseService methods
    // For now, just validate structure
    if (!payload.caseNumber || !payload.title) {
      throw new Error("Invalid case payload: missing required fields");
    }

    switch (operation) {
      case "create":
        // await caseService.createCase(payload, payload.officerId, payload.stationId)
        break;
      case "update":
        // await caseService.updateCase(payload.id, payload, payload.officerId)
        break;
      case "delete":
        // await caseService.deleteCase(payload.id, payload.officerId)
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  /**
   * Sync person entity
   */
  private async syncPerson(operation: SyncOperation, payload: any): Promise<void> {
    if (!payload.nin || !payload.firstName || !payload.lastName) {
      throw new Error("Invalid person payload: missing required fields");
    }

    switch (operation) {
      case "create":
        // await personService.createPerson(payload, payload.createdBy)
        break;
      case "update":
        // await personService.updatePerson(payload.id, payload, payload.updatedBy)
        break;
      case "delete":
        // await personService.deletePerson(payload.id, payload.deletedBy)
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  /**
   * Sync evidence entity
   */
  private async syncEvidence(operation: SyncOperation, payload: any): Promise<void> {
    if (!payload.caseId || !payload.type || !payload.description) {
      throw new Error("Invalid evidence payload: missing required fields");
    }

    switch (operation) {
      case "create":
        // await evidenceService.createEvidence(payload, payload.collectedBy, payload.stationId, payload.officerDetails)
        break;
      case "update":
        // await evidenceService.updateEvidence(payload.id, payload, payload.updatedBy)
        break;
      case "delete":
        // await evidenceService.deleteEvidence(payload.id, payload.deletedBy)
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  /**
   * Sync casePerson relationship
   */
  private async syncCasePerson(operation: SyncOperation, payload: any): Promise<void> {
    if (!payload.caseId || !payload.personId || !payload.role) {
      throw new Error("Invalid casePerson payload: missing required fields");
    }

    switch (operation) {
      case "create":
        // await caseService.addPersonToCase(payload.caseId, payload.personId, payload.role, payload.officerId)
        break;
      case "delete":
        // await caseService.removePersonFromCase(payload.caseId, payload.personId, payload.officerId)
        break;
      default:
        throw new Error(`Unsupported operation: ${operation} for casePerson`);
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<SyncStats> {
    const pending = await this.syncQueueRepo.countPending();
    const failed = await this.syncQueueRepo.countFailed();

    // Get last successful sync timestamp
    const allPending = await this.syncQueueRepo.getPendingEntries(1);
    const lastSyncAt = allPending.length > 0 ? allPending[0].syncedAt : null;

    return {
      pending,
      failed,
      lastSyncAt,
    };
  }

  /**
   * Cleanup old completed sync entries
   */
  async cleanupOldEntries(olderThanDays: number = 7): Promise<number> {
    return await this.syncQueueRepo.deleteCompleted(olderThanDays);
  }

  /**
   * Get entries for specific entity (for debugging)
   */
  async getEntriesByEntity(
    entityType: EntityType,
    entityId: string
  ): Promise<SyncQueueEntry[]> {
    return await this.syncQueueRepo.getEntriesByEntity(entityType, entityId);
  }
}
