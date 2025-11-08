/**
 * Edit Evidence Page
 *
 * Form for editing an existing evidence record
 * Pan-African Design: Clear, accessible form for evidence editing
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { EvidenceForm } from "@/components/evidence/evidence-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { container } from "@/src/di/container";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getEvidence(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    const prisma = container.prismaClient;
    const evidence = await prisma.evidence.findUnique({
      where: { id },
      select: {
        id: true,
        caseId: true,
        type: true,
        description: true,
        collectedDate: true,
        collectedLocation: true,
        storageLocation: true,
        tags: true,
        notes: true,
      },
    });

    return evidence;
  } catch (error) {
    console.error("Error fetching evidence:", error);
    return null;
  }
}

async function getCases(stationId: string) {
  try {
    const prisma = container.prismaClient;
    const cases = await prisma.case.findMany({
      take: 500,
      orderBy: { createdAt: "desc" },
      where: {
        stationId: stationId,
      },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        status: true,
      },
    });

    return cases as any[];
  } catch (error) {
    console.error("Error fetching cases:", error);
    return [];
  }
}

export default async function EditEvidencePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const evidence = await getEvidence(id);

  if (!evidence) {
    notFound();
  }

  const cases = await getCases(session.user.stationId);

  // Transform data to match form expectations
  const initialData = {
    caseId: evidence.caseId,
    type: evidence.type as "physical" | "document" | "photo" | "video" | "audio" | "digital" | "biological" | "other",
    description: evidence.description || "",
    collectedDate: evidence.collectedDate
      ? new Date(evidence.collectedDate).toISOString().slice(0, 16)
      : "",
    collectedLocation: evidence.collectedLocation || "",
    storageLocation: evidence.storageLocation || "",
    notes: evidence.notes || "",
    tags: evidence.tags || [],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/evidence/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Evidence
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Evidence</h1>
          <p className="text-gray-600 mt-2">
            Update the evidence record details below
          </p>
        </div>

        <EvidenceForm
          initialData={initialData}
          evidenceId={id}
          availableCases={cases}
        />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Editing Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>All changes will be tracked in the audit log</li>
          <li>Ensure all information is accurate before saving</li>
          <li>Chain of custody remains intact and preserved</li>
          <li>File uploads cannot be modified after creation for integrity</li>
        </ul>
      </div>

      {/* Chain of Custody Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Chain of Custody</h3>
        <p className="text-sm text-yellow-800">
          Editing this evidence record will be logged in the audit trail.
          The chain of custody remains unaffected by metadata updates. All
          changes are tracked with your name, badge number, and timestamp.
        </p>
      </div>

      {/* Security Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-900 mb-2">Security & Integrity</h3>
        <p className="text-sm text-red-800">
          Evidence integrity is critical for successful prosecution. Digital
          file hashes cannot be changed. All modifications are audited and
          logged permanently.
        </p>
      </div>
    </div>
  );
}
