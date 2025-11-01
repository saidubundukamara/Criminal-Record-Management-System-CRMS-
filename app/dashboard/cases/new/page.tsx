/**
 * New Case Page
 *
 * Form for creating a new criminal case
 * Pan-African Design: Clear, accessible form for case creation
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CaseForm } from "@/components/cases/case-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewCasePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/cases">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cases
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Case</h1>
          <p className="text-gray-600 mt-2">
            Fill in the details below to register a new criminal case
          </p>
        </div>

        <CaseForm />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Case Creation Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            Provide a clear, concise title that summarizes the incident
          </li>
          <li>
            Include all relevant details in the description
          </li>
          <li>
            Select the appropriate category and severity level
          </li>
          <li>
            The case number will be automatically generated
          </li>
          <li>
            You can add persons (suspects, victims, witnesses) and evidence
            after creating the case
          </li>
        </ul>
      </div>
    </div>
  );
}
