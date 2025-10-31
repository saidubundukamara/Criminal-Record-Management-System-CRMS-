/**
 * Station List Component
 *
 * Data table for displaying stations with actions
 * Pan-African Design: Multi-country support
 */
"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Edit, Ban, CheckCircle, MapPin } from "lucide-react";
import { StationCodeBadge } from "./station-code-badge";
import { ActiveBadge } from "@/components/admin";

export interface StationListItem {
  id: string;
  name: string;
  code: string;
  location: string;
  district: string | null;
  region: string | null;
  countryCode: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  officerCount?: number;
}

interface StationListProps {
  stations: StationListItem[];
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
}

export function StationList({
  stations,
  onActivate,
  onDeactivate,
}: StationListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Region/District</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Officers</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No stations found
              </TableCell>
            </TableRow>
          ) : (
            stations.map((station) => (
              <TableRow key={station.id}>
                <TableCell>
                  <StationCodeBadge code={station.code} size="sm" />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{station.name}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {station.location}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {station.region && <div>{station.region}</div>}
                    {station.district && (
                      <div className="text-muted-foreground">{station.district}</div>
                    )}
                    {!station.region && !station.district && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {station.phone && <div>{station.phone}</div>}
                    {station.email && (
                      <div className="text-muted-foreground text-xs">{station.email}</div>
                    )}
                    {!station.phone && !station.email && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {station.officerCount !== undefined ? (
                    <Badge variant="secondary" className="text-xs">
                      {station.officerCount} {station.officerCount === 1 ? "officer" : "officers"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={station.active} size="sm" />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/stations/${station.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/stations/${station.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {station.active && onDeactivate && (
                        <DropdownMenuItem
                          onClick={() => onDeactivate(station.id)}
                          className="text-red-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      )}
                      {!station.active && onActivate && (
                        <DropdownMenuItem onClick={() => onActivate(station.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Activate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
