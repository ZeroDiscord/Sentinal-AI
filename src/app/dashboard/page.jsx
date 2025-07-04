"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ShieldQuestion, FilePlus, Map as MapIcon } from "lucide-react";
import IncidentTable from "@/components/incident-table";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import IncidentTableSkeleton from "@/components/incident-table-skeleton";

export default function DashboardPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && role === undefined) return; // Wait for role
    if (!authLoading && !["school_proctor", "cpo", "secretary", "warden", "member", "student"].includes(role)) {
      router.replace("/dashboard/no-access");
    }
  }, [role, authLoading, router]);

  // Fetch incidents only for allowed roles
  useEffect(() => {
    if (["school_proctor", "cpo", "secretary", "warden", "member"].includes(role)) {
      setLoading(true);
      const unsub = onSnapshot(collection(db, "incidents"), (snapshot) => {
        setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (err) => {
        setError("Failed to fetch incidents");
        setLoading(false);
      });
      return () => unsub();
    }
  }, [role]);

  const totalIncidents = incidents.length;
  const pendingIncidents = incidents.filter(i => i.status !== 'resolved').length;
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;

  if (authLoading) return <div>Loading...</div>;

  // Only show special instructions for students
  if (role === "student") {
    return (
      <div className="max-w-xl w-full mx-auto glass-card p-8 flex flex-col items-center justify-center shadow-lg border border-cyan-900/20 mt-12">
        <h1 className="text-3xl font-bold mb-2 text-center">Welcome to SentinelAI!</h1>
        <p className="text-muted-foreground mb-6 text-center">
          You are signed in as a student. You can report incidents using the sidebar, or explore the live map. To view incident data and access more features, please contact your school admin.
        </p>
        <div className="w-full flex flex-col gap-4 mb-6">
          <div className="flex items-start gap-3">
            <FilePlus className="h-6 w-6 text-cyan-400 mt-1" />
            <div>
              <span className="font-semibold text-foreground">Report Incident:</span>
              <span className="text-muted-foreground ml-1">Submit a new incident.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapIcon className="h-6 w-6 text-cyan-400 mt-1" />
            <div>
              <span className="font-semibold text-foreground">Live Map:</span>
              <span className="text-muted-foreground ml-1">View real-time incident locations.</span>
            </div>
          </div>
        </div>
        <button
          className="mt-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold shadow-lg transition text-lg"
          onClick={() => router.push('/dashboard/report')}
        >
          Report an Incident
        </button>
      </div>
    );
  }

  // For all other roles, show the full dashboard (original layout)
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-6xl px-4 flex flex-col items-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Proctor. Here's your incident overview.</p>
        </div>
        <div className="w-full grid gap-4 md:grid-cols-3 mb-10">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card className="glass-card animate-pulse" key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium bg-gray-300 h-4 w-24 rounded" />
                  <div className="h-4 w-4 bg-gray-300 rounded-full" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-gray-300 rounded mb-2" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Incidents
                  </CardTitle>
                  <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalIncidents}</div>
                  <p className="text-xs text-muted-foreground">
                    All reported incidents
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Incidents
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingIncidents}</div>
                  <p className="text-xs text-muted-foreground">
                    Pending or in-progress
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved Incidents</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resolvedIncidents}</div>
                  <p className="text-xs text-muted-foreground">
                    Successfully closed cases
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        <div className="w-full">
          <h2 className="text-2xl font-bold mb-4">Recent Incidents</h2>
          {loading ? (
            <IncidentTableSkeleton />
          ) : error ? (
            <div className="text-destructive">{error}</div>
          ) : incidents.length === 0 ? (
            <div className="text-muted-foreground">No incidents found.</div>
          ) : (
            <IncidentTable incidents={incidents} />
          )}
        </div>
      </div>
    </div>
  );
}
