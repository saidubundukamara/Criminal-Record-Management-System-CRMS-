/**
 * Person Detail Page
 *
 * Displays full details of a single person with all related information
 * Pan-African Design: Comprehensive person view with privacy protection
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PersonRiskBadge } from "@/components/persons/person-risk-badge";
import { PersonWantedBadge } from "@/components/persons/person-wanted-badge";
import { PersonRiskLevelDialog } from "@/components/persons/person-risk-level-dialog";
import { PersonWantedToggleDialog } from "@/components/persons/person-wanted-toggle-dialog";
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  User,
  FileText,
  Users,
  AlertOctagon,
  Fingerprint,
  Phone,
  Mail,
  Globe,
  Briefcase,
  Heart,
  GraduationCap,
  Languages,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
      include: {
        cases: {
          include: {
            case: {
              select: {
                id: true,
                caseNumber: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return person as any;
  } catch (error) {
    console.error("Error fetching person:", error);
    return null;
  }
}

function PersonDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default async function PersonDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const personData = await getPerson(id);

  if (!personData) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/persons">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Persons
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/persons/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Person Header Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {personData.photoUrl ? (
              <img
                src={personData.photoUrl}
                alt={personData.fullName}
                className="h-32 w-32 rounded-lg object-cover border-2"
              />
            ) : (
              <div className="h-32 w-32 rounded-lg bg-gray-200 flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Main Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {personData.displayName}
                </h1>
                {personData.nin && (
                  <p className="text-sm text-gray-500 mt-1 font-mono">
                    NIN: {personData.nin}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <PersonWantedBadge isWanted={personData.isWanted} size="lg" />
                <PersonRiskBadge riskLevel={personData.riskLevel} size="lg" />
                {personData.isDeceasedOrMissing && (
                  <Badge variant="outline" className="text-sm">
                    Deceased/Missing
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Date of Birth</p>
                  {personData.dateOfBirth ? (
                    <>
                      <p className="font-medium text-gray-900">
                        {format(new Date(personData.dateOfBirth), "PPP")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {personData.age} years old ({personData.ageCategory})
                        {personData.isMinor && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Minor
                          </Badge>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-400">Unknown</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Gender</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {personData.gender}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Nationality</p>
                  <p className="font-medium text-gray-900">
                    {personData.nationality || "Unknown"}
                  </p>
                  {personData.placeOfBirth && (
                    <p className="text-xs text-gray-500">
                      Born in {personData.placeOfBirth}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Data Completeness */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Profile Completeness:</span>
                <span className="font-semibold text-blue-600">
                  {personData.dataCompleteness}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${personData.dataCompleteness}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Person Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Personal Details
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {personData.occupation && (
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    Occupation
                  </dt>
                  <dd className="font-medium text-gray-900 mt-1">
                    {personData.occupation}
                  </dd>
                </div>
              )}
              {personData.maritalStatus && (
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    Marital Status
                  </dt>
                  <dd className="font-medium text-gray-900 mt-1 capitalize">
                    {personData.maritalStatus}
                  </dd>
                </div>
              )}
              {personData.educationLevel && (
                <div>
                  <dt className="text-gray-500 flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    Education
                  </dt>
                  <dd className="font-medium text-gray-900 mt-1">
                    {personData.educationLevel}
                  </dd>
                </div>
              )}
              {personData.tribe && (
                <div>
                  <dt className="text-gray-500">Tribe/Ethnicity</dt>
                  <dd className="font-medium text-gray-900 mt-1">
                    {personData.tribe}
                  </dd>
                </div>
              )}
              {personData.religion && (
                <div>
                  <dt className="text-gray-500">Religion</dt>
                  <dd className="font-medium text-gray-900 mt-1">
                    {personData.religion}
                  </dd>
                </div>
              )}
              {personData.languagesSpoken?.length > 0 && (
                <div className="md:col-span-2">
                  <dt className="text-gray-500 flex items-center gap-1">
                    <Languages className="h-4 w-4" />
                    Languages Spoken
                  </dt>
                  <dd className="font-medium text-gray-900 mt-1">
                    {personData.languagesSpoken?.join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Contact Information */}
          {personData.hasContactInfo && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>
              <dl className="space-y-3 text-sm">
                {personData.primaryPhone && (
                  <div>
                    <dt className="text-gray-500 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </dt>
                    <dd className="font-medium text-gray-900 mt-1 font-mono">
                      {personData.primaryPhone}
                    </dd>
                  </div>
                )}
                {personData.primaryEmail && (
                  <div>
                    <dt className="text-gray-500 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </dt>
                    <dd className="font-medium text-gray-900 mt-1">
                      {personData.primaryEmail}
                    </dd>
                  </div>
                )}
                {personData.primaryAddress && (
                  <div>
                    <dt className="text-gray-500 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Address
                    </dt>
                    <dd className="font-medium text-gray-900 mt-1">
                      {personData.primaryAddress.street && (
                        <p>{personData.primaryAddress.street}</p>
                      )}
                      {personData.primaryAddress.city && (
                        <p>
                          {personData.primaryAddress.city}
                          {personData.primaryAddress.region &&
                            `, ${personData.primaryAddress.region}`}
                        </p>
                      )}
                      {personData.primaryAddress.country && (
                        <p>{personData.primaryAddress.country}</p>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Physical Description */}
          {personData.physicalDescription && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Physical Description
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {personData.physicalDescription}
              </p>
            </div>
          )}

          {/* Criminal History */}
          {personData.criminalHistory && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                <AlertOctagon className="h-5 w-5" />
                Criminal History
              </h3>
              <p className="text-red-800 whitespace-pre-wrap">
                {personData.criminalHistory}
              </p>
            </div>
          )}

          {/* Linked Cases */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Linked Cases
                {personData.casesCount > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({personData.casesCount})
                  </span>
                )}
              </h3>
            </div>
            {personData.cases?.length === 0 ? (
              <p className="text-sm text-gray-500">
                No cases linked to this person yet.
              </p>
            ) : (
              <div className="space-y-3">
                {personData.cases?.map((caseItem: any) => (
                  <div
                    key={caseItem.caseId}
                    className="flex items-start justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <Link
                        href={`/dashboard/cases/${caseItem.caseId}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {caseItem.caseNumber}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {caseItem.caseTitle}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {caseItem.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status Information
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Risk Level</dt>
                <dd className="mt-1">
                  <PersonRiskBadge riskLevel={personData.riskLevel} size="md" />
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Wanted Status</dt>
                <dd className="font-medium text-gray-900 mt-1">
                  {personData.isWanted ? (
                    <PersonWantedBadge isWanted={true} size="md" />
                  ) : (
                    <span className="text-gray-500">Not wanted</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Biometrics</dt>
                <dd className="mt-1">
                  {personData.hasBiometrics ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Fingerprint className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <span className="text-gray-500">Not available</span>
                  )}
                </dd>
              </div>
              {personData.requiresSpecialHandling && (
                <div>
                  <dt className="text-gray-500">Special Handling</dt>
                  <dd className="mt-1">
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                      Required
                    </Badge>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Record Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record Information
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Created At</dt>
                <dd className="font-medium text-gray-900 mt-1">
                  {format(new Date(personData.createdAt), "PPP p")}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="font-medium text-gray-900 mt-1">
                  {format(new Date(personData.updatedAt), "PPP p")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <PersonRiskLevelDialog
                personId={personData.id}
                currentRiskLevel={personData.riskLevel}
                personName={personData.fullName}
              />
              <PersonWantedToggleDialog
                personId={personData.id}
                isWanted={personData.isWanted}
                personName={personData.fullName}
              />
              <Button variant="outline" className="w-full justify-start">
                Add to Case
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Upload Photo
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Add Biometrics
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
