/**
 * Person Risk Badge Component
 *
 * Visual indicator for person risk level with color coding and icons
 */

import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PersonRiskBadgeProps {
  riskLevel: "low" | "medium" | "high" | null;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function PersonRiskBadge({
  riskLevel,
  size = "md",
  showIcon = true,
  className,
}: PersonRiskBadgeProps) {
  if (!riskLevel) {
    return (
      <Badge variant="outline" className={cn("capitalize", className)}>
        Not Assessed
      </Badge>
    );
  }

  const config = {
    low: {
      label: "Low Risk",
      variant: "default" as const,
      className: "bg-blue-100 text-blue-800 border-blue-300",
      icon: Info,
    },
    medium: {
      label: "Medium Risk",
      variant: "default" as const,
      className: "bg-orange-100 text-orange-800 border-orange-300",
      icon: AlertTriangle,
    },
    high: {
      label: "High Risk",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 border-red-300",
      icon: AlertCircle,
    },
  };

  const { label, variant, className: badgeClassName, icon: Icon } = config[riskLevel];

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
      variant={variant}
      className={cn(
        "capitalize font-medium",
        badgeClassName,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn("mr-1", iconSizes[size])} />}
      {label}
    </Badge>
  );
}
