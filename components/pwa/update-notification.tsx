/**
 * Service Worker Update Notification
 * 
 * Shows a notification when a new version of the app is available.
 * Allows users to update immediately or continue with the current version.
 */

"use client";

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useServiceWorkerUpdate } from '@/lib/hooks/use-service-worker';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function UpdateNotification() {
  const { isUpdateAvailable, installUpdate } = useServiceWorkerUpdate();
  const { toast } = useToast();

  useEffect(() => {
    if (isUpdateAvailable) {
      toast({
        title: "Update Available",
        description: "A new version of CRMS is available.",
        action: (
          <Button
            size="sm"
            onClick={installUpdate}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Update Now
          </Button>
        ),
        duration: Infinity, // Don't auto-dismiss
      });
    }
  }, [isUpdateAvailable, installUpdate, toast]);

  // This component doesn't render anything directly
  // Updates are shown via toast notifications
  return null;
}
