/**
 * Audit Log Statistics Component
 *
 * Displays audit log statistics and analytics
 *
 * CRMS - Pan-African Digital Public Good
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Stats {
  totalLogs: number;
  successfulLogs: number;
  failedOperations: number;
  successRate: number;
  logsByAction: { action: string; count: number }[];
  logsByEntityType: { entityType: string; count: number }[];
  mostActiveOfficers: {
    officerId: string;
    officerName: string;
    officerBadge: string;
    count: number;
  }[];
  recentActivity: { period: string; count: number }[];
  failedByAction: { action: string; count: number }[];
  generatedAt: string;
}

export function AuditLogStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/audit/stats");

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All audit log entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulLogs.toLocaleString()} successful operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Operations</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedOperations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.failedOperations / stats.totalLogs) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Officers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mostActiveOfficers.length}</div>
            <p className="text-xs text-muted-foreground">
              Top contributors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Top Actions (Last 1000 Logs)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.logsByAction.slice(0, 5).map((item) => (
                <div key={item.action} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{item.action}</span>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Entity Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Top Entity Types (Last 1000 Logs)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.logsByEntityType.slice(0, 5).map((item) => (
                <div key={item.entityType} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{item.entityType}</span>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Active Officers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Most Active Officers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.mostActiveOfficers.slice(0, 5).map((officer) => (
                <div key={officer.officerId} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{officer.officerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {officer.officerBadge}
                    </div>
                  </div>
                  <span className="text-sm font-medium">{officer.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity (Last 7 Days) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentActivity.map((activity) => (
                <div key={activity.period} className="flex items-center justify-between">
                  <span className="text-sm">{activity.period}</span>
                  <span className="text-sm font-medium">{activity.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failed Operations Breakdown (if any failures) */}
      {stats.failedOperations > 0 && stats.failedByAction.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-red-600">
              Failed Operations Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.failedByAction.map((item) => (
                <div key={item.action} className="text-center">
                  <div className="text-2xl font-bold text-red-600">{item.count}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {item.action}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center">
        Statistics generated at {new Date(stats.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}
