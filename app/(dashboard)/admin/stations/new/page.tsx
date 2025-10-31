/**
 * New Station Page
 *
 * Page for creating a new station
 * Pan-African Design: Multi-country station creation
 */
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { StationForm, StationFormData } from "@/components/stations";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewStationPage() {
  const router = useRouter();

  const handleSubmit = async (data: StationFormData) => {
    const response = await fetch("/api/stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create station");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/stations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Station</h1>
          <p className="text-muted-foreground">
            Create a new police station
          </p>
        </div>
      </div>

      {/* Form */}
      <StationForm onSubmit={handleSubmit} mode="create" />
    </div>
  );
}
