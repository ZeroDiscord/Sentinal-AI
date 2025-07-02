import { mockIncidents } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MapPin } from "lucide-react";
import AIAnalysis from "@/components/ai-analysis";

export default function IncidentDetailsPage({ params }: { params: { id: string } }) {
  const incidentIdSuffix = params.id.padStart(3, '0');
  const incident = mockIncidents.find(inc => inc.id.endsWith(incidentIdSuffix)) || mockIncidents[0];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
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
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <AIAnalysis reportText={incident.description} />
      </div>
    </div>
  );
}
