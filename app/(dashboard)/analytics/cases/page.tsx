/**
 * Case Trends Analytics Dashboard
 *
 * Time-series analysis of case trends with:
 * - Case status over time (line chart)
 * - Category breakdown with trends
 * - Severity distribution
 * - Resolution metrics
 * - Top performing stations
 *
 * RBAC: Station+ can view, scope determines data access
 */

"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChartCard } from "@/components/analytics/chart-card";
import { DateRangePicker, DateRange } from "@/components/analytics/date-range-picker";
import { TrendIndicator } from "@/components/analytics/trend-indicator";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, AlertCircle, Clock, CheckCircle } from "lucide-react";

interface CaseTrendsMetrics {
  dateRange: { startDate: Date; endDate: Date };
  timeline: {
    date: string;
    open: number;
    investigating: number;
    charged: number;
    court: number;
    closed: number;
    total: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    percentageChange: number;
  }[];
  severityBreakdown: {
    severity: string;
    count: number;
    percentageChange: number;
  }[];
  resolutionMetrics: {
    averageResolutionDays: number;
    resolutionRate: number;
    medianResolutionDays: number;
    staleCases: number;
  };
  topStations: {
    stationId: string;
    stationName: string;
    caseCount: number;
  }[];
}

const STATUS_COLORS = {
  open: "#FF8042",
  investigating: "#FFBB28",
  charged: "#00C49F",
  court: "#0088FE",
  closed: "#82CA9D",
};

export default function CaseTrendsPage() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<CaseTrendsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
    endDate: new Date(),
  });

  useEffect(() => {
    if (session?.user) {
      fetchMetrics();
    }
  }, [session, dateRange]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString().split("T")[0],
        endDate: dateRange.endDate.toISOString().split("T")[0],
      });

      const response = await fetch(`/api/analytics/case-trends?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch metrics");
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err: any) {
      console.error("Failed to fetch case trends metrics:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Please sign in to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Case Trends
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Time-series analysis of case patterns and resolution metrics
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} maxRangeDays={365} />
      </div>

      {/* Resolution Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Resolution Rate"
          value={`${metrics?.resolutionMetrics.resolutionRate.toFixed(1) || 0}%`}
          icon={<CheckCircle className="h-5 w-5" />}
          isLoading={isLoading}
          color="green"
        />
        <MetricCard
          title="Avg Resolution Time"
          value={`${metrics?.resolutionMetrics.averageResolutionDays || 0} days`}
          icon={<Clock className="h-5 w-5" />}
          isLoading={isLoading}
          color="blue"
        />
        <MetricCard
          title="Median Resolution"
          value={`${metrics?.resolutionMetrics.medianResolutionDays || 0} days`}
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={isLoading}
          color="purple"
        />
        <MetricCard
          title="Stale Cases"
          value={metrics?.resolutionMetrics.staleCases || 0}
          icon={<AlertCircle className="h-5 w-5" />}
          isLoading={isLoading}
          color="red"
          subtitle="30+ days no activity"
        />
      </div>

      {/* Main Timeline Chart */}
      <ChartCard
        title="Case Status Timeline"
        description="Cases by status over time"
        icon={<TrendingUp className="h-5 w-5" />}
        isLoading={isLoading}
        error={error}
      >
        {metrics && metrics.timeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={metrics.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="open"
                stackId="1"
                stroke={STATUS_COLORS.open}
                fill={STATUS_COLORS.open}
                name="Open"
              />
              <Area
                type="monotone"
                dataKey="investigating"
                stackId="1"
                stroke={STATUS_COLORS.investigating}
                fill={STATUS_COLORS.investigating}
                name="Investigating"
              />
              <Area
                type="monotone"
                dataKey="charged"
                stackId="1"
                stroke={STATUS_COLORS.charged}
                fill={STATUS_COLORS.charged}
                name="Charged"
              />
              <Area
                type="monotone"
                dataKey="court"
                stackId="1"
                stroke={STATUS_COLORS.court}
                fill={STATUS_COLORS.court}
                name="In Court"
              />
              <Area
                type="monotone"
                dataKey="closed"
                stackId="1"
                stroke={STATUS_COLORS.closed}
                fill={STATUS_COLORS.closed}
                name="Closed"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-96 items-center justify-center text-gray-500">
            No case data available for this period
          </div>
        )}
      </ChartCard>

      {/* Category & Severity Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <ChartCard
          title="Cases by Category"
          description="Distribution with trend indicators"
          isLoading={isLoading}
          error={error}
        >
          {metrics && metrics.categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {metrics.categoryBreakdown.slice(0, 8).map((cat, index) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: `hsl(${(index * 360) / 8}, 70%, 50%)`,
                      }}
                    />
                    <span className="font-medium capitalize">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">{cat.count}</span>
                    <TrendIndicator value={cat.percentageChange} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-500">
              No category data available
            </div>
          )}
        </ChartCard>

        {/* Severity Breakdown */}
        <ChartCard
          title="Cases by Severity"
          description="Critical, major, and minor cases"
          isLoading={isLoading}
          error={error}
        >
          {metrics && metrics.severityBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.severityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0088FE" name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-500">
              No severity data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* Top Stations */}
      {metrics && metrics.topStations.length > 0 && (
        <ChartCard
          title="Top Performing Stations"
          description="Stations by case volume"
          isLoading={isLoading}
          error={error}
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {metrics.topStations.slice(0, 6).map((station, index) => (
              <Card key={station.stationId} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{station.stationName}</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-primary">
                      {station.caseCount}
                    </p>
                    <p className="text-xs text-gray-500">cases handled</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  isLoading,
  color = "blue",
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading: boolean;
  color?: "blue" | "green" | "red" | "purple";
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-24 rounded bg-gray-200"></div>
          <div className="h-8 w-16 rounded bg-gray-200"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>{icon}</div>
      </div>
    </Card>
  );
}
