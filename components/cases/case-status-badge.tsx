/**
 * Case Status Badge Component
 *
 * Visual indicator for case status with color coding
 * Pan-African Design: Clear visual communication
 */
import { Badge } from "@/components/ui/badge";

interface CaseStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function CaseStatusBadge({ status, size = "md" }: CaseStatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "investigating":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "charged":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "court":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Open";
      case "investigating":
        return "Investigating";
      case "charged":
        return "Charged";
      case "court":
        return "In Court";
      case "closed":
        return "Closed";
      default:
        return status;
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
      className={`${getStatusColor(status)} ${sizeClasses[size]} font-medium border`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}
