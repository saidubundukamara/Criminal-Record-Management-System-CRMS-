/**
 * Evidence List Page
 *
 * Displays all evidence for the officer's station with filtering
 * Pan-African Design: Accessible, responsive evidence management interface
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EvidenceList } from "@/components/evidence/evidence-list";
import { Plus, Package, Shield, HardDrive, AlertCircle, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { container } from "@/src/di/container";

async function getEvidence() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return [];
  }

  try {
    const prisma = container.prismaClient;
    const evidence = await prisma.evidence.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      where: {
        case: {
          stationId: session.user.stationId,
        },
      },
    });

    return evidence as any[];
  } catch (error) {
    console.error("Error fetching evidence:", error);
    return [];
  }
}

function EvidenceListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default async function EvidencePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const evidence = await getEvidence();

  // Calculate statistics
  const sealedCount = evidence.filter((e: any) => e.isSealed).length;
  const digitalCount = evidence.filter((e: any) => e.isDigital).length;
  const criticalCount = evidence.filter((e: any) => e.isCritical).length;
  const courtCount = evidence.filter((e: any) => e.status === "court").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Evidence</h1>
          <p className="text-gray-600 mt-1">
            Manage evidence and chain of custody
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/evidence/scan">
            <Button variant="outline">
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR Code
            </Button>
          </Link>
          <Link href="/dashboard/evidence/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Evidence
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Evidence</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {evidence.length}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sealed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {sealedCount}
              </p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Digital Files</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {digitalCount}
              </p>
            </div>
            <HardDrive className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {criticalCount}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">{courtCount}</span> evidence items currently in court
          </p>
          <p className="text-sm text-blue-800">
            <span className="font-semibold">
              {Math.round((sealedCount / evidence.length) * 100) || 0}%
            </span>{" "}
            sealed for integrity
          </p>
        </div>
      </div>

      {/* Evidence List */}
      <Suspense fallback={<EvidenceListSkeleton />}>
        <EvidenceList evidence={evidence} showFilters={true} />
      </Suspense>
    </div>
  );
}
