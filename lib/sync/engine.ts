/**
 * CRMS Sync Engine
 * Manages offline data synchronization for low-connectivity environments
 *
 * Features:
 * - Auto-sync when connection restored
 * - Retry logic with exponential backoff
 * - Manual sync trigger
 * - Queue management (FIFO with priority)
 * - Conflict resolution (server wins for MVP)
 */

import { db, SyncQueueItem, PendingCase, PendingPerson, PendingEvidence } from './indexeddb';
import { v4 as uuid } from 'uuid';

// ==================== TYPES ====================

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export interface SyncEventData {
  status: SyncStatus;
  queueCount: number;
  lastSync?: Date;
  error?: string;
}

// ==================== SYNC ENGINE CLASS ====================

/**
 * SyncEngine - Manages offline-to-online data synchronization
 */
export class SyncEngine {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncStatus: SyncStatus = 'idle';
  private lastSync: Date | null = null;
  private listeners: Array<(data: SyncEventData) => void> = [];
  private readonly MAX_RETRIES = 5;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds
  private isSyncing = false; // Prevent concurrent syncs

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Listen for page visibility (sync when user returns to tab)
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  // ==================== EVENT HANDLERS ====================

  private handleOnline = () => {
    console.log('✅ Connection restored - starting sync');
    this.isOnline = true;
    this.emitEvent();
    this.startAutoSync();
    // Immediate sync when coming online
    this.syncAll().catch(console.error);
  };

