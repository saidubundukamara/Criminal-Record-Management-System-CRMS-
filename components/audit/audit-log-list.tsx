/**
 * Audit Log List Component
 *
 * Displays audit logs in a table with expandable details
 *
 * CRMS - Pan-African Digital Public Good
 */
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { AuditLogDetail } from "./audit-log-detail";

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

interface AuditLogListProps {
  logs: AuditLog[];
}

/**
 * Get color scheme for action type
 */
function getActionColor(action: string): string {
  const colorMap: Record<string, string> = {
    create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    read: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    update: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    login: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    logout: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    export: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  };

  return colorMap[action.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
}

/**
 * Get display name for entity type
 */
function getEntityTypeDisplay(entityType: string): string {
  const displayMap: Record<string, string> = {
    case: "Case",
    person: "Person",
    evidence: "Evidence",
    officer: "Officer",
    station: "Station",
    audit_log: "Audit Log",
    alert: "Alert",
    background_check: "Background Check",
  };

  return displayMap[entityType] || entityType;
}

export function AuditLogList({ logs }: AuditLogListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No audit logs found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Entity Type</TableHead>
            <TableHead>Officer</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isExpanded = expandedRows.has(log.id);
            const timestamp = new Date(log.createdAt);

            return (
              <>
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleRow(log.id)}
                >
                  <TableCell>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <div>{timestamp.toLocaleString()}</div>
                    <div className="text-muted-foreground">
                      {formatDistanceToNow(timestamp, { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getEntityTypeDisplay(log.entityType)}
                    </Badge>
                    {log.entityId && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {log.entityId.substring(0, 8)}...
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {log.officerName || "System"}
                    </div>
                    {log.officerBadge && (
                      <div className="text-xs text-muted-foreground">
                        {log.officerBadge}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>
                      {log.action.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.success ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Success</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Failed</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.ipAddress || "N/A"}
                  </TableCell>
                </TableRow>

                {/* Expanded Row with Details */}
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/30 p-4">
                      <AuditLogDetail log={log} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
