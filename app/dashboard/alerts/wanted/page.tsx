/**
 * Wanted Persons Page
 *
 * Displays active wanted person alerts with danger levels and priority
 * Pan-African Design: Regional cross-border alert system
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, AlertTriangle, CheckCircle, User, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { container } from "@/src/di/container";

async function getWantedPersons() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return [];
  }

  try {
    const prisma = container.prismaClient;
    const wantedPersons = await prisma.wantedPerson.findMany({
      take: 100,
      orderBy: { priority: 'desc' },
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
          },
        },
      },
    });

    return wantedPersons as any[];
  } catch (error) {
    console.error("Error fetching wanted persons:", error);
    return [];
  }
}

function getDangerColor(dangerLevel: string) {
  switch (dangerLevel) {
    case "extreme":
      return "bg-red-600 text-white";
    case "high":
      return "bg-red-500 text-white";
    case "medium":
      return "bg-orange-500 text-white";
    case "low":
      return "bg-yellow-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function getPriorityColor(priority: number) {
  if (priority >= 90) return "text-red-600";
  if (priority >= 70) return "text-orange-600";
  if (priority >= 50) return "text-yellow-600";
  return "text-gray-600";
}

export default async function WantedPersonsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const wantedPersons = await getWantedPersons();
  const activeWanted = wantedPersons.filter((w: any) => w.status === "active");
  const capturedWanted = wantedPersons.filter((w: any) => w.status === "captured");

  // Calculate total reward amount
  const totalReward = wantedPersons.reduce((sum: number, w: any) => {
    return sum + (w.rewardAmount || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wanted Persons</h1>
          <p className="text-gray-600 mt-1">
            Active alerts for wanted individuals
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/alerts/wanted/new">
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
              <p className="text-sm text-gray-600">Active Wanted</p>
              <p className="text-2xl font-bold text-red-600">{activeWanted.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Captured</p>
              <p className="text-2xl font-bold text-green-600">{capturedWanted.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rewards</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalReward > 0 ? `$${totalReward.toLocaleString()}` : "$0"}
              </p>
            </div>
            <Award className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* High Priority Alerts */}
      {activeWanted.filter((w: any) => w.priority >= 80).length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">High Priority</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeWanted
              .filter((w: any) => w.priority >= 80)
              .sort((a: any, b: any) => b.priority - a.priority)
              .map((wanted: any) => (
                <Link key={wanted.id} href={`/dashboard/alerts/wanted/${wanted.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-red-600">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {wanted.person?.firstName} {wanted.person?.lastName}
                            </h3>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {wanted.charges}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${getDangerColor(wanted.dangerLevel)}`}>
                            {wanted.dangerLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-sm">
                          <span className={`font-semibold ${getPriorityColor(wanted.priority)}`}>
                            Priority: {wanted.priority}
                          </span>
                          {wanted.rewardAmount && (
                            <span className="text-green-600 font-semibold">
                              ${wanted.rewardAmount.toLocaleString()} reward
                            </span>
                          )}
                          {wanted.regionalAlert && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                              Regional
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* All Wanted Persons List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Wanted Persons</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {wantedPersons.length === 0 ? (
            <div className="p-8 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No wanted person alerts
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new wanted person alert.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/alerts/wanted/new">
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Alert
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            wantedPersons
              .sort((a: any, b: any) => b.priority - a.priority)
              .map((wanted: any) => (
                <Link
                  key={wanted.id}
                  href={`/dashboard/alerts/wanted/${wanted.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">
                            {wanted.person?.firstName} {wanted.person?.lastName}
                          </p>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              wanted.status === "active"
                                ? "bg-red-100 text-red-800"
                                : wanted.status === "captured"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {wanted.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getDangerColor(wanted.dangerLevel)}`}>
                            {wanted.dangerLevel}
                          </span>
                          {wanted.regionalAlert && (
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                              Regional Alert
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {wanted.charges}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className={`font-semibold ${getPriorityColor(wanted.priority)}`}>
                            Priority: {wanted.priority}
                          </span>
                          {wanted.warrantNumber && (
                            <span>Warrant: {wanted.warrantNumber}</span>
                          )}
                          {wanted.rewardAmount && (
                            <span className="text-green-600 font-semibold">
                              ${wanted.rewardAmount.toLocaleString()} reward
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Published {new Date(wanted.createdAt).toLocaleDateString()}
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
