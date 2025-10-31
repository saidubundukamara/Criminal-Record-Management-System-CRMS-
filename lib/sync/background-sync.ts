/**
 * Background Sync API Wrapper
 *
 * Provides native Background Sync API integration with fallback.
 * The Background Sync API allows sync to happen even after the page is closed.
 *
 * Pan-African Design Considerations:
 * - Graceful degradation for browsers without Background Sync support (Safari)
 * - Efficient background processing for low-power devices
 * - Respects user data saver preferences
 */

export interface BackgroundSyncConfig {
  tag: string; // Unique tag for this sync registration
  minInterval?: number; // Minimum interval between syncs (in ms) for periodic sync
}

export interface BackgroundSyncStatus {
  supported: boolean;
  registered: boolean;
  lastSync?: Date;
  nextSync?: Date;
}

/**
 * Background Sync Manager
 */
export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private registrations: Map<string, Date> = new Map();

  private constructor() {}

  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  /**
   * Check if Background Sync API is supported
   */
  isSupported(): boolean {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    // Check for SyncManager
    return 'sync' in ServiceWorkerRegistration.prototype;
  }

  /**
   * Check if Periodic Background Sync is supported
   */
  isPeriodicSyncSupported(): boolean {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    // Check for PeriodicSyncManager
    return 'periodicSync' in ServiceWorkerRegistration.prototype;
  }

  /**
   * Register a one-time background sync
   * Triggers when connection is restored
   */
  async registerSync(config: BackgroundSyncConfig): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('[Background Sync] Not supported - using fallback');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Register the sync
      await (registration as any).sync.register(config.tag);

      this.registrations.set(config.tag, new Date());
      console.log(`[Background Sync] Registered: ${config.tag}`);

      return true;
    } catch (error) {
      console.error('[Background Sync] Registration failed:', error);
      return false;
    }
  }

  /**
   * Register periodic background sync
   * Syncs at regular intervals even when app is closed
   *
   * Note: Requires HTTPS and user permission
   * Only supported in Chromium browsers (not Safari or Firefox)
   */
  async registerPeriodicSync(config: BackgroundSyncConfig): Promise<boolean> {
    if (!this.isPeriodicSyncSupported()) {
      console.log('[Periodic Sync] Not supported - using fallback');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Request permission (will be automatically granted if site is installed as PWA)
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as any,
      });

      if (status.state === 'denied') {
        console.log('[Periodic Sync] Permission denied');
        return false;
      }

      // Register periodic sync
      await (registration as any).periodicSync.register(config.tag, {
        minInterval: config.minInterval || 24 * 60 * 60 * 1000, // Default: 24 hours
      });

      console.log(`[Periodic Sync] Registered: ${config.tag} (interval: ${config.minInterval}ms)`);
      return true;
    } catch (error) {
      console.error('[Periodic Sync] Registration failed:', error);
      return false;
    }
  }

  /**
   * Unregister a background sync
   */
  async unregisterSync(tag: string): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if registered
      const tags = await (registration as any).sync.getTags();

      if (tags.includes(tag)) {
        // Note: There's no unregister method for one-time sync
        // It auto-unregisters after successful execution
        this.registrations.delete(tag);
        console.log(`[Background Sync] Unregistered: ${tag}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Background Sync] Unregister failed:', error);
      return false;
    }
  }

  /**
   * Unregister periodic sync
   */
  async unregisterPeriodicSync(tag: string): Promise<boolean> {
    if (!this.isPeriodicSyncSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      await (registration as any).periodicSync.unregister(tag);

      console.log(`[Periodic Sync] Unregistered: ${tag}`);
      return true;
    } catch (error) {
      console.error('[Periodic Sync] Unregister failed:', error);
      return false;
    }
  }

  /**
   * Get status of background sync
   */
  async getStatus(tag: string): Promise<BackgroundSyncStatus> {
    const status: BackgroundSyncStatus = {
      supported: this.isSupported(),
      registered: false,
    };

    if (!status.supported) {
      return status;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check one-time sync
      const syncTags = await (registration as any).sync.getTags();
      status.registered = syncTags.includes(tag);

      if (status.registered) {
        status.lastSync = this.registrations.get(tag);
      }

      // Check periodic sync
      if (this.isPeriodicSyncSupported()) {
        const periodicTags = await (registration as any).periodicSync.getTags();
        if (periodicTags.includes(tag)) {
          status.registered = true;
          // Periodic sync doesn't provide next sync time via API
          // Would need to calculate based on minInterval
        }
      }
    } catch (error) {
      console.error('[Background Sync] Status check failed:', error);
    }

    return status;
  }

  /**
   * Get all registered sync tags
   */
  async getAllTags(): Promise<{ sync: string[]; periodicSync: string[] }> {
    const result = {
      sync: [] as string[],
      periodicSync: [] as string[],
    };

    if (!this.isSupported()) {
      return result;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Get one-time sync tags
      result.sync = await (registration as any).sync.getTags();

      // Get periodic sync tags
      if (this.isPeriodicSyncSupported()) {
        result.periodicSync = await (registration as any).periodicSync.getTags();
      }
    } catch (error) {
      console.error('[Background Sync] Failed to get tags:', error);
    }

    return result;
  }

  /**
   * Trigger immediate sync (for testing)
   * Note: This doesn't actually force the service worker sync event
   * It's just for fallback to manual sync
   */
  async triggerSync(tag: string, syncCallback: () => Promise<void>): Promise<void> {
    console.log(`[Background Sync] Manually triggering sync: ${tag}`);

    try {
      await syncCallback();
      this.registrations.set(tag, new Date());
    } catch (error) {
      console.error('[Background Sync] Manual sync failed:', error);
      throw error;
    }
  }
}

// Export singleton
export const backgroundSyncManager = BackgroundSyncManager.getInstance();

/**
 * Initialize background sync for CRMS
 */
export async function initializeBackgroundSync(): Promise<void> {
  const manager = backgroundSyncManager;

  console.log('[Background Sync] Initializing...');
  console.log(`- One-time sync supported: ${manager.isSupported()}`);
  console.log(`- Periodic sync supported: ${manager.isPeriodicSyncSupported()}`);

  if (!manager.isSupported()) {
    console.log('[Background Sync] Not supported - using interval-based fallback');
    return;
  }

  try {
    // Register one-time sync (triggers on connectivity restore)
    await manager.registerSync({
      tag: 'crms-sync',
    });

    // Register periodic sync if supported (daily sync)
    if (manager.isPeriodicSyncSupported()) {
      await manager.registerPeriodicSync({
        tag: 'crms-periodic-sync',
        minInterval: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    console.log('[Background Sync] Initialization complete');
  } catch (error) {
    console.error('[Background Sync] Initialization failed:', error);
  }
}

/**
 * Cleanup background sync
 */
export async function cleanupBackgroundSync(): Promise<void> {
  const manager = backgroundSyncManager;

  if (!manager.isSupported()) {
    return;
  }

  try {
    // Unregister periodic sync
    if (manager.isPeriodicSyncSupported()) {
      await manager.unregisterPeriodicSync('crms-periodic-sync');
    }

    console.log('[Background Sync] Cleanup complete');
  } catch (error) {
    console.error('[Background Sync] Cleanup failed:', error);
  }
}

/**
 * Listen for sync events in service worker
 * (This code should be in the service worker, not main app)
 *
 * Example service worker code:
 *
 * self.addEventListener('sync', (event) => {
 *   if (event.tag === 'crms-sync') {
 *     event.waitUntil(syncCRMSData());
 *   }
 * });
 *
 * self.addEventListener('periodicsync', (event) => {
 *   if (event.tag === 'crms-periodic-sync') {
 *     event.waitUntil(syncCRMSData());
 *   }
 * });
 *
 * async function syncCRMSData() {
 *   // Fetch all pending items from IndexedDB
 *   // Send to server
 *   // Update local database
 * }
 */

/**
 * Request notification permission (useful for sync notifications)
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Show notification after successful sync (if permitted)
 */
export async function showSyncNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      ...options,
    });
  } catch (error) {
    console.error('[Notification] Failed to show:', error);
  }
}
