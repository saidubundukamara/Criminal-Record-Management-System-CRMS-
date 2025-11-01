/**
 * Edit USSD Officer Settings Page
 *
 * Form for editing USSD settings
 * Pan-African Design: Clear, accessible form for USSD configuration
 */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditUSSDOfficerPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = use(params);
  const [officer, setOfficer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [ussdPhoneNumber, setUssdPhoneNumber] = useState("");
  const [ussdDailyLimit, setUssdDailyLimit] = useState(50);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/ussd-officers/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Officer not found");
          } else {
            setError("Failed to load officer data");
          }
          return;
        }

        const data = await response.json();
        setOfficer(data.officer);
        setUssdPhoneNumber(data.officer.ussdPhoneNumber || "");
        setUssdDailyLimit(data.officer.ussdDailyLimit || 50);
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Failed to load officer data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (ussdPhoneNumber && !/^\+?[1-9]\d{1,14}$/.test(ussdPhoneNumber)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number in E.164 format (e.g., +23276123456)",
        variant: "destructive",
      });
      return;
    }

    if (ussdDailyLimit < 1 || ussdDailyLimit > 1000) {
      toast({
        title: "Invalid daily limit",
        description: "Daily limit must be between 1 and 1000",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/ussd-officers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ussdPhoneNumber: ussdPhoneNumber || null,
          ussdDailyLimit,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update USSD settings");
      }

      toast({
        title: "Settings updated",
        description: "USSD settings have been updated successfully.",
      });

      router.push(`/dashboard/admin/ussd-officers/${id}`);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update USSD settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/admin/ussd-officers/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Officer
            </Link>
          </Button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !officer) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin/ussd-officers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to USSD Officers
            </Link>
          </Button>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-red-600">{error || "Officer not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/admin/ussd-officers/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Officer
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit USSD Settings</h1>
          <p className="text-gray-600 mt-2">
            {officer.name} ({officer.badge})
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{officer.stationName}</Badge>
            <Badge variant={officer.ussdEnabled ? "default" : "secondary"}>
              {officer.ussdEnabled ? "USSD Enabled" : "USSD Disabled"}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>USSD Configuration</CardTitle>
              <CardDescription>
                Update USSD phone number and daily query limit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ussdPhoneNumber">USSD Phone Number</Label>
                <Input
                  id="ussdPhoneNumber"
                  type="tel"
                  value={ussdPhoneNumber}
                  onChange={(e) => setUssdPhoneNumber(e.target.value)}
                  placeholder="+23276123456"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Phone number used for USSD authentication. Must be in E.164 format (e.g., +23276123456)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ussdDailyLimit">Daily Query Limit</Label>
                <Input
                  id="ussdDailyLimit"
                  type="number"
                  min="1"
                  max="1000"
                  value={ussdDailyLimit}
                  onChange={(e) => setUssdDailyLimit(parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of USSD queries allowed per day (1-1000)
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Configuration Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Phone number must match the number officer uses to dial USSD</li>
          <li>Daily limit helps prevent system abuse and manages load</li>
          <li>Changes take effect immediately</li>
          <li>All changes are logged for audit purposes</li>
        </ul>
      </div>

      {/* USSD Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">USSD Registration</h3>
        <p className="text-sm text-yellow-800">
          Officers must initiate USSD registration by dialing the shortcode from their
          registered phone number. The admin can update these settings but cannot complete
          the initial registration on behalf of the officer for security reasons.
        </p>
      </div>
    </div>
  );
}
