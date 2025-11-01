/**
 * Amber Alerts Page
 *
 * Displays active amber alerts for missing children
 * Pan-African Design: USSD-compatible missing children alert system
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, AlertTriangle, CheckCircle, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { container } from "@/src/di/container";

async function getAmberAlerts() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return [];
  }

  try {
    const prisma = container.prismaClient;
    const alerts = await prisma.amberAlert.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    return alerts as any[];
  } catch (error) {
    console.error("Error fetching amber alerts:", error);
    return [];
  }
}

export default async function AmberAlertsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const alerts = await getAmberAlerts();
  const activeAlerts = alerts.filter((a: any) => a.status === "active");
  const foundAlerts = alerts.filter((a: any) => a.status === "found");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Amber Alerts</h1>
          <p className="text-gray-600 mt-1">
            Missing children alerts and notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/alerts/amber/new">
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              New Alert
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">{activeAlerts.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Found (Safe)</p>
              <p className="text-2xl font-bold text-green-600">{foundAlerts.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map((alert: any) => (
              <Link key={alert.id} href={`/dashboard/alerts/amber/${alert.id}`}>
                <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-red-500">
                  <div className="flex items-start gap-4">
                    {alert.photoUrl ? (
                      <img
                        src={alert.photoUrl}
                        alt={alert.personName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{alert.personName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {alert.age && (
                          <span className="text-sm text-gray-600">{alert.age} years old</span>
                        )}
                        {alert.gender && (
                          <span className="text-sm text-gray-600">• {alert.gender}</span>
                        )}
                      </div>
                      {alert.lastSeenLocation && (
                        <p className="text-sm text-gray-600 mt-1">
                          Last seen: {alert.lastSeenLocation}
                        </p>
                      )}
                      {alert.lastSeenDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.lastSeenDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          ACTIVE
                        </span>
                        <span className="text-xs text-gray-500">
                          Contact: {alert.contactPhone}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Alerts List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Alerts</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No amber alerts
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new amber alert for a missing child.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/alerts/amber/new">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Alert
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            alerts.map((alert: any) => (
              <Link
                key={alert.id}
                href={`/dashboard/alerts/amber/${alert.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {alert.photoUrl ? (
                      <img
                        src={alert.photoUrl}
                        alt={alert.personName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{alert.personName}</p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            alert.status === "active"
                              ? "bg-red-100 text-red-800"
                              : alert.status === "found"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.age && `${alert.age} years old`}
                        {alert.age && alert.gender && " • "}
                        {alert.gender}
                      </p>
                      {alert.lastSeenLocation && (
                        <p className="text-sm text-gray-500 mt-1">
                          Last seen: {alert.lastSeenLocation}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Published {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
