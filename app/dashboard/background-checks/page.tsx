/**
 * Background Checks Page
 *
 * Displays background check history and allows officers to perform new checks
 * Pan-African Design: NIN-based criminal record checking
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, FileSearch, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { container } from "@/src/di/container";

async function getBackgroundChecks() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return [];
  }

  try {
    const prisma = container.prismaClient;
    const checks = await prisma.backgroundCheck.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return checks as any[];
  } catch (error) {
    console.error("Error fetching background checks:", error);
    return [];
  }
}

function BackgroundChecksListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default async function BackgroundChecksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const checks = await getBackgroundChecks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Background Checks</h1>
          <p className="text-gray-600 mt-1">
            Perform NIN-based criminal record checks
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/background-checks/search">
            <Button>
              <Search className="mr-2 h-4 w-4" />
              New Check
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Checks</p>
              <p className="text-2xl font-bold text-gray-900">{checks.length}</p>
            </div>
            <FileSearch className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clear Records</p>
              <p className="text-2xl font-bold text-green-600">
                {checks.filter((c: any) => c.result?.status === "clear").length}
              </p>
            </div>
            <FileSearch className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Records Found</p>
              <p className="text-2xl font-bold text-red-600">
                {checks.filter((c: any) => c.result?.status === "record_found").length}
              </p>
            </div>
            <FileSearch className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Checks List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Checks</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {checks.length === 0 ? (
            <div className="p-8 text-center">
              <FileSearch className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No background checks yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by performing a new NIN-based check.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/background-checks/search">
                  <Button>
                    <Search className="mr-2 h-4 w-4" />
                    Perform Check
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            checks.map((check: any) => (
              <Link
                key={check.id}
                href={`/dashboard/background-checks/${check.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-gray-900">NIN: {check.nin}</p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          check.result?.status === "clear"
                            ? "bg-green-100 text-green-800"
                            : check.result?.status === "record_found"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {check.result?.status === "clear"
                          ? "Clear"
                          : check.result?.status === "record_found"
                          ? "Record Found"
                          : check.status}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {check.requestType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {check.result?.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Checked on {new Date(check.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {check.certificateUrl && (
                    <div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Certificate
                      </Button>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
