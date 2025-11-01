/**
 * Officer Productivity Analytics Dashboard
 *
 * Displays productivity metrics for officers with interactive charts:
 * - Cases handled (by status, category)
 * - Activity timeline
 * - Evidence collected
 * - Background checks performed
 * - Station rankings
 *
 * RBAC: Officers see own metrics, Station+ see all officers in scope
 */

"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChartCard } from "@/components/analytics/chart-card";
import { DateRangePicker, DateRange } from "@/components/analytics/date-range-picker";
import { TrendIndicator } from "@/components/analytics/trend-indicator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Activity, Award, FileText, Search, TrendingUp } from "lucide-react";

interface OfficerProductivityMetrics {
  officerId: string;
  officerBadge: string;
  officerName: string;
  stationId: string;
  stationName: string;
  metrics: {
    totalCases: number;
    activeCases: number;
    closedCases: number;
    casesThisWeek: number;
    casesThisMonth: number;
    evidenceCollected: number;
    backgroundChecksPerformed: number;
    ussdQueriesThisWeek: number;
    averageResolutionDays: number;
    casesByCategory: { category: string; count: number }[];
    activityTimeline: { date: string; count: number }[];
  };
  rankings: {
    stationRank: number;
    totalOfficersInStation: number;
  };
}

// Color-blind friendly palette
const COLORS = [
  "#0088FE", // Blue
  "#00C49F", // Teal
  "#FFBB28", // Orange
  "#FF8042", // Red-orange
  "#8884D8", // Purple
  "#82CA9D", // Green
  "#FFC658", // Yellow
  "#8DD1E1", // Light blue
];

export default function OfficerProductivityPage() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<OfficerProductivityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
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

      const response = await fetch(`/api/analytics/officer-productivity?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch metrics");
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err: any) {
      console.error("Failed to fetch officer productivity metrics:", err);
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
            Officer Productivity
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Performance metrics and activity tracking
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Cases"
          value={metrics?.metrics.totalCases || 0}
          icon={<FileText className="h-5 w-5" />}
          isLoading={isLoading}
          subtitle={`${metrics?.metrics.activeCases || 0} active`}
        />
        <MetricCard
          title="Cases This Month"
          value={metrics?.metrics.casesThisMonth || 0}
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={isLoading}
          subtitle={`${metrics?.metrics.casesThisWeek || 0} this week`}
        />
        <MetricCard
          title="Evidence Collected"
          value={metrics?.metrics.evidenceCollected || 0}
          icon={<Search className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <MetricCard
          title="Avg Resolution Time"
          value={`${metrics?.metrics.averageResolutionDays || 0} days`}
          icon={<Activity className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>

      {/* Officer Info & Ranking */}
      {metrics && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {metrics.officerBadge} - {metrics.officerName}
              </h3>
              <p className="text-sm text-gray-500">{metrics.stationName}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">
                  #{metrics.rankings.stationRank}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                of {metrics.rankings.totalOfficersInStation} officers
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Timeline */}
        <ChartCard
          title="Activity Timeline"
          description="Cases handled per day"
          icon={<Activity className="h-5 w-5" />}
          isLoading={isLoading}
          error={error}
        >
          {metrics && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.metrics.activityTimeline}>
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
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0088FE"
                  strokeWidth={2}
                  name="Cases"
                  dot={{ fill: "#0088FE" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Cases by Category */}
        <ChartCard
          title="Cases by Category"
          description="Distribution of case types"
          icon={<FileText className="h-5 w-5" />}
          isLoading={isLoading}
          error={error}
        >
          {metrics && metrics.metrics.casesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.metrics.casesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, count, percent }: any) =>
                    `${category}: ${count} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.metrics.casesByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-64 items-center justify-center text-gray-500">
              No case data available
            </div>
          )}
        </ChartCard>

        {/* Case Status Distribution */}
        <ChartCard
          title="Case Status"
          description="Active vs closed cases"
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={isLoading}
          error={error}
        >
          {metrics && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { status: "Active", count: metrics.metrics.activeCases },
                  { status: "Closed", count: metrics.metrics.closedCases },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0088FE" name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Additional Metrics */}
        <ChartCard
          title="Additional Activities"
          description="Other productivity indicators"
          icon={<Search className="h-5 w-5" />}
          isLoading={isLoading}
          error={error}
        >
          {metrics && (
            <div className="space-y-4">
              <MetricRow
                label="Background Checks"
                value={metrics.metrics.backgroundChecksPerformed}
                icon="🔍"
              />
              <MetricRow
                label="Evidence Items"
                value={metrics.metrics.evidenceCollected}
                icon="📦"
              />
              <MetricRow
                label="USSD Queries (This Week)"
                value={metrics.metrics.ussdQueriesThisWeek}
                icon="📱"
              />
              <MetricRow
                label="Average Resolution Time"
                value={`${metrics.metrics.averageResolutionDays} days`}
                icon="⏱️"
              />
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  isLoading,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading: boolean;
  subtitle?: string;
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
        <div>
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
        <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      </div>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  );
}
