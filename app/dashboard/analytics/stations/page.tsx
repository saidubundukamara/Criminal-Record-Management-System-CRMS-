/**
 * Station Performance Analytics Dashboard
 *
 * Station-level performance metrics with:
 * - Key performance indicators
 * - Week-over-week and month-over-month trends
 * - Resource utilization (officers, evidence, vehicles)
 * - Case category breakdown
 * - Comparative metrics
 *
 * RBAC: Station commanders see own station, Regional/National see all
 */

"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChartCard } from "@/components/analytics/chart-card";
import { TrendIndicator } from "@/components/analytics/trend-indicator";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  Package,
  AlertCircle,
  Car,
} from "lucide-react";

interface StationPerformanceMetrics {
  stationId: string;
  stationCode: string;
  stationName: string;
  metrics: {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    resolutionRate: number;
    averageResolutionDays: number;
    totalOfficers: number;
    activeOfficers: number;
    casesPerOfficer: number;
    evidenceItems: number;
    personRecords: number;
    vehicleRecords: number;
    backgroundChecks: number;
    activeAlerts: number;
  };
  trends: {
    casesThisWeek: number;
    casesLastWeek: number;
    weekOverWeekChange: number;
    casesThisMonth: number;
    casesLastMonth: number;
    monthOverMonthChange: number;
  };
  casesByCategory: { category: string; count: number }[];
}

export default function StationPerformancePage() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<StationPerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchMetrics();
    }
  }, [session]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analytics/station-performance");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch metrics");
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err: any) {
      console.error("Failed to fetch station performance metrics:", err);
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

  // Prepare radar chart data
  const radarData = metrics
    ? [
        {
          metric: "Cases",
          value: Math.min((metrics.metrics.totalCases / 100) * 100, 100),
        },
        {
          metric: "Officers",
          value: Math.min((metrics.metrics.activeOfficers / 50) * 100, 100),
        },
        {
          metric: "Evidence",
          value: Math.min((metrics.metrics.evidenceItems / 200) * 100, 100),
        },
        {
          metric: "Vehicles",
          value: Math.min((metrics.metrics.vehicleRecords / 50) * 100, 100),
        },
        {
          metric: "Resolution",
          value: metrics.metrics.resolutionRate,
        },
      ]
    : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Station Performance
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {metrics?.stationName || "Loading..."} - Performance metrics and resource
          utilization
        </p>
      </div>

      {/* Station Info Card */}
      {metrics && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/20 p-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {metrics.stationCode} - {metrics.stationName}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metrics.metrics.activeOfficers} active officers •{" "}
                {metrics.metrics.totalCases} total cases
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Cases"
          value={metrics?.metrics.totalCases || 0}
          icon={<FileText className="h-5 w-5" />}
          trend={metrics?.trends.monthOverMonthChange}
          trendLabel="vs last month"
          isLoading={isLoading}
        />
        <MetricCard
          title="Resolution Rate"
          value={`${metrics?.metrics.resolutionRate.toFixed(1) || 0}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <MetricCard
          title="Active Officers"
          value={`${metrics?.metrics.activeOfficers || 0}/${metrics?.metrics.totalOfficers || 0}`}
          icon={<Users className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <MetricCard
          title="Cases per Officer"
          value={metrics?.metrics.casesPerOfficer.toFixed(1) || 0}
          icon={<FileText className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>

      {/* Trends Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Week-over-Week Trend */}
        <ChartCard
          title="Weekly Trend"
          description="Cases this week vs last week"
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={isLoading}
          error={error}
        >
          {metrics && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">This Week</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {metrics.trends.casesThisWeek}
                  </p>
                </div>
                <TrendIndicator
                  value={metrics.trends.weekOverWeekChange}
                  label="vs last week"
                  size="lg"
                />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    { week: "Last Week", cases: metrics.trends.casesLastWeek },
                    { week: "This Week", cases: metrics.trends.casesThisWeek },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cases" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Month-over-Month Trend */}
        <ChartCard
          title="Monthly Trend"
          description="Cases this month vs last month"
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={isLoading}
          error={error}
        >
          {metrics && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">This Month</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                    {metrics.trends.casesThisMonth}
                  </p>
                </div>
                <TrendIndicator
                  value={metrics.trends.monthOverMonthChange}
                  label="vs last month"
                  size="lg"
                />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={[
                    { month: "Last Month", cases: metrics.trends.casesLastMonth },
                    { month: "This Month", cases: metrics.trends.casesThisMonth },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cases" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Resource Utilization */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overall Performance Radar */}
        <ChartCard
          title="Overall Performance"
          description="Multi-dimensional station performance"
          isLoading={isLoading}
          error={error}
        >
          {metrics && (
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#0088FE"
                  fill="#0088FE"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Resource Breakdown */}
        <ChartCard
          title="Resource Inventory"
          description="Station resources and records"
          icon={<Package className="h-5 w-5" />}
          isLoading={isLoading}
          error={error}
        >
          {metrics && (
            <div className="space-y-3">
              <ResourceRow
                label="Evidence Items"
                value={metrics.metrics.evidenceItems}
                icon={<Package className="h-5 w-5 text-blue-600" />}
              />
              <ResourceRow
                label="Person Records"
                value={metrics.metrics.personRecords}
                icon={<Users className="h-5 w-5 text-green-600" />}
              />
              <ResourceRow
                label="Vehicle Records"
                value={metrics.metrics.vehicleRecords}
                icon={<Car className="h-5 w-5 text-purple-600" />}
              />
              <ResourceRow
                label="Background Checks"
                value={metrics.metrics.backgroundChecks}
                icon={<FileText className="h-5 w-5 text-orange-600" />}
              />
              <ResourceRow
                label="Active Alerts"
                value={metrics.metrics.activeAlerts}
                icon={<AlertCircle className="h-5 w-5 text-red-600" />}
              />
            </div>
          )}
        </ChartCard>
      </div>

      {/* Cases by Category */}
      <ChartCard
        title="Cases by Category"
        description="Case distribution across crime types"
        isLoading={isLoading}
        error={error}
      >
        {metrics && metrics.casesByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={metrics.casesByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0088FE" name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-80 items-center justify-center text-gray-500">
            No category data available
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  isLoading: boolean;
}) {
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
          {trend !== undefined && (
            <div className="mt-2">
              <TrendIndicator value={trend} label={trendLabel} size="sm" />
            </div>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      </div>
    </Card>
  );
}

function ResourceRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  );
}
