/**
 * Case Person Cards Component
 *
 * Displays persons linked to a case with their roles and actions
 * Pan-African Design: Clear display of suspects, victims, witnesses, informants
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PersonRiskBadge } from "@/components/persons/person-risk-badge";
import { PersonWantedBadge } from "@/components/persons/person-wanted-badge";
import { User, X, Loader2, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface CasePerson {
  linkId: string;
  personId: string;
  role: string;
  statement: string | null;
  createdAt: string;
  person: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    nin: string | null;
    photoUrl: string | null;
    gender: string;
    dateOfBirth: string | null;
    riskLevel: "low" | "medium" | "high" | null;
    isWanted: boolean;
  };
}

interface CasePersonCardsProps {
  caseId: string;
  persons: CasePerson[];
}

const getRoleColor = (role: string) => {
  switch (role) {
    case "suspect":
      return "bg-red-100 text-red-800 border-red-200";
    case "victim":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "witness":
      return "bg-green-100 text-green-800 border-green-200";
    case "informant":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    suspect: "Suspect",
    victim: "Victim",
    witness: "Witness",
    informant: "Informant",
  };
  return labels[role] || role;
};

export function CasePersonCards({ caseId, persons }: CasePersonCardsProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (personId: string, personName: string) => {
    setRemovingId(personId);

    try {
      const response = await fetch(
        `/api/cases/${caseId}/persons/${personId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove person from case");
      }

      toast({
        title: "Person Removed",
        description: `${personName} has been removed from this case`,
      });

      router.refresh(); // Refresh the page data
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove person from case",
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  };

  if (persons.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4">
        No persons added yet. Add suspects, victims, witnesses, or informants to
        this case.
      </p>
    );
  }

  // Group persons by role
  const groupedByRole = persons.reduce((acc, person) => {
    if (!acc[person.role]) {
      acc[person.role] = [];
    }
    acc[person.role].push(person);
    return acc;
  }, {} as Record<string, CasePerson[]>);

  const roleOrder = ["suspect", "victim", "witness", "informant"];

  return (
    <div className="space-y-4">
      {roleOrder.map((role) => {
        const rolePersons = groupedByRole[role];
        if (!rolePersons || rolePersons.length === 0) return null;

        return (
          <div key={role}>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={`${getRoleColor(role)} font-semibold border`}
              >
                {getRoleLabel(role)}s ({rolePersons.length})
              </Badge>
            </div>

            <div className="space-y-2">
              {rolePersons.map((casePerson) => (
                <div
                  key={casePerson.linkId}
                  className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {/* Photo */}
                    <Link
                      href={`/dashboard/persons/${casePerson.person.id}`}
                      className="flex-shrink-0"
                    >
                      {casePerson.person.photoUrl ? (
                        <img
                          src={casePerson.person.photoUrl}
                          alt={casePerson.person.fullName}
                          className="h-16 w-16 rounded-lg object-cover border-2 hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center border-2 hover:bg-gray-300 transition-colors">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/dashboard/persons/${casePerson.person.id}`}
                            className="font-semibold text-gray-900 hover:text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            {casePerson.person.fullName}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {casePerson.person.nin && (
                              <span className="text-sm text-gray-500 font-mono">
                                NIN: {casePerson.person.nin}
                              </span>
                            )}
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500 capitalize">
                              {casePerson.person.gender}
                            </span>
                            {casePerson.person.dateOfBirth && (
                              <>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500">
                                  {new Date().getFullYear() -
                                    new Date(
                                      casePerson.person.dateOfBirth
                                    ).getFullYear()}{" "}
                                  years
                                </span>
                              </>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge
                              variant="outline"
                              className={`${getRoleColor(casePerson.role)} text-xs border`}
                            >
                              {getRoleLabel(casePerson.role)}
                            </Badge>
                            {casePerson.person.isWanted && (
                              <PersonWantedBadge isWanted={true} size="sm" />
                            )}
                            {casePerson.person.riskLevel && (
                              <PersonRiskBadge
                                riskLevel={casePerson.person.riskLevel}
                                size="sm"
                              />
                            )}
                          </div>

                          {/* Statement */}
                          {casePerson.statement && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700 border border-gray-200">
                              <span className="font-medium text-gray-900">
                                Note:{" "}
                              </span>
                              {casePerson.statement}
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-shrink-0 text-gray-400 hover:text-red-600"
                              disabled={removingId === casePerson.personId}
                            >
                              {removingId === casePerson.personId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove Person from Case?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove{" "}
                                <strong>{casePerson.person.fullName}</strong> from
                                this case? This action cannot be undone, but the
                                person can be re-added later if needed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleRemove(
                                    casePerson.personId,
                                    casePerson.person.fullName
                                  )
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
