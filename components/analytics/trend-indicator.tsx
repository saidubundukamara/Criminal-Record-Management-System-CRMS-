/**
 * Trend Indicator Component
 *
 * Displays trend direction (up/down) with percentage change
 * Used throughout analytics dashboards to show metric changes
 *
 * Pan-African Design:
 * - Color-blind friendly (icons + colors)
 * - Locale-aware number formatting
 * - Clear visual indicators for positive/negative trends
 */

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number;
  label?: string;
  inverse?: boolean; // If true, down is good, up is bad (e.g., crime rates)
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function TrendIndicator({
  value,
  label,
  inverse = false,
  showIcon = true,
  className = "",
  size = "md",
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  // Determine color based on trend direction and inverse flag
  const getColorClass = () => {
    if (isNeutral) return "text-gray-500 dark:text-gray-400";
    if (inverse) {
      return isPositive
        ? "text-red-600 dark:text-red-400"
        : "text-green-600 dark:text-green-400";
    }
    return isPositive
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";
  };

  const getBgClass = () => {
    if (isNeutral) return "bg-gray-100 dark:bg-gray-800";
    if (inverse) {
      return isPositive
        ? "bg-red-50 dark:bg-red-950/20"
        : "bg-green-50 dark:bg-green-950/20";
    }
    return isPositive
      ? "bg-green-50 dark:bg-green-950/20"
      : "bg-red-50 dark:bg-red-950/20";
  };

  const getIcon = () => {
    if (isNeutral) return <Minus className="h-3 w-3" />;
    return isPositive ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs px-1.5 py-0.5";
      case "lg":
        return "text-base px-3 py-1.5";
      default:
        return "text-sm px-2 py-1";
    }
  };

  const formattedValue = Math.abs(value).toFixed(1);
  const displayValue = isPositive ? `+${formattedValue}%` : `${formattedValue}%`;

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium",
          getColorClass(),
          getBgClass(),
          getSizeClasses()
        )}
      >
        {showIcon && getIcon()}
        <span>{displayValue}</span>
      </span>
      {label && (
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      )}
    </div>
  );
}

/**
 * Trend Badge - Simplified version without background
 */
export function TrendBadge({
  value,
  inverse = false,
  className = "",
}: {
  value: number;
  inverse?: boolean;
  className?: string;
}) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const getColorClass = () => {
    if (isNeutral) return "text-gray-500";
    if (inverse) {
      return isPositive ? "text-red-600" : "text-green-600";
    }
    return isPositive ? "text-green-600" : "text-red-600";
  };

  const formattedValue = Math.abs(value).toFixed(1);
  const displayValue = isPositive ? `+${formattedValue}%` : `${formattedValue}%`;

  return (
    <span className={cn("text-sm font-medium", getColorClass(), className)}>
      {displayValue}
    </span>
  );
}
