/**
 * Officer Badge Component
 *
 * Displays officer badge number with formatting
 * Pan-African Design: Clear officer identification
 */
import { Badge } from "@/components/ui/badge";

interface OfficerBadgeProps {
  badge: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OfficerBadge({
  badge,
  size = "md",
  className = "",
}: OfficerBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={`bg-blue-50 text-blue-700 border-blue-200 ${sizeClasses[size]} font-mono font-semibold border ${className}`}
    >
      {badge}
    </Badge>
  );
}
