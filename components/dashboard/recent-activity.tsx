/**
 * Recent Activity Component
 *
 * Displays recent audit log entries for the dashboard
 * Pan-African Design: Transparent, accountable activity tracking
 */
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  User,
  Package,
  Shield,
  AlertCircle,
  Settings,
} from "lucide-react";

interface RecentActivityProps {
  activity: {
    recentActions: Array<{
      id: string;
      entityType: string;
      action: string;
      officerName: string;
      officerBadge: string;
      timestamp: string;
    }>;
  };
}

export function RecentActivity({ activity }: RecentActivityProps) {
  // Map entity types to icons and colors
  const getEntityConfig = (
    entityType: string
  ): { icon: React.ReactNode; color: string } => {
    const configs: Record<string, { icon: React.ReactNode; color: string }> = {
      case: {
        icon: <FileText className="h-4 w-4" />,
        color: "text-blue-600 bg-blue-50",
      },
      person: {
        icon: <User className="h-4 w-4" />,
        color: "text-green-600 bg-green-50",
      },
      evidence: {
        icon: <Package className="h-4 w-4" />,
        color: "text-purple-600 bg-purple-50",
      },
      officer: {
        icon: <Shield className="h-4 w-4" />,
        color: "text-orange-600 bg-orange-50",
      },
      alert: {
        icon: <AlertCircle className="h-4 w-4" />,
        color: "text-red-600 bg-red-50",
      },
    };

    return (
      configs[entityType.toLowerCase()] || {
        icon: <Settings className="h-4 w-4" />,
        color: "text-gray-600 bg-gray-50",
      }
    );
  };

  // Get badge variant for action
  const getActionVariant = (
    action: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (action === "create") return "default";
    if (action === "update") return "secondary";
    if (action === "delete") return "destructive";
    return "outline";
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>

      {activity.recentActions.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">No recent activity</p>
          <p className="text-sm text-gray-500">
            Get started by creating a new case or person record
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activity.recentActions.map((log) => {
            const config = getEntityConfig(log.entityType);
            const timeAgo = formatDistanceToNow(new Date(log.timestamp), {
              addSuffix: true,
            });

            return (
              <div
                key={log.id}
                className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${config.color}`}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getActionVariant(log.action)}>
                      {log.action}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {log.entityType}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{log.officerName}</span>
                    <span className="text-gray-500"> ({log.officerBadge})</span>
                  </p>

                  <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activity.recentActions.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            Showing last {activity.recentActions.length} activities from the
            past 7 days
          </p>
        </div>
      )}
    </Card>
  );
}
