/**
 * Storage Monitor Component
 * 
 * Monitors storage usage and displays warnings when storage is low.
 * Provides options for cleanup when storage is critical.
 * 
 * Pan-African Design:
 * - Proactive storage management for low-storage devices
 * - Clear warnings before data loss
 * - Easy cleanup options
 */

"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, Database, Trash2 } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { storageManager, onStorageEvent, StorageEstimate } from '@/lib/db/storage-manager';
import { useToast } from '@/hooks/use-toast';

export function StorageMonitor() {
  const [storageStatus, setStorageStatus] = useState<{
    type: 'low' | 'critical' | null;
    estimate: StorageEstimate | null;
  }>({ type: null, estimate: null });
  
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for storage events
    const unsubscribe = onStorageEvent((type, estimate) => {
      setStorageStatus({ type, estimate });
      
      if (type === 'critical') {
        // Show critical warning immediately
        setShowCleanupDialog(true);
      }
    });

    // Initial storage check
    storageManager.monitorStorage();

    return unsubscribe;
  }, []);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    
    try {
      const result = await storageManager.performAutomatedCleanup({
        deleteOldCases: true,
        deleteOldEvidence: true,
        daysThreshold: 90,
        keepMinimum: 50,
      });

      if (result.success) {
        toast({
          title: "Cleanup Successful",
          description: `Freed ${storageManager.formatBytes(result.spaceSaved)} by removing ${result.itemsDeleted} old items.`,
        });
        
        setShowCleanupDialog(false);
        setStorageStatus({ type: null, estimate: null });
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.errors.join(', '),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Cleanup Error",
        description: "Failed to cleanup storage. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  if (!storageStatus.type || !storageStatus.estimate) {
    return null;
  }

  const { type, estimate } = storageStatus;

  return (
    <>
      {/* Low Storage Warning (non-blocking) */}
      {type === 'low' && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-40">
          <Alert variant="default" className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertTitle className="text-yellow-900 dark:text-yellow-200">
              Storage Running Low
            </AlertTitle>
            <AlertDescription className="text-yellow-800 dark:text-yellow-300">
              <p className="mb-2">
                Using {estimate.usagePercent.toFixed(1)}% of available storage 
                ({storageManager.formatBytes(estimate.usage)} / {storageManager.formatBytes(estimate.quota)})
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCleanupDialog(true)}
                className="border-yellow-300 hover:bg-yellow-100 dark:border-yellow-700 dark:hover:bg-yellow-900/30"
              >
                <Database className="w-4 h-4 mr-2" />
                Manage Storage
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Critical Storage Dialog (blocking) */}
      <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {type === 'critical' ? 'Critical: Storage Full' : 'Storage Running Low'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Your device storage is {type === 'critical' ? 'critically low' : 'running low'}.
                  Using {estimate.usagePercent.toFixed(1)}% of available space.
                </p>
                
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Used:</span>
                    <span>{storageManager.formatBytes(estimate.usage)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Available:</span>
                    <span>{storageManager.formatBytes(estimate.available)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total:</span>
                    <span>{storageManager.formatBytes(estimate.quota)}</span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                    What will be cleaned:
                  </p>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-300">
                    <li>• Old synced cases (90+ days)</li>
                    <li>• Old evidence records (90+ days)</li>
                    <li>• Cached images and files</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-700 dark:text-blue-400">
                    Note: Only synced data will be removed. Pending changes are safe.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {type !== 'critical' && (
              <AlertDialogCancel disabled={isCleaningUp}>
                Not Now
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={handleCleanup}
              disabled={isCleaningUp}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isCleaningUp ? 'Cleaning...' : 'Clean Up Storage'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
