/**
 * Storage Manager
 *
 * Manages IndexedDB storage quotas, cleanup, and optimization.
 * Prevents storage quota exceeded errors on low-end devices.
 *
 * Pan-African Design Considerations:
 * - Aggressive cleanup for devices with limited storage (common in Africa)
 * - User warnings before data loss
 * - Export functionality before cleanup
 * - Efficient storage usage monitoring
 */

export interface StorageEstimate {
  quota: number; // Total available storage (bytes)
  usage: number; // Currently used storage (bytes)
  usagePercent: number; // Usage percentage (0-100)
  available: number; // Available storage (bytes)
}

export interface StorageBreakdown {
  indexedDB: number;
  caches: number;
  serviceWorker: number;
  total: number;
}

export interface CleanupOptions {
  deleteOldCases?: boolean; // Delete cases older than X days
  deleteOldPersons?: boolean; // Delete persons not linked to active cases
  deleteOldEvidence?: boolean; // Delete evidence for closed cases
  daysThreshold?: number; // Age threshold in days
  keepMinimum?: number; // Minimum items to keep regardless of age
}

export interface CleanupResult {
  success: boolean;
  itemsDeleted: number;
  spaceSaved: number; // in bytes
  errors: string[];
}

/**
 * Storage Manager Class
 */
class StorageManagerClass {
  private static instance: StorageManagerClass;
  private warningThreshold = 0.8; // 80% - warn user
  private criticalThreshold = 0.95; // 95% - force cleanup

  private constructor() {}

  static getInstance(): StorageManagerClass {
    if (!StorageManagerClass.instance) {
      StorageManagerClass.instance = new StorageManagerClass();
    }
    return StorageManagerClass.instance;
  }

  /**
   * Get storage estimate
   */
  async getStorageEstimate(): Promise<StorageEstimate> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
      return {
        quota: 0,
        usage: 0,
        usagePercent: 0,
        available: 0,
      };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;
      const available = quota - usage;

