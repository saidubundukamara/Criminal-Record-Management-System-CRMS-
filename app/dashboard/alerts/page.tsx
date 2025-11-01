/**
 * Alerts Hub Page
 *
 * Central page for managing Amber Alerts and Wanted Persons.
 *
 * Pan-African Design: Unified alert management for law enforcement
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { AlertTriangle, Users, Plus, TrendingUp } from "lucide-react";
import { container } from "@/src/di/container";
import { hasPermission } from "@/lib/permissions";

async function getAlertsStatistics() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    const prisma = container.prismaClient;
    const stationId = session.user.stationId;

    // Build where clause based on permissions
    let whereClause: any = {};

    if (hasPermission(session, "alerts", "read", "national")) {
      // National scope - no station filter
      whereClause = {};
    } else if (hasPermission(session, "alerts", "read", "station")) {
      // Station scope
      whereClause = { stationId };
    } else {
      // Own scope - only alerts created by this officer
      whereClause = { issuedBy: session.user.id };
    }

    const [
      totalAmberAlerts,
      activeAmberAlerts,
      totalWantedPersons,
      activeWantedPersons,
      recentAmberAlerts,
      recentWantedPersons,
    ] = await Promise.all([
      // Amber Alerts
      prisma.amberAlert.count({ where: whereClause }),
      prisma.amberAlert.count({
        where: {
          ...whereClause,
          status: "active",
        },
      }),

      // Wanted Persons
      prisma.wantedPerson.count({ where: whereClause }),
      prisma.wantedPerson.count({
        where: {
          ...whereClause,
          status: "active",
        },
      }),

      // Recent Amber Alerts
      prisma.amberAlert.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          personName: true,
          status: true,
          createdAt: true,
        },
      }),

      // Recent Wanted Persons
      prisma.wantedPerson.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
          person: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      amberAlerts: {
        total: totalAmberAlerts,
        active: activeAmberAlerts,
        recent: recentAmberAlerts.map((alert) => ({
          id: alert.id,
          name: alert.personName,
          status: alert.status,
          createdAt: alert.createdAt.toISOString(),
        })),
      },
      wantedPersons: {
        total: totalWantedPersons,
        active: activeWantedPersons,
        recent: recentWantedPersons.map((wanted) => ({
          id: wanted.id,
          name: wanted.person
            ? `${wanted.person.firstName} ${wanted.person.lastName}`
            : 'Unknown',
          status: wanted.status,
          createdAt: wanted.createdAt.toISOString(),
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching alerts statistics:", error);
    return null;
  }
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function StatsCards({ statistics }: { statistics: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Amber Alerts</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistics.amberAlerts.total}
            </p>
          </div>
          <div className="rounded-lg bg-orange-500/10 p-3">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Amber Alerts</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {statistics.amberAlerts.active}
            </p>
          </div>
          <div className="rounded-lg bg-orange-500/10 p-3">
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Wanted Persons</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {statistics.wantedPersons.total}
            </p>
          </div>
          <div className="rounded-lg bg-red-500/10 p-3">
            <Users className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Wanted Persons</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {statistics.wantedPersons.active}
            </p>
          </div>
          <div className="rounded-lg bg-red-500/10 p-3">
            <TrendingUp className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default async function AlertsHubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const statistics = await getAlertsStatistics();

  // Fallback empty statistics if fetch failed
  const defaultStatistics = {
    amberAlerts: { total: 0, active: 0, recent: [] },
    wantedPersons: { total: 0, active: 0, recent: [] },
  };

  const stats = statistics || defaultStatistics;

  const canCreateAmberAlert = hasPermission(session, "alerts", "create", "station");
  const canCreateWantedPerson = hasPermission(session, "alerts", "create", "station");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts & Wanted Persons</h1>
          <p className="mt-2 text-gray-600">
            Manage Amber Alerts and Wanted Persons across the system
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards statistics={stats} />
      </Suspense>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amber Alerts Card */}
        <Card className="p-8 hover:shadow-lg transition-shadow border-2">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-orange-500/10 p-4">
              <AlertTriangle className="h-10 w-10 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Amber Alerts</h2>
              <p className="mt-2 text-gray-600">
                Manage missing children alerts and notifications
              </p>

              <div className="mt-6 space-y-3">
                <Link href="/dashboard/alerts/amber">
                  <Button className="w-full" variant="default" size="lg">
                    View All Amber Alerts
                  </Button>
                </Link>
                {canCreateAmberAlert && (
                  <Link href="/dashboard/alerts/amber/new">
                    <Button className="w-full" variant="outline" size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Alert
                    </Button>
                  </Link>
                )}
              </div>

              {/* Recent Alerts Preview */}
              {stats.amberAlerts.recent.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Recent Alerts
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {stats.amberAlerts.recent.slice(0, 3).map((alert) => (
                      <li key={alert.id} className="flex justify-between items-center">
                        <span className="text-gray-600 truncate">{alert.name}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.status === "active"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Wanted Persons Card */}
        <Card className="p-8 hover:shadow-lg transition-shadow border-2">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-red-500/10 p-4">
              <Users className="h-10 w-10 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Wanted Persons</h2>
              <p className="mt-2 text-gray-600">
                Track and manage wanted persons database
              </p>

              <div className="mt-6 space-y-3">
                <Link href="/dashboard/alerts/wanted">
                  <Button className="w-full" variant="default" size="lg">
                    View All Wanted Persons
                  </Button>
                </Link>
                {canCreateWantedPerson && (
                  <Link href="/dashboard/alerts/wanted/new">
                    <Button className="w-full" variant="outline" size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Wanted Person
                    </Button>
                  </Link>
                )}
              </div>

              {/* Recent Wanted Preview */}
              {stats.wantedPersons.recent.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Recently Added
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {stats.wantedPersons.recent.slice(0, 3).map((wanted) => (
                      <li key={wanted.id} className="flex justify-between items-center">
                        <span className="text-gray-600 truncate">{wanted.name}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            wanted.status === "active"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {wanted.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Active Alerts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.amberAlerts.active + stats.wantedPersons.active}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Amber Alerts Active</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {stats.amberAlerts.active}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Wanted Persons Active</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {stats.wantedPersons.active}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
