/**
 * Stations List Page
 *
 * Admin page for managing all stations
 * Pan-African Design: Multi-country station management
 */
import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageStations } from "@/lib/permissions";
import { container } from "@/src/di/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StationList } from "@/components/stations";
import { StatsCard, EmptyState } from "@/components/admin";
import { Plus, Building2, CheckCircle, XCircle } from "lucide-react";

async function getStationsData() {
  const stations = await container.stationRepository.findAll({});
  const stats = await container.stationService.getStats();

  // Get officer count for each station
  const stationsWithCounts = await Promise.all(
    stations.map(async (station) => {
      const officers = await container.officerRepository.findAll({
        stationId: station.id,
      });

      return {
        ...station,
        officerCount: officers.length,
      };
    })
  );

  return { stations: stationsWithCounts, stats };
}

export default async function StationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!canManageStations(session)) {
    redirect("/dashboard");
  }

  const { stations, stats } = await getStationsData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stations</h1>
          <p className="text-muted-foreground">
            Manage police stations and facilities
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/stations/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Station
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Stations"
          value={stats.total}
          icon={Building2}
        />
        <StatsCard
          title="Active Stations"
          value={stats.active}
          icon={CheckCircle}
          description={`${Math.round((stats.active / stats.total) * 100)}% of total`}
        />
        <StatsCard
          title="Inactive Stations"
          value={stats.inactive}
          icon={XCircle}
          description={`${Math.round((stats.inactive / stats.total) * 100)}% of total`}
        />
      </div>

      {/* Stations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Stations</CardTitle>
          <CardDescription>
            View and manage all police stations in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stations.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No stations yet"
              description="Get started by adding your first police station to the system"
              actionLabel="Add Station"
              onAction={() => {}}
            />
          ) : (
            <StationList stations={stations} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
