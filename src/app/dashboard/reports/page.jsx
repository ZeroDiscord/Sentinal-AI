"use client";
import { useEffect, useState } from "react";
import IncidentTable from "@/components/incident-table";
import IncidentDetailsView from "@/components/incident-details-view";
import { useAuth } from "@/hooks/useAuth";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import IncidentTableSkeleton from "@/components/incident-table-skeleton";
import FullPageLoader from "@/components/ui/full-page-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import IncidentBriefDialogContent from "@/components/incident-brief-dialog-content";

export default function ReportsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, role, loading: authLoading } = useAuth();

  // State for the full incident details modal on this page
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const [selectedIncidentIdForFull, setSelectedIncidentIdForFull] = useState(null);

  // Filter state
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Add state for snapshot modal
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [selectedIncidentIdForSnapshot, setSelectedIncidentIdForSnapshot] = useState(null);

  useEffect(() => {
    // This page is intended for CPO/Admin, but we'll fetch data if user is logged in.
    // Role-based access control might be handled by parent layout or Firebase security rules.
    if (authLoading) return;

    // Fetch all incidents for the Reports page
    const q = query(collection(db, "incidents"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      setError("Failed to fetch incidents");
      setLoading(false);
      console.error(err);
    });
    return () => unsub();
  }, [authLoading]); // Depend on authLoading to ensure user state is ready

  // Compute filtered incidents
  let visibleIncidents = incidents;
  if (role === 'member' && user) {
    const userIds = [user.uid, user.displayName, user.email].filter(Boolean);
    visibleIncidents = incidents.filter(inc =>
      userIds.includes(inc.assignedTo) || userIds.includes(inc.reportedBy)
    );
  }
  const filteredIncidents = visibleIncidents.map(inc => {
    // Derive status for filtering and display
    let derivedStatus = inc.status;
    if (inc.status !== 'resolved' && inc.assignedTo) {
      derivedStatus = 'in_progress';
    }
    return { ...inc, derivedStatus };
  }).filter(inc => {
    const statusToCheck = inc.derivedStatus ? inc.derivedStatus.toLowerCase() : '';
    const sevMatch = severityFilter && severityFilter !== "all" ? (inc.severity && inc.severity.toLowerCase() === severityFilter) : true;
    const statusMatch = statusFilter && statusFilter !== "all" ? (statusToCheck === statusFilter) : true;
    return sevMatch && statusMatch;
  });

  // Update handler for row click to open snapshot modal
  const handleViewSnapshot = (incidentData) => {
    setSelectedIncidentIdForSnapshot(incidentData.id);
    setIsSnapshotModalOpen(true);
  };

  // Handler for opening the full incident details modal from snapshot
  const handleViewFullIncidentDetails = (incidentId) => {
    setIsSnapshotModalOpen(false);
    setSelectedIncidentIdForSnapshot(null);
    setSelectedIncidentIdForFull(incidentId);
    setIsFullModalOpen(true);
  };

  // Callback to refresh table after an action in the modal (e.g., assign, resolve)
  const handleIncidentActionComplete = () => {
    // onSnapshot will automatically re-run due to Firestore changes, so no manual re-fetch needed.
  };

  if (authLoading || loading) { // Use 'loading' directly here as this page fetches its own data
    return <FullPageLoader text="Loading Reports..." />;
  }

  // Optional: Add explicit role check here if this page should be strictly restricted
  // if (role !== 'cpo' && role !== 'school_proctor' && ...) {
  //   return <div className="text-center text-red-500 font-bold text-xl mt-12">You are not authorized to view this page.</div>;
  // }

  return (
    <div className="flex flex-col min-h-[80vh]">
      <div className="w-full max-w-6xl mx-auto px-4 flex flex-col">
        <div className="flex flex-col gap-8 p-4 md:p-6">
          <div className="text-left">
            <h1 className="text-3xl font-bold">All Incident Reports</h1>
            <p className="text-muted-foreground">Comprehensive list of all incidents.</p>
          </div>
          {/* Filters for CPO and similar roles */}
          {(role === 'cpo' || role === 'school_proctor' || role === 'secretary' || role === 'warden' || role === 'member') && (
            <div className="flex flex-wrap gap-4 items-center mb-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Severity</label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="analyzed">Analyzed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {loading ? (
            <IncidentTableSkeleton />
          ) : error ? (
            <div className="text-destructive glass-card p-4 rounded-lg">{error}</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-muted-foreground text-center glass-card p-8 rounded-lg">No incidents found.</div>
          ) : (
            <div className="overflow-x-auto w-full">
              {/* This IncidentTable will open the snapshot modal on row click */}
              <IncidentTable 
                incidents={filteredIncidents} 
                onViewIncident={handleViewSnapshot} 
                onActionComplete={handleIncidentActionComplete} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Card Modal */}
      {selectedIncidentIdForSnapshot && (
        <Dialog open={isSnapshotModalOpen} onOpenChange={setIsSnapshotModalOpen}>
          <DialogContent className="sm:max-w-[500px] glass-card max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Incident Snapshot</DialogTitle>
              <DialogDescription>
                A quick overview of the incident.
              </DialogDescription>
            </DialogHeader>
            <IncidentBriefDialogContent 
              incident={filteredIncidents.find(i => i.id === selectedIncidentIdForSnapshot)} 
              onClose={() => {
                setIsSnapshotModalOpen(false);
                setSelectedIncidentIdForSnapshot(null);
              }}
              onViewFullReport={handleViewFullIncidentDetails}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Full Details Modal */}
      {selectedIncidentIdForFull && (
        <Dialog open={isFullModalOpen} onOpenChange={setIsFullModalOpen}>
          <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] glass-card max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Incident Details</DialogTitle>
              <DialogDescription>
                Comprehensive details about the incident.
              </DialogDescription>
            </DialogHeader>
            <IncidentDetailsView 
              incidentId={selectedIncidentIdForFull} 
              onClose={() => {
                setIsFullModalOpen(false);
                setSelectedIncidentIdForFull(null);
                handleIncidentActionComplete();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}