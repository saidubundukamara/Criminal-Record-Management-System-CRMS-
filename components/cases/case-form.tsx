/**
 * Case Form Component
 *
 * Form for creating and editing cases with validation
 * Pan-African Design: Accessible form with clear labels and validation
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const caseSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must not exceed 200 characters"),
  description: z
    .string()
    .max(5000, "Description must not exceed 5000 characters")
    .optional(),
  category: z.string().min(1, "Category is required"),
  severity: z.enum(["minor", "major", "critical"]),
  incidentDate: z.string().min(1, "Incident date is required"),
  location: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseSchema>;

interface CaseFormProps {
  initialData?: Partial<CaseFormData>;
  caseId?: string;
  onSuccess?: (caseData: any) => void;
}

export function CaseForm({ initialData, caseId, onSuccess }: CaseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      severity: initialData?.severity || "major",
      incidentDate: initialData?.incidentDate || "",
      location: initialData?.location || "",
    },
  });

  const onSubmit = async (data: CaseFormData) => {
    setIsSubmitting(true);

    try {
      const url = caseId ? `/api/cases/${caseId}` : "/api/cases";
      const method = caseId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save case");
      }

      const result = await response.json();

      toast({
        title: caseId ? "Case updated" : "Case created",
        description: caseId
          ? "Case has been updated successfully"
          : `Case ${result.case.caseNumber} has been created successfully`,
      });

      if (onSuccess) {
        onSuccess(result.case);
      } else {
        router.push(`/dashboard/cases/${result.case.id}`);
      }
    } catch (error) {
      console.error("Error saving case:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save case",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Case Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Brief description of the case"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                A clear, concise title that describes the case
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of the incident"
                  rows={5}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Provide all relevant details about the incident
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="assault">Assault</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="murder">Murder</SelectItem>
                    <SelectItem value="robbery">Armed Robbery</SelectItem>
                    <SelectItem value="kidnapping">Kidnapping</SelectItem>
                    <SelectItem value="drug">Drug Offense</SelectItem>
                    <SelectItem value="cybercrime">Cybercrime</SelectItem>
                    <SelectItem value="domestic_violence">
                      Domestic Violence
                    </SelectItem>
                    <SelectItem value="burglary">Burglary</SelectItem>
                    <SelectItem value="arson">Arson</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Severity */}
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Incident Date */}
          <FormField
            control={form.control}
            name="incidentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incident Date & Time *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  When did the incident occur?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Where did this occur?"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Specific location or address
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {caseId ? "Update Case" : "Create Case"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
