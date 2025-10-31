/**
 * Officer Form Component
 *
 * Form for creating and editing officers
 * Pan-African Design: Simple, clear form for all education levels
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export interface OfficerFormData {
  badge: string;
  name: string;
  email?: string;
  phone?: string;
  roleId: string;
  stationId: string;
  pin?: string; // Only for creation
}

interface OfficerFormProps {
  officer?: OfficerFormData & { id: string };
  roles: Array<{ id: string; name: string; level: number }>;
  stations: Array<{ id: string; name: string; code: string }>;
  onSubmit: (data: OfficerFormData) => Promise<void>;
  mode: "create" | "edit";
}

export function OfficerForm({
  officer,
  roles,
  stations,
  onSubmit,
  mode,
}: OfficerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<OfficerFormData>({
    defaultValues: {
      badge: officer?.badge || "",
      name: officer?.name || "",
      email: officer?.email || "",
      phone: officer?.phone || "",
      roleId: officer?.roleId || "",
      stationId: officer?.stationId || "",
      pin: "",
    },
  });

  const handleSubmit = async (data: OfficerFormData) => {
    try {
      setLoading(true);
      await onSubmit(data);
      toast({
        title: mode === "create" ? "Officer created" : "Officer updated",
        description: `${data.name} has been ${mode === "create" ? "created" : "updated"} successfully.`,
      });
      router.push("/dashboard/admin/officers");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode} officer`,
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
              Enter the officer's personal and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="badge"
              rules={{ required: "Badge number is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., HQ-00123"
                      disabled={mode === "edit"}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Unique badge number (cannot be changed after creation)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Full name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="officer@police.gov"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="+232 XX XXX XXXX" />
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
            <CardTitle>Assignment</CardTitle>
            <CardDescription>
              Assign role and station for this officer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="roleId"
              rules={{ required: "Role is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name} (Level {role.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stationId"
              rules={{ required: "Station is required" }}
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
          </CardContent>
        </Card>

        {mode === "create" && (
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Set initial PIN for officer login
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="pin"
                rules={{
                  required: mode === "create" ? "PIN is required" : false,
                  minLength: {
                    value: 8,
                    message: "PIN must be at least 8 characters",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial PIN</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Minimum 8 characters"
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>
                      Officer will be required to change PIN on first login
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

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
            {mode === "create" ? "Create Officer" : "Update Officer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
