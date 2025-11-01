/**
 * Background Check Search Page
 *
 * Allows officers to perform new background checks by NIN
 * Pan-African Design: Supports any national ID system
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Search, ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function BackgroundCheckSearchPage() {
  const router = useRouter();
  const [nin, setNin] = useState("");
  const [requestType, setRequestType] = useState<"officer" | "employer" | "visa">("officer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/background-checks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nin,
          requestType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to perform background check");
        return;
      }

      // Show result
      setResult(data.backgroundCheck);

      // Redirect to detail page after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/background-checks/${data.backgroundCheck.id}`);
      }, 2000);
    } catch (err) {
      setError("An error occurred while performing the check");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/background-checks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Background Check</h1>
          <p className="text-gray-600 mt-1">
            Search for criminal records by National ID Number
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* NIN Input */}
          <div>
            <Label htmlFor="nin">National ID Number (NIN)</Label>
            <Input
              id="nin"
              type="text"
              placeholder="Enter NIN (e.g., NIN-2024-123456)"
              value={nin}
              onChange={(e) => setNin(e.target.value)}
              required
              className="mt-1"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the National Identification Number to search
            </p>
          </div>

          {/* Request Type */}
          <div>
            <Label htmlFor="requestType">Request Type</Label>
            <select
              id="requestType"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as any)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="officer">Officer (Full Details)</option>
              <option value="employer">Employer (Limited Details)</option>
              <option value="visa">Visa Application (Certificate)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {requestType === "officer" && "Full criminal record details for investigation"}
              {requestType === "employer" && "Limited information for employment screening"}
              {requestType === "visa" && "Official certificate for visa applications"}
            </p>
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
                <p className="font-medium text-green-900">Background Check Complete</p>
              </div>
              <div className="ml-7 space-y-1">
                <p className="text-sm text-green-700">
                  Result: {result.result?.status === "clear" ? "No Criminal Record" : "Criminal Record Found"}
                </p>
                <p className="text-sm text-green-600">Redirecting to results...</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !nin.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Records...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Perform Background Check
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-2">What's Checked?</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Criminal case history</li>
            <li>• Active investigations</li>
            <li>• Case status and outcomes</li>
            <li>• Risk level assessment</li>
          </ul>
        </Card>
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-2">Result Types</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <span className="text-green-600">Clear:</span> No records found</li>
            <li>• <span className="text-red-600">Record Found:</span> Criminal history exists</li>
            <li>• <span className="text-gray-600">Pending:</span> Check in progress</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
