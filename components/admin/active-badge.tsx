/**
 * Active Badge Component
 *
 * Visual indicator for active/inactive status
 * Pan-African Design: Clear status communication
 */
import { Badge } from "@/components/ui/badge";

interface ActiveBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: "sm" | "md" | "lg";
}

export function ActiveBadge({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  size = "md",
}: ActiveBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={`${
        active
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-gray-100 text-gray-800 border-gray-200"
      } ${sizeClasses[size]} font-medium border`}
    >
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}
