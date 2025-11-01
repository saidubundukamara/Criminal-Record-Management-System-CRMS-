/**
 * Vehicle Form Component
 *
 * Form for creating and editing vehicles
 * Pan-African Design: Simple, clear form for vehicle registration
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export interface VehicleFormData {
  licensePlate: string;
  ownerNIN?: string;
  ownerName?: string;
  vehicleType: string;
  make?: string;
  model?: string;
  color?: string;
  year?: number;
  notes?: string;
  stationId?: string;
}

interface VehicleFormProps {
  vehicle?: VehicleFormData & { id: string };
  stations?: Array<{ id: string; name: string; code: string }>;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  mode: "create" | "edit";
}

export function VehicleForm({
  vehicle,
  stations,
  onSubmit,
  mode,
}: VehicleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<VehicleFormData>({
    defaultValues: {
      licensePlate: vehicle?.licensePlate || "",
      ownerNIN: vehicle?.ownerNIN || "",
      ownerName: vehicle?.ownerName || "",
      vehicleType: vehicle?.vehicleType || "",
      make: vehicle?.make || "",
      model: vehicle?.model || "",
      color: vehicle?.color || "",
      year: vehicle?.year || undefined,
      notes: vehicle?.notes || "",
      stationId: vehicle?.stationId || "",
    },
  });

  const handleSubmit = async (data: VehicleFormData) => {
    try {
      setLoading(true);
      await onSubmit(data);
      toast({
        title: mode === "create" ? "Vehicle registered" : "Vehicle updated",
        description: `${data.licensePlate} has been ${mode === "create" ? "registered" : "updated"} successfully.`,
      });
      router.push("/dashboard/admin/vehicles");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode} vehicle`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = [
    { value: "car", label: "Car" },
    { value: "truck", label: "Truck" },
    { value: "motorcycle", label: "Motorcycle" },
    { value: "bus", label: "Bus" },
    { value: "van", label: "Van" },
    { value: "bicycle", label: "Bicycle" },
    { value: "tricycle", label: "Tricycle" },
    { value: "other", label: "Other" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>
              Enter the vehicle's identification details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="licensePlate"
              rules={{ required: "License plate is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Plate</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., ABC-1234"
                      disabled={mode === "edit"}
                      className="font-mono uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique license plate number (cannot be changed after creation)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicleType"
              rules={{ required: "Vehicle type is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Toyota" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Corolla" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 2020"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., White" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {stations && stations.length > 0 && (
              <FormField
                control={form.control}
                name="stationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select station" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stations.map((station) => (
                          <SelectItem key={station.id} value={station.id}>
                            {station.name} ({station.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner Information</CardTitle>
            <CardDescription>
              Optional owner details (if available)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="ownerNIN"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner NIN (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="National Identification Number" className="font-mono" />
                  </FormControl>
                  <FormDescription>
                    Links vehicle to person record if NIN exists in system
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Name (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>
              Any additional information about this vehicle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Optional notes or description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Register Vehicle" : "Update Vehicle"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
