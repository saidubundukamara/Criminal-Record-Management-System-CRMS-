/**
 * Vehicle Detail Page
 *
 * View vehicle details and perform actions
 * Pan-African Design: Clear vehicle information display
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { container } from "@/src/di/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Car,
  User,
  AlertTriangle,
  CheckCircle,
  Lock,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getVehicleData(id: string, officerId: string) {
  try {
    const vehicle = await container.vehicleService.getVehicleById(id, officerId);
    return vehicle;
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return null;
  }
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!hasPermission(session as any, "reports", "read", "station")) {
    redirect("/dashboard");
  }

  const vehicle = await getVehicleData(id, session.user.id);

  if (!vehicle) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>;
      case "stolen":
        return <Badge variant="outline" className="bg-red-50 text-red-700">Stolen</Badge>;
      case "impounded":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Impounded</Badge>;
      case "recovered":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Recovered</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
            <h1 className="text-3xl font-bold tracking-tight font-mono">{vehicle.licensePlate}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(vehicle.status)}
              <Badge variant="outline" className="capitalize">{vehicle.vehicleType}</Badge>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/admin/vehicles/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Vehicle
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">License Plate</div>
              <div className="font-mono font-semibold">{vehicle.licensePlate}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="capitalize">{vehicle.vehicleType}</div>
            </div>
            {vehicle.make && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Make & Model</div>
                  <div>{vehicle.make} {vehicle.model}</div>
                </div>
              </>
            )}
            {vehicle.year && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Year</div>
                  <div>{vehicle.year}</div>
                </div>
              </>
            )}
            {vehicle.color && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Color</div>
                  <div>{vehicle.color}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Owner Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Owner Name</div>
              <div>{vehicle.ownerName || "Not provided"}</div>
            </div>
            {vehicle.ownerNIN && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Owner NIN</div>
                  <div className="font-mono">{vehicle.ownerNIN}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Status Information */}
        {(vehicle.status === "stolen" || vehicle.status === "recovered") && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Status Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                {getStatusBadge(vehicle.status)}
              </div>
              {vehicle.stolenDate && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground">Stolen Date</div>
                    <div>{format(vehicle.stolenDate, "PPP")}</div>
                  </div>
                </>
              )}
              {vehicle.recoveredDate && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground">Recovered Date</div>
                    <div>{format(vehicle.recoveredDate, "PPP")}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {vehicle.status === "active" && (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Mark as Stolen
              </Button>
            )}
            {vehicle.status === "stolen" && !vehicle.recoveredDate && (
              <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Recovered
              </Button>
            )}
            {(vehicle.status === "active" || vehicle.status === "stolen") && (
              <Button variant="outline" size="sm" className="text-yellow-600 hover:text-yellow-700">
                <Lock className="mr-2 h-4 w-4" />
                Mark as Impounded
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Vehicle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
