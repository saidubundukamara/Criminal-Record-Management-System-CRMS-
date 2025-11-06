/**
 * New Vehicle Page
 *
 * Page for registering a new vehicle
 * Pan-African Design: Simple vehicle registration
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";

const vehicleTypes = [
  "car",
  "truck",
  "motorcycle",
  "bus",
  "van",
  "bicycle",
  "tricycle",
  "other"
];

export default function NewVehiclePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    licensePlate: "",
    ownerNIN: "",
    ownerName: "",
    vehicleType: "car",
    make: "",
    model: "",
    color: "",
    year: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload: any = {
        licensePlate: formData.licensePlate,
        vehicleType: formData.vehicleType,
        stationId: (session?.user as any)?.stationId, // Use officer's station
      };

      if (formData.ownerNIN) payload.ownerNIN = formData.ownerNIN;
      if (formData.ownerName) payload.ownerName = formData.ownerName;
      if (formData.make) payload.make = formData.make;
      if (formData.model) payload.model = formData.model;
      if (formData.color) payload.color = formData.color;
      if (formData.year) payload.year = parseInt(formData.year, 10);
      if (formData.notes) payload.notes = formData.notes;

      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create vehicle");
      }

      const result = await response.json();
      router.push(`/dashboard/admin/vehicles/${result.vehicle.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

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
          <p className="text-muted-foreground mt-2">Add a vehicle to the registry</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="licensePlate">License Plate *</Label>
                <Input
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  required
                  placeholder="e.g., SL-A-1234"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the vehicle's license plate number
                </p>
              </div>

              <div>
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {vehicleTypes.map(type => (
                    <option key={type} value={type} className="capitalize">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  placeholder="e.g., Toyota"
                />
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., Corolla"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g., Silver"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owner Information */}
        <Card>
          <CardHeader>
            <CardTitle>Owner Information (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Full name of vehicle owner"
              />
            </div>

            <div>
              <Label htmlFor="ownerNIN">National ID (NIN)</Label>
              <Input
                id="ownerNIN"
                name="ownerNIN"
                value={formData.ownerNIN}
                onChange={handleChange}
                placeholder="Owner's National Identification Number"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the owner's NIN for cross-reference with person records
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information about this vehicle..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/admin/vehicles")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Register Vehicle
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Vehicle Registration</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>License plate is required and must be unique</li>
          <li>Owner information can be added now or later</li>
          <li>Vehicle status will be set to "Active" by default</li>
          <li>You can mark vehicles as stolen, recovered, or impounded after registration</li>
        </ul>
      </div>
    </div>
  );
}
