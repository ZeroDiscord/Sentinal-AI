import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle, UserPlus, Eye, ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const IncidentTimeline = ({ incident }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
        <div className="w-full flex flex-col items-center">
          <div className="relative w-full max-w-md flex flex-col items-center">
            {/* Vertical timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-border z-0" style={{ minHeight: 60, borderRadius: 8 }} />
            {events.map((event, idx) => {
              return (
                <div key={idx} className="relative z-10 flex items-start w-full mb-8 last:mb-0">
                  {/* Timeline marker */}
                  <div className="flex flex-col items-center mr-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${hoveredIndex === idx ? 'border-primary bg-primary/10' : 'border-border bg-background'} transition-colors duration-150`}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <event.icon className={`w-5 h-5 ${hoveredIndex === idx ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    {/* Vertical line segment (except for last event) */}
                    {idx < events.length - 1 && (
                      <div className="w-1 bg-border flex-1" style={{ minHeight: 32, marginTop: 2, marginBottom: 2, borderRadius: 8 }} />
                    )}
                  </div>
                  {/* Event card */}
                  <div className="flex-1 bg-background/80 border border-border rounded-lg shadow-md px-4 py-3">
                    <div className="font-semibold text-primary mb-1 flex items-center gap-2">
                      <event.icon className="w-4 h-4" />
                      {event.type}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{format(event.timestamp, 'MMM dd, yyyy HH:mm')}</div>
                    <div className="text-sm text-foreground/90">{event.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentTimeline;