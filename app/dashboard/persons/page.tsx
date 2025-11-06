/**
 * Persons List Page
 *
 * Displays all persons for the officer's station with filtering
 * Pan-African Design: Accessible, responsive person management interface
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PersonList } from "@/components/persons/person-list";
import { Plus, Users, AlertOctagon, Fingerprint } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { container } from "@/src/di/container";

async function getPersons() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return [];
  }

  try {
    const { persons } = await container.personService.searchPersons(
      { stationId: session.user.stationId },
      session.user.id,
      500,
      0
    );

    return persons;
  } catch (error) {
    console.error("Error fetching persons:", error);
    return [];
  }
}

function PersonsListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default async function PersonsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const persons = await getPersons();

  // Serialize Person entities to plain objects for client components
  const serializedPersons = persons.map((p) => p.toJSON());

  // Calculate statistics
  const wantedCount = persons.filter((p) => p.isWanted).length;
  const highRiskCount = persons.filter((p) => p.riskLevel === "high").length;
  const withBiometricsCount = persons.filter((p) => p.hasBiometricData()).length;
  const minorsCount = persons.filter((p) => {
    const age = p.getAge();
    return age !== null && age < 18;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Persons</h1>
          <p className="text-gray-600 mt-1">
            Manage person records and identities
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/persons/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Person
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Persons</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {persons.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wanted</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {wantedCount}
              </p>
            </div>
            <AlertOctagon className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {highRiskCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With Biometrics</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {withBiometricsCount}
              </p>
            </div>
            <Fingerprint className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">{minorsCount}</span> minors in database
          </p>
          <p className="text-sm text-blue-800">
            <span className="font-semibold">
              {Math.round((withBiometricsCount / persons.length) * 100) || 0}%
            </span>{" "}
            have biometric data
          </p>
        </div>
      </div>

      {/* Persons List */}
      <Suspense fallback={<PersonsListSkeleton />}>
        <PersonList persons={serializedPersons} showFilters={true} />
      </Suspense>
    </div>
  );
}
