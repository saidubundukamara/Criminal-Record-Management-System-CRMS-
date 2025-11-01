/**
 * Station Detail Page
 *
 * View station details and perform actions
 * Pan-African Design: Clear station information display
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageStations } from "@/lib/permissions";
import { container } from "@/src/di/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StationCodeBadge } from "@/components/stations";
import { ActiveBadge } from "@/components/admin";
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Map,
  Users,
  Ban,
  CheckCircle,
  Building2,
} from "lucide-react";
import { format } from "date-fns";

interface StationDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getStationData(id: string) {
  try {
    const station = await container.stationService.getStation(id);

    // Get officer count for this station
    const officers = await container.officerRepository.findByStationId(id);

    return {
      station,
      officerCount: officers.length,
    };
  } catch (error) {
    console.error("Error fetching station:", error);
    return null;
  }
}

export default async function StationDetailPage({ params }: StationDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!canManageStations(session)) {
    redirect("/dashboard");
  }

  const data = await getStationData(id);
  if (!data || !data.station) {
    notFound();
  }

  const { station, officerCount } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/stations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{station.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StationCodeBadge code={station.code} size="sm" />
              <ActiveBadge active={station.active} size="sm" />
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/admin/stations/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Station
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
              <div className="text-sm text-muted-foreground">Station Code</div>
              <div className="font-mono font-semibold">{station.code}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Station Name</div>
              <div className="font-medium">{station.name}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </div>
              <div className="text-sm">{station.location}</div>
            </div>
            {(station.district || station.region) && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Region/District</div>
                  <div className="text-sm">
                    {station.region && <div>{station.region}</div>}
                    {station.district && (
                      <div className="text-muted-foreground">{station.district}</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone
              </div>
              <div className="text-sm">{station.phone || "Not provided"}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </div>
              <div className="text-sm">{station.email || "Not provided"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Coordinates */}
        {(station.latitude || station.longitude) && (
          <Card>
            <CardHeader>
              <CardTitle>Geographic Coordinates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Map className="h-3 w-3" />
                  GPS Coordinates
                </div>
                <div className="text-sm font-mono">
                  {station.latitude && <div>Lat: {station.latitude}</div>}
                  {station.longitude && <div>Long: {station.longitude}</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                Assigned Officers
              </div>
              <div className="text-2xl font-bold">{officerCount}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <ActiveBadge active={station.active} />
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Country</div>
              <Badge variant="outline" className="font-mono">
                {station.countryCode}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {station.active ? (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Ban className="mr-2 h-4 w-4" />
                Deactivate Station
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate Station
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/admin/officers?station=${id}`}>
                <Users className="mr-2 h-4 w-4" />
                View Officers
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
