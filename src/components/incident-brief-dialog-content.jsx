import React, { useEffect, useState } from 'react';
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInSeconds, formatDuration, intervalToDuration, formatDistanceStrict } from 'date-fns';
import { Clock, CheckCircle, UserPlus, Eye, ListChecks } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useUserNames from '@/hooks/useUserNames';

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
  const assignedToId = liveIncident?.assignedTo ? [liveIncident.assignedTo] : [];
  const userNames = useUserNames(assignedToId);

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
      description: `Assigned to ${userNames[liveIncident.assignedTo] || liveIncident.assignedTo}.`,
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
          <div className="relative w-full max-w-xs mx-auto flex flex-col items-center">
            {timelineEvents.map((event, idx) => {
              let delta = null;
              if (idx > 0) {
                const prev = timelineEvents[idx - 1];
                const seconds = differenceInSeconds(event.timestamp, prev.timestamp);
                if (seconds > 0) {
                  delta = formatDistanceStrict(prev.timestamp, event.timestamp, { roundingMethod: 'floor' });
                }
              }
              return (
                <div key={idx} className="flex items-center w-full relative">
                  {/* Timeline line (except for last event) */}
                  <div className="flex flex-col items-center mr-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-border bg-background z-10">
                      <event.icon className="w-5 h-5 text-primary" />
                    </div>
                    {idx < timelineEvents.length - 1 && (
                      <div className="w-px h-8 bg-border mx-auto" />
                    )}
                  </div>
                  <div className="flex-1 py-2">
                    <div className="font-semibold text-primary text-sm flex items-center gap-2">
                      {event.type}
                    </div>
                    {delta && (
                      <div className="inline-block mt-1 mb-1 px-2 py-0.5 rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        +{delta}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mb-1">{format(event.timestamp, 'MMM dd, yyyy HH:mm')}</div>
                    <div className="text-sm text-foreground/90">{event.description}</div>
                  </div>
                </div>
              );
            })}
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