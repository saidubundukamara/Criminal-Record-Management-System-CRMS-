/**
 * New Evidence Page
 *
 * Form for creating new evidence record
 * Pan-African Design: Clear, accessible form for evidence registration
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EvidenceForm } from "@/components/evidence/evidence-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { container } from "@/src/di/container";

type CaseOption = {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
};

async function getCases(): Promise<CaseOption[]> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return [];
  }

  try {
    const prisma = container.prismaClient;
    const cases = await prisma.case.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      where: {
        stationId: session.user.stationId,
      },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        status: true,
      },
    });

    return cases;
  } catch (error) {
    console.error("Error fetching cases:", error);
    return [];
  }
}

export default async function NewEvidencePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const cases = await getCases();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/evidence">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Evidence
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Evidence</h1>
          <p className="text-gray-600 mt-2">
            Register new evidence in the criminal records system
          </p>
        </div>

        <EvidenceForm availableCases={cases} />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Evidence Collection Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            Provide a detailed description of the evidence including appearance and condition
          </li>
          <li>
            Record the exact location and date/time when the evidence was collected
          </li>
          <li>
            A unique QR code will be automatically generated for tracking
          </li>
          <li>
            Upload digital files (photos, videos, documents) if applicable
          </li>
          <li>
            Physical evidence should be sealed and stored in a secure evidence room
          </li>
          <li>
            Tag critical evidence with appropriate labels (weapon, biological, high-value)
          </li>
          <li>
            Chain of custody begins automatically when evidence is created
          </li>
        </ul>
      </div>

      {/* Chain of Custody Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Chain of Custody</h3>
        <p className="text-sm text-yellow-800">
          By creating this evidence record, you are initiating the chain of custody. All
          subsequent handling, transfers, and access to this evidence will be logged and
          tracked. This ensures the integrity of evidence for court proceedings. The initial
          custody event will be recorded with your name, badge number, and timestamp.
        </p>
      </div>

      {/* Security Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-900 mb-2">Security & Integrity</h3>
        <p className="text-sm text-red-800">
          Evidence integrity is critical for successful prosecution. Once sealed, evidence
          cannot be unsealed without proper authorization. Digital files are hashed (SHA-256)
          to detect tampering. All access and modifications are audited and logged
          permanently. Unauthorized access or tampering may result in disciplinary action.
        </p>
      </div>
    </div>
  );
}
