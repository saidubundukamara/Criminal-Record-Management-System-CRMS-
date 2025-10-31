/**
 * New Officer Page
 *
 * Page for creating a new officer
 * Pan-African Design: Simple officer creation
 */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { OfficerForm, OfficerFormData } from "@/components/officers";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewOfficerPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Array<{ id: string; name: string; level: number }>>([]);
  const [stations, setStations] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [rolesRes, stationsRes] = await Promise.all([
          fetch("/api/roles"),
          fetch("/api/stations"),
        ]);

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setRoles(rolesData.roles || []);
        }

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

  const handleSubmit = async (data: OfficerFormData) => {
    // Send PIN as plaintext - API route will hash it server-side
    const response = await fetch("/api/officers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        badge: data.badge,
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        pin: data.pin || "12345678",
        roleId: data.roleId,
        stationId: data.stationId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create officer");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/admin/officers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Officer</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/officers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Officer</h1>
          <p className="text-muted-foreground">
            Create a new police officer account
          </p>
        </div>
      </div>

      {/* Form */}
      <OfficerForm
        roles={roles}
        stations={stations}
        onSubmit={handleSubmit}
        mode="create"
      />
    </div>
  );
}
