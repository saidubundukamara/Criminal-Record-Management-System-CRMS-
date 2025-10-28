/**
 * Sync Status Component
 *
 * Displays offline sync status and allows manual sync trigger
 * Pan-African Design: Visual indicator for low-connectivity environments
 */
"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SyncStats {
  pending: number;
  failed: number;
  lastSyncAt: string | null;
  isOnline: boolean;
}

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const { toast } = useToast();

  // Check online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    updateOnlineStatus();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Fetch sync stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/sync");
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch sync stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming online with pending items
  useEffect(() => {
    if (isOnline && stats && stats.pending > 0 && !isSyncing) {
      handleSync();
    }
  }, [isOnline, stats?.pending]);

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Sync complete",
          description: `Successfully synced ${data.synced} items`,
        });

        // Refresh stats
        const statsResponse = await fetch("/api/sync");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }
      } else {
        toast({
          title: "Sync failed",
          description: data.message || "Some items failed to sync",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return "text-gray-400";
    if (stats && stats.failed > 0) return "text-red-500";
    if (stats && stats.pending > 0) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <CloudOff className={`h-5 w-5 ${getStatusColor()}`} />;
    }
    if (isSyncing) {
      return <RefreshCw className={`h-5 w-5 text-blue-500 animate-spin`} />;
    }
    if (stats && (stats.pending > 0 || stats.failed > 0)) {
      return <AlertCircle className={`h-5 w-5 ${getStatusColor()}`} />;
    }
    return <Cloud className={`h-5 w-5 ${getStatusColor()}`} />;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          title={isOnline ? "Online" : "Offline"}
        >
          {getStatusIcon()}
          {stats && (stats.pending > 0 || stats.failed > 0) && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {stats.pending + stats.failed}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Sync Status</h3>
            <div className="flex items-center gap-2 text-sm">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Failed</span>
                <span className="font-medium text-red-600">{stats.failed}</span>
              </div>
              {stats.lastSyncAt && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Last sync: {new Date(stats.lastSyncAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Sync Button */}
          <Button
            onClick={handleSync}
            disabled={!isOnline || isSyncing || (stats?.pending === 0 && stats?.failed === 0)}
            className="w-full"
            size="sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>

          {/* Offline Notice */}
          {!isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs text-yellow-800">
                You are offline. Changes will be queued and synced when connection is restored.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
