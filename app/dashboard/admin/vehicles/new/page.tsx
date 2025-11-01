/**
 * New Vehicle Page
 *
 * Page for registering a new vehicle
 * Pan-African Design: Simple vehicle registration
 */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { VehicleForm, VehicleFormData } from "@/components/vehicles";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewVehiclePage() {
  const router = useRouter();
  const [stations, setStations] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const stationsRes = await fetch("/api/stations");

        if (stationsRes.ok) {
          const stationsData = await stationsRes.json();
          setStations(stationsData.stations || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSubmit = async (data: VehicleFormData) => {
    const response = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to register vehicle");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Register New Vehicle</h1>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Register New Vehicle</h1>
          <p className="text-muted-foreground">
            Add a new vehicle to the system
          </p>
        </div>
      </div>

      {/* Form */}
      <VehicleForm
        stations={stations}
        onSubmit={handleSubmit}
        mode="create"
      />
    </div>
  );
}
