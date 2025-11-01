/**
 * Case Detail Page
 *
 * Displays full details of a single case with all related information
 * Pan-African Design: Comprehensive case view with actions
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { CaseSeverityBadge } from "@/components/cases/case-severity-badge";
import { CaseStatusChangeDialog } from "@/components/cases/case-status-change-dialog";
import { AddPersonToCaseDialog } from "@/components/cases/add-person-to-case-dialog";
import { CasePersonCards } from "@/components/cases/case-person-cards";
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  User,
  FileText,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
      include: {
        officer: {
          select: {
            id: true,
            name: true,
            badge: true,
          },
        },
        _count: {
          select: {
            persons: true,
            evidence: true,
          },
        },
      },
    });

    if (!caseData) {
      return null;
    }

    // Transform to match expected structure
    return {
      ...caseData,
      personCount: caseData._count.persons,
      evidenceCount: caseData._count.evidence,
    };
  } catch (error) {
    console.error("Error fetching case:", error);
    return null;
  }
}

async function getCasePersons(caseId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return [];
  }

  try {
    // Fetch case persons directly from database
    const prisma = container.prismaClient;
    const casePersons = await prisma.casePerson.findMany({
      where: { caseId },
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            nationalId: true,
            dob: true,
            gender: true,
            nationality: true,
            photoUrl: true,
            riskLevel: true,
            isWanted: true,
          },
        },
      },
    });

    return casePersons.map((cp) => ({
      linkId: cp.id,
      personId: cp.person.id,
      role: cp.role,
      statement: cp.statement,
      createdAt: cp.createdAt.toISOString(),
      person: {
        id: cp.person.id,
        fullName: `${cp.person.firstName} ${cp.person.middleName ? cp.person.middleName + ' ' : ''}${cp.person.lastName}`,
        firstName: cp.person.firstName,
        lastName: cp.person.lastName,
        nin: cp.person.nationalId,
        dateOfBirth: cp.person.dob?.toISOString() || null,
        gender: cp.person.gender || '',
        photoUrl: cp.person.photoUrl,
        riskLevel: cp.person.riskLevel as "low" | "medium" | "high" | null,
        isWanted: cp.person.isWanted,
      },
    }));
  } catch (error) {
    console.error("Error fetching case persons:", error);
    return [];
  }
}

function CaseDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default async function CaseDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const [caseData, casePersons] = await Promise.all([
    getCase(id),
    getCasePersons(id),
  ]);

  if (!caseData) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cases">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cases
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/cases/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Case Number</div>
            <h1 className="text-3xl font-bold text-gray-900">
              {caseData.caseNumber}
            </h1>
          </div>
          <div className="flex gap-2">
            <CaseStatusBadge status={caseData.status} size="lg" />
            <CaseSeverityBadge severity={caseData.severity} size="lg" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {caseData.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-500">Incident Date</p>
              <p className="font-medium text-gray-900">
                {format(new Date(caseData.incidentDate), "PPP p")}
              </p>
            </div>
          </div>

          {caseData.location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{caseData.location}</p>
              </div>
            </div>
          )}

          {caseData.officer && (
            <div className="flex items-start gap-2">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-500">Investigating Officer</p>
                <p className="font-medium text-gray-900">
                  {caseData.officer.name}
                </p>
                <p className="text-xs text-gray-500">{caseData.officer.badge}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Case Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {caseData.description && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {caseData.description}
              </p>
            </div>
          )}

          {/* Persons Involved */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Persons Involved
                {casePersons.length > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({casePersons.length})
                  </span>
                )}
              </h3>
              <AddPersonToCaseDialog
                caseId={caseData.id}
                caseNumber={caseData.caseNumber}
              />
            </div>
            <CasePersonCards caseId={caseData.id} persons={casePersons} />
          </div>

          {/* Evidence */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Evidence
                {caseData.evidenceCount > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({caseData.evidenceCount})
                  </span>
                )}
              </h3>
              <Button size="sm" variant="outline">
                Add Evidence
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              No evidence added yet. Upload photos, documents, or other evidence.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Case Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Case Information
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-900 capitalize">
                  {caseData.category}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Reported Date</dt>
                <dd className="font-medium text-gray-900">
                  {format(new Date(caseData.reportedDate), "PPP")}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Created At</dt>
                <dd className="font-medium text-gray-900">
                  {format(new Date(caseData.createdAt), "PPP")}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="font-medium text-gray-900">
                  {format(new Date(caseData.updatedAt), "PPP p")}
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
              <CaseStatusChangeDialog
                caseId={caseData.id}
                currentStatus={caseData.status as "open" | "investigating" | "charged" | "court" | "closed"}
                caseNumber={caseData.caseNumber}
              />
              <Button variant="outline" className="w-full justify-start">
                Assign Officer
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Add Note
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
