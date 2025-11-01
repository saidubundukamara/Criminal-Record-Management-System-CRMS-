/**
 * Edit Officer Page
 *
 * Form for editing an existing officer record
 * Pan-African Design: Clear, accessible form for officer management
 */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { OfficerForm, OfficerFormData } from "@/components/officers/officer-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditOfficerPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [officer, setOfficer] = useState<(OfficerFormData & { id: string }) | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; level: number }>>([]);
  const [stations, setStations] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [officerRes, rolesRes, stationsRes] = await Promise.all([
          fetch(`/api/officers/${id}`),
          fetch("/api/roles"),
          fetch("/api/stations"),
        ]);

        if (!officerRes.ok) {
          if (officerRes.status === 404) {
            setError("Officer not found");
          } else {
            setError("Failed to load officer data");
          }
          return;
        }

        const officerData = await officerRes.json();

        // Transform officer data to match form expectations
        setOfficer({
          id: officerData.officer.id,
          badge: officerData.officer.badge,
          name: officerData.officer.name,
          email: officerData.officer.email || "",
          phone: officerData.officer.phone || "",
          roleId: officerData.officer.roleId,
          stationId: officerData.officer.stationId,
        });

        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setRoles(rolesData.roles || []);
        }

        if (stationsRes.ok) {
          const stationsData = await stationsRes.json();
          setStations(stationsData.stations || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        setError("Failed to load officer data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmit = async (formData: OfficerFormData) => {
    const response = await fetch(`/api/officers/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        roleId: formData.roleId,
        stationId: formData.stationId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update officer");
    }

    return response.json();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/admin/officers/${id}`}>
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
            <Link href="/dashboard/admin/officers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Officers
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
        <Link href={`/dashboard/admin/officers/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Officer
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Officer</h1>
          <p className="text-gray-600 mt-2">
            Update the officer details below
          </p>
        </div>

        <OfficerForm
          officer={officer}
          roles={roles}
          stations={stations}
          onSubmit={handleSubmit}
          mode="edit"
        />
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Editing Guidelines</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>All changes will be tracked in the audit log</li>
          <li>Badge number cannot be changed after creation</li>
          <li>Role and station changes affect permissions immediately</li>
          <li>PIN cannot be changed here - use Reset PIN action</li>
        </ul>
      </div>

      {/* Privacy Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Security Notice</h3>
        <p className="text-sm text-yellow-800">
          All officer information changes are logged and audited. Changes to role
          or station assignments take effect immediately and may affect access
          permissions. Only authorized administrators can modify officer records.
        </p>
      </div>
    </div>
  );
}
