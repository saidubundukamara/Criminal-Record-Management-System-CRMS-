/**
 * Create Wanted Person Alert Page
 *
 * Form to create new wanted person alerts
 * Pan-African Design: Regional cross-border alert system
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, Search } from "lucide-react";
import Link from "next/link";

export default function CreateWantedPersonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [searchingPerson, setSearchingPerson] = useState(false);
  const [personSearch, setPersonSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    personId: "",
    charges: "",
    warrantNumber: "",
    dangerLevel: "medium" as "extreme" | "high" | "medium" | "low",
    rewardAmount: "",
    lastSeenLocation: "",
    lastSeenDate: "",
    regionalAlert: false,
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

  const searchPerson = async () => {
    if (!personSearch.trim()) {
      setError("Please enter a person name or NIN to search");
      return;
    }

    setSearchingPerson(true);
    setError("");

    try {
      const response = await fetch(`/api/persons?search=${encodeURIComponent(personSearch)}&limit=10`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to search persons");
        setSearchResults([]);
        return;
      }

      setSearchResults(data.persons || []);
      if (data.persons.length === 0) {
        setError("No persons found. Please create a person record first.");
      }
    } catch (err) {
      setError("An error occurred while searching");
      console.error(err);
    } finally {
      setSearchingPerson(false);
    }
  };

  const selectPerson = (person: any) => {
    setFormData((prev) => ({ ...prev, personId: person.id }));
    setPersonSearch(`${person.firstName} ${person.lastName} (${person.nin || "No NIN"})`);
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    // Client-side validation
    if (!formData.personId) {
      setError("Please select a person from the search results");
      setLoading(false);
      return;
    }

    if (!formData.charges.trim()) {
      setError("Charges are required");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        personId: formData.personId,
        charges: formData.charges.trim(),
        warrantNumber: formData.warrantNumber.trim() || undefined,
        dangerLevel: formData.dangerLevel,
        rewardAmount: formData.rewardAmount ? parseFloat(formData.rewardAmount) : undefined,
        lastSeenLocation: formData.lastSeenLocation.trim() || undefined,
        lastSeenDate: formData.lastSeenDate || undefined,
        regionalAlert: formData.regionalAlert,
        publishNow: formData.publishNow,
      };

      const response = await fetch("/api/alerts/wanted", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create wanted person alert");
        return;
      }

      // Show success and redirect
      setResult(data.alert);

      setTimeout(() => {
        router.push(`/dashboard/alerts/wanted/${data.alert.id}`);
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
          <h1 className="text-3xl font-bold text-gray-900">Create Wanted Person Alert</h1>
          <p className="text-gray-600 mt-1">
            Issue a wanted person alert with danger level and priority
          </p>
        </div>
      </div>

      {/* Person Search */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Step 1: Select Person</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="personSearch">Search for Person</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="personSearch"
                type="text"
                placeholder="Enter name or NIN..."
                value={personSearch}
                onChange={(e) => setPersonSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchPerson())}
                disabled={searchingPerson || loading}
              />
              <Button
                type="button"
                onClick={searchPerson}
                disabled={searchingPerson || loading}
              >
                {searchingPerson ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Search by name or national ID number
            </p>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {searchResults.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => selectPerson(person)}
                  className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                    formData.personId === person.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                  }`}
                >
                  <p className="font-medium text-gray-900">
                    {person.firstName} {person.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    NIN: {person.nin || "Not provided"}
                  </p>
                  {person.dateOfBirth && (
                    <p className="text-xs text-gray-500">
                      DOB: {new Date(person.dateOfBirth).toLocaleDateString()}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {formData.personId && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700">Person selected</p>
            </div>
          )}
        </div>
      </Card>

      {/* Alert Form */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Step 2: Alert Details</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Charges */}
          <div>
            <Label htmlFor="charges">
              Charges <span className="text-red-600">*</span>
            </Label>
            <textarea
              id="charges"
              name="charges"
              placeholder="List the criminal charges..."
              value={formData.charges}
              onChange={handleChange}
              required
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Specify the criminal charges for which the person is wanted
            </p>
          </div>

          {/* Warrant Number */}
          <div>
            <Label htmlFor="warrantNumber">Warrant Number</Label>
            <Input
              id="warrantNumber"
              name="warrantNumber"
              type="text"
              placeholder="WRT-2025-001234"
              value={formData.warrantNumber}
              onChange={handleChange}
              className="mt-1"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Optional: Court warrant number</p>
          </div>

          {/* Danger Level and Reward */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dangerLevel">
                Danger Level <span className="text-red-600">*</span>
              </Label>
              <select
                id="dangerLevel"
                name="dangerLevel"
                value={formData.dangerLevel}
                onChange={handleChange}
                required
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="low">Low (Non-violent)</option>
                <option value="medium">Medium (Potentially dangerous)</option>
                <option value="high">High (Armed/dangerous)</option>
                <option value="extreme">Extreme (Highly dangerous)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="rewardAmount">Reward Amount (USD)</Label>
              <Input
                id="rewardAmount"
                name="rewardAmount"
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                value={formData.rewardAmount}
                onChange={handleChange}
                className="mt-1"
                disabled={loading}
              />
            </div>
          </div>

          {/* Last Seen Info */}
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

          {/* Regional Alert Checkbox */}
          <div className="flex items-start gap-3">
            <input
              id="regionalAlert"
              name="regionalAlert"
              type="checkbox"
              checked={formData.regionalAlert}
              onChange={handleChange}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={loading}
            />
            <div>
              <Label htmlFor="regionalAlert" className="cursor-pointer">
                Regional Cross-Border Alert
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Broadcast this alert to neighboring countries (ECOWAS region)
              </p>
            </div>
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
                <p className="font-medium text-green-900">Wanted Person Alert Created</p>
              </div>
              <div className="ml-7 space-y-1">
                <p className="text-sm text-green-700">
                  Alert created with priority score: {result.priority}
                </p>
                <p className="text-sm text-green-600">Redirecting to alert details...</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={loading || !formData.personId || !formData.charges.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Alert...
              </>
            ) : (
              <>Create Wanted Person Alert</>
            )}
          </Button>
        </form>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">About Wanted Person Alerts</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Priority is automatically calculated based on danger level and other factors</li>
          <li>• Regional alerts are shared across ECOWAS member states</li>
          <li>• Rewards can be offered for information leading to capture</li>
          <li>• Person records must exist before creating wanted alerts</li>
          <li>• All alerts are audited and tracked</li>
        </ul>
      </Card>
    </div>
  );
}
