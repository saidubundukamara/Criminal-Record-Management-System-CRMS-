/**
 * Vehicles List Page
 *
 * Admin page for managing all vehicles
 * Pan-African Design: Multi-country vehicle management
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, AlertTriangle, Check, Package, Plus, Eye, Download } from "lucide-react";
import { container } from "@/src/di/container";

export const metadata = {
  title: "Vehicle Management | CRMS",
  description: "Manage vehicle records and stolen vehicle alerts",
};

async function getVehicles() {
  try {
    const result = await container.vehicleRepository.search({}, { limit: 1000 });
    return result.vehicles;
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
}

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login");
  }

  const vehicles = await getVehicles();

  // Calculate statistics
  const stats = {
    total: vehicles.length,
    active: vehicles.filter((v: any) => v.status === "active").length,
    stolen: vehicles.filter((v: any) => v.status === "stolen").length,
    recovered: vehicles.filter((v: any) => v.status === "recovered").length,
    impounded: vehicles.filter((v: any) => v.status === "impounded").length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
      stolen: { variant: "destructive", className: "" },
      recovered: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
      impounded: { variant: "secondary", className: "" },
    };
    return variants[status] || variants.active;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "stolen":
        return <AlertTriangle className="h-3 w-3" />;
      case "active":
        return <Check className="h-3 w-3" />;
      case "impounded":
        return <Package className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Management</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage vehicle records including stolen vehicle alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/api/vehicles/export">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/admin/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stolen</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.stolen}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovered</CardTitle>
            <Check className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recovered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impounded</CardTitle>
            <Package className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.impounded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No vehicles registered yet</p>
              <p className="text-sm mt-2">Add your first vehicle to start tracking</p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/admin/vehicles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Plate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vehicles.map((vehicle: any) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-lg">{vehicle.licensePlate}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vehicle.year} {vehicle.color && `• ${vehicle.color}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div>{vehicle.ownerName || "—"}</div>
                          {vehicle.ownerNIN && (
                            <div className="text-muted-foreground font-mono text-xs">{vehicle.ownerNIN}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge {...getStatusBadge(vehicle.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(vehicle.status)}
                            {vehicle.status.toUpperCase()}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">{vehicle.vehicleType}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/admin/vehicles/${vehicle.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Vehicle Management Features</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Track vehicle ownership and registration details</li>
          <li>Mark vehicles as stolen and alert officers via USSD</li>
          <li>Record recovered vehicles and impounded property</li>
          <li>Export vehicle records for reporting and analysis</li>
        </ul>
      </div>
    </div>
  );
}
