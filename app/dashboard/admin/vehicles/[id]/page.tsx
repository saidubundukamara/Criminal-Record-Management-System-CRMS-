/**
 * Vehicle Detail Page
 *
 * View vehicle details and perform actions
 * Pan-African Design: Clear vehicle information display
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, AlertTriangle, Check, Package, Edit, ArrowLeft, Calendar, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { container } from "@/src/di/container";

export const metadata = {
  title: "Vehicle Details | CRMS",
  description: "View vehicle information and manage status",
};

async function getVehicle(id: string) {
  try {
    const vehicle = await container.vehicleRepository.findById(id);
    if (!vehicle) return null;

    // Fetch station information
    const station = await container.stationRepository.findById(vehicle.stationId);

    return {
      ...vehicle.toJSON(),
      station: station ? {
        id: station.id,
        name: station.name,
        code: station.code,
      } : null,
    } as any;
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return null;
  }
}

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const vehicle = await getVehicle(id);

  if (!vehicle) {
    notFound();
  }

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
        return <AlertTriangle className="h-4 w-4" />;
      case "active":
        return <Check className="h-4 w-4" />;
      case "impounded":
        return <Package className="h-4 w-4" />;
      case "recovered":
        return <Check className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight font-mono">{vehicle.licensePlate}</h1>
              <Badge {...getStatusBadge(vehicle.status)}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(vehicle.status)}
                  {vehicle.status.toUpperCase()}
                </span>
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              {vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/admin/vehicles/${vehicle.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Vehicle
          </Link>
        </Button>
      </div>

      {/* Main Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Vehicle Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">License Plate</p>
                <p className="font-mono font-bold text-lg">{vehicle.licensePlate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{vehicle.vehicleType}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Make</p>
                <p className="font-medium">{vehicle.make || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-medium">{vehicle.model || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium">{vehicle.year || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="font-medium capitalize">{vehicle.color || "—"}</p>
              </div>
            </div>

            {vehicle.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm bg-gray-50 p-3 rounded border">{vehicle.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Owner Name</p>
              <p className="font-medium text-lg">{vehicle.ownerName || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">National ID (NIN)</p>
              <p className="font-mono font-medium">{vehicle.ownerNIN || "—"}</p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                <MapPin className="h-3 w-3" />
                Registered Station
              </p>
              <p className="font-medium">{vehicle.station?.name || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Information */}
      {(vehicle.status === "stolen" || vehicle.status === "recovered") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              {vehicle.status === "stolen" ? "Stolen Vehicle Alert" : "Recovered Vehicle Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {vehicle.stolenDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Date Reported Stolen</p>
                  <p className="font-medium">{format(new Date(vehicle.stolenDate), "PPP")}</p>
                </div>
              )}
              {vehicle.recoveredDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Date Recovered</p>
                  <p className="font-medium">{format(new Date(vehicle.recoveredDate), "PPP")}</p>
                </div>
              )}
            </div>

            {vehicle.stolenReportedBy && (
              <div>
                <p className="text-sm text-muted-foreground">Reported By Officer</p>
                <p className="font-mono text-sm">{vehicle.stolenReportedBy}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {vehicle.status === "active" && (
              <form action={`/api/vehicles/${vehicle.id}/stolen`} method="POST">
                <Button type="submit" variant="destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Mark as Stolen
                </Button>
              </form>
            )}

            {vehicle.status === "stolen" && (
              <form action={`/api/vehicles/${vehicle.id}/recovered`} method="POST">
                <Button type="submit" variant="default">
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Recovered
                </Button>
              </form>
            )}

            <Button variant="outline" asChild>
              <Link href={`/dashboard/admin/vehicles/${vehicle.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created {format(new Date(vehicle.createdAt), "PPP")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Updated {format(new Date(vehicle.updatedAt), "PPP")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
