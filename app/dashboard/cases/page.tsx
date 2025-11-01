/**
 * Cases List Page
 *
 * Displays all cases for the officer's station with filtering
 * Pan-African Design: Accessible, responsive case management interface
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CaseList } from "@/components/cases/case-list";
import { Plus, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { container } from "@/src/di/container";

async function getCases() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return [];
  }

  try {
    // Fetch cases directly from database
    const prisma = container.prismaClient;
    const cases = await prisma.case.findMany({
      where: {
        stationId: session.user.stationId, // Filter by user's station
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        description: true,
        category: true,
        severity: true,
        status: true,
        incidentDate: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return cases.map(c => ({
      ...c,
      description: c.description ?? undefined,
      location: c.location ?? undefined,
      incidentDate: c.incidentDate.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching cases:", error);
    return [];
  }
}

function CasesListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default async function CasesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const cases = await getCases();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-600 mt-1">
            Manage criminal cases and investigations
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/cases/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cases</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {cases.length}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {cases.filter((c: any) => c.status === "open").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Investigating</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {cases.filter((c: any) => c.status === "investigating").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {cases.filter((c: any) => c.severity === "critical").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <Suspense fallback={<CasesListSkeleton />}>
        <CaseList cases={cases} showFilters={true} />
      </Suspense>
    </div>
  );
}
