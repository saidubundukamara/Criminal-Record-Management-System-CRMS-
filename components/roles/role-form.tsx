/**
 * Role Form Component
 *
 * Form for creating and editing roles
 * Pan-African Design: Simple role configuration
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
import { Textarea } from "@/components/ui/textarea";
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

export interface RoleFormData {
  name: string;
  description?: string;
  level: number;
}

interface RoleFormProps {
  role?: RoleFormData & { id: string };
  onSubmit: (data: RoleFormData) => Promise<void>;
  mode: "create" | "edit";
}

export function RoleForm({ role, onSubmit, mode }: RoleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<RoleFormData>({
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      level: role?.level || 4,
    },
  });

  const handleSubmit = async (data: RoleFormData) => {
    try {
      setLoading(true);
      await onSubmit(data);
      toast({
        title: mode === "create" ? "Role created" : "Role updated",
        description: `${data.name} has been ${mode === "create" ? "created" : "updated"} successfully.`,
      });
      router.push("/dashboard/admin/roles");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${mode} role`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const roleLevels = [
    { value: 1, label: "Level 1 - SuperAdmin", description: "Full system access" },
    { value: 2, label: "Level 2 - Admin", description: "Regional/national administration" },
    { value: 3, label: "Level 3 - Station Commander", description: "Station-level oversight" },
    { value: 4, label: "Level 4 - Officer", description: "Operational police officer" },
    { value: 5, label: "Level 5 - Evidence Clerk", description: "Evidence management specialist" },
    { value: 6, label: "Level 6 - Viewer", description: "Read-only access" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>
              Define the role name, description, and hierarchy level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Role name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Senior Investigator" />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive name for this role
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the responsibilities and scope of this role"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              rules={{ required: "Role level is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hierarchy Level</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hierarchy level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {level.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Lower numbers = higher authority (1 is highest, 6 is lowest)
                  </FormDescription>
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
            {mode === "create" ? "Create Role" : "Update Role"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
