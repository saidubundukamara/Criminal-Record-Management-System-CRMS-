/**
 * Service Worker Registration Hook
 * 
 * Handles service worker registration, updates, and lifecycle events.
 * Integrates with background sync and storage management.
 * 
 * Pan-African Design:
 * - Progressive enhancement (works without SW support)
 * - Automatic update detection
 * - Background sync integration for offline changes
 * - Storage permission for data persistence
 */

"use client";

import { useEffect, useState, useCallback } from 'react';
import { 
  initializeBackgroundSync, 
  backgroundSyncManager 
} from '@/lib/sync/background-sync';
import { storageManager } from '@/lib/db/storage-manager';

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isInstalling: boolean;
  registration: ServiceWorkerRegistration | null;
}

export interface ServiceWorkerHookResult {
  status: ServiceWorkerStatus;
  updateServiceWorker: () => Promise<void>;
  unregister: () => Promise<void>;
}

/**
 * Custom hook for service worker management
 */
export function useServiceWorker(): ServiceWorkerHookResult {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    isInstalling: false,
    registration: null,
  });

  /**
   * Register service worker
   */
  const registerServiceWorker = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[Service Worker] Not supported in this browser');
      return;
    }

    try {
      console.log('[Service Worker] Starting registration...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[Service Worker] Registered successfully');

      setStatus((prev) => ({
        ...prev,
        isSupported: true,
        isRegistered: true,
        registration,
      }));

      // Check for updates immediately
      await registration.update();

      // Setup update listeners
      registration.addEventListener('updatefound', () => {
        console.log('[Service Worker] Update found');
        const newWorker = registration.installing;

        if (newWorker) {
          setStatus((prev) => ({ ...prev, isInstalling: true }));

          newWorker.addEventListener('statechange', () => {
            console.log(`[Service Worker] State changed to: ${newWorker.state}`);

            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed, update available
              console.log('[Service Worker] Update available');
              setStatus((prev) => ({
                ...prev,
                isUpdateAvailable: true,
                isInstalling: false,
              }));

              // Dispatch custom event for UI to handle
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }

            if (newWorker.state === 'activated') {
              setStatus((prev) => ({ ...prev, isInstalling: false }));
            }
          });
        }
      });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[Service Worker] Controller changed - reloading');
        window.location.reload();
      });

      // Initialize background sync after registration
      await initializeBackgroundSync();

      // Request persistent storage
      const isPersisted = await storageManager.requestPersistentStorage();
      console.log(`[Storage] Persistence: ${isPersisted ? 'granted' : 'denied'}`);

    } catch (error) {
      // Handle missing sw.js gracefully (common in dev mode)
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('404') || errorMessage.includes('bad HTTP response')) {
        console.warn(
          '[Service Worker] sw.js not found - PWA features disabled.\n' +
          'This is expected in development mode unless ENABLE_PWA_DEV=true.\n' +
          'For production, run "npm run build" to generate service worker.'
        );
      } else {
        console.error('[Service Worker] Registration failed:', error);
      }
      
      setStatus((prev) => ({
        ...prev,
        isSupported: true,
        isRegistered: false,
      }));
    }
  }, []);

  /**
   * Update service worker (skip waiting)
   */
  const updateServiceWorker = useCallback(async () => {
    if (!status.registration) {
      console.log('[Service Worker] No registration found');
      return;
    }

    const waiting = status.registration.waiting;

    if (waiting) {
      console.log('[Service Worker] Activating update...');
      
      // Tell the waiting service worker to skip waiting
      waiting.postMessage({ type: 'SKIP_WAITING' });

      // The page will reload via controllerchange event
    } else {
      console.log('[Service Worker] No update waiting');
      // Try to check for updates
      await status.registration.update();
    }
  }, [status.registration]);

  /**
   * Unregister service worker (for development/testing)
   */
  const unregister = useCallback(async () => {
    if (!status.registration) {
      return;
    }

    try {
      const success = await status.registration.unregister();
      if (success) {
        console.log('[Service Worker] Unregistered successfully');
        setStatus({
          isSupported: true,
          isRegistered: false,
          isUpdateAvailable: false,
          isInstalling: false,
          registration: null,
        });
      }
    } catch (error) {
      console.error('[Service Worker] Unregister failed:', error);
    }
  }, [status.registration]);

  /**
   * Register on mount
   */
  useEffect(() => {
    // Only register in production or when explicitly enabled
    const shouldRegister = 
      process.env.NODE_ENV === 'production' || 
      process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

    if (shouldRegister) {
      // Delay registration to avoid blocking initial page load
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);
        return () => window.removeEventListener('load', registerServiceWorker);
      }
    } else {
      console.log('[Service Worker] Registration disabled in development');
      setStatus((prev) => ({ ...prev, isSupported: true }));
    }
  }, [registerServiceWorker]);

  /**
   * Setup online/offline listeners
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Online - triggering sync');
      
      // Trigger background sync if supported
      if (backgroundSyncManager.isSupported()) {
        backgroundSyncManager.registerSync({ tag: 'crms-sync' });
      }
    };

    const handleOffline = () => {
      console.log('[Network] Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Monitor storage periodically
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const intervalId = storageManager.startMonitoring(60000); // Check every minute

    return () => {
      storageManager.stopMonitoring(intervalId);
    };
  }, []);

  return {
    status,
    updateServiceWorker,
    unregister,
  };
}

/**
 * Hook to listen for service worker updates
 */
