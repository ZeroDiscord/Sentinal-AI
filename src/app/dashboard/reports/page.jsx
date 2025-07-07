"use client";
import { useEffect, useState } from "react";
import IncidentTable from "@/components/incident-table";
import IncidentDetailsView from "@/components/IncidentDetailsView";
import { useAuth } from "@/hooks/useAuth";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import IncidentTableSkeleton from "@/components/incident-table-skeleton";
import FullPageLoader from "@/components/ui/full-page-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ReportsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, role, loading: authLoading } = useAuth();

  // State for the full incident details modal on this page
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const [selectedIncidentIdForFull, setSelectedIncidentIdForFull] = useState(null);

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

  // Handler for opening the full incident details modal
  const handleViewFullIncidentDetails = (incidentData) => {
    setSelectedIncidentIdForFull(incidentData.id);
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
          {loading ? (
            <IncidentTableSkeleton />
          ) : error ? (
            <div className="text-destructive glass-card p-4 rounded-lg">{error}</div>
          ) : incidents.length === 0 ? (
            <div className="text-muted-foreground text-center glass-card p-8 rounded-lg">No incidents found.</div>
          ) : (
            <div className="overflow-x-auto w-full">
              {/* This IncidentTable will open the FULL details modal */}
              <IncidentTable 
                incidents={incidents} 
                onViewIncident={handleViewFullIncidentDetails} 
                onActionComplete={handleIncidentActionComplete} 
              />
            </div>
          )}
        </div>
      </div>

      {/* Full Incident Details Modal (for the /dashboard/reports page) */}
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
                handleIncidentActionComplete(); // Trigger refresh on close
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}