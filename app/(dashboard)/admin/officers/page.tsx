/**
 * Officers List Page
 *
 * Admin page for managing all officers
 * Pan-African Design: Efficient officer management
 */
import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageOfficers } from "@/lib/permissions";
import { container } from "@/src/di/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OfficerList } from "@/components/officers";
import { StatsCard, EmptyState } from "@/components/admin";
import { Plus, Users, UserCheck, UserX, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

async function getOfficersData() {
  const officers = await container.officerRepository.findAll({});
  const stats = await container.officerService.getStats();

  return { officers, stats };
}

export default async function OfficersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!canManageOfficers(session)) {
    redirect("/dashboard");
  }

  const { officers, stats } = await getOfficersData();

  // Get role and station info for each officer
  const officersWithDetails = await Promise.all(
    officers.map(async (officer) => {
      const role = await container.roleRepository.findById(officer.roleId);
      const station = await container.stationRepository.findById(officer.stationId);

      return {
        id: officer.id,
        badge: officer.badge,
        name: officer.name,
        email: officer.email,
        role: {
          name: role?.name || "Unknown",
          level: role?.level || 99,
        },
        station: {
          name: station?.name || "Unknown",
          code: station?.code || "N/A",
        },
        active: officer.active,
        lastLogin: officer.lastLogin,
        isLocked: officer.isLocked(),
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Officers</h1>
          <p className="text-muted-foreground">
            Manage police officers and their access
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/officers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Officer
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Officers"
          value={stats.total}
          icon={Users}
        />
        <StatsCard
          title="Active Officers"
          value={stats.active}
          icon={UserCheck}
          description={`${Math.round((stats.active / stats.total) * 100)}% of total`}
        />
        <StatsCard
          title="Inactive Officers"
          value={stats.inactive}
          icon={UserX}
          description={`${Math.round((stats.inactive / stats.total) * 100)}% of total`}
        />
        <StatsCard
          title="Locked Accounts"
          value={stats.locked}
          icon={Lock}
        />
      </div>

      {/* Officers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Officers</CardTitle>
          <CardDescription>
            View and manage all police officers in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {officers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No officers yet"
              description="Get started by adding your first officer to the system"
              actionLabel="Add Officer"
              onAction={() => {}}
            />
          ) : (
            <OfficerList officers={officersWithDetails} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
