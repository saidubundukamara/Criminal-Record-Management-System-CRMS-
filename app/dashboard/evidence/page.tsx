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
    // Use EvidenceRepository instead of direct Prisma queries
    const evidenceRepo = container.evidenceRepository;
    const evidenceEntities = await evidenceRepo.findAll(
      { stationId: session.user.stationId },
      500,
      0
    );

    // Map domain entities to component format
    const evidence = evidenceEntities.map((e) => ({
      id: e.id,
      qrCode: e.qrCode,
      caseId: e.caseId,
      type: e.type,
      description: e.description,
      status: e.status,
      collectedDate: e.collectedDate,
      collectedLocation: e.collectedLocation,
      isSealed: e.isSealed,
      isDigital: e.isDigital(), // Method call
      fileUrl: e.fileUrl,
      fileName: e.fileName,
      humanReadableSize: e.getHumanReadableFileSize(), // Method call
      storageLocation: e.storageLocation,
      tags: e.tags,
      custodyTransferCount: e.getCustodyTransferCount(), // Method call
      isCritical: e.isCritical(), // Method call
      ageInDays: e.getAgeInDays(), // Method call
      createdAt: e.createdAt,
    }));

    return evidence;
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

  // Calculate statistics (evidence is now mapped with properties, not methods)
  const sealedCount = evidence.filter((e) => e.isSealed).length;
  const digitalCount = evidence.filter((e) => e.isDigital).length;
  const criticalCount = evidence.filter((e) => e.isCritical).length;
  const courtCount = evidence.filter((e) => e.status === "court").length;

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
