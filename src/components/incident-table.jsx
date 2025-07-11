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
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState, useEffect, useRef } from "react";

// Add onViewIncident to props
export default function IncidentTable({ incidents, onActionComplete, onViewIncident }) {
  const router = useRouter(); // Keep for 'View All Reports' button
  const { user, role } = useAuth();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [assignTo, setAssignTo] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [userNames, setUserNames] = useState({});
  const userCache = useRef({});

  // Sort incidents by priorityScore descending
  const sortedIncidents = [...incidents].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  // Pagination state
  const pageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(sortedIncidents.length / pageSize);
  const paginatedIncidents = sortedIncidents.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => {
    // Reset to first page if incidents change and current page is out of range
    if (currentPage > totalPages) setCurrentPage(1);
  }, [sortedIncidents.length, totalPages, currentPage]); // Added currentPage to dependency array for clarity

  // Fetch assignable users (members, secretaries)
  useEffect(() => {
    if (assignDialogOpen) {
      getDocs(collection(db, "users")).then(snap => {
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  }, [assignDialogOpen]);
  const assignableUsers = users.filter(u => ["member", "secretary"].includes(u.role));

  // Fetch display names for all unique user IDs in the current page
  useEffect(() => {
    const idsToFetch = paginatedIncidents
      .map(i => i.reportedBy)
      .filter(id => id && id !== 'Anonymous' && !userCache.current[id]);
    
    if (idsToFetch.length === 0) {
        // If no new IDs to fetch, and there are incidents, make sure userNames state is updated from cache
        if (paginatedIncidents.length > 0 && Object.keys(userNames).length === 0 && Object.keys(userCache.current).length > 0) {
            setUserNames({ ...userCache.current });
        }
        return;
    }

    const fetchUsers = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, "users")); // Fetches all users
            const newUserNames = { ...userCache.current };
            usersSnapshot.docs.forEach(userDoc => {
                if (idsToFetch.includes(userDoc.id)) {
                    newUserNames[userDoc.id] = userDoc.data().name || userDoc.data().displayName || userDoc.id;
                }
            });

            userCache.current = newUserNames;
            setUserNames({ ...newUserNames });
        } catch (error) {
            console.error("Error fetching user names:", error);
        }
    };
    fetchUsers();
  }, [paginatedIncidents, users]); // Added `users` to dependency array to react to user list changes

  async function handleAssign() {
    if (!selectedIncident) return;
    setAssignLoading(true);
    try {
      const token = user && (await user.getIdToken());
      const res = await fetch(`/api/incidents/${selectedIncident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignedTo: assignTo }),
      });
      if (res.ok) {
        setAssignDialogOpen(false);
        setAssignTo("");
        setSelectedIncident(null);
        if (onActionComplete) onActionComplete(); // Notify parent of action completion
        // router.refresh(); // Removed as parent (Dashboard) will handle data refresh onActionComplete
      } else {
        const errorData = await res.json();
        console.error("Failed to assign incident:", errorData.message);
        // Optionally show an error to the user
      }
    } catch (error) {
        console.error("Error assigning incident:", error);
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleResolve() {
    if (!selectedIncident) return;
    setResolveLoading(true);
    try {
      const token = user && (await user.getIdToken());
      const res = await fetch(`/api/incidents/${selectedIncident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (res.ok) {
        setResolveDialogOpen(false);
        setSelectedIncident(null);
        if (onActionComplete) onActionComplete(); // Notify parent of action completion
        // router.refresh(); // Removed as parent (Dashboard) will handle data refresh onActionComplete
      } else {
        const errorData = await res.json();
        console.error("Failed to resolve incident:", errorData.message);
        // Optionally show an error to the user
      }
    } catch (error) {
        console.error("Error resolving incident:", error);
    } finally {
      setResolveLoading(false);
    }
  }

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-600/80 border-red-500 text-white hover:bg-red-600/90";
      case "High":
        return "bg-orange-500/80 border-orange-400 text-white hover:bg-orange-500/90";
      case "Medium":
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
        return "bg-blue-600/90 border-blue-500 text-white hover:bg-blue-700/90";
      case "Analyzed":
        return "bg-blue-500/80 border-blue-400 text-white hover:bg-blue-500/90";
      case "Pending":
        return "bg-gray-500/80 border-gray-400 text-white hover:bg-gray-500/90";
      default:
        return "bg-gray-500";
    }
  };

  // Modified to call the onViewIncident prop, passing the full incident object
  const handleViewDetails = (incidentData) => {
    if (onViewIncident) {
      onViewIncident(incidentData); // Pass the entire incident object
    }
  };

  return (
    <div className="glass-card overflow-x-auto w-full max-w-full rounded-lg bg-transparent scrollbar-thin scrollbar-thumb-rounded custom-scrollbar">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b-white/10">
            <TableHead className="px-6 py-3">Incident ID</TableHead>
            <TableHead className="hidden md:table-cell px-6 py-3">Type</TableHead>
            <TableHead className="px-6 py-3">Severity</TableHead>
            <TableHead className="px-6 py-3">Priority</TableHead>
            <TableHead className="hidden lg:table-cell px-6 py-3">Reported By</TableHead>
            <TableHead className="hidden md:table-cell px-6 py-3">Date</TableHead>
            <TableHead className="px-6 py-3">School</TableHead>
            <TableHead className="px-6 py-3">Assigned To</TableHead>
            <TableHead className="px-6 py-3">Status</TableHead>
            <TableHead className="text-right px-6 py-3">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedIncidents.map((incident) => (
            // Changed onClick to pass the full incident object
            <TableRow key={incident.id} className="hover:bg-white/5 border-b-white/10 last:border-b-0 cursor-pointer" onClick={() => {
              handleViewDetails(incident);
            }}>
              <TableCell className="px-6 py-3 font-medium">{`#${incident.id.slice(-4).toUpperCase()}`}</TableCell>
              <TableCell className="hidden md:table-cell px-6 py-3">{incident.type}</TableCell>
              <TableCell>
                {(() => {
                  const normalizedSeverity = incident.severity
                    ? (() => {
                        const sev = incident.severity.toLowerCase();
                        if (sev === "critical") return "Critical";
                        if (sev === "high") return "High";
                        if (sev === "medium" || sev === "moderate") return "Medium";
                        if (sev === "low") return "Low";
                        return "Low"; // Default if no match
                      })()
                    : "Low"; // Default if severity is null/undefined
                  return (
                    <Badge className={cn(
                      "text-xs font-semibold severity-badge",
                      getSeverityBadgeClass(normalizedSeverity),
                      {
                        'severity-critical': normalizedSeverity === 'Critical',
                        'severity-high': normalizedSeverity === 'High',
                        'severity-medium': normalizedSeverity === 'Medium',
                        'severity-low': normalizedSeverity === 'Low',
                      }
                    )}>
                      {normalizedSeverity}
                    </Badge>
                  );
                })()}
              </TableCell>
              <TableCell>
                {typeof incident.priorityScore === 'number' ? (
                  <span className="font-mono font-bold text-lg text-primary">{incident.priorityScore.toFixed(1)}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell px-6 py-3">
                {incident.reportedBy === 'Anonymous' || !incident.reportedBy
                  ? 'Anonymous'
                  : userNames[incident.reportedBy] || incident.reportedBy}
              </TableCell>
              <TableCell className="hidden md:table-cell px-6 py-3 whitespace-nowrap">
                {(() => {
                  let dateObj = null;
                  if (incident.date?.toDate) {
                    dateObj = incident.date.toDate();
                  } else if (typeof incident.date === 'string' || typeof incident.date === 'number') {
                    dateObj = new Date(incident.date);
                  }
                  return dateObj && !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                    : '-';
                })()}
              </TableCell>
              <TableCell className="px-6 py-3">{incident.school || '-'}</TableCell>
              <TableCell className="px-6 py-3">{incident.assignedTo || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
              <TableCell>
                   <Badge variant="outline" className={cn("text-xs font-medium flex items-center justify-center px-4 py-1 rounded-full whitespace-nowrap", getStatusBadgeClass((incident.derivedStatus || incident.status)?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())))}>
                     {(incident.derivedStatus || incident.status)?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                   </Badge>
              </TableCell>
              <TableCell className="text-right px-6 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                       {/* Prevent row click from firing when dropdown trigger is clicked */}
                       <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                           <span className="sr-only">Open menu</span>
                           <MoreHorizontal className="h-4 w-4" />
                       </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-card">
                       {/* Changed to call handleViewDetails with the full incident object */}
                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(incident); }}>View Details</DropdownMenuItem>
                       {/* Ensure these actions also stop propagation to prevent row click */}
                       <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Mark as In Progress</DropdownMenuItem>
                       {role === 'cpo' || role === 'school_proctor' ? (
                           <>
                               <DropdownMenuItem onClick={e => { e.stopPropagation(); setSelectedIncident(incident); setAssignDialogOpen(true); }}>Assign</DropdownMenuItem>
                               <DropdownMenuItem onClick={e => { e.stopPropagation(); setSelectedIncident(incident); setResolveDialogOpen(true); }}>Resolve</DropdownMenuItem>
                           </>
                       ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="glass-card"> {/* Added glass-card class */}
          <DialogHeader><DialogTitle>Assign Incident</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select user to assign" />
              </SelectTrigger>
              <SelectContent className="glass-card"> {/* Added glass-card class */}
                {assignableUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {(u.displayName || u.name || u.id)}
                    {u.role ? ` (${u.role})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleAssign} disabled={!assignTo || assignLoading}>
              {assignLoading ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="glass-card"> {/* Added glass-card class */}
          <DialogHeader><DialogTitle>Resolve Incident</DialogTitle></DialogHeader>
          <p>Are you sure you want to mark this incident as resolved?</p>
          <DialogFooter>
            <Button onClick={handleResolve} variant="destructive" disabled={resolveLoading}>
              {resolveLoading ? "Resolving..." : "Yes, Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-1 mt-6 p-4"> {/* Added padding for clarity */}
          <Button
            variant="ghost"
            className="h-9 px-3 rounded-full flex items-center justify-center"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={currentPage === i + 1 ? "default" : "ghost"}
              className="h-9 px-4 min-w-[2.25rem] rounded-full flex items-center justify-center font-semibold transition-all"
              onClick={() => setCurrentPage(i + 1)}
              aria-label={`Page ${i + 1}`}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="h-9 px-3 rounded-full flex items-center justify-center"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}