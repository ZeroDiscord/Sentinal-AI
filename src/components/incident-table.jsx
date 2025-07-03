"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function IncidentTable({ incidents }) {
  const router = useRouter();

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-600/80 border-red-500 text-white hover:bg-red-600/90";
      case "High":
        return "bg-orange-500/80 border-orange-400 text-white hover:bg-orange-500/90";
      case "Moderate":
        return "bg-amber-500/80 border-amber-400 text-white hover:bg-amber-500/90";
      case "Low":
        return "bg-blue-500/80 border-blue-400 text-white hover:bg-blue-500/90";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-600/80 border-emerald-500 text-white hover:bg-emerald-600/90";
      case "In Progress":
        return "bg-sky-500/80 border-sky-400 text-white hover:bg-sky-500/90";
      case "Pending":
        return "bg-gray-500/80 border-gray-400 text-white hover:bg-gray-500/90";
      default:
        return "bg-gray-500";
    }
  };

  const handleViewDetails = (id) => {
    router.push(`/dashboard/incidents/${id.replace('INC-', '')}`);
  };

  return (
    <div className="glass-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-white/10">
            <TableHead>Incident ID</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead className="hidden lg:table-cell">Reported By</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id} className="hover:bg-white/5 border-b-white/10 last:border-b-0 cursor-pointer" onClick={() => handleViewDetails(incident.id)}>
              <TableCell className="font-medium">{incident.id}</TableCell>
              <TableCell className="hidden md:table-cell">{incident.type}</TableCell>
              <TableCell>
                <Badge className={cn("text-xs font-semibold", getSeverityBadgeClass(incident.severity))}>
                  {incident.severity}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">{incident.reportedBy}</TableCell>
              <TableCell className="hidden md:table-cell">{incident.date}</TableCell>
              <TableCell>
                 <Badge variant="outline" className={cn("text-xs", getStatusBadgeClass(incident.status))}>
                  {incident.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card">
                     <DropdownMenuItem onClick={() => handleViewDetails(incident.id)}>View Details</DropdownMenuItem>
                     <DropdownMenuItem>Mark as In Progress</DropdownMenuItem>
                     <DropdownMenuItem>Resolve Incident</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
