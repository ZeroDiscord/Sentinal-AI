"use client";
import { useEffect, useState, use as usePromise } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MapPin } from "lucide-react";
import AIAnalysis from "@/components/ai-analysis";
import IncidentForm from "@/components/incident-form";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function IncidentDetailsPage({ params }) {
  const unwrappedParams = usePromise(params);
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  const fetchIncident = async () => {
    setLoading(true);
    setError(null);
    try {
      const id = unwrappedParams.id.padStart(3, '0');
      const res = await fetch(`/api/incidents/${id}`);
      const data = await res.json();
      if (res.ok) setIncident(data.incident);
      else setError(data.error || "Incident not found");
    } catch (err) {
      setError("Failed to fetch incident");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
    // eslint-disable-next-line
  }, [unwrappedParams.id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this incident?")) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const token = user && (await user.getIdToken());
      const res = await fetch(`/api/incidents/${incident.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete incident");
      }
    } catch (err) {
      setDeleteError("Failed to delete incident");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <div>Loading incident...</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!incident) return <div>No incident found.</div>;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        {editing ? (
          <IncidentForm
            incident={incident}
            onSuccess={() => {
              setEditing(false);
              fetchIncident();
            }}
          />
        ) : (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{incident.title}</CardTitle>
                  <CardDescription>Incident ID: {incident.id}</CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg">{incident.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Reported on {incident.date}</div>
                <div className="flex items-center gap-2"><User className="w-4 h-4" /> By {incident.reportedBy} ({incident.reporterRole})</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> At {incident.location}</div>
              </div>
              <div className="prose prose-invert max-w-none text-foreground/80">
                <h3 className="text-foreground">Description</h3>
                <p>{incident.description}</p>
              </div>
              {user && (
                <div className="flex gap-2 mt-6">
                  <button className="btn btn-primary" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-destructive"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </button>
                  {deleteError && <div className="text-destructive ml-2">{deleteError}</div>}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-1">
        <AIAnalysis reportText={incident.description} />
      </div>
    </div>
  );
}
