/**
 * Role List Component
 *
 * Data table for displaying roles with actions
 * Pan-African Design: Clear role hierarchy visualization
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
import { MoreHorizontal, Eye, Edit, Copy, Shield } from "lucide-react";

export interface RoleListItem {
  id: string;
  name: string;
  description: string | null;
  level: number;
  permissionCount: number;
  officerCount?: number;
}

interface RoleListProps {
  roles: RoleListItem[];
  onClone?: (id: string) => void;
}

export function RoleList({ roles, onClone }: RoleListProps) {
  const getRoleLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-red-100 text-red-800 border-red-200";
      case 2:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case 3:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case 4:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 5:
        return "bg-green-100 text-green-800 border-green-200";
      case 6:
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Officers</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No roles found
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{role.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${getRoleLevelColor(role.level)} border font-medium text-xs`}
                  >
                    Level {role.level}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground max-w-md">
                    {role.description || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {role.permissionCount} {role.permissionCount === 1 ? "permission" : "permissions"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {role.officerCount !== undefined ? (
                    <Badge variant="outline" className="text-xs">
                      {role.officerCount} {role.officerCount === 1 ? "officer" : "officers"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
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
                        <Link href={`/dashboard/admin/roles/${role.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/roles/${role.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Role
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/roles/${role.id}/permissions`}>
                          <Shield className="mr-2 h-4 w-4" />
                          Manage Permissions
                        </Link>
                      </DropdownMenuItem>
                      {onClone && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onClone(role.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Clone Role
                          </DropdownMenuItem>
                        </>
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