      return {
        quota,
        usage,
        usagePercent,
        available,
      };
    } catch (error) {
      console.error('Error getting storage estimate:', error);
      return {
        quota: 0,
        usage: 0,
        usagePercent: 0,
        available: 0,
      };
    }
  }

  /**
   * Get detailed storage breakdown
   */
  async getStorageBreakdown(): Promise<StorageBreakdown> {
    const breakdown: StorageBreakdown = {
      indexedDB: 0,
      caches: 0,
      serviceWorker: 0,
      total: 0,
    };

    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
      return breakdown;
    }

    try {
      const estimate = await navigator.storage.estimate();

      // Type-safe access to usageDetails
      const usageDetails = (estimate as any).usageDetails;

      if (usageDetails) {
        breakdown.indexedDB = usageDetails.indexedDB || 0;
        breakdown.caches = usageDetails.caches || 0;
        breakdown.serviceWorker = usageDetails.serviceWorkerRegistrations || 0;
      }

      breakdown.total = estimate.usage || 0;
    } catch (error) {
      console.error('Error getting storage breakdown:', error);
    }

    return breakdown;
  }

  /**
   * Check if storage is running low
   */
  async isStorageLow(): Promise<{
    low: boolean;
    critical: boolean;
    estimate: StorageEstimate;
  }> {
    const estimate = await this.getStorageEstimate();
    const usageRatio = estimate.usagePercent / 100;

    return {
      low: usageRatio >= this.warningThreshold,
      critical: usageRatio >= this.criticalThreshold,
      estimate,
    };
  }

  /**
   * Request persistent storage (prevents eviction)
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
      return false;
    }

    try {
      const isPersisted = await navigator.storage.persisted();

      if (isPersisted) {
        console.log('[Storage] Already persisted');
        return true;
      }

      const granted = await navigator.storage.persist();

      if (granted) {
        console.log('[Storage] Persistence granted');
      } else {
        console.log('[Storage] Persistence denied');
      }

      return granted;
    } catch (error) {
      console.error('[Storage] Error requesting persistence:', error);
      return false;
    }
  }

  /**
   * Check if storage is persisted
   */
  async isPersisted(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persisted) {
      return false;
    }

    try {
      return await navigator.storage.persisted();
    } catch (error) {
      console.error('[Storage] Error checking persistence:', error);
      return false;
    }
  }

  /**
   * Monitor storage and warn user if low
   */
  async monitorStorage(): Promise<void> {
    const status = await this.isStorageLow();

    if (status.critical) {
      console.error(
        `⚠️ CRITICAL: Storage usage at ${status.estimate.usagePercent.toFixed(1)}%!`
      );

      // Trigger critical storage event
      this.dispatchStorageEvent('critical', status.estimate);
    } else if (status.low) {
      console.warn(
        `⚠️ WARNING: Storage usage at ${status.estimate.usagePercent.toFixed(1)}%`
      );

      // Trigger low storage event
      this.dispatchStorageEvent('low', status.estimate);
    }
  }

  /**
   * Dispatch storage event for UI to handle
   */
  private dispatchStorageEvent(
    type: 'low' | 'critical',
    estimate: StorageEstimate
  ): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('storage-status', {
        detail: { type, estimate },
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Get recommended cleanup size (in bytes)
   */
  async getRecommendedCleanupSize(): Promise<number> {
    const estimate = await this.getStorageEstimate();

    // Recommend cleaning up to get back to 70% usage
    const targetUsage = estimate.quota * 0.7;
    const cleanupNeeded = Math.max(0, estimate.usage - targetUsage);

    return cleanupNeeded;
  }

  /**
   * Perform automated cleanup (called when storage is critical)
   */
  async performAutomatedCleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    console.log('[Storage] Starting automated cleanup...');

    const result: CleanupResult = {
      success: false,
      itemsDeleted: 0,
      spaceSaved: 0,
      errors: [],
    };

    try {
      const { db } = await import('../sync/indexeddb');

      const beforeUsage = await this.getStorageEstimate();

      const defaults: CleanupOptions = {
        deleteOldCases: true,
        deleteOldPersons: false, // Keep persons by default
        deleteOldEvidence: true,
        daysThreshold: options.daysThreshold || 90, // 90 days default
        keepMinimum: options.keepMinimum || 50, // Keep at least 50 items
      };

      const mergedOptions = { ...defaults, ...options };
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (mergedOptions.daysThreshold || 90));

      // Cleanup old synced cases
      if (mergedOptions.deleteOldCases) {
        try {
          const oldCases = await db.cases
            .where('syncStatus')
            .equals('synced')
            .and((caseItem) => {
              const createdAt = new Date(caseItem.createdAt);
              return createdAt < cutoffDate;
            })
            .toArray();

          // Keep minimum number of items
          const casesToDelete = oldCases.slice(0, Math.max(0, oldCases.length - (mergedOptions.keepMinimum || 50)));

          for (const caseItem of casesToDelete) {
            await db.cases.delete(caseItem.id);
            result.itemsDeleted++;
          }

          console.log(`[Storage] Deleted ${casesToDelete.length} old cases`);
        } catch (error) {
          result.errors.push(`Failed to cleanup cases: ${error}`);
        }
      }

      // Cleanup old synced evidence
      if (mergedOptions.deleteOldEvidence) {
        try {
          const oldEvidence = await db.evidence
            .where('syncStatus')
            .equals('synced')
            .and((evidence) => {
              const createdAt = new Date(evidence.createdAt);
              return createdAt < cutoffDate;
            })
            .toArray();

          const evidenceToDelete = oldEvidence.slice(0, Math.max(0, oldEvidence.length - (mergedOptions.keepMinimum || 50)));

          for (const evidence of evidenceToDelete) {
            await db.evidence.delete(evidence.id);
            result.itemsDeleted++;
          }

          console.log(`[Storage] Deleted ${evidenceToDelete.length} old evidence items`);
        } catch (error) {
          result.errors.push(`Failed to cleanup evidence: ${error}`);
        }
      }

      // Calculate space saved
      const afterUsage = await this.getStorageEstimate();
      result.spaceSaved = beforeUsage.usage - afterUsage.usage;
      result.success = result.errors.length === 0;

      console.log(`[Storage] Cleanup complete: ${result.itemsDeleted} items deleted, ${this.formatBytes(result.spaceSaved)} saved`);

      return result;
    } catch (error) {
      console.error('[Storage] Cleanup failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Clear all offline data (emergency cleanup)
   * WARNING: This deletes ALL local data!
   */
  async clearAllData(): Promise<CleanupResult> {
    console.warn('[Storage] EMERGENCY: Clearing all offline data!');

    const result: CleanupResult = {
      success: false,
      itemsDeleted: 0,
      spaceSaved: 0,
      errors: [],
    };

    try {
      const { db } = await import('../sync/indexeddb');
      const beforeUsage = await this.getStorageEstimate();

      // Clear all tables
      await db.cases.clear();
      await db.persons.clear();
      await db.evidence.clear();
      await db.syncQueue.clear();

      result.itemsDeleted = -1; // Indicate "all"

      // Clear caches
      if (typeof caches !== 'undefined') {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Calculate space saved
      const afterUsage = await this.getStorageEstimate();
      result.spaceSaved = beforeUsage.usage - afterUsage.usage;
      result.success = true;

      console.log(`[Storage] All data cleared: ${this.formatBytes(result.spaceSaved)} freed`);

      return result;
    } catch (error) {
      console.error('[Storage] Clear all data failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Start monitoring storage at regular intervals
   */
  startMonitoring(intervalMs: number = 60000): NodeJS.Timeout {
    console.log(`[Storage] Starting monitoring (interval: ${intervalMs}ms)`);

    // Initial check
    this.monitorStorage();

    // Periodic checks
    return setInterval(() => {
      this.monitorStorage();
    }, intervalMs);
  }

  /**
   * Stop monitoring storage
   */
  stopMonitoring(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    console.log('[Storage] Monitoring stopped');
  }
}

// Export singleton
export const storageManager = StorageManagerClass.getInstance();

/**
 * Listen for storage events in UI
 */
export function onStorageEvent(
  callback: (type: 'low' | 'critical', estimate: StorageEstimate) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail.type, customEvent.detail.estimate);
  };

  window.addEventListener('storage-status', handler);

  return () => {
    window.removeEventListener('storage-status', handler);
  };
}