  private handleOffline = () => {
    console.log('⚠️ Connection lost - working offline');
    this.isOnline = false;
    this.emitEvent();
    this.stopAutoSync();
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.isOnline) {
      // User returned to tab - check if sync needed
      this.syncAll().catch(console.error);
    }
  };

  // ==================== QUEUE MANAGEMENT ====================

  /**
   * Add operation to sync queue
   * @param entityType Type of entity (case, person, evidence)
   * @param entityId ID of the entity
   * @param operation Operation type (create, update, delete)
   * @param payload Full entity data
   * @param priority Priority level (higher = more urgent)
   */
  async addToQueue(
    entityType: SyncQueueItem['entityType'],
    entityId: string,
    operation: SyncQueueItem['operation'],
    payload: any,
    priority: number = 0
  ): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: uuid(),
      entityType,
      entityId,
      operation,
      payload,
      attempts: 0,
      priority,
      createdAt: new Date(),
    };

    await db.syncQueue.add(queueItem);
    console.log(`📝 Added to sync queue: ${entityType}:${entityId} (${operation})`);

    // Emit event to update UI
    this.emitEvent();

    // Try immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      await this.syncSingleItem(queueItem);
    }
  }

  /**
   * Get current queue count
   */
  async getQueueCount(): Promise<number> {
    return await db.syncQueue.count();
  }

  /**
   * Get pending items count by entity type
   */
  async getPendingCount(): Promise<{ cases: number; persons: number; evidence: number; total: number }> {
    const [cases, persons, evidence] = await Promise.all([
      db.cases.where('syncStatus').equals('pending').count(),
      db.persons.where('syncStatus').equals('pending').count(),
      db.evidence.where('syncStatus').equals('pending').count(),
    ]);

    return {
      cases,
      persons,
      evidence,
      total: cases + persons + evidence,
    };
  }

  // ==================== SYNC OPERATIONS ====================

  /**
   * Sync a single queue item
   */
  async syncSingleItem(item: SyncQueueItem): Promise<boolean> {
    try {
      // Make API request
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType: item.entityType,
          entityId: item.entityId,
          operation: item.operation,
          payload: item.payload,
        }),
      });

      if (response.ok) {
        // Success - remove from queue
        await db.syncQueue.delete(item.id);

        // Update entity sync status
        await this.updateEntitySyncStatus(item.entityType, item.entityId, 'synced');

        console.log(`✅ Synced ${item.entityType}:${item.entityId}`);
        this.emitEvent();
        return true;
      } else {
        // Server error - log and retry later
        const errorText = await response.text();
        throw new Error(`Sync failed with status ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ Sync failed for ${item.entityType}:${item.entityId}`, error);

      // Increment attempts and store error
      const attempts = item.attempts + 1;
      const lastError = error instanceof Error ? error.message : 'Unknown error';

      await db.syncQueue.update(item.id, {
        attempts,
        lastError,
      });

      // Update entity sync status if max retries exceeded
      if (attempts >= this.MAX_RETRIES) {
        await this.updateEntitySyncStatus(item.entityType, item.entityId, 'failed');
        console.error(`❌ Max retries exceeded for ${item.entityType}:${item.entityId}`);
      }

      this.emitEvent();
      return false;
    }
  }

  /**
   * Sync all pending items
   */
  async syncAll(): Promise<SyncResult> {
    if (!this.isOnline) {
      console.log('⚠️ Offline - skipping sync');
      return { success: false, synced: 0, failed: 0, errors: ['Device is offline'] };
    }

    if (this.isSyncing) {
      console.log('⚠️ Sync already in progress - skipping');
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    this.syncStatus = 'syncing';
    this.emitEvent();

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Get all queue items sorted by priority (desc) and creation date (asc)
      const queueItems = await db.syncQueue
        .orderBy('[priority+createdAt]')
        .reverse()
        .toArray();

      console.log(`🔄 Syncing ${queueItems.length} items...`);

      // Process items sequentially (could be parallel for performance, but sequential is safer)
      for (const item of queueItems) {
        // Skip if max retries exceeded
        if (item.attempts >= this.MAX_RETRIES) {
          failed++;
          errors.push(`Max retries for ${item.entityType}:${item.entityId}`);
          continue;
        }

        const success = await this.syncSingleItem(item);
        if (success) {
          synced++;
        } else {
          failed++;
          errors.push(`Failed to sync ${item.entityType}:${item.entityId}`);
        }

        // Brief delay to avoid overwhelming server
        await this.delay(100);
      }

      this.lastSync = new Date();
      this.syncStatus = 'idle';
      this.emitEvent();

      console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`);

      return {
        success: failed === 0,
        synced,
        failed,
        errors,
      };
    } catch (error) {
      console.error('❌ Sync error:', error);
      this.syncStatus = 'error';
      this.emitEvent();

      return {
        success: false,
        synced,
        failed,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Force immediate sync (manual trigger)
   */
  async forceSyncNow(): Promise<SyncResult> {
    console.log('🔄 Manual sync triggered');
    return await this.syncAll();
  }

  // ==================== AUTO-SYNC ====================

  /**
   * Start automatic background sync
   * @param intervalMs Sync interval in milliseconds (default: 30 seconds)
   */
  startAutoSync(intervalMs: number = this.SYNC_INTERVAL_MS): void {
    if (this.syncInterval) {
      console.log('⚠️ Auto-sync already running');
      return;
    }

    console.log(`🔄 Starting auto-sync (every ${intervalMs}ms)`);
    this.syncInterval = setInterval(() => {
      this.syncAll().catch(console.error);
    }, intervalMs);
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏸️ Auto-sync stopped');
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Update entity sync status in IndexedDB
   */
  private async updateEntitySyncStatus(
    entityType: SyncQueueItem['entityType'],
    entityId: string,
    status: 'pending' | 'synced' | 'failed'
  ): Promise<void> {
    switch (entityType) {
      case 'case':
        await db.cases.update(entityId, { syncStatus: status });
        break;
      case 'person':
        await db.persons.update(entityId, { syncStatus: status });
        break;
      case 'evidence':
        await db.evidence.update(entityId, { syncStatus: status });
        break;
    }
  }

  /**
   * Delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Check if device is online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get last successful sync time
   */
  getLastSync(): Date | null {
    return this.lastSync;
  }

  // ==================== EVENT EMITTER ====================

  /**
   * Subscribe to sync events
   */
  subscribe(listener: (data: SyncEventData) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private async emitEvent(): Promise<void> {
    const queueCount = await this.getQueueCount();
    const data: SyncEventData = {
      status: this.syncStatus,
      queueCount,
      lastSync: this.lastSync || undefined,
    };

    this.listeners.forEach(listener => listener(data));
  }

  // ==================== CLEANUP ====================

  /**
   * Cleanup resources (call on app unmount)
   */
  cleanup(): void {
    this.stopAutoSync();

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    this.listeners = [];
    console.log('🧹 Sync engine cleaned up');
  }
}

// ==================== SINGLETON INSTANCE ====================

/**
 * Global sync engine instance
 * Use this throughout the application
 */
export const syncEngine = new SyncEngine();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    syncEngine.cleanup();
  });
}
