/**
 * Edit Person Page
 *
 * Form for editing an existing person record
 * Pan-African Design: Clear, accessible form for person editing
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PersonForm } from "@/components/persons/person-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { container } from "@/src/di/container";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getPerson(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    const prisma = container.prismaClient;
    const person = await prisma.person.findUnique({
      where: { id },
      select: {
        id: true,
        nationalId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        dob: true,
        gender: true,
        nationality: true,
        aliases: true,
        riskLevel: true,
      },
    });

    return person;
  } catch (error) {
    console.error("Error fetching person:", error);
    return null;
  }
}

export default async function EditPersonPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const person = await getPerson(id);

  if (!person) {
    notFound();
  }

  // Transform data to match form expectations
  const initialData = {
    nin: person.nationalId || "",
    firstName: person.firstName,
    lastName: person.lastName,
    middleName: person.middleName || "",
    dateOfBirth: person.dob
      ? new Date(person.dob).toISOString().split("T")[0]
      : "",
    gender: (person.gender as "male" | "female" | "other" | "unknown") || "unknown",
    nationality: person.nationality || "",
    placeOfBirth: "",
    occupation: "",
    maritalStatus: "",
    educationLevel: "",
    tribe: "",
    religion: "",
    physicalDescription: "",
    riskLevel: person.riskLevel as "low" | "medium" | "high" | undefined,
    criminalHistory: "",
    notes: "",
    alias: person.aliases || [],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/persons/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Person
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Person</h1>
          <p className="text-gray-600 mt-2">
            Update the person record details below
          </p>
        </div>

        <PersonForm initialData={initialData} personId={id} />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Editing Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>All changes will be tracked in the audit log</li>
          <li>Ensure all information is accurate before saving</li>
          <li>Personal information (PII) remains encrypted</li>
          <li>Update risk level and criminal history as needed</li>
        </ul>
      </div>

      {/* Privacy Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Privacy & Security Notice</h3>
        <p className="text-sm text-yellow-800">
          All personal information changes are encrypted and stored securely.
          Access is logged and audited. Only authorized personnel with appropriate
          permissions can view or modify person records.
        </p>
      </div>
    </div>
  );
}
