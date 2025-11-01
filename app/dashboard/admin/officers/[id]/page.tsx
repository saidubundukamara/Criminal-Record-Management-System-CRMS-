/**
 * Officer Detail Page
 *
 * View officer details and perform actions
 * Pan-African Design: Clear officer information display
 */
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageOfficers } from "@/lib/permissions";
import { container } from "@/src/di/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OfficerBadge, OfficerRoleBadge } from "@/components/officers";
import { ActiveBadge } from "@/components/admin";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  Key,
  Ban,
  CheckCircle,
  Shield,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface OfficerDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getOfficerData(id: string) {
  const officer = await container.officerService.getOfficer(id);
  if (!officer) return null;

  const role = await container.roleRepository.findById(officer.roleId);
  const station = await container.stationRepository.findById(officer.stationId);

  return { officer, role, station };
}

export default async function OfficerDetailPage({ params }: OfficerDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!canManageOfficers(session)) {
    redirect("/dashboard");
  }

  const data = await getOfficerData(id);
  if (!data) {
    notFound();
  }

  const { officer, role, station } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/officers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{officer.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <OfficerBadge badge={officer.badge} size="sm" />
              <ActiveBadge active={officer.active} size="sm" />
              {officer.isLocked() && (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/admin/officers/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Officer
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
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
            {officer.email && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </div>
                  <div className="text-sm">{officer.email}</div>
                </div>
              </>
            )}
            {officer.phone && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone
                  </div>
                  <div className="text-sm">{officer.phone}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Role
              </div>
              {role && (
                <OfficerRoleBadge roleName={role.name} roleLevel={role.level} />
              )}
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Station
              </div>
              {station && (
                <div>
                  <div className="font-medium">{station.name}</div>
                  <div className="text-sm text-muted-foreground font-mono">{station.code}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card>
          <CardHeader>
            <CardTitle>Security Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Account Status</div>
              <ActiveBadge active={officer.active} />
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Failed Login Attempts</div>
              <div className="font-semibold">{officer.failedAttempts}</div>
            </div>
            {officer.isLocked() && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Locked Until</div>
                  <div className="text-sm font-medium text-red-600">
                    {officer.lockedUntil && format(officer.lockedUntil, "PPpp")}
                  </div>
                </div>
              </>
            )}
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">MFA Enabled</div>
              <Badge variant={officer.mfaEnabled ? "default" : "secondary"}>
                {officer.mfaEnabled ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Last Login
              </div>
              <div className="text-sm">
                {officer.lastLogin
                  ? formatDistanceToNow(officer.lastLogin, { addSuffix: true })
                  : "Never"}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">PIN Changed</div>
              <div className="text-sm">
                {formatDistanceToNow(officer.pinChangedAt, { addSuffix: true })}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Account Created</div>
              <div className="text-sm">{format(officer.createdAt, "PPP")}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Perform administrative actions on this officer account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {officer.isLocked() && (
              <Button variant="outline" size="sm">
                <Unlock className="mr-2 h-4 w-4" />
                Unlock Account
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Key className="mr-2 h-4 w-4" />
              Reset PIN
            </Button>
            {officer.active ? (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Ban className="mr-2 h-4 w-4" />
                Deactivate Officer
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate Officer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
