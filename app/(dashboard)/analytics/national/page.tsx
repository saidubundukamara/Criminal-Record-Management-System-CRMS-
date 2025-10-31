/**
 * National Crime Statistics Dashboard
 *
 * National-level analytics with:
 * - Overview metrics (cases, persons, evidence, officers, stations)
 * - Case distribution (status, category, severity)
 * - Geographic distribution by station
 * - Trends (7 days, 30 days, 12 months)
 * - Top performing officers
 *
 * RBAC: National scope required (SuperAdmin, Admin only)
 */

"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChartCard } from "@/components/analytics/chart-card";
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
import {
  Globe,
  FileText,
  Users,
  Package,
  Building2,
  AlertTriangle,
  UserX,
  Car,
  Award,
} from "lucide-react";

interface NationalStatistics {
  overview: {
    totalCases: number;
    totalPersons: number;
    totalEvidence: number;
    totalOfficers: number;
    totalStations: number;
    wantedPersons: number;
    missingPersons: number;
    stolenVehicles: number;
  };
  caseMetrics: {
    byStatus: { status: string; count: number; percentage: number }[];
    byCategory: { category: string; count: number; percentage: number }[];
    bySeverity: { severity: string; count: number; percentage: number }[];
  };
  geographicDistribution: {
    stationId: string;
    stationCode: string;
    stationName: string;
    caseCount: number;
    percentage: number;
  }[];
  trends: {
    last7Days: { date: string; count: number }[];
    last30Days: { date: string; count: number }[];
    last12Months: { month: string; count: number }[];
  };
  topOfficers: {
    officerId: string;
    officerBadge: string;
    officerName: string;
    casesClosed: number;
  }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export default function NationalStatisticsPage() {
  const { data: session } = useSession();
  const [statistics, setStatistics] = useState<NationalStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchStatistics();
    }
  }, [session]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analytics/national-statistics");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch statistics");
      }

      const data = await response.json();
      setStatistics(data.statistics);
    } catch (err: any) {
      console.error("Failed to fetch national statistics:", err);
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

  if (error && error.includes("National-level permissions required")) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Access Denied
        </h2>
        <p className="mt-2 text-gray-500">
          You need national-level permissions to view this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Globe className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            National Crime Statistics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pan-African crime data and trends across all stations
          </p>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          title="Total Cases"
          value={statistics?.overview.totalCases || 0}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
          isLoading={isLoading}
        />
        <OverviewCard
          title="Person Records"
          value={statistics?.overview.totalPersons || 0}
          icon={<Users className="h-6 w-6" />}
          color="green"
          isLoading={isLoading}
        />
        <OverviewCard
          title="Evidence Items"
          value={statistics?.overview.totalEvidence || 0}
          icon={<Package className="h-6 w-6" />}
          color="purple"
          isLoading={isLoading}
        />
        <OverviewCard
          title="Active Officers"
          value={statistics?.overview.totalOfficers || 0}
          icon={<Users className="h-6 w-6" />}
          color="orange"
          isLoading={isLoading}
          subtitle={`${statistics?.overview.totalStations || 0} stations`}
        />
      </div>

      {/* Alert Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <AlertCard
          title="Wanted Persons"
          value={statistics?.overview.wantedPersons || 0}
          icon={<UserX className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <AlertCard
          title="Missing Persons"
          value={statistics?.overview.missingPersons || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <AlertCard
          title="Stolen Vehicles"
          value={statistics?.overview.stolenVehicles || 0}
          icon={<Car className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>

      {/* Case Distribution Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* By Status */}
        <ChartCard
          title="Cases by Status"
          description="Case status distribution"
          isLoading={isLoading}
          error={error}
        >
          {statistics && statistics.caseMetrics.byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statistics.caseMetrics.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }: any) =>
                    `${status}: ${(percentage * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statistics.caseMetrics.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <NoData />
          )}
        </ChartCard>

        {/* By Category */}
        <ChartCard
          title="Cases by Category"
          description="Crime type distribution"
          isLoading={isLoading}
          error={error}
        >
          {statistics && statistics.caseMetrics.byCategory.length > 0 ? (
            <div className="space-y-2">
              {statistics.caseMetrics.byCategory.slice(0, 6).map((cat, idx) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="capitalize">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{cat.count}</span>
                    <span className="text-gray-500">
                      ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <NoData />
          )}
        </ChartCard>

        {/* By Severity */}
        <ChartCard
          title="Cases by Severity"
          description="Severity level distribution"
          isLoading={isLoading}
          error={error}
        >
          {statistics && statistics.caseMetrics.bySeverity.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statistics.caseMetrics.bySeverity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData />
          )}
        </ChartCard>
      </div>

      {/* Trends */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Last 30 Days */}
        <ChartCard
          title="30-Day Trend"
          description="Cases reported in the last 30 days"
          isLoading={isLoading}
          error={error}
        >
          {statistics && statistics.trends.last30Days.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.trends.last30Days}>
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
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0088FE"
                  strokeWidth={2}
                  name="Cases"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <NoData />
          )}
        </ChartCard>

        {/* Last 12 Months */}
        <ChartCard
          title="12-Month Trend"
          description="Monthly case volumes"
          isLoading={isLoading}
          error={error}
        >
          {statistics && statistics.trends.last12Months.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.trends.last12Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#00C49F" name="Cases" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData />
          )}
        </ChartCard>
      </div>

      {/* Geographic Distribution */}
      <ChartCard
        title="Geographic Distribution"
        description="Cases by station location"
        icon={<Building2 className="h-5 w-5" />}
        isLoading={isLoading}
        error={error}
      >
        {statistics && statistics.geographicDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={statistics.geographicDistribution.slice(0, 10)}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stationName" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="caseCount" fill="#0088FE" name="Cases" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NoData />
        )}
      </ChartCard>

      {/* Top Officers */}
      {statistics && statistics.topOfficers.length > 0 && (
        <ChartCard
          title="Top Performing Officers"
          description="Officers with most cases closed"
          icon={<Award className="h-5 w-5" />}
          isLoading={isLoading}
          error={error}
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {statistics.topOfficers.slice(0, 10).map((officer, index) => (
              <Card
                key={officer.officerId}
                className="border-2 border-primary/20 p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-700">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{officer.officerBadge}</p>
                    <p className="text-xs text-gray-500">{officer.officerName}</p>
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {officer.casesClosed}
                </p>
                <p className="text-xs text-gray-500">cases closed</p>
              </Card>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

function OverviewCard({
  title,
  value,
  icon,
  color,
  isLoading,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "orange";
  isLoading: boolean;
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
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
            {value.toLocaleString()}
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

function AlertCard({
  title,
  value,
  icon,
  isLoading,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-20 rounded bg-gray-200"></div>
          <div className="h-6 w-12 rounded bg-gray-200"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
            {value}
          </p>
        </div>
        <div className="text-red-600 dark:text-red-400">{icon}</div>
      </div>
    </Card>
  );
}

function NoData() {
  return (
    <div className="flex h-64 items-center justify-center text-gray-500">
      No data available
    </div>
  );
}
