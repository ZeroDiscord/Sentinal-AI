"use client";
import { useEffect, useState, use as usePromise } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MapPin, Pencil, Trash2, RefreshCw } from "lucide-react";
import AIAnalysis from "@/components/ai-analysis";
import IncidentForm from "@/components/incident-form";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function IncidentDetailsPage({ params }) {
  const unwrappedParams = usePromise(params);
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
      setShowDeleteDialog(false);
    }
  };

  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      const id = unwrappedParams.id.padStart(3, '0');
      const response = await fetch(`/api/incidents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIncident(data.incident);
        // Show success message or toast
        console.log('Incident re-analyzed successfully');
      } else {
        console.error('Failed to re-analyze incident');
      }
    } catch (error) {
      console.error('Error re-analyzing incident:', error);
    } finally {
      setReanalyzing(false);
    }
  }

  if (loading) return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="glass-card p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-8 w-40" />
      </div>
    </div>
  );
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
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Incident Details</h1>
                <Button 
                  onClick={handleReanalyze} 
                  disabled={reanalyzing}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${reanalyzing ? 'animate-spin' : ''}`} />
                  {reanalyzing ? 'Re-Analyzing...' : 'Re-Analyze with AI'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Reported on {incident.date ? new Date(incident.date).toLocaleString() : 'Unknown'}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  By {incident.reportedBy && incident.reportedBy !== 'anonymous' ? incident.reportedBy : 'Anonymous'}{incident.reporterRole ? ` (${incident.reporterRole})` : ''}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> At {incident.location}
                </div>
              </div>
              <div className="prose prose-invert max-w-none text-foreground/80">
                <h3 className="text-foreground">Description</h3>
                <p>{incident.description}</p>
                {incident.summary && (
                  <>
                    <h4 className="mt-4 text-foreground">AI Summary</h4>
                    <p>{incident.summary}</p>
                  </>
                )}
                {incident.tags && incident.tags.length > 0 && (
                  <>
                    <h4 className="mt-4 text-foreground">AI Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {incident.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </>
                )}
                {incident.escalationReason && (
                  <>
                    <h4 className="mt-4 text-foreground">Escalation Reason</h4>
                    <p>{incident.escalationReason}</p>
                  </>
                )}
                {incident.aiSeverities && (
                  <>
                    <h4 className="mt-4 text-foreground">AI Severities (All Flows)</h4>
                    <ul className="list-disc ml-6 text-sm">
                      {Object.entries(incident.aiSeverities).map(([flow, sev]) => (
                        <li key={flow}><span className="font-semibold">{flow}:</span> {sev || 'N/A'}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              {user && (
                <div className="flex gap-3 mt-8">
                  <Button variant="default" size="sm" onClick={() => setEditing(true)} className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={deleteLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleteLoading ? <span className="ml-1">Deleting...</span> : <span>Delete</span>}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Incident</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this incident? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      {deleteError && <div className="text-destructive mb-2">{deleteError}</div>}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteLoading}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                          {deleteLoading ? "Deleting..." : "Confirm"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
