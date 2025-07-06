"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { onSnapshot } from "firebase/firestore";

export default function MyReportsPage() {
  const { user, role } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.isAnonymous) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "incidents"), where("reportedBy", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const normalizeSeverity = (severity) => {
    const sev = (severity || '').toLowerCase();
    if (sev === 'critical') return 'Critical';
    if (sev === 'high') return 'High';
    if (sev === 'medium' || sev === 'moderate') return 'Medium';
    if (sev === 'low') return 'Low';
    return 'Low';
  };

  if (!user) return null;
  if (user.isAnonymous) {
    return (
      <Card className="glass-card max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>My Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Anonymous reports cannot be tracked. Please sign in to track your reports.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>My Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading your reports...</div>
        ) : incidents.length === 0 ? (
          <div className="text-center text-muted-foreground">You have not reported any incidents yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-4">Title</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-left py-2 px-4">Summary</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(incident => (
                  <tr key={incident.id} className="border-b border-border/20">
                    <td className="py-2 px-4 font-medium text-foreground">
                      <Link href={`/dashboard/incidents/${incident.id}`} className="hover:underline">
                        {incident.title}
                      </Link>
                    </td>
                    <td className="py-2 px-4">
                      <Badge>{incident.status}</Badge>
                    </td>
                    <td className="py-2 px-4">{incident.date}</td>
                    <td className="py-2 px-4 max-w-xs truncate">{incident.description?.slice(0, 60) || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 