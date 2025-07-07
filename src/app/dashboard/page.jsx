"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ShieldQuestion, FilePlus, Map as MapIcon, Clock, Shield } from "lucide-react";
import IncidentTable from "@/components/incident-table";
import IncidentBriefDialogContent from "@/components/incident-brief-dialog-content"; // Import the brief dialog content
import IncidentDetailsView from "@/components/incident-details-view"; // Import the full details view
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy, where, limit } from "firebase/firestore"; // Import 'where' and 'limit'
import { db } from "@/lib/firebase";
import IncidentTableSkeleton from "@/components/incident-table-skeleton";
import FullPageLoader from "@/components/ui/full-page-loader";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const severityConfig = {
  critical: { color: '#ef4444', label: 'Critical' },
  high: { color: '#fb7185', label: 'High' },
  medium: { color: '#f59e0b', label: 'Medium' },
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
      // Fetch all incidents for the dashboard metrics and for the "View All Reports" button
      const allIncidentsQuery = query(collection(db, "incidents"), orderBy("createdAt", "desc"));
      const unsubAll = onSnapshot(allIncidentsQuery, (snapshot) => {
        setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (err) => {
        setError("Failed to fetch incidents");
        setLoading(false);
        console.error(err);
      });

      return () => {
        unsubAll();
      };
    } else if (role === "student") {
        setLoading(false);
    }
  }, [role, authLoading]);

  // Separate state and effect for incidents requiring attention (top 5 by severity)
  const [attentionIncidents, setAttentionIncidents] = useState([]);
  const [loadingAttention, setLoadingAttention] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const allowedRoles = ["school_proctor", "cpo", "secretary", "warden", "member"];
    if (allowedRoles.includes(role)) {
      // Fetch top 5 most recent incidents, sorted by severity (critical > high > medium > low), then by createdAt
      const attentionQuery = query(
        collection(db, "incidents"),
        where("status", "!=", "resolved"),
        orderBy("severity", "desc"), // Assuming 'critical' is highest, 'low' is lowest
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const unsubAttention = onSnapshot(attentionQuery, (snapshot) => {
        setAttentionIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingAttention(false);
      }, (err) => {
        setLoadingAttention(false);
      });
      return () => unsubAttention();
    } else if (role === "student") {
      setLoadingAttention(false);
    }
  }, [role, authLoading]);

  // Filter incidents for members: only show assigned incidents (case-insensitive, trimmed)
  let visibleIncidents = incidents;
  if (role && role.trim().toLowerCase() === 'member' && user) {
    const userIds = [user.uid, user.displayName, user.email]
      .filter(Boolean)
      .map(val => val.trim().toLowerCase());
    visibleIncidents = incidents.filter(i =>
      userIds.includes((i.assignedTo || '').trim().toLowerCase())
    );
  }
  // Filter attentionIncidents for members as well
  let visibleAttentionIncidents = attentionIncidents;
  if (role && role.trim().toLowerCase() === 'member' && user) {
    const userIds = [user.uid, user.displayName, user.email]
      .filter(Boolean)
      .map(val => val.trim().toLowerCase());
    visibleAttentionIncidents = attentionIncidents.filter(i =>
      userIds.includes((i.assignedTo || '').trim().toLowerCase())
    );
  }

  // Data processing (remains the same, but use visibleIncidents)
  const totalIncidents = visibleIncidents.length;
  const activeIncidents = visibleIncidents.filter(i => i.status !== 'resolved').length;
  const resolvedIncidents = visibleIncidents.filter(i => i.status === 'resolved').length;
  
  const donutData = Object.entries(
    visibleIncidents.reduce((acc, i) => {
      const severity = (i.severity || 'default').toLowerCase().replace('medium', 'medium');
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({
    name: severityConfig[name]?.label || 'Unknown',
    value,
    color: severityConfig[name]?.color || severityConfig.default.color,
  })).filter(item => item.value > 0);

  const calculateResolutionMetrics = () => {
    const resolvedIncidentsList = visibleIncidents.filter(i => i.status === 'resolved' && i.resolvedAt && i.createdAt);
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

  // Compute status counts per severity (use visibleIncidents)
  const severities = ['critical', 'high', 'medium', 'low'];
  const statusLabels = [
    { key: 'unread', label: 'Unread', color: 'bg-gray-400' },
    { key: 'read', label: 'Read', color: 'bg-blue-500' },
    { key: 'assigned', label: 'Assigned', color: 'bg-amber-500' },
    { key: 'resolved', label: 'Resolved', color: 'bg-emerald-600' },
  ];
  const severityColors = {
    critical: 'bg-red-600 text-white',
    high: 'bg-pink-400 text-white',
    medium: 'bg-amber-400 text-white',
    low: 'bg-blue-500 text-white',
  };
  const severityLabels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  const statusBySeverity = {};
  severities.forEach(sev => {
    statusBySeverity[sev] = { unread: 0, read: 0, assigned: 0, resolved: 0 };
  });
  visibleIncidents.forEach(i => {
    const sev = (i.severity || '').toLowerCase();
    if (!severities.includes(sev)) return;
    if (i.status === 'resolved') {
      statusBySeverity[sev].resolved++;
    } else if (i.assignedTo) {
      statusBySeverity[sev].assigned++;
    } else if (i.readBy && i.readBy.includes(user?.uid)) {
      statusBySeverity[sev].read++;
    } else {
      statusBySeverity[sev].unread++;
    }
  });

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
        <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900/60 via-slate-900/80 to-indigo-900/60 animate-gradient-move" />
            <div className="w-full max-w-md glass-card p-8 rounded-2xl shadow-2xl border border-slate-600/60 bg-gradient-to-br from-slate-900/90 to-slate-800/70 flex flex-col items-center relative">
                {/* Illustration/Icon */}
                <div className="mb-2 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-primary drop-shadow-lg animate-bounce-slow" />
                </div>
                {/* Avatar with glowing ring */}
                <div className="relative mb-4">
                    <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/40 via-indigo-400/30 to-cyan-400/40 blur-lg animate-pulse-slow" />
                    <Avatar className="h-16 w-16 border-4 border-primary/60 shadow-xl relative">
                        <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || user?.email || 'User'} />
                        <AvatarFallback>{(user?.displayName || user?.email || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
                <h1 className="text-2xl font-bold mb-1">Welcome{user?.displayName ? `, ${user.displayName}` : ''}!</h1>
                <p className="text-muted-foreground text-sm mb-6">Glad to see you, {user?.displayName || user?.email || 'Student'}.</p>
                <div className="flex flex-wrap justify-center items-center gap-3 w-full mb-2">
                    <Button onClick={() => router.push('/dashboard/report')} size="lg" className="flex-1 min-w-[140px] transition-all duration-200 hover:scale-105 hover:shadow-lg">
                        <FilePlus className="mr-2 h-5 w-5" />
                        Report Incident
                    </Button>
                    <Button onClick={() => router.push('/dashboard/my-reports')} size="lg" className="flex-1 min-w-[140px] transition-all duration-200 hover:scale-105 hover:shadow-lg">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        My Reports
                    </Button>
                    <Button onClick={() => router.push('/dashboard/map')} size="lg" className="flex-1 min-w-[140px] transition-all duration-200 hover:scale-105 hover:shadow-lg">
                        <MapIcon className="mr-2 h-5 w-5" />
                        Live Map
                    </Button>
                </div>
            </div>
            <div className="w-full max-w-md text-center glass-card p-6 rounded-xl mt-6 border border-slate-700/40 bg-slate-900/70 shadow-lg">
                <h2 className="text-xl font-semibold mb-2">Welcome to SentinelAI</h2>
                <p className="text-muted-foreground">As a student, you can report incidents and view the live map using the sidebar or the quick actions above.</p>
            </div>
            {/* Custom styles for animation */}
            <style jsx>{`
                .animate-gradient-move {
                    background-size: 200% 200%;
                    animation: gradientMove 8s ease-in-out infinite;
                }
                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-bounce-slow {
                    animation: bounceSlow 2.5s infinite alternate;
                }
                @keyframes bounceSlow {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-8px); }
                }
                .animate-pulse-slow {
                    animation: pulseSlow 2.5s infinite alternate;
                }
                @keyframes pulseSlow {
                    0% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .severity-badge {
          box-shadow: 0 0 4px 1px rgba(0,0,0,0.10);
          animation: none;
          border-width: 2px;
          border-style: solid;
        }
        .severity-critical {
          border-color: #ef4444cc;
          background: #ef4444;
          color: #fff;
          box-shadow: 0 0 8px 2px #ef444488;
          animation: pulse-critical 1.5s infinite alternate;
        }
        .severity-high {
          border-color: #fb718599;
          background: #fb7185;
          color: #fff;
          box-shadow: 0 0 6px 1px #fb718555;
          animation: pulse-high 2s infinite alternate;
        }
        .severity-medium {
          border-color: #f59e0b77;
          background: #f59e0b;
          color: #fff;
          box-shadow: 0 0 4px 1px #f59e0b44;
          animation: pulse-medium 2.5s infinite alternate;
        }
        .severity-low {
          border-color: #3b82f655;
          background: #3b82f6;
          color: #fff;
          box-shadow: 0 0 2px 1px #3b82f633;
          animation: none;
        }
        @keyframes pulse-critical {
          0% { box-shadow: 0 0 8px 2px #ef444488; }
          100% { box-shadow: 0 0 12px 4px #ef444466; }
        }
        @keyframes pulse-high {
          0% { box-shadow: 0 0 6px 1px #fb718555; }
          100% { box-shadow: 0 0 10px 2px #fb718544; }
        }
        @keyframes pulse-medium {
          0% { box-shadow: 0 0 4px 1px #f59e0b44; }
          100% { box-shadow: 0 0 7px 2px #f59e0b33; }
        }
      `}</style>

      {/* When rendering the attentionIncidents table, sort by severity order */}
      {/* This sorting logic is placed here as it relates to rendering the table later */}
      {(() => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const sortedAttentionIncidents = [...visibleAttentionIncidents].sort((a, b) => {
          const sevA = (a.severity || '').toLowerCase();
          const sevB = (b.severity || '').toLowerCase();
          return (severityOrder[sevA] ?? 99) - (severityOrder[sevB] ?? 99);
        });

        return (
          <div className="flex flex-col min-h-[80vh]">
            <div className="w-full max-w-6xl mx-auto px-4 flex flex-col">
              <div className="flex flex-col gap-8 p-4 md:p-6">
                <div className="text-left">
                  <h1 className="text-3xl font-bold">Dashboard</h1>
                  <p className="text-muted-foreground">
                    {`Welcome back${user?.displayName ? `, ${user.displayName}` : ''}. Here's your incident overview.`}
                  </p>
                </div>
                {/* Collapsible Donut + Metrics + Status Breakdown */}
                <div className="glass-card rounded-xl overflow-hidden mb-6">
                  <div className="flex flex-col md:flex-row items-stretch justify-between p-6 gap-8">
                    {/* Donut chart and legend */}
                    <div className="flex flex-col items-center justify-center flex-1 min-w-[260px] max-w-[340px] mx-auto">
                      <div className="text-base font-semibold mb-2 self-start">Incidents by Severity</div>
                      <div style={{ width: 240, height: 240 }} className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={100}
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
                                color: '#fff',
                                fontWeight: 500,
                              }}
                              itemStyle={{ color: '#fff', fontWeight: 500 }}
                              labelStyle={{ color: '#fff', fontWeight: 500 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Custom legend below chart with improved spacing */}
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {donutData.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-full" style={{ background: entry.color }} />
                            <span className="text-sm" style={{ color: entry.color }}>{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Metrics and status breakdown */}
                    <div className="flex-1 w-full flex flex-col justify-center">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard title="Total Incidents" value={totalIncidents} description="All reported incidents" icon={ShieldQuestion}/>
                        <MetricCard title="Active Incidents" value={activeIncidents} description="Pending or in-progress" icon={AlertCircle} />
                        <MetricCard title="Resolved Incidents" value={resolvedIncidents} description="Successfully closed cases" icon={CheckCircle} />
                      </div>
                      {/* Status Breakdown Card */}
                      <div className="mt-6">
                        <div className="glass-card p-4 rounded-lg">
                          <div className="font-semibold mb-2">Status Breakdown by Severity</div>
                          <div className="flex flex-col gap-2">
                            {severities.map(sev => (
                              <div key={sev} className="flex items-center gap-3">
                                <span className={`inline-block w-3 h-3 rounded-full mr-2`} style={{ background: severityColors[sev].split(' ')[0].replace('bg-', 'var(--tw-bg-opacity, 1) hsl(var(--' + sev + '))') || '#888' }} />
                                <span className="font-medium text-base text-foreground mr-2">{severityLabels[sev]}</span>
                                <div className="flex gap-3 flex-wrap">
                                  {statusLabels.map(status => (
                                    statusBySeverity[sev][status.key] > 0 && (
                                      <span key={status.key} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                        {status.label}
                                        <span className="font-bold" style={{ color: severityColors[sev].split(' ')[0].replace('bg-', 'var(--tw-bg-opacity, 1) hsl(var(--' + sev + '))') || '#888' }}>
                                          {statusBySeverity[sev][status.key]}
                                        </span>
                                      </span>
                                    )
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* End collapsible card */}

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
                    <h2 className="text-2xl font-bold">Incidents Requiring Attention</h2>
                    <Button onClick={() => router.push('/dashboard/reports')}>
                      View All Reports
                    </Button>
                  </div>
                  {loadingAttention ? (
                    <IncidentTableSkeleton />
                  ) : error ? (
                    <div className="text-destructive glass-card p-4 rounded-lg">{error}</div>
                  ) : sortedAttentionIncidents.length === 0 ? (
                    <div className="text-muted-foreground text-center glass-card p-8 rounded-lg">No incidents requiring attention found.</div>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <IncidentTable 
                        incidents={sortedAttentionIncidents}
                        onViewIncident={handleOpenIncidentModal}
                        onActionComplete={handleIncidentActionComplete} 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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