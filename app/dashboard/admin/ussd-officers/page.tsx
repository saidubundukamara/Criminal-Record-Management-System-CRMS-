/**
 * USSD Officer Management Admin Page
 *
 * Features:
 * - View all officers with USSD registration status
 * - Enable/disable USSD access per officer
 * - View USSD query logs (filterable)
 * - View usage statistics
 * - Reset Quick PINs
 *
 * Permissions: SuperAdmin, Admin only
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export const metadata = {
  title: "USSD Officer Management | CRMS",
  description: "Manage USSD access for field officers",
};

export default async function USSDOfficersPage() {
  // Authentication check
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Permission check: Only SuperAdmin and Admin can access
  if (
    !hasPermission(session as any, "officers", "update", "national") &&
    !hasPermission(session as any, "officers", "update", "station")
  ) {
    redirect("/dashboard");
  }

  // Fetch officers with USSD data
  const officers = await prisma.officer.findMany({
    where: { active: true },
    include: {
      role: { select: { name: true, level: true } },
      station: { select: { code: true, name: true } },
      _count: {
        select: { ussdQueries: true },
      },
    },
    orderBy: [
      { ussdRegisteredAt: { sort: "desc", nulls: "last" } },
      { name: "asc" },
    ],
  });

  // Fetch recent USSD query logs
  const recentLogs = await prisma.uSSDQueryLog.findMany({
    take: 50,
    include: {
      officer: {
        select: {
          badge: true,
          name: true,
          station: { select: { code: true } },
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });

  // Calculate statistics
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    totalRegistered,
    enabledCount,
    queriesToday,
    queriesThisWeek,
    totalQueries,
  ] = await Promise.all([
    prisma.officer.count({
      where: {
        ussdPhoneNumber: { not: null },
      },
    }),
    prisma.officer.count({
      where: {
        ussdEnabled: true,
      },
    }),
    prisma.uSSDQueryLog.count({
      where: { timestamp: { gte: today } },
    }),
    prisma.uSSDQueryLog.count({
      where: { timestamp: { gte: weekStart } },
    }),
    prisma.uSSDQueryLog.count(),
  ]);

  const stats = {
    totalRegistered,
    enabledCount,
    queriesToday,
    queriesThisWeek,
    totalQueries,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">USSD Officer Management</h1>
        <p className="text-gray-600 mt-2">
          Manage USSD field access for officers
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Registered Officers"
          value={stats.totalRegistered}
          subtitle={`${stats.enabledCount} enabled`}
        />
        <StatCard
          title="Queries Today"
          value={stats.queriesToday}
          subtitle="All officers"
        />
        <StatCard
          title="Queries This Week"
          value={stats.queriesThisWeek}
          subtitle="Last 7 days"
        />
        <StatCard
          title="Total Queries"
          value={stats.totalQueries}
          subtitle="All time"
        />
        <StatCard
          title="Avg Per Officer"
          value={
            stats.totalRegistered > 0
              ? Math.round(stats.totalQueries / stats.totalRegistered)
              : 0
          }
          subtitle="Lifetime average"
        />
      </div>

      {/* Officers Table */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Officers</h2>
          <p className="text-sm text-gray-600 mt-1">
            {officers.length} active officers
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Badge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Queries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {officers.map((officer) => (
                <OfficerRow key={officer.id} officer={officer} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Query Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent USSD Queries</h2>
          <p className="text-sm text-gray-600 mt-1">
            Last 50 queries from all officers
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Officer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Search Term
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{log.officer.badge}</div>
                    <div className="text-xs text-gray-500">
                      {log.officer.station.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {log.queryType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">
                    {log.searchTerm}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.resultSummary || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.success ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Statistics Card Component
 */
function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number | string;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

/**
 * Officer Row Component (Client-side for interactivity)
 */
function OfficerRow({ officer }: { officer: any }) {
  const isRegistered = !!officer.ussdPhoneNumber;
  const isEnabled = officer.ussdEnabled;
  const queryCount = officer._count.ussdQueries;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 text-sm font-medium">{officer.badge}</td>
      <td className="px-6 py-4 text-sm">{officer.name}</td>
      <td className="px-6 py-4 text-sm">
        <div>{officer.station.name}</div>
        <div className="text-xs text-gray-500">{officer.station.code}</div>
      </td>
      <td className="px-6 py-4 text-sm font-mono">
        {officer.ussdPhoneNumber || (
          <span className="text-gray-400">Not registered</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm">
        {isRegistered ? (
          isEnabled ? (
            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
              Enabled
            </span>
          ) : (
            <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
              Disabled
            </span>
          )
        ) : (
          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
            Not Registered
            </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm">
        <span className="font-medium">{queryCount}</span>
        <span className="text-xs text-gray-500 ml-1">
          / {officer.ussdDailyLimit} daily
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        {officer.ussdLastUsed
          ? new Date(officer.ussdLastUsed).toLocaleDateString()
          : "-"}
      </td>
      <td className="px-6 py-4 text-sm">
        {isRegistered && (
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 text-xs rounded ${
                isEnabled
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
              title={isEnabled ? "Disable USSD" : "Enable USSD"}
            >
              {isEnabled ? "Disable" : "Enable"}
            </button>
            <button
              className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
              title="View Logs"
            >
              Logs
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
