"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ShieldQuestion, FilePlus, Map as MapIcon, Clock } from "lucide-react";
import IncidentTable from "@/components/incident-table";
import IncidentBriefDialogContent from "@/components/IncidentBriefDialogContent"; // Import the brief dialog content
import IncidentDetailsView from "@/components/IncidentDetailsView"; // Import the full details view
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import IncidentTableSkeleton from "@/components/incident-table-skeleton";
import FullPageLoader from "@/components/ui/full-page-loader";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const severityConfig = {
  critical: { color: '#ef4444', label: 'Critical' },
  high: { color: '#f97316', label: 'High' },
  moderate: { color: '#f59e0b', label: 'Moderate' },
  low: { color: '#3b82f6', label: 'Low' },
  default: { color: '#6b7280', label: 'Unknown' },
};

// MetricCard: icon larger and centered
const MetricCard = ({ title, value, description, icon: Icon }) => (
  <Card className="glass-card h-full flex flex-col justify-center p-6">
    <div className="flex justify-between items-center h-12 mb-2">
      <div className="flex flex-col justify-center">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <p className="text-xs text-muted-foreground mt-2">{description}</p>
  </Card>
);

export default function DashboardPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to hold the incident data/ID for the modal
  const [selectedIncidentForModal, setSelectedIncidentForModal] = useState(null);
  // State to control what content is shown in the modal: 'brief' or 'full'
  const [modalViewMode, setModalViewMode] = useState('brief');

  useEffect(() => {
    if (authLoading) return;
    const allowedRoles = ["school_proctor", "cpo", "secretary", "warden", "member"];
    if (allowedRoles.includes(role)) {
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
    } else if (role === "student") {
        setLoading(false);
    }
  }, [role, authLoading]);

  // Data processing (remains the same)
  const totalIncidents = incidents.length;
  const activeIncidents = incidents.filter(i => i.status !== 'resolved').length;
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;
  
  const donutData = Object.entries(
    incidents.reduce((acc, i) => {
      const severity = (i.severity || 'default').toLowerCase().replace('medium', 'moderate');
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({
    name: severityConfig[name]?.label || 'Unknown',
    value,
    color: severityConfig[name]?.color || severityConfig.default.color,
  })).filter(item => item.value > 0);

  const calculateResolutionMetrics = () => {
    const resolvedIncidentsList = incidents.filter(i => i.status === 'resolved' && i.resolvedAt && i.createdAt);
    const totalResolved = resolvedIncidentsList.length;

    const overallResolutionPercentage = totalIncidents > 0 ? ((resolvedIncidents / totalIncidents) * 100).toFixed(1) : 0;

    let totalResolutionTime = 0;
    resolvedIncidentsList.forEach(i => {
      const createdAt = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt);
      const resolvedAt = i.resolvedAt?.toDate ? i.resolvedAt.toDate() : new Date(i.resolvedAt);
      totalResolutionTime += (resolvedAt.getTime() - createdAt.getTime());
    });

    // Ensure averageResolutionTimeMs is defined here
    const averageResolutionTimeMs = totalResolved > 0 ? totalResolutionTime / totalResolved : 0;

    const msToDays = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
      if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''}`;
      return `${seconds} sec${seconds > 1 ? 's' : ''}`;
    };

    const formattedAverageResolutionTime = averageResolutionTimeMs > 0 ? msToDays(averageResolutionTimeMs) : 'N/A';

    return {
      overallResolutionPercentage,
      formattedAverageResolutionTime,
    };
  };

  const { overallResolutionPercentage, formattedAverageResolutionTime } = calculateResolutionMetrics();

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

  if (authLoading || (loading && role !== 'student')) {
    return <FullPageLoader text="Loading Dashboard..." />;
  }

  if (role === "student") {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="w-full max-w-lg text-center glass-card p-8 rounded-xl">
                 <h1 className="text-3xl font-bold mb-2">Welcome to SentinelAI</h1>
                 <p className="text-muted-foreground mb-6">As a text-muted-foreground student, you can report incidents and view the live map using the sidebar.</p>
                 <Button onClick={() => router.push('/dashboard/report')} size="lg">
                    <FilePlus className="mr-2 h-5 w-5" />
                    Report an Incident
                 </Button>
            </div>
        </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-[80vh]">
        <div className="w-full max-w-6xl mx-auto px-4 flex flex-col">
          <div className="flex flex-col gap-8 p-4 md:p-6">
            <div className="text-left">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back. Here's your incident overview.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[220px]">
              <Card className="glass-card h-full md:col-span-2 lg:col-span-1 flex flex-col justify-center">
                <CardHeader>
                  <CardTitle className="text-base">Incidents by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        labelLine={false}
                      >
                        {donutData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.color} stroke={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--secondary))' }}
                        contentStyle={{
                          background: 'hsl(var(--background) / 0.8)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <MetricCard title="Total Incidents" value={totalIncidents} description="All reported incidents" icon={ShieldQuestion}/>
              <MetricCard title="Active Incidents" value={activeIncidents} description="Pending or in-progress" icon={AlertCircle} />
              <MetricCard title="Resolved Incidents" value={resolvedIncidents} description="Successfully closed cases" icon={CheckCircle} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 min-h-[120px]">
                <MetricCard 
                    title="Overall Resolution Rate" 
                    value={`${overallResolutionPercentage}%`} 
                    description="Percentage of all incidents resolved" 
                    icon={CheckCircle} 
                />
                <MetricCard 
                    title="Avg. Resolution Time" 
                    value={formattedAverageResolutionTime} 
                    description="Average time to resolve an incident" 
                    icon={Clock} 
                />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Recent Incidents</h2>
                <Button onClick={() => router.push('/dashboard/reports')}>
                  View All Reports
                </Button>
              </div>
              {loading ? (
                <IncidentTableSkeleton />
              ) : error ? (
                <div className="text-destructive glass-card p-4 rounded-lg">{error}</div>
              ) : incidents.length === 0 ? (
                <div className="text-muted-foreground text-center glass-card p-8 rounded-lg">No incidents found.</div>
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
      </div>
      <style jsx global>{`
        .recharts-tooltip-item,
        .recharts-tooltip-label {
          color: #fff !important;
        }
        .recharts-default-tooltip {
          background: hsl(var(--background) / 0.8) !important;
          backdrop-filter: blur(4px) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: var(--radius) !important;
        }
      `}</style>

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