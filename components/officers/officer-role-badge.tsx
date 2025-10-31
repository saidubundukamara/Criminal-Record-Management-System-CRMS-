/**
 * Officer Role Badge Component
 *
 * Displays officer role with color coding by level
 * Pan-African Design: Clear hierarchy visualization
 */
import { Badge } from "@/components/ui/badge";

interface OfficerRoleBadgeProps {
  roleName: string;
  roleLevel: number;
  size?: "sm" | "md" | "lg";
}

export function OfficerRoleBadge({
  roleName,
  roleLevel,
  size = "md",
}: OfficerRoleBadgeProps) {
  const getRoleColor = (level: number) => {
    switch (level) {
      case 1: // SuperAdmin
        return "bg-red-100 text-red-800 border-red-200";
      case 2: // Admin
        return "bg-orange-100 text-orange-800 border-orange-200";
      case 3: // StationCommander
        return "bg-purple-100 text-purple-800 border-purple-200";
      case 4: // Officer
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 5: // EvidenceClerk
        return "bg-green-100 text-green-800 border-green-200";
      case 6: // Viewer
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={`${getRoleColor(roleLevel)} ${sizeClasses[size]} font-medium border`}
    >
      {roleName}
    </Badge>
  );
}
