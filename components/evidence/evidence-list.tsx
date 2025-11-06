/**
 * Evidence List Component
 *
 * Displays list of evidence in a table format with filtering
 * Pan-African Design: Responsive, accessible table for evidence management
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { EvidenceTypeBadge } from "./evidence-type-badge";
import { EvidenceStatusBadge } from "./evidence-status-badge";
import { Eye, QrCode, Shield, HardDrive, Package, Calendar } from "lucide-react";
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

interface Evidence {
  id: string;
  qrCode: string;
  caseId: string;
  type: string;
  description: string;
  status: string;
  collectedDate: Date;
  collectedLocation: string;
  isSealed: boolean;
  isDigital: boolean;
  fileUrl: string | null;
  fileName: string | null;
  humanReadableSize: string | null;
  storageLocation: string | null;
  tags: string[];
  custodyTransferCount: number;
  isCritical: boolean;
  ageInDays: number;
  createdAt: Date;
}

interface EvidenceListProps {
  evidence: Evidence[];
  showFilters?: boolean;
}

export function EvidenceList({ evidence, showFilters = true }: EvidenceListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sealedFilter, setSealedFilter] = useState<string>("all");

  // Filter evidence
  const filteredEvidence = evidence.filter((e) => {
    const matchesSearch =
      e.qrCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ?? false);

    const matchesType = typeFilter === "all" || e.type === typeFilter;

    const matchesStatus = statusFilter === "all" || e.status === statusFilter;

    const matchesSealed =
      sealedFilter === "all" ||
      (sealedFilter === "sealed" && e.isSealed) ||
      (sealedFilter === "unsealed" && !e.isSealed);

    return matchesSearch && matchesType && matchesStatus && matchesSealed;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
          <div className="flex-1">
            <Input
              placeholder="Search by QR code, description, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="biological">Biological</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="collected">Collected</SelectItem>
              <SelectItem value="stored">Stored</SelectItem>
              <SelectItem value="analyzed">Analyzed</SelectItem>
              <SelectItem value="court">In Court</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="destroyed">Destroyed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sealedFilter} onValueChange={setSealedFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Sealed status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="sealed">Sealed</SelectItem>
              <SelectItem value="unsealed">Unsealed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredEvidence.length} of {evidence.length} evidence items
      </div>

      {/* Evidence Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>QR Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvidence.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No evidence found
                </TableCell>
              </TableRow>
            ) : (
              filteredEvidence.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/evidence/${item.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <QrCode className="h-4 w-4" />
                      {item.qrCode}
                    </Link>
                    {item.isCritical && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Critical
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <EvidenceTypeBadge type={item.type as any} size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">{item.description}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {item.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <EvidenceStatusBadge status={item.status as any} size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.collectedDate), "MMM d, yyyy")}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.collectedLocation}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.ageInDays} days old
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      {item.isSealed && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Shield className="h-3 w-3" />
                          Sealed
                        </div>
                      )}
                      {item.isDigital && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <HardDrive className="h-3 w-3" />
                          {item.humanReadableSize}
                        </div>
                      )}
                      {!item.isDigital && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Package className="h-3 w-3" />
                          {item.storageLocation || "Not stored"}
                        </div>
                      )}
                      {item.custodyTransferCount > 0 && (
                        <p className="text-gray-500">
                          {item.custodyTransferCount} transfers
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/evidence/${item.id}`}>
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
