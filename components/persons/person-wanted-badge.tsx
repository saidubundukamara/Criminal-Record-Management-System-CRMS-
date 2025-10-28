/**
 * Person Wanted Badge Component
 *
 * Visual indicator for wanted persons with prominent styling
 */

import { AlertOctagon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PersonWantedBadgeProps {
  isWanted: boolean;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function PersonWantedBadge({
  isWanted,
  size = "md",
  showIcon = true,
  className,
}: PersonWantedBadgeProps) {
  if (!isWanted) {
    return null;
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5 font-bold",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Badge
      variant="destructive"
      className={cn(
        "uppercase font-bold tracking-wide",
        "bg-red-600 text-white border-red-700",
        "animate-pulse",
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <AlertOctagon className={cn("mr-1", iconSizes[size])} />}
      WANTED
    </Badge>
  );
}
