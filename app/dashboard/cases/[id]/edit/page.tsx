/**
 * Edit Case Page
 *
 * Form for editing an existing criminal case
 * Pan-African Design: Clear, accessible form for case editing
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { CaseForm } from "@/components/cases/case-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { container } from "@/src/di/container";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getCase(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    // Fetch case data directly from database
    const prisma = container.prismaClient;
    const caseData = await prisma.case.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        severity: true,
        incidentDate: true,
        location: true,
      },
    });

    return caseData;
  } catch (error) {
    console.error("Error fetching case:", error);
    return null;
  }
}

export default async function EditCasePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const caseData = await getCase(id);

  if (!caseData) {
    notFound();
  }

  // Transform data to match form expectations
  const initialData = {
    title: caseData.title,
    description: caseData.description || "",
    category: caseData.category,
    severity: caseData.severity as "minor" | "major" | "critical",
    incidentDate: caseData.incidentDate
      ? new Date(caseData.incidentDate).toISOString().slice(0, 16)
      : "",
    location: caseData.location || "",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/cases/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Case
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Case</h1>
          <p className="text-gray-600 mt-2">
            Update the case details below
          </p>
        </div>

        <CaseForm initialData={initialData} caseId={id} />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Editing Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>All changes will be tracked in the audit log</li>
          <li>Ensure all information is accurate before saving</li>
          <li>
            To modify persons or evidence, return to the case detail page
          </li>
        </ul>
      </div>
    </div>
  );
}
