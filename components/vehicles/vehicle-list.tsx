/**
 * Vehicle List Component
 *
 * Data table for displaying vehicles with actions
 * Pan-African Design: Clear vehicle display and management
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
import { MoreHorizontal, Eye, Edit, AlertTriangle, CheckCircle, Lock } from "lucide-react";

export interface VehicleListItem {
  id: string;
  licensePlate: string;
  ownerName: string | null;
  ownerNIN: string | null;
  vehicleType: string;
  make: string | null;
  model: string | null;
  color: string | null;
  year: number | null;
  status: string;
  stolenDate: Date | null;
  recoveredDate: Date | null;
}

interface VehicleListProps {
  vehicles: VehicleListItem[];
}

export function VehicleList({ vehicles }: VehicleListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "stolen":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Stolen
          </Badge>
        );
      case "impounded":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Lock className="mr-1 h-3 w-3" />
            Impounded
          </Badge>
        );
      case "recovered":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Recovered
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>License Plate</TableHead>
            <TableHead>Vehicle Details</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No vehicles found
              </TableCell>
            </TableRow>
          ) : (
            vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <div className="font-mono font-semibold">{vehicle.licensePlate}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium capitalize">{vehicle.vehicleType}</div>
                    <div className="text-muted-foreground">
                      {vehicle.make && vehicle.model
                        ? `${vehicle.make} ${vehicle.model}`
                        : vehicle.make || vehicle.model || "-"}
                      {vehicle.year && ` (${vehicle.year})`}
                    </div>
                    {vehicle.color && (
                      <div className="text-xs text-muted-foreground">
                        Color: {vehicle.color}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {vehicle.ownerName ? (
                    <div className="text-sm">
                      <div>{vehicle.ownerName}</div>
                      {vehicle.ownerNIN && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {vehicle.ownerNIN}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
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
                        <Link href={`/dashboard/admin/vehicles/${vehicle.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/vehicles/${vehicle.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {vehicle.status === "active" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Mark as Stolen
                          </DropdownMenuItem>
                        </>
                      )}
                      {vehicle.status === "stolen" && !vehicle.recoveredDate && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Recovered
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
