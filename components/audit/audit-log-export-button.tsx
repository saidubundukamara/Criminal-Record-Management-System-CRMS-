/**
 * Audit Log Export Button Component
 *
 * Button with dropdown to export audit logs as CSV
 *
 * CRMS - Pan-African Digital Public Good
 */
"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

interface FilterState {
  entityType?: string;
  entityId?: string;
  officerId?: string;
  action?: string;
  success?: boolean;
  fromDate?: string;
  toDate?: string;
}

interface AuditLogExportButtonProps {
  filters: FilterState;
}

export function AuditLogExportButton({ filters }: AuditLogExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (exportType: "filtered" | "all") => {
    try {
      setExporting(true);

      // Build query params
      const params = new URLSearchParams({
        exportType,
      });

      // Add filters (only for filtered export)
      if (exportType === "filtered") {
        if (filters.entityType) params.append("entityType", filters.entityType);
        if (filters.entityId) params.append("entityId", filters.entityId);
        if (filters.officerId) params.append("officerId", filters.officerId);
        if (filters.action) params.append("action", filters.action);
        if (filters.success !== undefined) params.append("success", filters.success.toString());
        if (filters.fromDate) params.append("fromDate", filters.fromDate);
        if (filters.toDate) params.append("toDate", filters.toDate);
      }

      // Fetch CSV
      const response = await fetch(`/api/audit/export?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have permission to export audit logs");
        }
        throw new Error("Failed to export audit logs");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `audit-logs-${Date.now()}.csv`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Audit logs exported to ${filename}`,
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) => filters[key as keyof FilterState] !== undefined
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={exporting}>
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("filtered")}>
          <div>
            <div className="font-medium">Export Filtered Results</div>
            <div className="text-xs text-muted-foreground">
              {hasActiveFilters
                ? "Export logs matching current filters"
                : "Export all logs (no filters active)"}
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("all")}>
          <div>
            <div className="font-medium">Export All Logs</div>
            <div className="text-xs text-muted-foreground">
              Export all audit logs (max 10,000 records)
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
