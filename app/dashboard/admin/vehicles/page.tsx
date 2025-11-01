/**
 * Vehicles List Page
 *
 * Admin page for managing all vehicles
 * Pan-African Design: Multi-country vehicle management
 */
import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { container } from "@/src/di/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleList } from "@/components/vehicles";
import { Plus, Car, AlertTriangle, CheckCircle, Lock } from "lucide-react";

async function getVehiclesData() {
  const result = await container.vehicleService.searchVehicles({}, { page: 1, limit: 100 });
  const statusCounts = await container.vehicleService.countByStatus();

  const stats = {
    ...statusCounts,
    total: statusCounts.active + statusCounts.stolen + statusCounts.impounded + statusCounts.recovered,
  };

  return { vehicles: result.vehicles, stats };
}

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasPermission(session as any, "reports", "read", "station")) {
    redirect("/dashboard");
  }

  const { vehicles, stats } = await getVehiclesData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">
            Manage vehicle registrations and stolen vehicle tracking
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Register Vehicle
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Stolen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stolen}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-yellow-600" />
              Impounded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.impounded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
          <CardDescription>
            {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} registered in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleList vehicles={vehicles} />
        </CardContent>
      </Card>
    </div>
  );
}
