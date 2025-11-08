/**
 * Evidence Form Component
 *
 * Form for creating and editing evidence with validation
 * Pan-African Design: Accessible form with file upload and chain of custody
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
import { Loader2, Plus, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const evidenceSchema = z.object({
  caseId: z.string().min(1, "Case is required"),
  type: z.enum(
    ["physical", "document", "photo", "video", "audio", "digital", "biological", "other"]
  ),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must not exceed 1000 characters"),
  collectedDate: z.string().min(1, "Collection date is required"),
  collectedLocation: z.string().min(1, "Collection location is required"),
  storageLocation: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type EvidenceFormData = z.infer<typeof evidenceSchema>;

interface EvidenceFormProps {
  initialData?: Partial<EvidenceFormData>;
  evidenceId?: string;
  availableCases?: { id: string; caseNumber: string; title: string }[];
  onSuccess?: (evidenceData: any) => void;
}

export function EvidenceForm({
  initialData,
  evidenceId,
  availableCases = [],
  onSuccess,
}: EvidenceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>((initialData as any)?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const form = useForm<EvidenceFormData>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: {
      caseId: initialData?.caseId || "",
      type: initialData?.type || "physical",
      description: initialData?.description || "",
      collectedDate: initialData?.collectedDate || "",
      collectedLocation: initialData?.collectedLocation || "",
      storageLocation: initialData?.storageLocation || "",
      notes: initialData?.notes || "",
    },
  });

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const onSubmit = async (data: EvidenceFormData) => {
    setIsSubmitting(true);

    try {
      const url = evidenceId ? `/api/evidence/${evidenceId}` : "/api/evidence";
      const method = evidenceId ? "PATCH" : "POST";

      // Always use FormData for consistency (supports file uploads and matches API expectations)
      const formData = new FormData();

      // Add common form fields
      formData.append('type', data.type);
      formData.append('description', data.description);

      if (evidenceId) {
        // For updates, only include editable fields
        if (data.collectedLocation) formData.append('collectedLocation', data.collectedLocation);
        if (data.storageLocation) formData.append('storageLocation', data.storageLocation);
        if (data.notes) formData.append('notes', data.notes);

        // Add tags as comma-separated string
        if (tags.length > 0) {
          formData.append('tags', tags.join(','));
        }
      } else {
        // For creation, include all required fields
        formData.append('caseId', data.caseId);
        formData.append('collectedDate', data.collectedDate);
        formData.append('collectedLocation', data.collectedLocation);
        if (data.storageLocation) formData.append('storageLocation', data.storageLocation);
        if (data.notes) formData.append('notes', data.notes);

        // Add tags as comma-separated string
        if (tags.length > 0) {
          formData.append('tags', tags.join(','));
        }

        // Add file if present
        if (uploadedFile) {
          formData.append('file', uploadedFile);
        }
      }

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save evidence");
      }

      const result = await response.json();

      toast({
        title: evidenceId ? "Evidence updated" : "Evidence created",
        description: evidenceId
          ? "Evidence record has been updated successfully"
          : `Evidence ${result.evidence.qrCode} has been created successfully`,
      });

      if (onSuccess) {
        onSuccess(result.evidence);
      } else {
        router.push(`/dashboard/evidence/${result.evidence.id}`);
      }
    } catch (error) {
      console.error("Error saving evidence:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save evidence",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Case Selection */}
        {availableCases.length > 0 && (
          <FormField
            control={form.control}
            name="caseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Case *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting || !!evidenceId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select case" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableCases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.caseNumber} - {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the case this evidence belongs to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Evidence Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Evidence Type *</FormLabel>
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
                  <SelectItem value="physical">Physical Object</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="photo">Photograph</SelectItem>
                  <SelectItem value="video">Video Recording</SelectItem>
                  <SelectItem value="audio">Audio Recording</SelectItem>
                  <SelectItem value="digital">Digital Evidence</SelectItem>
                  <SelectItem value="biological">Biological Sample</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Detailed description of the evidence..."
                  rows={5}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Provide a detailed description including appearance, condition, and any
                distinguishing features
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Collection Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="collectedDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Collection Date & Time *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormDescription>When was this evidence collected?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="collectedLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Collection Location *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., 123 Main St, Crime Scene Room 5"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>Where was this evidence found?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Storage Location */}
        <FormField
          control={form.control}
          name="storageLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Storage Location</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Evidence Room A, Shelf 3, Box 12"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Physical storage location (for non-digital evidence)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag (e.g., weapon, critical, high-value)"
              disabled={isSubmitting}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} disabled={isSubmitting} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  disabled={isSubmitting}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* File Upload */}
        {!evidenceId && (
          <div className="space-y-2">
            <FormLabel>Attach File (Optional)</FormLabel>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  Photos, videos, documents, or digital evidence
                </p>
              </label>
              {uploadedFile && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {filePreview && (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="mt-2 max-w-xs mx-auto rounded"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
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

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {evidenceId ? "Update Evidence" : "Create Evidence"}
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
