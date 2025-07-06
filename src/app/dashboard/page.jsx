"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ShieldQuestion, FilePlus, Map as MapIcon } from "lucide-react";
import IncidentTable from "@/components/incident-table";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import IncidentTableSkeleton from "@/components/incident-table-skeleton";
import FullPageLoader from "@/components/ui/full-page-loader";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  // Data processing
  const totalIncidents = incidents.length;
  const activeIncidents = incidents.filter(i => i.status !== 'resolved').length;
  const resolvedIncidents = totalIncidents - activeIncidents;
  
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

  if (authLoading || (loading && role !== 'student')) {
    return <FullPageLoader text="Loading Dashboard..." />;
  }

  if (role === "student") {
    // Student-specific landing view
    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="w-full max-w-lg text-center glass-card p-8 rounded-xl">
                 <h1 className="text-3xl font-bold mb-2">Welcome to SentinelAI</h1>
                 <p className="text-muted-foreground mb-6">As a student, you can report incidents and view the live map using the sidebar.</p>
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
      {/* Main dashboard container: remove centering, let flexbox handle layout */}
      <div className="flex flex-col min-h-[80vh]">
        <div className="w-full max-w-6xl mx-auto px-4 flex flex-col">
          <div className="flex flex-col gap-8 p-4 md:p-6">
            <div className="text-left">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back. Here's your incident overview.</p>
            </div>
            {/* Top Section: Grid for Chart and Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[220px]">
              {/* Donut Chart */}
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
              {/* Metric Cards */}
              <MetricCard title="Total Incidents" value={totalIncidents} description="All reported incidents" icon={ShieldQuestion}/>
              <MetricCard title="Active Incidents" value={activeIncidents} description="Pending or in-progress" icon={AlertCircle} />
              <MetricCard title="Resolved Incidents" value={resolvedIncidents} description="Successfully closed cases" icon={CheckCircle} />
            </div>
            {/* Bottom Section: Recent Incidents Table */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Recent Incidents</h2>
              {loading ? (
                <IncidentTableSkeleton />
              ) : error ? (
                <div className="text-destructive glass-card p-4 rounded-lg">{error}</div>
              ) : incidents.length === 0 ? (
                <div className="text-muted-foreground text-center glass-card p-8 rounded-lg">No incidents found.</div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <IncidentTable incidents={incidents} />
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
          background: hsl(var(--background), 0.95) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: var(--radius) !important;
          backdrop-filter: blur(4px) !important;
        }
      `}</style>
    </>
  );
}
