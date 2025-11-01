/**
 * Audit Log Viewer Page
 *
 * Admin-only page for viewing and filtering system audit logs
 *
 * CRMS - Pan-African Digital Public Good
 * Comprehensive audit trail for accountability
 */
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuditLogFilters } from "@/components/audit/audit-log-filters";
import { AuditLogList } from "@/components/audit/audit-log-list";
import { AuditLogStats } from "@/components/audit/audit-log-stats";
import { AuditLogExportButton } from "@/components/audit/audit-log-export-button";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, ArrowLeft } from "lucide-react";

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string | null;
  officerId: string | null;
  officerName?: string;
  officerBadge?: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  stationId: string | null;
  success: boolean;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FilterState {
  entityType?: string;
  entityId?: string;
  officerId?: string;
  action?: string;
  success?: boolean;
  fromDate?: string;
  toDate?: string;
}

export default function AuditLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<FilterState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Check authorization
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Check if user has admin role (level 1 or 2)
    const userRoleLevel = session.user.roleLevel;
    if (!userRoleLevel || (userRoleLevel !== 1 && userRoleLevel !== 2)) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  // Fetch audit logs
  const fetchLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      // Add filters
      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.entityId) params.append("entityId", filters.entityId);
      if (filters.officerId) params.append("officerId", filters.officerId);
      if (filters.action) params.append("action", filters.action);
      if (filters.success !== undefined) params.append("success", filters.success.toString());
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);

      const response = await fetch(`/api/audit?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have permission to view audit logs");
        }
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (session?.user) {
      fetchLogs();
    }
  }, [session]);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1
  };

  // Handle filter apply
  const handleApplyFilters = () => {
    fetchLogs(1);
  };

  // Handle filter clear
  const handleClearFilters = () => {
    setFilters({});
    setTimeout(() => fetchLogs(1), 0);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchLogs(newPage);
  };

  // If not authorized or loading session
  if (status === "loading") {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive system audit trail for accountability
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            {showStats ? "Hide" : "Show"} Statistics
          </button>
          <AuditLogExportButton filters={filters} />
        </div>
      </div>

      {/* Statistics */}
      {showStats && <AuditLogStats />}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Audit Logs</CardTitle>
          <CardDescription>
            Filter logs by entity type, officer, action, date range, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Audit Logs
            {pagination.total > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({pagination.total} total)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Displaying page {pagination.page} of {pagination.totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No audit logs found matching your filters.
            </div>
          ) : (
            <>
              <AuditLogList logs={logs} />

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
