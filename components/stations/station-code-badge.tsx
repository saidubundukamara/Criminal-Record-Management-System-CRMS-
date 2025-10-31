/**
 * Station Code Badge Component
 *
 * Displays station code with formatting
 * Pan-African Design: Clear station identification
 */
import { Badge } from "@/components/ui/badge";

interface StationCodeBadgeProps {
  code: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StationCodeBadge({
  code,
  size = "md",
  className = "",
}: StationCodeBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={`bg-purple-50 text-purple-700 border-purple-200 ${sizeClasses[size]} font-mono font-semibold border ${className}`}
    >
      {code}
    </Badge>
  );
}
