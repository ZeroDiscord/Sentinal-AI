import React from 'react';
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Clock, CheckCircle, UserPlus, Eye, ListChecks } from 'lucide-react';

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

// Added onViewFullReport prop
const IncidentBriefDialogContent = ({ incident, onClose, onViewFullReport }) => {
  // Removed: const router = useRouter(); // No longer needed

  // Helper to safely get a Date object from a Firestore Timestamp or other date format
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

  const createdAtDate = safeToDate(incident.createdAt);
  if (createdAtDate) {
    timelineEvents.push({
      type: 'Reported',
      icon: Clock,
      timestamp: createdAtDate,
    });
  }

  const firstReadAtDate = safeToDate(incident.firstReadAt);
  if (firstReadAtDate) {
    timelineEvents.push({
      type: 'First Read',
      icon: Eye,
      timestamp: firstReadAtDate,
    });
  }

  const assignedAtDate = safeToDate(incident.assignedAt);
  if (assignedAtDate && incident.assignedTo) {
    timelineEvents.push({
      type: 'Assigned',
      icon: UserPlus,
      timestamp: assignedAtDate,
    });
  }

  const inProgressAtDate = safeToDate(incident.inProgressAt);
  if (inProgressAtDate) {
    timelineEvents.push({
      type: 'In Progress',
      icon: ListChecks,
      timestamp: inProgressAtDate,
    });
  }

  const resolvedAtDate = safeToDate(incident.resolvedAt);
  if (resolvedAtDate) {
    timelineEvents.push({
      type: 'Resolved',
      icon: CheckCircle,
      timestamp: resolvedAtDate,
    });
  }

  timelineEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Changed to call onViewFullReport callback
  const handleViewFullReport = () => {
    if (onViewFullReport) {
      onViewFullReport(incident.id); // Pass incident ID to parent to switch view
    }
    // Removed: onClose();
    // Removed: router.push(`/dashboard/incidents/${incident.id}`);
  };

  if (!incident) {
    return <CardContent>Loading incident details...</CardContent>;
  }

  return (
    <CardContent className="space-y-4 px-0 pt-0">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold">{incident.title}</h3>
        <p className="text-muted-foreground text-sm">ID: {incident.id}</p>
        <div className="flex items-center gap-2">
          <Badge className={getSeverityStyles(incident.severity)}>{incident.severity}</Badge>
          <Badge className={getStatusBadgeClass(incident.status)}>{incident.status}</Badge>
          <Badge variant="secondary">{incident.type || 'N/A'}</Badge>
        </div>
      </div>

      <p className="text-foreground/80 text-sm mt-3 line-clamp-3">
        {incident.summary || incident.description || 'No description available.'}
      </p>

      {timelineEvents.length > 0 && (
        <div className="border-t border-b border-border/20 py-4 mt-4">
          <h4 className="font-semibold text-foreground text-md mb-3">Key Timeline Events</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {timelineEvents.slice(0, 4).map((event, index) => (
              <div key={index} className="flex items-center gap-2">
                <event.icon className="w-4 h-4 text-primary" />
                <span>
                  <span className="font-medium">{event.type}:</span> {format(event.timestamp, 'MMM dd, HH:mm')}
                </span>
              </div>
            ))}
            {timelineEvents.length > 4 && (
              <p className="text-xs text-muted-foreground col-span-2 mt-2">
                And {timelineEvents.length - 4} more events...
              </p>
            )}
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