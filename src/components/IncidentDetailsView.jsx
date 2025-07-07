"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MapPin, Pencil, Trash2, RefreshCw } from "lucide-react";
import AIAnalysis from "@/components/ai-analysis";
import IncidentForm from "@/components/incident-form";
import IncidentTimeline from "@/components/IncidentTimeline";
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
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

const CAMPUS_MAPS = {
  bidholi: {
    name: "Bidholi",
    image: "/maps/upes-bidholi.png",
    satellite: "/maps/upes-bidholi_sat.png",
  },
  kandoli: {
    name: "Kandoli",
    image: "/maps/upes-kandoli.png",
    satellite: "/maps/upes-kandoli_sat.png",
  },
};

export default function IncidentDetailsView({ incidentId, onClose }) {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user, role } = useAuth();
  const router = useRouter();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [assignTo, setAssignTo] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [mapType, setMapType] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [reporterName, setReporterName] = useState(null);
  const reporterCache = useRef({});

  const fetchIncident = async () => {
    setLoading(true);
    setError(null);
    try {
      // FIX: Use incidentId directly without modification.
      // Firebase document IDs are alphanumeric strings and do not need padding.
      const idToFetch = incidentId;
      const res = await fetch(`/api/incidents/${idToFetch}`);
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
    if (incidentId) {
      fetchIncident();
    }
    // eslint-disable-next-line
  }, [incidentId]);

  useEffect(() => {
    if (assignDialogOpen) {
      getDocs(collection(db, "users")).then(snap => {
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  }, [assignDialogOpen]);

  useEffect(() => {
    async function fetchReporterName() {
      if (!incident || !incident.reportedBy || incident.reportedBy === 'Anonymous' || incident.reportedBy === 'anonymous') {
        setReporterName('Anonymous');
        return;
      }
      if (reporterCache.current[incident.reportedBy]) {
        setReporterName(reporterCache.current[incident.reportedBy]);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', incident.reportedBy));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const name = data.name || data.displayName || incident.reportedBy;
          reporterCache.current[incident.reportedBy] = name;
          setReporterName(name);
        } else {
          setReporterName(incident.reportedBy);
        }
      } catch {
        setReporterName(incident.reportedBy);
      }
    }
    fetchReporterName();
  }, [incident]);

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
        if (onClose) onClose();
        else router.push("/dashboard");
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
      // FIX: Use incidentId directly without modification.
      const idToReanalyze = incidentId; 
      const token = user && (await user.getIdToken());
      const response = await fetch(`/api/incidents/${idToReanalyze}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIncident(data.incident);
        await fetchIncident(); // Re-fetch to get the latest data, including potentially new AI analysis
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

  const assignableUsers = users.filter(u => ["member", "secretary"].includes(u.role));

  async function handleAssign() {
    setAssignLoading(true);
    try {
      const token = user && (await user.getIdToken());
      const res = await fetch(`/api/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignedTo: assignTo }),
      });
      if (res.ok) {
        setAssignDialogOpen(false);
        fetchIncident(); // Re-fetch to get updated assignedAt timestamp
      } else {
        const errorData = await res.json();
        console.error("Failed to assign incident:", errorData.error);
      }
    } catch (error) {
        console.error("Error assigning incident:", error);
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleResolve() {
    setResolveLoading(true);
    try {
      const token = user && (await user.getIdToken());
      const res = await fetch(`/api/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (res.ok) {
        setResolveDialogOpen(false);
        fetchIncident(); // Re-fetch to get updated resolvedAt timestamp
      } else {
        const errorData = await res.json();
        console.error("Failed to resolve incident:", errorData.error);
      }
    } catch (error) {
        console.error("Error resolving incident:", error);
    } finally {
      setResolveLoading(false);
    }
  }

  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(z => Math.max(1, Math.min(3, z + (e.deltaY < 0 ? 0.1 : -0.1))));
  };
  const handleMouseDown = (e) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => {
    dragging.current = false;
  };
  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    setOffset(off => ({
      x: off.x + (e.clientX - lastPos.current.x),
      y: off.y + (e.clientY - lastPos.current.y),
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleDoubleClick = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

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
    <div className="max-w-4xl mx-auto px-4 space-y-10">
      <div className="space-y-8">
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
                  <div className="flex items-center gap-4 mt-2">
                    <span className="font-mono font-bold text-lg text-primary">Priority: {typeof incident.priorityScore === 'number' ? incident.priorityScore.toFixed(1) : '-'}</span>
                    <Badge variant="outline" className="text-xs">{incident.status || 'open'}</Badge>
                    <span className="text-xs text-muted-foreground">Assigned to: {incident.assignedTo || 'Unassigned'}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg">{incident.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {incident.campus && incident.marker && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">Location on Map ({CAMPUS_MAPS[incident.campus]?.name})</span>
                    <Button
                      type="button"
                      variant={((mapType ?? incident.mapType) !== 'satellite') ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMapType('default')}
                    >
                      Default
                    </Button>
                    <Button
                      type="button"
                      variant={((mapType ?? incident.mapType) === 'satellite') ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMapType('satellite')}
                    >
                      Satellite
                    </Button>
                    <span className="ml-auto text-xs text-muted-foreground">Scroll to zoom, drag to pan, double-click to reset</span>
                  </div>
                  <div
                    className="relative mx-auto select-none"
                    style={{
                      width: "100%",
                      maxWidth: "1200px",
                      aspectRatio: "16/9",
                      borderRadius: "0.75rem",
                      overflow: "hidden",
                      border: "1px solid var(--border-color)",
                      cursor: zoom > 1 ? "grab" : "default",
                    }}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseUp}
                    onDoubleClick={handleDoubleClick}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                        transition: dragging.current ? "none" : "transform 0.2s",
                        position: "relative",
                      }}
                    >
                      <Image
                        src={(mapType ?? incident.mapType) === 'satellite' ? CAMPUS_MAPS[incident.campus].satellite : CAMPUS_MAPS[incident.campus].image}
                        alt={`${CAMPUS_MAPS[incident.campus]?.name} Campus Map ${(mapType ?? incident.mapType) === 'satellite' ? '(Satellite)' : ''}`}
                        fill
                        className="object-contain"
                        priority
                        draggable={false}
                        style={{ userSelect: "none", pointerEvents: "none" }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: `${incident.marker.y}%`,
                          left: `${incident.marker.x}%`,
                          transform: "translate(-50%, -50%)",
                          zIndex: 10,
                          pointerEvents: "none",
                        }}
                        className="inline-block w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-6 w-full">
                <h1 className="text-3xl font-bold">Incident Details</h1>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleReanalyze} 
                    disabled={reanalyzing}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${reanalyzing ? 'animate-spin' : ''}`} />
                    {reanalyzing ? 'Re-Analyzing...' : 'Re-Analyze with AI'}
                  </Button>
                  {user && (role === 'cpo' || role === 'school_proctor') && (
                    <>
                      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="secondary" className="ml-2">Assign</Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card">
                          <DialogHeader><DialogTitle>Assign Incident</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <Select value={assignTo} onValueChange={setAssignTo}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select user to assign" />
                              </SelectTrigger>
                              <SelectContent className="glass-card">
                                {assignableUsers.map(u => (
                                  <SelectItem key={u.id} value={u.name || u.email || u.id}>{u.name || u.email} ({u.role})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAssign} disabled={!assignTo || assignLoading}>
                              {assignLoading ? "Assigning..." : "Assign"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="destructive" className="ml-2">Resolve</Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card">
                          <DialogHeader><DialogTitle>Resolve Incident</DialogTitle></DialogHeader>
                          <p>Are you sure you want to mark this incident as resolved?</p>
                          <DialogFooter>
                            <Button onClick={handleResolve} variant="destructive" disabled={resolveLoading}>
                              {resolveLoading ? "Resolving..." : "Yes, Resolve"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Reported on {incident.date ? new Date(incident.date).toLocaleString() : 'Unknown'}
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  By {reporterName}{incident && incident.reporterRole ? ` (${incident.reporterRole})` : ''}
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
                    <DialogContent className="glass-card">
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

      <div className="mb-8">
        {!incident?.summary && !incident?.aiAnalysis && (
          <Button onClick={handleReanalyze} disabled={reanalyzing} className="mb-4">
            {reanalyzing ? 'Generating AI Analysis...' : 'Generate AI Analysis'}
          </Button>
        )}
        <AIAnalysis analysis={
          incident?.aiAnalysis ||
          (incident?.summary && {
            summary: incident.summary,
            tags: incident.tags,
            severity: incident.severity,
            escalate: incident.escalate,
            escalationReason: incident.escalationReason,
            type: incident.type,
            confidence: incident.confidence
          })
        } isLoading={reanalyzing} />
      </div>

      <IncidentTimeline incident={incident} />
    </div>
  );
}