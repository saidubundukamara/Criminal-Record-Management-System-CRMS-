/**
 * Evidence Detail Page
 *
 * Displays full details of a single evidence item with chain of custody
 * Pan-African Design: Comprehensive evidence view with QR code and timeline
 */
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { EvidenceTypeBadge } from "@/components/evidence/evidence-type-badge";
import { EvidenceStatusBadge } from "@/components/evidence/evidence-status-badge";
import { EvidenceStatusChangeDialog } from "@/components/evidence/evidence-status-change-dialog";
import { AddCustodyEventDialog } from "@/components/evidence/add-custody-event-dialog";
import { EvidenceSealDialog } from "@/components/evidence/evidence-seal-dialog";
import { EvidenceDownloadButton } from "@/components/evidence/evidence-download-button";
import { EvidenceQRCodeDisplay } from "@/components/evidence/evidence-qr-code-display";
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  QrCode,
  Shield,
  ShieldAlert,
  FileText,
  HardDrive,
  Package,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
    // Use EvidenceService to get proper domain entity with case information
    const evidence = await container.evidenceService.getEvidenceWithCase(
      id,
      session.user.id
    );

    return evidence;
  } catch (error) {
    console.error("Error fetching evidence:", error);
    return null;
  }
}

function EvidenceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default async function EvidenceDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const evidenceData = await getEvidence(id);

  if (!evidenceData) {
    notFound();
  }

  const courtReadiness = evidenceData.isReadyForCourt();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/evidence">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Evidence
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/evidence/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Evidence Header Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">QR Code</div>
                <h1 className="text-3xl font-bold text-gray-900 font-mono">
                  {evidenceData.qrCode}
                </h1>
                <Link
                  href={`/dashboard/cases/${evidenceData.caseId}`}
                  className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                >
                  Case: {evidenceData.case.caseNumber} - {evidenceData.case.title}
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                <EvidenceTypeBadge type={evidenceData.type} size="lg" />
                <EvidenceStatusBadge status={evidenceData.status} size="lg" />
                 {evidenceData.isCritical() && (
                   <Badge variant="destructive" className="text-sm">
                     Critical
                   </Badge>
                 )}
                {evidenceData.isSealed && (
                  <Badge variant="default" className="bg-green-600 text-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    Sealed
                  </Badge>
                )}
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {evidenceData.description}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Collected</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(evidenceData.collectedDate), "PPP p")}
                  </p>
                   <p className="text-xs text-gray-500">
                     {evidenceData.getAgeInDays()} days ago
                   </p>
                </div>
              </div>

               <div className="flex items-start gap-2">
                 <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                 <div>
                   <p className="text-gray-500">Location</p>
                   <p className="font-medium text-gray-900">
                     {evidenceData.collectedLocation}
                   </p>
                 </div>
               </div>

               {evidenceData.getCurrentCustodian() && (
                 <div className="flex items-start gap-2">
                   <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                   <div>
                     <p className="text-gray-500">Current Custodian</p>
                     <p className="font-medium text-gray-900">
                       {evidenceData.getCurrentCustodian()!.officerName}
                     </p>
                     <p className="text-xs text-gray-500">
                       {evidenceData.getCurrentCustodian()!.officerBadge}
                     </p>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Court Readiness Indicator */}
        {courtReadiness && (
          <div
            className={`p-4 rounded-lg ${
              courtReadiness.ready
                ? "bg-green-50 border border-green-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {courtReadiness.ready ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <h3 className="font-semibold">Court Readiness</h3>
            </div>
            {courtReadiness.ready ? (
              <p className="text-sm text-green-800 mt-1">
                This evidence is ready for court presentation
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-yellow-800 mb-2">Issues to resolve:</p>
                <ul className="text-sm text-yellow-800 list-disc list-inside">
                  {courtReadiness.issues.map((issue: string, idx: number) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evidence Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
           {/* Digital File Info */}
           {evidenceData.isDigital() && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Digital File Information
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">File Name</dt>
                  <dd className="font-medium text-gray-900 font-mono mt-1">
                    {evidenceData.fileName}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">File Size</dt>
                   <dd className="font-medium text-gray-900 mt-1">
                     {evidenceData.getHumanReadableFileSize()}
                   </dd>
                </div>
                <div>
                  <dt className="text-gray-500">File Type</dt>
                  <dd className="font-medium text-gray-900 mt-1">
                    {evidenceData.fileMimeType}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Integrity Hash (SHA-256)</dt>
                  <dd className="font-mono text-xs text-gray-700 mt-1 break-all">
                    {evidenceData.fileHash}
                  </dd>
                </div>
                 {evidenceData.fileUrl && evidenceData.fileName && (
                   <div>
                     <EvidenceDownloadButton
                       evidenceId={evidenceData.id}
                       fileName={evidenceData.fileName}
                     />
                   </div>
                 )}
              </dl>
            </div>
          )}

          {/* Physical Storage */}
          {!evidenceData.isDigital && evidenceData.storageLocation && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Physical Storage
              </h3>
              <p className="text-gray-700">{evidenceData.storageLocation}</p>
            </div>
          )}

          {/* Notes */}
          {evidenceData.notes && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{evidenceData.notes}</p>
            </div>
          )}

          {/* Chain of Custody */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Chain of Custody
                <span className="text-sm font-normal text-gray-500">
                  ({evidenceData.chainOfCustody.length} events)
                </span>
              </h3>
              <AddCustodyEventDialog
                evidenceId={evidenceData.id}
                qrCode={evidenceData.qrCode}
              >
                <Button size="sm" variant="outline">
                  Add Event
                </Button>
              </AddCustodyEventDialog>
            </div>

            {/* Timeline */}
            <div className="relative pl-8 space-y-6">
              {evidenceData.chainOfCustody.map((event: any, idx: number) => (
                <div key={idx} className="relative">
                  {/* Timeline line */}
                  {idx !== evidenceData.chainOfCustody.length - 1 && (
                    <div className="absolute left-[-1.4rem] top-6 w-0.5 h-full bg-gray-200" />
                  )}

                  {/* Timeline dot */}
                  <div className="absolute left-[-1.85rem] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />

                  {/* Event content */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">
                          {event.action}
                        </p>
                        <p className="text-sm text-gray-600">
                          by {event.officerName} ({event.officerBadge})
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.timestamp), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </p>
                      {event.notes && (
                        <p className="text-gray-700 mt-1">{event.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Handling Officers */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Handling Officers
            </h3>
            <div className="space-y-2">
              {evidenceData.chainOfCustody.map((event: any, index: number) => (
                <div
                  key={`${event.officerId}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium text-gray-900">{event.officerName}</p>
                    <p className="text-sm text-gray-600">{event.officerBadge}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.action} • {format(new Date(event.timestamp), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Evidence Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Evidence Information
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Type</dt>
                <dd className="mt-1">
                  <EvidenceTypeBadge type={evidenceData.type} size="md" />
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="mt-1">
                  <EvidenceStatusBadge status={evidenceData.status} size="md" />
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Sealed</dt>
                <dd className="mt-1">
                  {evidenceData.isSealed ? (
                    <div>
                      <Badge variant="default" className="bg-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        Sealed
                      </Badge>
                       <p className="text-xs text-gray-500 mt-1">
                         {evidenceData.sealedAt ? format(new Date(evidenceData.sealedAt), "PPP") : "Unknown"}
                       </p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600">
                      <ShieldAlert className="h-3 w-3 mr-1" />
                      Not Sealed
                    </Badge>
                  )}
                </dd>
              </div>
              {evidenceData.tags.length > 0 && (
                <div>
                  <dt className="text-gray-500">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {evidenceData.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
               <div>
                 <dt className="text-gray-500">Transfers</dt>
                 <dd className="font-medium text-gray-900 mt-1">
                   {evidenceData.getCustodyTransferCount()}
                 </dd>
               </div>
              <div>
                <dt className="text-gray-500">Created At</dt>
                <dd className="font-medium text-gray-900 mt-1">
                  {format(new Date(evidenceData.createdAt), "PPP")}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="font-medium text-gray-900 mt-1">
                  {format(new Date(evidenceData.updatedAt), "PPP p")}
                </dd>
              </div>
            </dl>
          </div>

          {/* QR Code Display */}
          <EvidenceQRCodeDisplay
            qrCode={evidenceData.qrCode}
            description={evidenceData.description}
            evidenceType={evidenceData.type}
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <EvidenceStatusChangeDialog
                evidenceId={evidenceData.id}
                currentStatus={evidenceData.status}
                qrCode={evidenceData.qrCode}
              >
                <Button variant="outline" className="w-full justify-start">
                  Update Status
                </Button>
              </EvidenceStatusChangeDialog>
              <EvidenceSealDialog
                evidenceId={evidenceData.id}
                qrCode={evidenceData.qrCode}
                isSealed={evidenceData.isSealed}
              />
              <AddCustodyEventDialog
                evidenceId={evidenceData.id}
                qrCode={evidenceData.qrCode}
              />
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
