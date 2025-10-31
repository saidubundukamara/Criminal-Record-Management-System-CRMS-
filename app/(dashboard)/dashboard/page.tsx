/**
 * Dashboard Home Page
 *
 * Main dashboard landing page with overview statistics and quick actions.
 *
 * Pan-African Design: Clean, informative dashboard for law enforcement
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatisticsOverview } from "@/components/dashboard/statistics-overview";
import { StatisticsCharts } from "@/components/dashboard/statistics-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, TrendingUp, Building2, Globe } from "lucide-react";

async function getStatistics() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/statistics`, {
      cache: "no-store",
      headers: {
        Cookie: `next-auth.session-token=${session}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch statistics");
      return null;
    }

    const data = await response.json();
    return data.statistics;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return null;
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const statistics = await getStatistics();

  // Fallback empty statistics if fetch failed
  const defaultStatistics = {
    overview: { totalCases: 0, totalPersons: 0, totalEvidence: 0, staleCases: 0 },
    cases: { byStatus: {}, bySeverity: {}, recent: [] },
    persons: { total: 0, wanted: 0, highRisk: 0, withBiometrics: 0 },
    evidence: { total: 0, byStatus: {}, sealed: 0, digital: 0, inCourt: 0 },
    activity: { recentActions: [] },
  };

  const stats = statistics || defaultStatistics;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-gray-600">
          {session.user.roleName} • {session.user.stationName}
        </p>
      </div>

      {/* Overview Statistics */}
      <Suspense fallback={<DashboardSkeleton />}>
        <StatisticsOverview statistics={stats} />
      </Suspense>

      {/* Analytics Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/analytics/officers">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Officer Productivity</h3>
                  <p className="mt-1 text-sm text-gray-500">View individual performance metrics</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/analytics/cases">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Case Trends</h3>
                  <p className="mt-1 text-sm text-gray-500">Time-series analysis & patterns</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/analytics/stations">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Station Performance</h3>
                  <p className="mt-1 text-sm text-gray-500">Resource utilization & trends</p>
                </div>
              </div>
            </Card>
          </Link>

          {session.user.roleName === "SuperAdmin" || session.user.roleName === "Admin" ? (
            <Link href="/analytics/national">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-orange-500/10 p-3">
                    <Globe className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">National Statistics</h3>
                    <p className="mt-1 text-sm text-gray-500">Country-wide crime data</p>
                  </div>
                </div>
              </Card>
            </Link>
          ) : (
            <Card className="p-6 opacity-50 cursor-not-allowed border-2">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-gray-500/10 p-3">
                  <Globe className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">National Statistics</h3>
                  <p className="mt-1 text-sm text-gray-500">Requires national permissions</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Charts and Visualizations */}
      <Suspense fallback={<DashboardSkeleton />}>
        <StatisticsCharts statistics={stats} />
      </Suspense>

      {/* Recent Activity */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <RecentActivity activity={stats.activity} />
      </Suspense>
    </div>
  );
}
