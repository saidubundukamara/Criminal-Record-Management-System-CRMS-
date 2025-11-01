/**
 * Amber Alert Detail Page
 *
 * Displays full details of an amber alert and allows marking as found
 * Pan-African Design: USSD-compatible missing children alert system
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
  Clock,
  MapPin,
  Phone,
  Calendar,
  Info,
} from "lucide-react";
import { container } from "@/src/di/container";
import { AmberResolveDialog } from "@/components/alerts/amber-resolve-dialog";

async function getAmberAlert(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    const prisma = container.prismaClient;
    const alert = await prisma.amberAlert.findUnique({
      where: { id },
    });

    return alert as any;
  } catch (error) {
    console.error("Error fetching amber alert:", error);
    return null;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-red-100 text-red-800";
    case "found":
      return "bg-green-100 text-green-800";
    case "expired":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function AmberAlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const alert = await getAmberAlert(id);

  if (!alert) {
    notFound();
  }

  const daysMissing = alert.lastSeenDate
    ? Math.ceil((new Date().getTime() - new Date(alert.lastSeenDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const daysUntilExpiry = alert.expiresAt
    ? Math.ceil((new Date(alert.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
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
            <h1 className="text-3xl font-bold text-gray-900">Amber Alert</h1>
            <p className="text-gray-600 mt-1">{alert.personName}</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {alert.status === "active" && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">ACTIVE AMBER ALERT</h3>
              <p className="text-sm text-red-700 mt-1">
                This child is currently missing. If you have any information, please contact the number below immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {alert.status === "found" && alert.foundAt && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">CHILD FOUND SAFE</h3>
              <p className="text-sm text-green-700 mt-1">
                Found on {new Date(alert.foundAt).toLocaleDateString()} at{" "}
                {new Date(alert.foundAt).toLocaleTimeString()}
              </p>
              {alert.foundLocation && (
                <p className="text-sm text-green-700">Location: {alert.foundLocation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo and Basic Info Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {alert.photoUrl ? (
              <img
                src={alert.photoUrl}
                alt={alert.personName}
                className="w-48 h-48 rounded-lg object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-48 h-48 rounded-lg bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                <User className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{alert.personName}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(alert.status)}`}>
                  {alert.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {alert.age !== null && (
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="text-lg font-semibold text-gray-900">{alert.age} years old</p>
                </div>
              )}
              {alert.gender && (
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{alert.gender}</p>
                </div>
              )}
              {daysMissing !== null && (
                <div>
                  <p className="text-sm text-gray-600">Days Missing</p>
                  <p className={`text-lg font-semibold ${daysMissing > 7 ? "text-red-600" : "text-orange-600"}`}>
                    {daysMissing} {daysMissing === 1 ? "day" : "days"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Description */}
      {alert.description && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Physical Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{alert.description}</p>
        </Card>
      )}

      {/* Last Seen Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Seen Information</h3>
        <div className="space-y-3">
          {alert.lastSeenLocation && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="text-base text-gray-900">{alert.lastSeenLocation}</p>
              </div>
            </div>
          )}
          {alert.lastSeenDate && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="text-base text-gray-900">
                  {new Date(alert.lastSeenDate).toLocaleDateString()} at{" "}
                  {new Date(alert.lastSeenDate).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Contact Information</h3>
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm text-blue-700">If you have any information, please call:</p>
            <p className="text-xl font-bold text-blue-900 mt-1">{alert.contactPhone}</p>
          </div>
        </div>
      </Card>

      {/* Broadcast Message (USSD) */}
      {alert.broadcastMessage && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">USSD Broadcast Message</h3>
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
            {alert.broadcastMessage}
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
            <p className="text-sm text-gray-900 mt-1 font-mono">{alert.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Published On</p>
            <p className="text-sm text-gray-900 mt-1">
              {new Date(alert.createdAt).toLocaleString()}
            </p>
          </div>
          {alert.publishedAt && (
            <div>
              <p className="text-sm text-gray-600">Broadcast At</p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(alert.publishedAt).toLocaleString()}
              </p>
            </div>
          )}
          {alert.expiresAt && (
            <div>
              <p className="text-sm text-gray-600">Expires At</p>
              <p className={`text-sm mt-1 ${daysUntilExpiry && daysUntilExpiry < 7 ? "text-red-600" : "text-gray-900"}`}>
                {new Date(alert.expiresAt).toLocaleString()}
                {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                  <span className="ml-2">({daysUntilExpiry} days remaining)</span>
                )}
                {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
                  <span className="ml-2 text-red-600">(Expired)</span>
                )}
              </p>
            </div>
          )}
          {alert.updatedAt && (
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(alert.updatedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      {alert.status === "active" && (
        <div className="flex gap-3">
          <Link href={`/dashboard/alerts`} className="flex-1">
            <Button variant="outline" className="w-full">
              View All Alerts
            </Button>
          </Link>
          <div className="flex-1">
            <AmberResolveDialog alertId={alert.id} personName={alert.personName} />
          </div>
        </div>
      )}
    </div>
  );
}
