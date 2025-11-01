/**
 * New Person Page
 *
 * Form for creating a new person record
 * Pan-African Design: Clear, accessible form for person registration
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PersonForm } from "@/components/persons/person-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewPersonPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/persons">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Persons
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Person</h1>
          <p className="text-gray-600 mt-2">
            Register a new person in the criminal records system
          </p>
        </div>

        <PersonForm />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Person Registration Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            Provide as much information as possible for accurate identification
          </li>
          <li>
            NIN (National ID) is optional but highly recommended
          </li>
          <li>
            Add all known aliases to help with searches and identification
          </li>
          <li>
            Physical description should include height, build, and distinguishing marks
          </li>
          <li>
            Criminal history and risk level can be updated later as needed
          </li>
          <li>
            All personal information (PII) is encrypted for privacy protection
          </li>
          <li>
            Biometric data (fingerprints, photos) can be added after creation
          </li>
        </ul>
      </div>

      {/* Privacy Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Privacy & Security Notice</h3>
        <p className="text-sm text-yellow-800">
          All personal information entered in this form is encrypted and stored securely.
          Access is logged and audited. Only authorized personnel with appropriate
          permissions can view or modify person records. This data is protected under
          national data protection laws and international privacy standards.
        </p>
      </div>
    </div>
  );
}
