/**
 * Create Amber Alert Page
 *
 * Form to create new amber alerts for missing children
 * Pan-African Design: USSD-compatible missing children alert system
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CreateAmberAlertPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    personName: "",
    age: "",
    gender: "",
    description: "",
    photoUrl: "",
    lastSeenLocation: "",
    lastSeenDate: "",
    contactPhone: "",
    urgency: "high" as "critical" | "high" | "medium",
    publishNow: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    // Client-side validation
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 0 || age >= 18) {
      setError("Age must be a valid number less than 18 (Amber Alerts are for children only)");
      setLoading(false);
      return;
    }

    if (!formData.personName.trim()) {
      setError("Person name is required");
      setLoading(false);
      return;
    }

    if (!formData.contactPhone.trim()) {
      setError("Contact phone number is required");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        personName: formData.personName.trim(),
        age: parseInt(formData.age),
        gender: formData.gender || undefined,
        description: formData.description.trim() || undefined,
        photoUrl: formData.photoUrl.trim() || undefined,
        lastSeenLocation: formData.lastSeenLocation.trim() || undefined,
        lastSeenDate: formData.lastSeenDate || undefined,
        contactPhone: formData.contactPhone.trim(),
        urgency: formData.urgency,
        publishNow: formData.publishNow,
      };

      const response = await fetch("/api/alerts/amber", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create amber alert");
        return;
      }

      // Show success and redirect
      setResult(data.alert);

      setTimeout(() => {
        router.push(`/dashboard/alerts/amber/${data.alert.id}`);
      }, 2000);
    } catch (err) {
      setError("An error occurred while creating the alert");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/alerts">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Amber Alert</h1>
          <p className="text-gray-600 mt-1">
            Report a missing child and broadcast an alert
          </p>
        </div>
      </div>

      {/* Alert Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Person Name */}
          <div>
            <Label htmlFor="personName">
              Child's Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="personName"
              name="personName"
              type="text"
              placeholder="Enter full name"
              value={formData.personName}
              onChange={handleChange}
              required
              className="mt-1"
              disabled={loading}
            />
          </div>

          {/* Age and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">
                Age <span className="text-red-600">*</span>
              </Label>
              <Input
                id="age"
                name="age"
                type="number"
                placeholder="0-17"
                min="0"
                max="17"
                value={formData.age}
                onChange={handleChange}
                required
                className="mt-1"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be under 18 years old
              </p>
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Physical Description</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Height, weight, clothing, distinguishing features..."
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Include any details that could help identify the child
            </p>
          </div>

          {/* Photo URL */}
          <div>
            <Label htmlFor="photoUrl">Photo URL</Label>
            <Input
              id="photoUrl"
              name="photoUrl"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={formData.photoUrl}
              onChange={handleChange}
              className="mt-1"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: URL to child's photo
            </p>
          </div>

          {/* Last Seen Location and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lastSeenLocation">Last Seen Location</Label>
              <Input
                id="lastSeenLocation"
                name="lastSeenLocation"
                type="text"
                placeholder="City, district, landmark..."
                value={formData.lastSeenLocation}
                onChange={handleChange}
                className="mt-1"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="lastSeenDate">Last Seen Date/Time</Label>
              <Input
                id="lastSeenDate"
                name="lastSeenDate"
                type="datetime-local"
                value={formData.lastSeenDate}
                onChange={handleChange}
                className="mt-1"
                disabled={loading}
              />
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <Label htmlFor="contactPhone">
              Contact Phone <span className="text-red-600">*</span>
            </Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              placeholder="+232 XX XXX XXXX"
              value={formData.contactPhone}
              onChange={handleChange}
              required
              className="mt-1"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Phone number for tips and information
            </p>
          </div>

          {/* Urgency Level */}
          <div>
            <Label htmlFor="urgency">Urgency Level</Label>
            <select
              id="urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="critical">Critical (Immediate danger)</option>
              <option value="high">High (Recent disappearance)</option>
              <option value="medium">Medium (Extended time missing)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.urgency === "critical" &&
                "Immediate threat to life - broadcast immediately"}
              {formData.urgency === "high" &&
                "Recent disappearance - high priority broadcast"}
              {formData.urgency === "medium" &&
                "Extended time missing - standard priority"}
            </p>
          </div>

          {/* Publish Now Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="publishNow"
              name="publishNow"
              type="checkbox"
              checked={formData.publishNow}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={loading}
            />
            <Label htmlFor="publishNow" className="cursor-pointer">
              Publish and broadcast immediately
            </Label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-900">Amber Alert Created</p>
              </div>
              <div className="ml-7 space-y-1">
                <p className="text-sm text-green-700">
                  Alert for {result.personName} has been created
                  {result.status === "active" && " and published"}
                </p>
                <p className="text-sm text-green-600">Redirecting to alert details...</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={loading || !formData.personName.trim() || !formData.age || !formData.contactPhone.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Alert...
              </>
            ) : (
              <>Create Amber Alert</>
            )}
          </Button>
        </form>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">About Amber Alerts</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• For missing children under 18 years old</li>
          <li>• Alerts are broadcast via USSD and SMS to the public</li>
          <li>• Critical alerts are sent immediately</li>
          <li>• Alerts auto-expire after 30 days</li>
          <li>• All alerts are logged and audited</li>
        </ul>
      </Card>
    </div>
  );
}
