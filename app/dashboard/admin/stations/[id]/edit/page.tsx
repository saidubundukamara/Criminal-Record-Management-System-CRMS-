/**
 * Edit Station Page
 *
 * Form for editing an existing station record
 * Pan-African Design: Clear, accessible form for station management
 */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { StationForm, StationFormData } from "@/components/stations/station-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditStationPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [station, setStation] = useState<(StationFormData & { id: string; countryCode: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/stations/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Station not found");
          } else {
            setError("Failed to load station data");
          }
          return;
        }

        const data = await response.json();

        // Transform station data to match form expectations
        setStation({
          id: data.station.id,
          code: data.station.code,
          name: data.station.name,
          location: data.station.location,
          district: data.station.district || "",
          region: data.station.region || "",
          phone: data.station.phone || "",
          email: data.station.email || "",
          latitude: data.station.latitude,
          longitude: data.station.longitude,
          countryCode: data.station.countryCode,
        });
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Failed to load station data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (formData: StationFormData) => {
    const response = await fetch(`/api/stations/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        location: formData.location,
        district: formData.district || undefined,
        region: formData.region || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update station");
    }

    return response.json();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/admin/stations/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Station
            </Link>
          </Button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin/stations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stations
            </Link>
          </Button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-red-600">{error || "Station not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/admin/stations/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Station
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Station</h1>
          <p className="text-gray-600 mt-2">
            Update the station details below
          </p>
        </div>

        <StationForm
          station={station}
          onSubmit={handleSubmit}
          mode="edit"
        />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Editing Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>All changes will be tracked in the audit log</li>
          <li>Station code cannot be changed after creation</li>
          <li>Updates to location and contact info are immediate</li>
          <li>GPS coordinates are optional but recommended for mapping</li>
        </ul>
      </div>

      {/* Multi-Country Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Pan-African Design</h3>
        <p className="text-sm text-yellow-800">
          This station is part of the {station.countryCode} deployment. All changes
          are logged and audited. Station information can be customized to match
          local administrative divisions and naming conventions.
        </p>
      </div>
    </div>
  );
}
