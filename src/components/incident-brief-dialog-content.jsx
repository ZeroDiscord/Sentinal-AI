import React, { useEffect, useState } from 'react';
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Clock, CheckCircle, UserPlus, Eye, ListChecks } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const getSeverityStyles = (severity) => {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-red-600/80 border-red-500 text-white";
    case "high": return "bg-orange-500/80 border-orange-400 text-white";
    case "medium": return "bg-amber-500/80 border-amber-400 text-white";
    case "low": return "bg-blue-500/80 border-blue-400 text-white";
    default: return "bg-gray-500";
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "resolved": return "bg-emerald-600/80 border-emerald-500 text-white";
    case "in progress": return "bg-sky-500/80 border-sky-400 text-white";
    case "pending": return "bg-gray-500/80 border-gray-400 text-white";
    case "analyzed": return "bg-blue-600/80 border-blue-500 text-white";
    default: return "bg-gray-500";
  }
};

const IncidentBriefDialogContent = ({ incident, onClose, onViewFullReport }) => {
  const { user, role } = useAuth();
  const [liveIncident, setLiveIncident] = useState(incident);

  useEffect(() => {
    if (!incident?.id) return;
    setLiveIncident(incident);
    const unsub = onSnapshot(doc(db, 'incidents', incident.id), (docSnap) => {
      if (docSnap.exists()) {
        setLiveIncident({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsub();
  }, [incident?.id]);

  useEffect(() => {
    if (liveIncident && user && role?.toLowerCase() === 'cpo') {
      (async () => {
        try {
          const token = await user.getIdToken();
          const res = await fetch(`/api/incidents/${liveIncident.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ readBy: [user.uid] }),
          });
          if (!res.ok && res.status !== 400) {
            // Only log errors that are not 400 (already read)
            const errText = await res.text();
            console.error(`[CPO READ PATCH] Unexpected error: ${res.status} ${errText}`);
          }
          // If 400, do nothing (suppress)
        } catch (err) {
          // Only log network or unexpected errors
          console.error('[CPO READ PATCH] Network or unexpected error:', err);
        }
      })();
    }
  }, [liveIncident, user, role]);

  const safeToDate = (timestamp) => {
    if (!timestamp) return null;
    let dateObj;
    if (timestamp.toDate) {
      dateObj = timestamp.toDate();
    } else {
      dateObj = new Date(timestamp);
    }
    return isNaN(dateObj.getTime()) ? null : dateObj;
  };

  const timelineEvents = [];
  const createdAtDate = safeToDate(liveIncident?.createdAt);
  if (createdAtDate && liveIncident?.reportedBy) {
    timelineEvents.push({
      type: 'Reported',
      icon: Clock,
      timestamp: createdAtDate,
      description: `Incident reported by ${liveIncident.reportedBy === 'Anonymous' ? 'Anonymous' : 'user'}.`,
    });
  }
  const firstReadAtDate = safeToDate(liveIncident?.firstReadAt);
  if (firstReadAtDate) {
    timelineEvents.push({
      type: 'First Read',
      icon: Eye,
      timestamp: firstReadAtDate,
      description: `Incident report was first viewed.`,
    });
  }
  const assignedAtDate = safeToDate(liveIncident?.assignedAt);
  if (assignedAtDate && liveIncident?.assignedTo) {
    timelineEvents.push({
      type: 'Assigned',
      icon: UserPlus,
      timestamp: assignedAtDate,
      description: `Assigned to ${liveIncident.assignedTo}.`,
    });
  }
  const inProgressAtDate = safeToDate(liveIncident?.inProgressAt);
  if (inProgressAtDate) {
    timelineEvents.push({
      type: 'In Progress',
      icon: ListChecks,
      timestamp: inProgressAtDate,
      description: `Incident marked as in progress.`,
    });
  }
  const resolvedAtDate = safeToDate(liveIncident?.resolvedAt);
  if (resolvedAtDate) {
    timelineEvents.push({
      type: 'Resolved',
      icon: CheckCircle,
      timestamp: resolvedAtDate,
      description: `Incident marked as resolved.`,
    });
  }
  timelineEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const handleViewFullReport = () => {
    if (onViewFullReport) {
      onViewFullReport(liveIncident.id);
    }
  };

  if (!liveIncident) {
    return <CardContent>Loading incident details...</CardContent>;
  }

  return (
    <CardContent className="space-y-4 px-0 pt-0">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold">{liveIncident.title}</h3>
        <p className="text-muted-foreground text-sm">ID: {liveIncident.id.slice(-4)}</p>
        <div className="flex items-center gap-2">
          <Badge className={getSeverityStyles(liveIncident.severity)}>{liveIncident.severity}</Badge>
          <Badge className={getStatusBadgeClass(liveIncident.status)}>{liveIncident.status}</Badge>
          <Badge variant="secondary">{liveIncident.type || 'N/A'}</Badge>
        </div>
      </div>

      <p className="text-foreground/80 text-sm mt-3 line-clamp-3">
        {liveIncident.summary || liveIncident.description || 'No description available.'}
      </p>

      {timelineEvents.length > 0 && (
        <div className="w-full flex flex-col items-center mt-4 mb-2">
          <div className="flex flex-row items-center justify-center gap-4 w-full">
            {timelineEvents.map((event, idx) => (
              <div
                key={idx}
                className="group flex flex-col items-center px-3 py-2 bg-background/80 border border-border rounded-xl shadow transition-all duration-150 hover:border-primary hover:bg-primary/10 relative"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-border bg-background group-hover:border-primary group-hover:bg-primary/10 transition-colors duration-150 mb-1">
                  <event.icon className="w-5 h-5 group-hover:text-primary text-muted-foreground" />
                </div>
                <span className="text-xs font-semibold text-foreground">{event.type}</span>
                <div className="hidden group-hover:block absolute -top-24 left-1/2 -translate-x-1/2 bg-background border border-border rounded-lg shadow-lg px-4 py-2 z-20 min-w-[180px] text-left animate-fade-in">
                  <div className="font-semibold text-primary mb-1 flex items-center gap-2">
                    <event.icon className="w-4 h-4" />
                    {event.type}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">{format(event.timestamp, 'MMM dd, yyyy HH:mm')}</div>
                  <div className="text-sm text-foreground/90">{event.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={handleViewFullReport}>View Full Report</Button>
      </div>
    </CardContent>
  );
};

export default IncidentBriefDialogContent;

<style jsx global>{`
  /* Custom dark scrollbar for modals and snapshot */
  .DialogContent, .glass-card, .modal, .incident-snapshot-modal, body {
    scrollbar-color: #23272f #181a20;
    scrollbar-width: thin;
  }
  ::-webkit-scrollbar {
    width: 8px;
    background: #181a20;
  }
  ::-webkit-scrollbar-thumb {
    background: #23272f;
    border-radius: 8px;
    border: 2px solid #181a20;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #3b4252;
  }
  ::-webkit-scrollbar-track {
    background: #181a20;
    border-radius: 8px;
  }
`}</style>