/**
 * Case List Component
 *
 * Displays list of cases in a table format with filtering
 * Pan-African Design: Responsive, accessible table for case management
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CaseStatusBadge } from "./case-status-badge";
import { CaseSeverityBadge } from "./case-severity-badge";
import { Eye, Calendar, MapPin, User } from "lucide-react";
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

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  incidentDate: string;
  location?: string;
  officer?: {
    name: string;
    badge: string;
  };
  personsCount?: number;
  evidenceCount?: number;
  createdAt: string;
}

interface CaseListProps {
  cases: Case[];
  showFilters?: boolean;
}

export function CaseList({ cases, showFilters = true }: CaseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Filter cases
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || c.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(cases.map((c) => c.category)));

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
          <div className="flex-1">
            <Input
              placeholder="Search by case number or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="charged">Charged</SelectItem>
              <SelectItem value="court">In Court</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredCases.length} of {cases.length} cases
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case Number</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Incident Date</TableHead>
              <TableHead>Officer</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No cases found
                </TableCell>
              </TableRow>
            ) : (
              filteredCases.map((caseItem) => (
                <TableRow key={caseItem.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/cases/${caseItem.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {caseItem.caseNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{caseItem.title}</p>
                      {caseItem.location && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {caseItem.location}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <CaseStatusBadge status={caseItem.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <CaseSeverityBadge
                      severity={caseItem.severity}
                      size="sm"
                      showIcon={false}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize">{caseItem.category}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(caseItem.incidentDate), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {caseItem.officer && (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{caseItem.officer.name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/cases/${caseItem.id}`}>
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
