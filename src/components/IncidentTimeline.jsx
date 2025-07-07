import React from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle, UserPlus, Eye, ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card'; // Ensure Card is imported

const IncidentTimeline = ({ incident }) => {
  if (!incident) {
    return (
      <Card className="glass-card mt-8">
        <CardContent className="py-6 text-center text-muted-foreground">
          No incident data to display timeline.
        </CardContent>
      </Card>
    );
  }

  const events = [];

  // Helper to safely get a valid Date object from a Firestore Timestamp or other date format
  const safeToDate = (timestamp) => {
    if (!timestamp) return null;
    let dateObj;
    if (timestamp.toDate) { // It's likely a Firestore Timestamp object
      dateObj = timestamp.toDate();
    } else { // It's something else, try to parse it
      dateObj = new Date(timestamp);
    }
    // Check if the resulting Date object is valid (getTime() on an invalid Date returns NaN)
    return isNaN(dateObj.getTime()) ? null : dateObj;
  };

  // Reported
  const createdAtDate = safeToDate(incident.createdAt);
  if (createdAtDate && incident.reportedBy) {
    events.push({
      type: 'Reported',
      icon: Clock,
      timestamp: createdAtDate,
      description: `Incident reported by ${incident.reportedBy === 'Anonymous' ? 'Anonymous' : 'user'}.`,
    });
  }

  // First Read (if applicable)
  const firstReadAtDate = safeToDate(incident.firstReadAt);
  if (firstReadAtDate) {
    events.push({
      type: 'First Read',
      icon: Eye,
      timestamp: firstReadAtDate,
      description: `Incident report was first viewed.`,
    });
  }

  // Assigned (if applicable)
  const assignedAtDate = safeToDate(incident.assignedAt);
  if (assignedAtDate && incident.assignedTo) {
    events.push({
      type: 'Assigned',
      icon: UserPlus,
      timestamp: assignedAtDate,
      description: `Assigned to ${incident.assignedTo}.`,
    });
  }
  
  // In Progress (if applicable - if you implement a separate "Mark as In Progress" action)
  const inProgressAtDate = safeToDate(incident.inProgressAt);
  if (inProgressAtDate) {
    events.push({
      type: 'In Progress',
      icon: ListChecks,
      timestamp: inProgressAtDate,
      description: `Incident marked as in progress.`,
    });
  }

  // Resolved
  const resolvedAtDate = safeToDate(incident.resolvedAt);
  if (resolvedAtDate) {
    events.push({
      type: 'Resolved',
      icon: CheckCircle,
      timestamp: resolvedAtDate,
      description: `Incident marked as resolved.`,
    });
  }

  // Sort events chronologically
  events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (events.length === 0) {
    return (
      <Card className="glass-card mt-8">
        <CardContent className="py-6 text-center text-muted-foreground">
          No timeline events available for this incident.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card mt-8">
      <CardContent className="py-6">
        <h3 className="text-xl font-bold mb-6 text-foreground">Incident Resolution Timeline</h3>
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border rounded-full" />

          {events.map((event, index) => (
            <div key={index} className="mb-8 flex items-start relative last:mb-0">
              {/* Dot icon */}
              <div className="absolute left-0 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-primary z-10 -translate-x-1/2">
                <event.icon className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="ml-8 flex-1">
                <p className="font-semibold text-foreground">{event.type}</p>
                <p className="text-sm text-muted-foreground">
                  {format(event.timestamp, 'MMM dd, yyyy HH:mm')}
                </p>
                <p className="text-sm text-foreground/80 mt-1">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentTimeline;