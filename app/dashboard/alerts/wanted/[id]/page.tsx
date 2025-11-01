/**
 * Wanted Person Detail Page
 *
 * Displays full details of a wanted person alert and allows marking as captured
 * Pan-African Design: Regional cross-border alert system
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Calendar,
  Award,
  FileText,
  Globe,
} from "lucide-react";
import { container } from "@/src/di/container";
import { WantedCaptureDialog } from "@/components/alerts/wanted-capture-dialog";

async function getWantedPerson(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    const prisma = container.prismaClient;
    const wanted = await prisma.wantedPerson.findUnique({
      where: { id },
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true,
            dob: true,
            gender: true,
          },
        },
      },
    });

    return wanted as any;
  } catch (error) {
    console.error("Error fetching wanted person:", error);
    return null;
  }
}

function getDangerColor(dangerLevel: string) {
  switch (dangerLevel) {
    case "extreme":
      return "bg-red-600 text-white";
    case "high":
      return "bg-red-500 text-white";
    case "medium":
      return "bg-orange-500 text-white";
    case "low":
      return "bg-yellow-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function getPriorityColor(priority: number) {
  if (priority >= 90) return "text-red-600";
  if (priority >= 70) return "text-orange-600";
  if (priority >= 50) return "text-yellow-600";
  return "text-gray-600";
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-red-100 text-red-800";
    case "captured":
      return "bg-green-100 text-green-800";
    case "expired":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function WantedPersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const wanted = await getWantedPerson(id);

  if (!wanted) {
    notFound();
  }

  const person = wanted.person;
  const daysAtLarge = wanted.publishedAt
    ? Math.ceil((new Date().getTime() - new Date(wanted.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/alerts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wanted Person Alert</h1>
            <p className="text-gray-600 mt-1">
              {person?.firstName} {person?.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {wanted.status === "active" && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">ACTIVE WANTED ALERT</h3>
              <p className="text-sm text-red-700 mt-1">
                This person is wanted. Do not approach if dangerous. Contact law enforcement immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {wanted.status === "captured" && wanted.capturedAt && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">CAPTURED</h3>
              <p className="text-sm text-green-700 mt-1">
                Captured on {new Date(wanted.capturedAt).toLocaleDateString()} at{" "}
                {new Date(wanted.capturedAt).toLocaleTimeString()}
              </p>
              {wanted.capturedLocation && (
                <p className="text-sm text-green-700">Location: {wanted.capturedLocation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Person Info Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Photo Placeholder */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 rounded-lg bg-gray-200 flex items-center justify-center border-4 border-gray-300">
              <User className="h-24 w-24 text-gray-400" />
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
              Photo from person record
            </p>
          </div>

          {/* Person Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {person?.firstName} {person?.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(wanted.status)}`}>
                  {wanted.status.toUpperCase()}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getDangerColor(wanted.dangerLevel)}`}>
                  {wanted.dangerLevel.toUpperCase()} DANGER
                </span>
                {wanted.regionalAlert && (
                  <span className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800 font-medium">
                    REGIONAL ALERT
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">NIN</p>
                <p className="text-base font-semibold text-gray-900">
                  {person?.nin || "Not available"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority Score</p>
                <p className={`text-base font-bold ${getPriorityColor(wanted.priority)}`}>
                  {wanted.priority} / 100
                </p>
              </div>
              {person?.dateOfBirth && (
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="text-base text-gray-900">
                    {new Date(person.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              )}
              {person?.gender && (
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="text-base text-gray-900 capitalize">{person.gender}</p>
                </div>
              )}
              {daysAtLarge !== null && wanted.status === "active" && (
                <div>
                  <p className="text-sm text-gray-600">Days at Large</p>
                  <p className={`text-base font-semibold ${daysAtLarge > 30 ? "text-red-600" : "text-orange-600"}`}>
                    {daysAtLarge} {daysAtLarge === 1 ? "day" : "days"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Charges */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Criminal Charges
        </h3>
        <p className="text-gray-700 whitespace-pre-wrap">{wanted.charges}</p>
        {wanted.warrantNumber && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Warrant Number</p>
            <p className="text-base font-mono text-gray-900 mt-1">{wanted.warrantNumber}</p>
          </div>
        )}
      </Card>

      {/* Reward Information */}
      {wanted.rewardAmount && wanted.rewardAmount > 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">Reward Offered</h3>
              <p className="text-3xl font-bold text-yellow-700 mt-1">
                ${wanted.rewardAmount.toLocaleString()} USD
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                For information leading to the capture and arrest of this individual
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Last Seen Information */}
      {(wanted.lastSeenLocation || wanted.lastSeenDate) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Known Information</h3>
          <div className="space-y-3">
            {wanted.lastSeenLocation && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Last Seen Location</p>
                  <p className="text-base text-gray-900">{wanted.lastSeenLocation}</p>
                </div>
              </div>
            )}
            {wanted.lastSeenDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Last Seen Date & Time</p>
                  <p className="text-base text-gray-900">
                    {new Date(wanted.lastSeenDate).toLocaleDateString()} at{" "}
                    {new Date(wanted.lastSeenDate).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Regional Alert Info */}
      {wanted.regionalAlert && (
        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <Globe className="h-6 w-6 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900">Regional Cross-Border Alert</h3>
              <p className="text-sm text-purple-700 mt-1">
                This alert has been broadcast to ECOWAS member states including Sierra Leone, Guinea, Liberia, Ghana, Nigeria, and others.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Broadcast Message (USSD) */}
      {wanted.broadcastMessage && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">USSD Broadcast Message</h3>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
            {wanted.broadcastMessage}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This message is broadcast via USSD to feature phones across the region
          </p>
        </Card>
      )}

      {/* Alert Metadata */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Alert ID</p>
            <p className="text-sm text-gray-900 mt-1 font-mono">{wanted.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created On</p>
            <p className="text-sm text-gray-900 mt-1">
              {new Date(wanted.createdAt).toLocaleString()}
            </p>
          </div>
          {wanted.publishedAt && (
            <div>
              <p className="text-sm text-gray-600">Published At</p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(wanted.publishedAt).toLocaleString()}
              </p>
            </div>
          )}
          {wanted.updatedAt && (
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(wanted.updatedAt).toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Person Record</p>
            <Link href={`/dashboard/persons/${person?.id}`} className="text-sm text-blue-600 hover:underline mt-1 block">
              View full person record →
            </Link>
          </div>
        </div>
      </Card>

      {/* Actions */}
      {wanted.status === "active" && (
        <div className="flex gap-3">
          <Link href="/dashboard/alerts" className="flex-1">
            <Button variant="outline" className="w-full">
              View All Wanted Persons
            </Button>
          </Link>
          <div className="flex-1">
            <WantedCaptureDialog
              wantedId={wanted.id}
              personName={`${person?.firstName} ${person?.lastName}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
