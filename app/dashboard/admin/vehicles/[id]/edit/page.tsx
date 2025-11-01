/**
 * Edit Vehicle Page
 *
 * Form for editing an existing vehicle record
 * Pan-African Design: Clear, accessible form for vehicle management
 */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { VehicleForm, VehicleFormData } from "@/components/vehicles/vehicle-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditVehiclePage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [vehicle, setVehicle] = useState<(VehicleFormData & { id: string }) | null>(null);
  const [stations, setStations] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [vehicleRes, stationsRes] = await Promise.all([
          fetch(`/api/vehicles/${id}`),
          fetch("/api/stations"),
        ]);

        if (!vehicleRes.ok) {
          if (vehicleRes.status === 404) {
            setError("Vehicle not found");
          } else {
            setError("Failed to load vehicle data");
          }
          return;
        }

        const vehicleData = await vehicleRes.json();
        setVehicle({
          id: vehicleData.vehicle.id,
          licensePlate: vehicleData.vehicle.licensePlate,
          ownerNIN: vehicleData.vehicle.ownerNIN || "",
          ownerName: vehicleData.vehicle.ownerName || "",
          vehicleType: vehicleData.vehicle.vehicleType,
          make: vehicleData.vehicle.make || "",
          model: vehicleData.vehicle.model || "",
          color: vehicleData.vehicle.color || "",
          year: vehicleData.vehicle.year,
          notes: vehicleData.vehicle.notes || "",
          stationId: vehicleData.vehicle.stationId,
        });

        if (stationsRes.ok) {
          const stationsData = await stationsRes.json();
          setStations(stationsData.stations || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Failed to load vehicle data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (formData: VehicleFormData) => {
    const response = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update vehicle");
    }

    return response.json();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/admin/vehicles/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vehicle
            </Link>
          </Button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin/vehicles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vehicles
            </Link>
          </Button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-red-600">{error || "Vehicle not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/admin/vehicles/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicle
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
          <p className="text-gray-600 mt-2">
            Update the vehicle details below
          </p>
        </div>

        <VehicleForm
          vehicle={vehicle}
          stations={stations}
          onSubmit={handleSubmit}
          mode="edit"
        />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Editing Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>All changes will be tracked in the audit log</li>
          <li>License plate cannot be changed after registration</li>
          <li>Update owner information if vehicle ownership changes</li>
          <li>Status changes (stolen, recovered, impounded) are done via Quick Actions</li>
        </ul>
      </div>
    </div>
  );
}
