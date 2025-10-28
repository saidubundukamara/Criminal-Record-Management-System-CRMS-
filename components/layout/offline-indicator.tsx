/**
 * Offline Indicator Component
 * Displays connection status and offline sync status
 *
 * Features:
 * - Shows online/offline status
 * - Displays pending sync count
 * - Manual sync trigger button
 * - Auto-hides when online with no pending syncs
 * - Toast notifications for sync events
 */

'use client';

import { useEffect, useState } from 'react';
import { syncEngine, type SyncEventData } from '@/lib/sync/engine';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';

// ==================== TYPES ====================

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// ==================== COMPONENT ====================

export function OfflineIndicator() {
  // State
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncEventData['status']>('idle');
  const [queueCount, setQueueCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Initialize and subscribe to sync events
  useEffect(() => {
    // Initial state
    setIsOnline(syncEngine.getIsOnline());

    // Subscribe to sync events
    const unsubscribe = syncEngine.subscribe((data) => {
      setIsOnline(syncEngine.getIsOnline());
      setSyncStatus(data.status);
      setQueueCount(data.queueCount);
      if (data.lastSync) {
        setLastSync(data.lastSync);
      }
    });

    // Start auto-sync
    syncEngine.startAutoSync();

    // Initial queue count
    syncEngine.getQueueCount().then(setQueueCount);

    // Cleanup
    return () => {
      unsubscribe();
      syncEngine.stopAutoSync();
    };
  }, []);

  // Update syncing state
  useEffect(() => {
    setIsSyncing(syncStatus === 'syncing');
  }, [syncStatus]);

  // Handle manual sync
  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return;

    try {
      showToast('info', 'Starting sync...');
      const result = await syncEngine.forceSyncNow();

      if (result.success) {
        showToast('success', `Synced ${result.synced} items successfully!`);
      } else {
        showToast('error', `Sync completed with ${result.failed} failures`);
      }
    } catch (error) {
      showToast('error', 'Sync failed. Please try again.');
      console.error('Manual sync error:', error);
    }
  };

  // Toast helpers
  const showToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Hide indicator if online and no pending items
  if (isOnline && queueCount === 0 && !isSyncing) {
    return (
      <>
        {/* Only show toasts */}
        {toasts.length > 0 && (
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        )}
      </>
    );
  }

  // ==================== RENDER ====================

  return (
    <>
      {/* Main Indicator */}
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className={`
          bg-white dark:bg-gray-800
          border-2 rounded-lg shadow-lg
          p-4 flex items-center gap-3
          ${!isOnline ? 'border-red-500' : 'border-yellow-500'}
          transition-all duration-300
        `}>
          {/* Icon */}
          <div className="flex-shrink-0">
            {!isOnline ? (
              <WifiOff className="h-6 w-6 text-red-500" />
            ) : isSyncing ? (
              <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
            ) : (
              <Wifi className="h-6 w-6 text-green-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {!isOnline ? (
              <>
                <p className="font-semibold text-sm text-red-700 dark:text-red-400">
                  Working Offline
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {queueCount} {queueCount === 1 ? 'item' : 'items'} pending sync
                </p>
              </>
            ) : isSyncing ? (
              <>
                <p className="font-semibold text-sm text-blue-700 dark:text-blue-400">
                  Syncing...
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Uploading offline changes
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-sm text-yellow-700 dark:text-yellow-400">
                  Sync Pending
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {queueCount} {queueCount === 1 ? 'item' : 'items'} to sync
                </p>
                {lastSync && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    Last sync: {formatRelativeTime(lastSync)}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Sync Button (only show when online and not syncing) */}
          {isOnline && !isSyncing && queueCount > 0 && (
            <button
              onClick={handleManualSync}
              className="
                flex-shrink-0
                px-3 py-1.5
                bg-blue-600 hover:bg-blue-700
                text-white text-sm font-medium
                rounded-md
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
            >
              Sync Now
            </button>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      )}
    </>
  );
}

// ==================== TOAST CONTAINER ====================

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            p-4 rounded-lg shadow-lg flex items-start gap-3
            animate-in slide-in-from-top-5
            ${
              toast.type === 'success'
                ? 'bg-green-50 border-l-4 border-green-500'
                : toast.type === 'error'
                ? 'bg-red-50 border-l-4 border-red-500'
                : 'bg-blue-50 border-l-4 border-blue-500'
            }
          `}
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-red-600" />
            ) : (
              <RefreshCw className="h-5 w-5 text-blue-600" />
            )}
          </div>

          {/* Message */}
          <p className={`
            flex-1 text-sm font-medium
            ${
              toast.type === 'success'
                ? 'text-green-800'
                : toast.type === 'error'
                ? 'text-red-800'
                : 'text-blue-800'
            }
          `}>
            {toast.message}
          </p>

          {/* Close button */}
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format date as relative time (e.g., "2 minutes ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}
