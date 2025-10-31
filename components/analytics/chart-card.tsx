/**
 * Chart Card Component
 *
 * Reusable wrapper for all dashboard charts
 * Provides consistent styling, loading states, and error handling
 *
 * Pan-African Design:
 * - Responsive layout for mobile/tablet/desktop
 * - Accessible color schemes (color-blind friendly)
 * - Loading skeleton for low-bandwidth scenarios
 */

import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  actions?: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  icon,
  children,
  isLoading = false,
  error = null,
  className = "",
  actions,
}: ChartCardProps) {
  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-start gap-3">
          {icon && <div className="mt-1 text-primary">{icon}</div>}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {isLoading ? (
          <ChartSkeleton />
        ) : error ? (
          <ChartError error={error} />
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

/**
 * Loading skeleton for charts
 */
function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-64 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

/**
 * Error display for charts
 */
function ChartError({ error }: { error: string }) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
        <div className="mb-2 text-4xl">⚠️</div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Failed to load chart
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    </div>
  );
}
