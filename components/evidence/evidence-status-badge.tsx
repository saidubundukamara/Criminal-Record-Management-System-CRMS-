/**
 * Evidence Status Badge Component
 *
 * Visual indicator for evidence status with color coding
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Package,
  Archive,
  Microscope,
  Scale,
  Undo2,
  Trash2,
} from "lucide-react";

type EvidenceStatus =
  | "collected"
  | "stored"
  | "analyzed"
  | "court"
  | "returned"
  | "destroyed";

interface EvidenceStatusBadgeProps {
  status: EvidenceStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function EvidenceStatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: EvidenceStatusBadgeProps) {
  const config = {
    collected: {
      label: "Collected",
      className: "bg-blue-100 text-blue-800 border-blue-300",
      icon: Package,
    },
    stored: {
      label: "Stored",
      className: "bg-green-100 text-green-800 border-green-300",
      icon: Archive,
    },
    analyzed: {
      label: "Analyzed",
      className: "bg-purple-100 text-purple-800 border-purple-300",
      icon: Microscope,
    },
    court: {
      label: "In Court",
      className: "bg-orange-100 text-orange-800 border-orange-300",
      icon: Scale,
    },
    returned: {
      label: "Returned",
      className: "bg-gray-100 text-gray-800 border-gray-300",
      icon: Undo2,
    },
    destroyed: {
      label: "Destroyed",
      className: "bg-red-100 text-red-800 border-red-300",
      icon: Trash2,
    },
  };

  const { label, className: badgeClassName, icon: Icon } = config[status];

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
