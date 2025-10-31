/**
 * Add Person to Case Dialog Component
 *
 * Dialog for searching and adding persons to cases with role assignment
 * Pan-African Design: Link suspects, victims, witnesses, informants to cases
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Loader2,
  Search,
  UserPlus,
  User,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { PersonRiskBadge } from "@/components/persons/person-risk-badge";
import { PersonWantedBadge } from "@/components/persons/person-wanted-badge";

interface Person {
  id: string;
  fullName: string;
  nin: string | null;
  photoUrl: string | null;
  gender: string;
  riskLevel: "low" | "medium" | "high" | null;
  isWanted: boolean;
}

interface AddPersonToCaseDialogProps {
  caseId: string;
  caseNumber: string;
  children?: React.ReactNode;
}

const roles = [
  {
    value: "suspect",
    label: "Suspect",
    description: "Person suspected of committing the crime",
  },
  {
    value: "victim",
    label: "Victim",
    description: "Person who suffered harm from the crime",
  },
  {
    value: "witness",
    label: "Witness",
    description: "Person who witnessed the crime or has relevant information",
  },
  {
    value: "informant",
    label: "Informant",
    description: "Person who provided information about the crime",
  },
];

export function AddPersonToCaseDialog({
  caseId,
  caseNumber,
  children,
}: AddPersonToCaseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [statement, setStatement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search persons
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/persons?search=${encodeURIComponent(searchQuery.trim())}&limit=10`
      );

      if (!response.ok) {
        throw new Error("Failed to search persons");
      }

      const data = await response.json();
      setSearchResults(data.persons || []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search persons. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger search when query changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPerson) {
      setError("Please select a person");
      return;
    }

    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/cases/${caseId}/persons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personId: selectedPerson.id,
          role: selectedRole,
          statement: statement.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add person to case");
      }

      toast({
        title: "Person Added",
        description: `${selectedPerson.fullName} has been added to case ${caseNumber} as ${selectedRole}`,
      });

      handleOpenChange(false);
      router.refresh(); // Refresh the page data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add person");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset state when closing
        setSearchQuery("");
        setSearchResults([]);
        setSelectedPerson(null);
        setSelectedRole("");
        setStatement("");
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Person
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Person to Case</DialogTitle>
            <DialogDescription>Case: {caseNumber}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Step 1: Search for Person */}
            {!selectedPerson && (
              <div className="space-y-3">
                <Label htmlFor="search">Search for Person</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by name, NIN, or alias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>

                {/* Search Results */}
                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    {searchResults.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => setSelectedPerson(person)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-0 text-left"
                      >
                        {person.photoUrl ? (
                          <img
                            src={person.photoUrl}
                            alt={person.fullName}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {person.fullName}
                          </p>
                          <p className="text-sm text-gray-500 font-mono">
                            {person.nin || "No NIN"} • {person.gender}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {person.isWanted && (
                            <PersonWantedBadge isWanted={true} size="sm" />
                          )}
                          {person.riskLevel && (
                            <PersonRiskBadge
                              riskLevel={person.riskLevel}
                              size="sm"
                            />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!isSearching &&
                  searchQuery.trim() &&
                  searchResults.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No persons found. Try a different search term or create a
                        new person record first.
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            )}

            {/* Step 2: Selected Person & Role */}
            {selectedPerson && (
              <div className="space-y-4">
                {/* Selected Person Display */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <Label className="text-xs text-gray-500">Selected Person</Label>
                  <div className="flex items-center gap-3 mt-2">
                    {selectedPerson.photoUrl ? (
                      <img
                        src={selectedPerson.photoUrl}
                        alt={selectedPerson.fullName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {selectedPerson.fullName}
                      </p>
                      <p className="text-sm text-gray-500 font-mono">
                        {selectedPerson.nin || "No NIN"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPerson(null)}
                    >
                      Change
                    </Button>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Role in Case <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.label}</span>
                            <span className="text-xs text-gray-500">
                              {role.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Statement */}
                <div className="space-y-2">
                  <Label htmlFor="statement">Statement / Notes (Optional)</Label>
                  <Textarea
                    id="statement"
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="Add any relevant notes about this person's involvement in the case..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* High Risk Warning */}
                {selectedPerson.riskLevel === "high" && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>High Risk Individual:</strong> This person has been
                      classified as high risk. Exercise appropriate caution.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Wanted Warning */}
                {selectedPerson.isWanted && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Wanted Person:</strong> This individual is currently
                      wanted. Ensure proper protocols are followed.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedPerson || !selectedRole}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to Case
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
