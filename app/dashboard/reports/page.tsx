/**
 * Reports Hub Page
 *
 * Central page for accessing various system reports and analytics.
 *
 * Pan-African Design: Unified reporting interface for law enforcement
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { FileText, Shield, BarChart3, Download, Eye, TrendingUp } from "lucide-react";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";

async function getReportsStatistics() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    const prisma = container.prismaClient;
    const stationId = session.user.stationId;

    // Build where clause based on permissions
    let whereClause: any = {};

    if (hasPermission(session, "reports", "read", "national")) {
      // National scope - no station filter
      whereClause = {};
    } else if (hasPermission(session, "reports", "read", "station")) {
      // Station scope
      whereClause = { stationId };
    } else {
      // Own scope
      whereClause = { stationId };
    }

    const [
      totalAuditLogs,
      recentAuditLogs,
      totalCases,
      totalOfficers,
    ] = await Promise.all([
      // Audit logs count
      prisma.auditLog.count({ where: whereClause }),

      // Recent audit logs
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          entityType: true,
          action: true,
          createdAt: true,
          officer: {
            select: {
              name: true,
              badge: true,
            },
          },
        },
      }),

      // Total cases for case reports
      prisma.case.count({ where: { stationId } }),

      // Total officers for officer reports
      prisma.officer.count({ where: { stationId } }),
    ]);

    return {
      auditLogs: {
        total: totalAuditLogs,
        recent: recentAuditLogs.map((log) => ({
          id: log.id,
          entityType: log.entityType,
          action: log.action,
          officerName: log.officer?.name || "System",
          officerBadge: log.officer?.badge || "SYSTEM",
          timestamp: log.createdAt.toISOString(),
        })),
      },
      overview: {
        totalCases,
        totalOfficers,
        totalAuditLogs,
      },
    };
  } catch (error) {
    console.error("Error fetching reports statistics:", error);
    return null;
  }
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function StatsCards({ statistics }: { statistics: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Cases</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistics.overview.totalCases}
            </p>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-3">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Officers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistics.overview.totalOfficers}
            </p>
          </div>
          <div className="rounded-lg bg-green-500/10 p-3">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Audit Log Entries</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistics.auditLogs.total}
            </p>
          </div>
          <div className="rounded-lg bg-purple-500/10 p-3">
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default async function ReportsHubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const statistics = await getReportsStatistics();

  // Fallback empty statistics if fetch failed
  const defaultStatistics = {
    auditLogs: { total: 0, recent: [] },
    overview: { totalCases: 0, totalOfficers: 0, totalAuditLogs: 0 },
  };

  const stats = statistics || defaultStatistics;

  const canViewAuditReports = hasPermission(session, "reports", "read", "station");
  const canExportReports = hasPermission(session, "reports", "export", "station");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">
            Access system reports, audit trails, and data analytics
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards statistics={stats} />
      </Suspense>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Audit Reports Card */}
        <Card className="p-8 hover:shadow-lg transition-shadow border-2">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-500/10 p-4">
              <Shield className="h-10 w-10 text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Audit Reports</h2>
              <p className="mt-2 text-gray-600">
                View system activity logs and security audit trails
              </p>

              <div className="mt-6 space-y-3">
                {canViewAuditReports && (
                  <Link href="/dashboard/reports/audit">
                    <Button className="w-full" variant="default" size="lg">
                      <Eye className="h-4 w-4 mr-2" />
                      View Audit Logs
                    </Button>
                  </Link>
                )}
                {canExportReports && (
                  <Button className="w-full" variant="outline" size="lg" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export Audit Report
                  </Button>
                )}
              </div>

              {/* Recent Activity Preview */}
              {stats.auditLogs.recent.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Recent Activity
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {stats.auditLogs.recent.slice(0, 3).map((log) => (
                      <li key={log.id} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900 font-medium">
                            {log.action}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {log.entityType}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {log.officerName} ({log.officerBadge})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Case Reports Card - Coming Soon */}
        <Card className="p-8 hover:shadow-lg transition-shadow border-2 opacity-75">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-500/10 p-4">
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Case Reports</h2>
              <p className="mt-2 text-gray-600">
                Generate reports on case statistics and trends
              </p>

              <div className="mt-6 space-y-3">
                <Button className="w-full" variant="default" size="lg" disabled>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Case Analytics
                </Button>
                <Button className="w-full" variant="outline" size="lg" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export Case Report
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 italic">
                  Coming soon: Case analytics and reporting features
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Officer Performance Reports - Coming Soon */}
        <Card className="p-8 hover:shadow-lg transition-shadow border-2 opacity-75">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-green-500/10 p-4">
              <TrendingUp className="h-10 w-10 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Officer Performance</h2>
              <p className="mt-2 text-gray-600">
                Track officer productivity and case resolution metrics
              </p>

              <div className="mt-6 space-y-3">
                <Button className="w-full" variant="default" size="lg" disabled>
                  <Eye className="h-4 w-4 mr-2" />
                  View Performance Dashboard
                </Button>
                <Button className="w-full" variant="outline" size="lg" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export Performance Report
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 italic">
                  Coming soon: Officer performance analytics and metrics
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Evidence Reports - Coming Soon */}
        <Card className="p-8 hover:shadow-lg transition-shadow border-2 opacity-75">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-orange-500/10 p-4">
              <FileText className="h-10 w-10 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Evidence Reports</h2>
              <p className="mt-2 text-gray-600">
                Chain of custody reports and evidence analytics
              </p>

              <div className="mt-6 space-y-3">
                <Button className="w-full" variant="default" size="lg" disabled>
                  <Eye className="h-4 w-4 mr-2" />
                  View Evidence Reports
                </Button>
                <Button className="w-full" variant="outline" size="lg" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export Evidence Report
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 italic">
                  Coming soon: Evidence tracking and chain of custody reports
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Info */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <BarChart3 className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900">About Reports</h3>
            <p className="mt-1 text-sm text-blue-700">
              The reports system provides comprehensive analytics and audit trails for all system
              activities. Audit reports are currently available, with additional report types
              coming in future updates. All reports respect your permission scope (own, station,
              or national).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
