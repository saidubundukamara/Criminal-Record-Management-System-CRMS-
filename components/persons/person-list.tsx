/**
 * Person List Component
 *
 * Displays list of persons in a table format with filtering
 * Pan-African Design: Responsive, accessible table for person management
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { PersonRiskBadge } from "./person-risk-badge";
import { PersonWantedBadge } from "./person-wanted-badge";
import { Eye, User, MapPin, Fingerprint } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Person {
  id: string;
  nin: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  fullName: string;
  alias: string[];
  dateOfBirth: Date | null;
  age: number | null;
  gender: string;
  nationality: string | null;
  riskLevel: "low" | "medium" | "high" | null;
  isWanted: boolean;
  isDeceasedOrMissing: boolean;
  hasBiometrics: boolean;
  photoUrl: string | null;
  createdAt: Date;
}

interface PersonListProps {
  persons: Person[];
  showFilters?: boolean;
}

export function PersonList({ persons, showFilters = true }: PersonListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [wantedFilter, setWantedFilter] = useState<string>("all");

  // Filter persons
  const filteredPersons = persons.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nin && p.nin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.alias.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGender = genderFilter === "all" || p.gender === genderFilter;

    const matchesRisk =
      riskFilter === "all" ||
      (riskFilter === "unassessed" && !p.riskLevel) ||
      p.riskLevel === riskFilter;

    const matchesWanted =
      wantedFilter === "all" ||
      (wantedFilter === "wanted" && p.isWanted) ||
      (wantedFilter === "not_wanted" && !p.isWanted);

    return matchesSearch && matchesGender && matchesRisk && matchesWanted;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
          <div className="flex-1">
            <Input
              placeholder="Search by name, NIN, or alias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Filter by gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="unassessed">Not Assessed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={wantedFilter} onValueChange={setWantedFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Wanted status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="wanted">Wanted</SelectItem>
              <SelectItem value="not_wanted">Not Wanted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredPersons.length} of {persons.length} persons
      </div>

      {/* Persons Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>NIN</TableHead>
              <TableHead>Age/Gender</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Info</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPersons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No persons found
                </TableCell>
              </TableRow>
            ) : (
              filteredPersons.map((person) => (
                <TableRow key={person.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/persons/${person.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <div className="flex items-center gap-2">
                        {person.photoUrl ? (
                          <img
                            src={person.photoUrl}
                            alt={person.fullName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{person.fullName}</p>
                          {person.alias.length > 0 && (
                            <p className="text-xs text-gray-500">
                              aka {person.alias.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">
                      {person.nin || (
                        <span className="text-gray-400">Not recorded</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {person.age !== null ? (
                        <p className="font-medium">{person.age} years</p>
                      ) : (
                        <p className="text-gray-400">Age unknown</p>
                      )}
                      <p className="text-xs text-gray-500 capitalize">
                        {person.gender}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PersonRiskBadge riskLevel={person.riskLevel} size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <PersonWantedBadge isWanted={person.isWanted} size="sm" />
                      {person.isDeceasedOrMissing && (
                        <Badge variant="outline" className="text-xs">
                          Deceased/Missing
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {person.nationality ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {person.nationality}
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {person.hasBiometrics && (
                        <div title="Has biometrics">
                          <Fingerprint className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/persons/${person.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
