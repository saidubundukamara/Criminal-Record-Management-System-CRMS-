/**
 * Background Check Detail Page
 *
 * Displays detailed results of a background check
 * Pan-African Design: Shows criminal history and risk assessment
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { container } from "@/src/di/container";

async function getBackgroundCheck(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  try {
    const prisma = container.prismaClient;
    const check = await prisma.backgroundCheck.findUnique({
      where: { id },
    });

    return check as any;
  } catch (error) {
    console.error("Error fetching background check:", error);
    return null;
  }
}

export default async function BackgroundCheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const check = await getBackgroundCheck(id);

  if (!check) {
    notFound();
  }

  const isExpired = check.expiresAt && new Date(check.expiresAt) < new Date();
  const daysUntilExpiry = check.expiresAt
    ? Math.ceil((new Date(check.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/background-checks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Background Check</h1>
            <p className="text-gray-600 mt-1">NIN: {check.nin}</p>
          </div>
        </div>
        {check.certificateUrl && (
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            {check.result?.status === "clear" ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-lg font-bold ${
                check.result?.status === "clear" ? "text-green-600" : "text-red-600"
              }`}>
                {check.result?.status === "clear" ? "Clear" : "Record Found"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Request Type</p>
              <p className="text-lg font-bold text-gray-900 capitalize">{check.requestType}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Validity</p>
              <p className={`text-lg font-bold ${isExpired ? "text-red-600" : "text-gray-900"}`}>
                {isExpired ? "Expired" : daysUntilExpiry ? `${daysUntilExpiry} days` : "No expiry"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Result Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Check Result</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Message</p>
            <p className="text-base text-gray-900 mt-1">{check.result?.message}</p>
          </div>

          {check.result?.recordsCount !== undefined && check.result.recordsCount > 0 && (
            <div>
              <p className="text-sm text-gray-600">Records Found</p>
              <p className="text-base text-gray-900 mt-1">{check.result.recordsCount}</p>
            </div>
          )}

          {check.result?.riskLevel && (
            <div>
              <p className="text-sm text-gray-600">Risk Level</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  check.result.riskLevel === "high"
                    ? "bg-red-100 text-red-800"
                    : check.result.riskLevel === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {check.result.riskLevel.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Criminal History (if available) */}
      {check.result?.criminalHistory && check.result.criminalHistory.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Criminal History</h2>
          <div className="space-y-4">
            {check.result.criminalHistory.map((record: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{record.caseNumber}</p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          record.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : record.severity === "major"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {record.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Category: {record.category}</p>
                    <p className="text-sm text-gray-600">Status: {record.status}</p>
                    <p className="text-sm text-gray-500">
                      Incident Date: {new Date(record.incidentDate).toLocaleDateString()}
                    </p>
                    {record.outcome && (
                      <p className="text-sm text-gray-500">Outcome: {record.outcome}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Check Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Check ID</p>
            <p className="text-sm text-gray-900 mt-1 font-mono">{check.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Performed On</p>
            <p className="text-sm text-gray-900 mt-1">
              {new Date(check.createdAt).toLocaleString()}
            </p>
          </div>
          {check.issuedAt && (
            <div>
              <p className="text-sm text-gray-600">Issued At</p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(check.issuedAt).toLocaleString()}
              </p>
            </div>
          )}
          {check.expiresAt && (
            <div>
              <p className="text-sm text-gray-600">Expires At</p>
              <p className={`text-sm mt-1 ${isExpired ? "text-red-600" : "text-gray-900"}`}>
                {new Date(check.expiresAt).toLocaleString()}
                {isExpired && " (Expired)"}
              </p>
            </div>
          )}
          {check.ipAddress && (
            <div>
              <p className="text-sm text-gray-600">IP Address</p>
              <p className="text-sm text-gray-900 mt-1 font-mono">{check.ipAddress}</p>
            </div>
          )}
          {check.phoneNumber && (
            <div>
              <p className="text-sm text-gray-600">Phone Number</p>
              <p className="text-sm text-gray-900 mt-1">{check.phoneNumber}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      {check.requestType === "visa" && !check.certificateUrl && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">Certificate Available</h3>
              <p className="text-sm text-blue-700 mt-1">
                This is a visa request. You can generate an official certificate for this background check.
              </p>
              <Button className="mt-3" size="sm">
                Generate Certificate
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
