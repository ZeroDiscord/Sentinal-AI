"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import IncidentTable from "@/components/incident-table";
import IncidentTableSkeleton from "@/components/incident-table-skeleton";
import FullPageLoader from "@/components/ui/full-page-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Import Dialog components
import IncidentBriefDialogContent from "@/components/incident-brief-dialog-content"; // Import brief dialog content
import IncidentDetailsView from "@/components/incident-details-view"; // Import full details view

export default function MyReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to hold the incident data/ID for the modal
  const [selectedIncidentForModal, setSelectedIncidentForModal] = useState(null);
  // State to control what content is shown in the modal: 'brief' or 'full'
  const [modalViewMode, setModalViewMode] = useState('brief');


  useEffect(() => {
    if (authLoading) return;

    if (!user || user.isAnonymous) {
      setLoading(false);
      setError("Please sign in to view your reports.");
      setIncidents([]);
      return;
    }

    const q = query(
      collection(db, "incidents"),
      where("reportedBy", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      setError("Failed to fetch your reports.");
      setLoading(false);
      console.error(err);
    });

    return () => unsub();
  }, [user, authLoading]);

  // Handle opening the modal (always starts in brief mode)
  const handleOpenIncidentModal = (incidentData) => {
    setSelectedIncidentForModal(incidentData); // Store the full incident object for brief view
    setModalViewMode('brief'); // Start in brief mode
    setIsModalOpen(true);
  };

  // Callback to switch to full report view within the modal
  const handleSwitchToFullReport = (incidentId) => {
    setSelectedIncidentForModal(null); // Clear incident object to force IncidentDetailsView to fetch by ID
    setSelectedIncidentForModal(incidentId); // Now store the ID for IncidentDetailsView
    setModalViewMode('full'); // Switch to full mode
  };

  // Callback for when an action (assign/resolve) is completed in the modal
  const handleIncidentActionComplete = () => {
    // onSnapshot will naturally trigger a re-fetch.
  };

  // Handle modal close (resets state to default for next open)
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedIncidentForModal(null);
    setModalViewMode('brief'); // Reset to brief for next open
  };

  if (authLoading || loading) {
    return <FullPageLoader text="Loading your reports..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-[80vh]">
        <div className="w-full max-w-6xl mx-auto px-4 flex flex-col">
          <div className="flex flex-col gap-8 p-4 md:p-6">
            <div className="text-left">
              <h1 className="text-3xl font-bold">My Reports</h1>
              <p className="text-muted-foreground">View incidents you have reported.</p>
            </div>
            {incidents.length === 0 ? (
              <div className="text-muted-foreground text-center glass-card p-8 rounded-lg">
                No incidents reported by you.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <IncidentTable 
                  incidents={incidents} 
                  onViewIncident={handleOpenIncidentModal} // Pass the handler for brief modal
                  onActionComplete={handleIncidentActionComplete} 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Incident Modal */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
          <DialogContent 
            className={`glass-card max-h-[90vh] overflow-y-auto ${modalViewMode === 'brief' ? 'sm:max-w-xl' : 'sm:max-w-[800px] lg:max-w-[1000px]'}`}
          >
            <DialogHeader>
              <DialogTitle>
                {modalViewMode === 'brief' ? 'Incident Snapshot' : 'Incident Details'}
              </DialogTitle>
              <DialogDescription>
                {modalViewMode === 'brief' ? 'A quick overview of the incident.' : 'Comprehensive details about the incident.'}
              </DialogDescription>
            </DialogHeader>

            {modalViewMode === 'brief' && selectedIncidentForModal && (
              <IncidentBriefDialogContent 
                incident={selectedIncidentForModal} // Pass the full incident object
                onClose={handleModalClose}
                onViewFullReport={handleSwitchToFullReport} // Pass callback to switch view
              />
            )}

            {modalViewMode === 'full' && selectedIncidentForModal && (
              <IncidentDetailsView 
                incidentId={typeof selectedIncidentForModal === 'string' ? selectedIncidentForModal : selectedIncidentForModal.id} // Ensure ID is passed
                onClose={handleModalClose} // Allow closing full modal
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}