export function useServiceWorkerUpdate(
  onUpdateAvailable?: () => void
): { isUpdateAvailable: boolean; installUpdate: () => void } {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const { updateServiceWorker } = useServiceWorker();

  useEffect(() => {
    const handleUpdate = () => {
      setIsUpdateAvailable(true);
      onUpdateAvailable?.();
    };

    window.addEventListener('sw-update-available', handleUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdate);
    };
  }, [onUpdateAvailable]);

  const installUpdate = useCallback(() => {
    updateServiceWorker();
  }, [updateServiceWorker]);

  return {
    isUpdateAvailable,
    installUpdate,
  };
}

/**
 * Hook to check if app is running as PWA
 */
export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (installed PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsPWA(isStandalone);
  }, []);

  return isPWA;
}

/**
 * Clear all service worker caches
 * Useful for development when testing PWA with caching enabled
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    console.warn('[Cache] Cache API not supported');
    return;
  }

  try {
    const keys = await caches.keys();
    console.log(`[Cache] Clearing ${keys.length} cache(s)...`);
    
    await Promise.all(keys.map(key => caches.delete(key)));
    
    console.log('[Cache] ✓ All caches cleared successfully');
    console.log('[Cache] Refresh page to reload fresh content');
  } catch (error) {
    console.error('[Cache] Failed to clear caches:', error);
    throw error;
  }
}

/**
 * Clear all offline data (caches + IndexedDB + storage)
 * Nuclear option for complete reset
 */
export async function clearAllOfflineData(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    console.log('[Offline Data] Starting complete cleanup...');

    // 1. Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('[Offline Data] ✓ Service workers unregistered');
    }

    // 2. Clear all caches
    await clearAllCaches();

    // 3. Clear IndexedDB
    if ('indexedDB' in window) {
      const databases = ['crms-db']; // Add more if needed
      for (const dbName of databases) {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(dbName);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      console.log('[Offline Data] ✓ IndexedDB cleared');
    }

    // 4. Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('[Offline Data] ✓ Storage cleared');

    console.log('[Offline Data] ✓ Complete cleanup finished');
    console.log('[Offline Data] Refresh page to start fresh');
  } catch (error) {
    console.error('[Offline Data] Cleanup failed:', error);
    throw error;
  }
}

/**
 * Hook for PWA install prompt
 */
export function usePWAInstall(): {
  canInstall: boolean;
  promptInstall: () => Promise<boolean>;
} {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default install prompt
      e.preventDefault();
      
      // Store the event for later use
      setDeferredPrompt(e);
      setCanInstall(true);

      console.log('[PWA] Install prompt available');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setDeferredPrompt(null);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`[PWA] User response: ${outcome}`);

      // Clear the prompt
      setDeferredPrompt(null);
      setCanInstall(false);

      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    canInstall,
    promptInstall,
  };
}
