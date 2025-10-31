/**
 * Audit Log Detail Component
 *
 * Displays detailed information about an audit log entry
 *
 * CRMS - Pan-African Digital Public Good
 */
"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

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

interface AuditLogDetailProps {
  log: AuditLog;
}

export function AuditLogDetail({ log }: AuditLogDetailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header with Copy Button */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg">Audit Log Details</h4>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy JSON</span>
            </>
          )}
        </button>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Log ID</div>
            <div className="font-mono text-sm">{log.id}</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Timestamp</div>
            <div className="text-sm">
              {new Date(log.createdAt).toLocaleString()}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Entity Type</div>
            <Badge variant="outline">{log.entityType}</Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Entity ID</div>
            <div className="font-mono text-sm">{log.entityId || "N/A"}</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Officer</div>
            <div className="text-sm">
              {log.officerName || "System"}
              {log.officerBadge && (
                <div className="text-xs text-muted-foreground">
                  Badge: {log.officerBadge}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Officer ID</div>
            <div className="font-mono text-sm">{log.officerId || "N/A"}</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">IP Address</div>
            <div className="font-mono text-sm">{log.ipAddress || "N/A"}</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Station ID</div>
            <div className="font-mono text-sm">{log.stationId || "N/A"}</div>
          </div>
        </Card>
      </div>

      {/* User Agent (if present) */}
      {log.userAgent && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">User Agent</div>
            <div className="font-mono text-xs break-all">{log.userAgent}</div>
          </div>
        </Card>
      )}

      {/* Details (JSON) */}
      {log.details && Object.keys(log.details).length > 0 && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Additional Details</div>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
