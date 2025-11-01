/**
 * Station Form Component
 *
 * Form for creating and editing stations
 * Pan-African Design: Multi-country support
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export interface StationFormData {
  name: string;
  code: string;
  location: string;
  district?: string;
  region?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

interface StationFormProps {
  station?: StationFormData & { id: string; countryCode: string };
  onSubmit: (data: StationFormData) => Promise<void>;
  mode: "create" | "edit";
}

export function StationForm({
  station,
  onSubmit,
  mode,
}: StationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<StationFormData>({
    defaultValues: {
      name: station?.name || "",
      code: station?.code || "",
      location: station?.location || "",
      district: station?.district || "",
      region: station?.region || "",
      phone: station?.phone || "",
      email: station?.email || "",
      latitude: station?.latitude ?? undefined,
      longitude: station?.longitude ?? undefined,
    },
  });

  const handleSubmit = async (data: StationFormData) => {
    try {
      setLoading(true);
      await onSubmit(data);
      toast({
        title: mode === "create" ? "Station created" : "Station updated",
        description: `${data.name} has been ${mode === "create" ? "created" : "updated"} successfully.`,
      });
      router.push("/dashboard/admin/stations");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode} station`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the station's identification and location details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                rules={{ required: "Station code is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., HQ, CID-01"
                        disabled={mode === "edit"}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>
                      Unique code (cannot be changed after creation)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Station name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Central Police Station" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              rules={{ required: "Location is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location/Address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., 23 Main Street, Freetown"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Western Urban" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Western Area" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Optional contact details for this station
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="+232 XX XXX XXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="station@police.gov"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Coordinates</CardTitle>
            <CardDescription>
              Optional GPS coordinates for mapping and location services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        step="any"
                        placeholder="e.g., 8.4657"
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        step="any"
                        placeholder="e.g., -13.2317"
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
            {mode === "create" ? "Create Station" : "Update Station"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
