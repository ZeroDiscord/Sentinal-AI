import Image from "next/image";
import { mockIncidents } from "@/lib/data";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Incident } from "@/types";

const getPosition = (id: string) => {
  const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const x = (hash * 47) % 90 + 5;
  const y = (hash * 31) % 85 + 5;
  return { top: `${y}%`, left: `${x}%` };
};

const getSeverityStyles = (severity: Incident["severity"]) => {
  switch (severity) {
    case "Critical":
      return { dot: "bg-red-500", badge: "bg-red-600/80 border-red-500 text-white hover:bg-red-600/90" };
    case "High":
      return { dot: "bg-orange-500", badge: "bg-orange-500/80 border-orange-400 text-white hover:bg-orange-500/90" };
    case "Moderate":
      return { dot: "bg-amber-500", badge: "bg-amber-500/80 border-amber-400 text-white hover:bg-amber-500/90" };
    case "Low":
      return { dot: "bg-blue-500", badge: "bg-blue-500/80 border-blue-400 text-white hover:bg-blue-500/90" };
    default:
      return { dot: "bg-gray-500", badge: "bg-gray-500" };
  }
};


export default function MapPage() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold">Live Incident Map</h1>
        <p className="text-muted-foreground">Click on hotspots to view incident details.</p>
       </div>
       <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden glass-card border border-border">
            <Image
                src="https://placehold.co/1600x900.png"
                alt="Campus Map"
                fill
                className="object-cover"
                data-ai-hint="map campus"
            />
            {mockIncidents.filter(inc => inc.status !== 'Resolved').map((incident) => {
                const position = getPosition(incident.id);
                const severityStyles = getSeverityStyles(incident.severity);

                return (
                    <Popover key={incident.id}>
                        <PopoverTrigger
                            asChild
                            style={{ top: position.top, left: position.left }}
                            className="absolute -translate-x-1/2 -translate-y-1/2"
                        >
                            <button className="relative flex items-center justify-center w-5 h-5 focus:outline-none" aria-label={`View incident ${incident.id}`}>
                                <span className={cn(
                                    "absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse",
                                    severityStyles.dot
                                )} />
                                <span className={cn(
                                    "relative inline-flex rounded-full h-3 w-3",
                                    severityStyles.dot
                                )} />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 glass-card">
                            <div className="space-y-2">
                                <h4 className="font-semibold leading-none">{incident.title}</h4>
                                <p className="text-sm text-muted-foreground">{incident.location}</p>
                                <div className="flex items-center gap-2 pt-2">
                                    <Badge className={cn("text-xs", severityStyles.badge)}>{incident.severity}</Badge>
                                    <Badge variant="secondary">{incident.type}</Badge>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                )
            })}
       </div>
    </div>
  );
}
