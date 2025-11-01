/**
 * Person Form Component
 *
 * Form for creating and editing persons with validation
 * Pan-African Design: Comprehensive form with encrypted PII handling
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
import { Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const personSchema = z.object({
  // Basic Information
  nin: z.string().optional(),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must not exceed 50 characters"),
  middleName: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "unknown"]),
  nationality: z.string().optional(),
  placeOfBirth: z.string().optional(),

  // Additional Details
  occupation: z.string().optional(),
  maritalStatus: z.string().optional(),
  educationLevel: z.string().optional(),
  tribe: z.string().optional(),
  religion: z.string().optional(),
  physicalDescription: z.string().max(500).optional(),

  // Risk Assessment
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  criminalHistory: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
});

type PersonFormData = z.infer<typeof personSchema>;

interface PersonFormProps {
  initialData?: Partial<PersonFormData>;
  personId?: string;
  onSuccess?: (personData: any) => void;
}

export function PersonForm({ initialData, personId, onSuccess }: PersonFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aliases, setAliases] = useState<string[]>(
    (initialData as any)?.alias || []
  );
  const [newAlias, setNewAlias] = useState("");
  const [languages, setLanguages] = useState<string[]>(
    (initialData as any)?.languagesSpoken || []
  );
  const [newLanguage, setNewLanguage] = useState("");

  const form = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      nin: initialData?.nin || "",
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      middleName: initialData?.middleName || "",
      dateOfBirth: initialData?.dateOfBirth || "",
      gender: initialData?.gender || "unknown",
      nationality: initialData?.nationality || "",
      placeOfBirth: initialData?.placeOfBirth || "",
      occupation: initialData?.occupation || "",
      maritalStatus: initialData?.maritalStatus || "",
      educationLevel: initialData?.educationLevel || "",
      tribe: initialData?.tribe || "",
      religion: initialData?.religion || "",
      physicalDescription: initialData?.physicalDescription || "",
      riskLevel: initialData?.riskLevel,
      criminalHistory: initialData?.criminalHistory || "",
      notes: initialData?.notes || "",
    },
  });

  const addAlias = () => {
    if (newAlias.trim() && !aliases.includes(newAlias.trim())) {
      setAliases([...aliases, newAlias.trim()]);
      setNewAlias("");
    }
  };

  const removeAlias = (alias: string) => {
    setAliases(aliases.filter((a) => a !== alias));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage("");
    }
  };

  const removeLanguage = (language: string) => {
    setLanguages(languages.filter((l) => l !== language));
  };

  const onSubmit = async (data: PersonFormData) => {
    setIsSubmitting(true);

    try {
      const url = personId ? `/api/persons/${personId}` : "/api/persons";
      const method = personId ? "PATCH" : "POST";

      const payload = {
        ...data,
        alias: aliases,
        languagesSpoken: languages,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save person");
      }

      const result = await response.json();

      toast({
        title: personId ? "Person updated" : "Person created",
        description: personId
          ? "Person record has been updated successfully"
          : `Person record for ${result.person.fullName} has been created successfully`,
      });

      if (onSuccess) {
        onSuccess(result.person);
      } else {
        router.push(`/dashboard/persons/${result.person.id}`);
      }
    } catch (error) {
      console.error("Error saving person:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save person",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIN (National ID)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., SL-12345678901"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    National Identification Number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Aliases */}
          <div className="space-y-2">
            <FormLabel>Known Aliases</FormLabel>
            <div className="flex gap-2">
              <Input
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="Add alias"
                disabled={isSubmitting}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAlias())}
              />
              <Button
                type="button"
                onClick={addAlias}
                disabled={isSubmitting}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {aliases.map((alias) => (
                <div
                  key={alias}
                  className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
                >
                  <span>{alias}</span>
                  <button
                    type="button"
                    onClick={() => removeAlias(alias)}
                    disabled={isSubmitting}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationality</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Sierra Leonean"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="placeOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place of Birth</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marital Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="educationLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education Level</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Secondary, University"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tribe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tribe/Ethnicity</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="religion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Religion</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <FormLabel>Languages Spoken</FormLabel>
            <div className="flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Add language"
                disabled={isSubmitting}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
              />
              <Button
                type="button"
                onClick={addLanguage}
                disabled={isSubmitting}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {languages.map((lang) => (
                <div
                  key={lang}
                  className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
                >
                  <span>{lang}</span>
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang)}
                    disabled={isSubmitting}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="physicalDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Physical Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Height, build, distinguishing marks, scars, tattoos, etc."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Risk Assessment */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>

          <FormField
            control={form.control}
            name="riskLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="criminalHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Criminal History Summary</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Brief summary of criminal history..."
                    rows={4}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Internal use only - not disclosed in citizen background checks
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Any additional information..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {personId ? "Update Person" : "Create Person"}
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
