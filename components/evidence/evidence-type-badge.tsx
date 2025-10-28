/**
 * Evidence Type Badge Component
 *
 * Visual indicator for evidence type with icons and color coding
 */

import {
  FileText,
  Image as ImageIcon,
  Video,
  Volume2,
  HardDrive,
  Dna,
  Package,
  File,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EvidenceType =
  | "physical"
  | "document"
  | "photo"
  | "video"
  | "audio"
  | "digital"
  | "biological"
  | "other";

interface EvidenceTypeBadgeProps {
  type: EvidenceType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function EvidenceTypeBadge({
  type,
  size = "md",
  showIcon = true,
  className,
}: EvidenceTypeBadgeProps) {
  const config = {
    physical: {
      label: "Physical",
      className: "bg-gray-100 text-gray-800 border-gray-300",
      icon: Package,
    },
    document: {
      label: "Document",
      className: "bg-blue-100 text-blue-800 border-blue-300",
      icon: FileText,
    },
    photo: {
      label: "Photo",
      className: "bg-purple-100 text-purple-800 border-purple-300",
      icon: ImageIcon,
    },
    video: {
      label: "Video",
      className: "bg-pink-100 text-pink-800 border-pink-300",
      icon: Video,
    },
    audio: {
      label: "Audio",
      className: "bg-green-100 text-green-800 border-green-300",
      icon: Volume2,
    },
    digital: {
      label: "Digital",
      className: "bg-indigo-100 text-indigo-800 border-indigo-300",
      icon: HardDrive,
    },
    biological: {
      label: "Biological",
      className: "bg-red-100 text-red-800 border-red-300",
      icon: Dna,
    },
    other: {
      label: "Other",
      className: "bg-gray-100 text-gray-600 border-gray-300",
      icon: File,
    },
  };

  const { label, className: badgeClassName, icon: Icon } = config[type];

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
