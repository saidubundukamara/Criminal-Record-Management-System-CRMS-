/**
 * Officer List Component
 *
 * Data table for displaying officers with actions
 * Pan-African Design: Efficient data display for low-bandwidth
 */
"use client";

import { useState } from "react";
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
import { MoreHorizontal, Eye, Edit, Lock, Unlock, Key, Ban, CheckCircle } from "lucide-react";
import { OfficerBadge } from "./officer-badge";
import { ActiveBadge } from "@/components/admin";
import { formatDistanceToNow } from "date-fns";

export interface OfficerListItem {
  id: string;
  badge: string;
  name: string;
  email: string | null;
  role: {
    name: string;
    level: number;
  };
  station: {
    name: string;
    code: string;
  };
  active: boolean;
  lastLogin: Date | null;
  isLocked: boolean;
}

interface OfficerListProps {
  officers: OfficerListItem[];
  onActivate?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  onUnlock?: (id: string) => void;
  onResetPin?: (id: string) => void;
}

export function OfficerList({
  officers,
  onActivate,
  onDeactivate,
  onUnlock,
  onResetPin,
}: OfficerListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Badge</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {officers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No officers found
              </TableCell>
            </TableRow>
          ) : (
            officers.map((officer) => (
              <TableRow key={officer.id}>
                <TableCell>
                  <OfficerBadge badge={officer.badge} size="sm" />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{officer.name}</div>
                    {officer.email && (
                      <div className="text-sm text-muted-foreground">{officer.email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {officer.role.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{officer.station.name}</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {officer.station.code}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <ActiveBadge active={officer.active} size="sm" />
                    {officer.isLocked && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-xs w-fit">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {officer.lastLogin
                    ? formatDistanceToNow(officer.lastLogin, { addSuffix: true })
                    : "Never"}
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
                        <Link href={`/dashboard/admin/officers/${officer.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/officers/${officer.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {officer.isLocked && onUnlock && (
                        <DropdownMenuItem onClick={() => onUnlock(officer.id)}>
                          <Unlock className="mr-2 h-4 w-4" />
                          Unlock Account
                        </DropdownMenuItem>
                      )}
                      {onResetPin && (
                        <DropdownMenuItem onClick={() => onResetPin(officer.id)}>
                          <Key className="mr-2 h-4 w-4" />
                          Reset PIN
                        </DropdownMenuItem>
                      )}
                      {officer.active && onDeactivate && (
                        <DropdownMenuItem
                          onClick={() => onDeactivate(officer.id)}
                          className="text-red-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      )}
                      {!officer.active && onActivate && (
                        <DropdownMenuItem onClick={() => onActivate(officer.id)}>
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
