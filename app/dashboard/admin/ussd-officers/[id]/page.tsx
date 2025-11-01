/**
 * USSD Officer Detail Page
 *
 * View officer USSD profile and perform actions
 * Pan-African Design: Clear USSD officer information display
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageOfficers } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Phone,
  Calendar,
  Activity,
  FileText,
  Power,
  Key,
  Shield,
  MapPin,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface USSDOfficerDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getUSSDOfficerData(id: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ussd-officers/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching USSD officer:", error);
    return null;
  }
}

export default async function USSDOfficerDetailPage({ params }: USSDOfficerDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!canManageOfficers(session)) {
    redirect("/dashboard");
  }

  const data = await getUSSDOfficerData(id);
  if (!data || !data.officer) {
    notFound();
  }

  const { officer } = data;
  const isRegistered = !!officer.ussdPhoneNumber;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/ussd-officers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{officer.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="font-mono">
                {officer.badge}
              </Badge>
              {isRegistered && (
                <Badge variant={officer.ussdEnabled ? "default" : "secondary"}>
                  {officer.ussdEnabled ? "USSD Enabled" : "USSD Disabled"}
                </Badge>
              )}
              {!isRegistered && (
                <Badge variant="outline" className="bg-gray-100">
                  Not Registered
                </Badge>
              )}
            </div>
          </div>
        </div>
        {isRegistered && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/admin/ussd-officers/${id}/logs`}>
                <FileText className="mr-2 h-4 w-4" />
                View Logs
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/dashboard/admin/ussd-officers/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Settings
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Officer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Badge Number</div>
              <div className="font-mono font-semibold">{officer.badge}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Full Name</div>
              <div className="font-medium">{officer.name}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Role
              </div>
              <div className="text-sm">
                {officer.roleName} (Level {officer.roleLevel})
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Station
              </div>
              <div className="font-medium">{officer.stationName}</div>
              <div className="text-xs text-muted-foreground font-mono">{officer.stationCode}</div>
            </div>
          </CardContent>
        </Card>

        {/* USSD Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>USSD Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                USSD Phone Number
              </div>
              <div className="font-mono text-sm">
                {officer.ussdPhoneNumber || (
                  <span className="text-muted-foreground">Not registered</span>
                )}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Power className="h-3 w-3" />
                Status
              </div>
              <Badge variant={officer.ussdEnabled ? "default" : "secondary"}>
                {officer.ussdEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Daily Query Limit
              </div>
              <div className="text-2xl font-bold">{officer.ussdDailyLimit}</div>
            </div>
            {officer.ussdRegisteredAt && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Registered
                  </div>
                  <div className="text-sm">
                    {format(new Date(officer.ussdRegisteredAt), "PPP")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(officer.ussdRegisteredAt), { addSuffix: true })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Queries Today</div>
              <div className="text-3xl font-bold">{officer.queriesToday}</div>
              <div className="text-xs text-muted-foreground">
                of {officer.ussdDailyLimit} limit
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Total Queries</div>
              <div className="text-3xl font-bold">{officer.totalQueries}</div>
              <div className="text-xs text-muted-foreground">All time</div>
            </div>
            {officer.ussdLastUsed && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Last Used</div>
                  <div className="text-sm">
                    {format(new Date(officer.ussdLastUsed), "PPP p")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(officer.ussdLastUsed), { addSuffix: true })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {isRegistered && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/admin/ussd-officers/${id}/logs`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Query Logs
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Key className="mr-2 h-4 w-4" />
                    Reset Quick PIN
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={officer.ussdEnabled ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                  >
                    <Power className="mr-2 h-4 w-4" />
                    {officer.ussdEnabled ? "Disable USSD" : "Enable USSD"}
                  </Button>
                </>
              )}
              {!isRegistered && (
                <div className="text-sm text-muted-foreground">
                  Officer must register via USSD first before actions are available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">USSD Access Information</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Officers register for USSD by dialing the shortcode from their phone</li>
          <li>Quick PIN is a 4-digit code for fast authentication via USSD</li>
          <li>Daily query limit helps manage system load and prevent abuse</li>
          <li>All queries are logged for audit and security purposes</li>
        </ul>
      </div>
    </div>
  );
}
