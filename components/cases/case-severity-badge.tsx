/**
 * Case Severity Badge Component
 *
 * Visual indicator for case severity level
 * Pan-African Design: Color-coded severity indicators
 */
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface CaseSeverityBadgeProps {
  severity: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CaseSeverityBadge({
  severity,
  showIcon = true,
  size = "md",
}: CaseSeverityBadgeProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          label: "Critical",
          icon: AlertCircle,
        };
      case "major":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          label: "Major",
          icon: AlertTriangle,
        };
      case "minor":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          label: "Minor",
          icon: Info,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          label: severity,
          icon: Info,
        };
    }
  };

  const config = getSeverityConfig(severity);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Badge
      variant="outline"
      className={`${config.color} ${sizeClasses[size]} font-medium border flex items-center gap-1`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}
