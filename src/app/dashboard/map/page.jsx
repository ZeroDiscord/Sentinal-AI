"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import "@/app/dashboard/map/pulse.css";

const CAMPUS_MAPS = {
  bidholi: {
    name: "Bidholi",
    image: "/maps/upes-bidholi.png",
  },
  kandoli: {
    name: "Kandoli",
    image: "/maps/upes-kandoli.png",
  },
};

// Example: Map incident location to coordinates (customize as needed)
const LOCATION_COORDS = {
  // Bidholi
  "West Wing, Near Chemistry Lab": { x: 30, y: 40, campus: "bidholi" },
  "Main Gate": { x: 10, y: 90, campus: "bidholi" },
  // Kandoli
  "Hostel Block C": { x: 60, y: 30, campus: "kandoli" },
  "Main Playground": { x: 80, y: 60, campus: "kandoli" },
};

const getSeverityStyles = (severity) => {
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
  const { role } = useAuth();
  const [campus, setCampus] = useState("bidholi");
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIncident, setActiveIncident] = useState(null);
  const [hoveredIncident, setHoveredIncident] = useState(null);
  const mapRef = useRef();

  useEffect(() => {
    setLoading(true);
    // Listen for real-time updates, filter by campus if possible
    const q = query(collection(db, "incidents"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter by campus if campus field exists, else show all
      setIncidents(all.filter(inc => !inc.campus || inc.campus === campus));
      setLoading(false); // Always set loading to false after first snapshot
    }, (error) => {
      setIncidents([]);
      setLoading(false); // Also set loading to false on error
    });
    return () => unsubscribe();
  }, [campus]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">Live Incident Map</h1>
        <div className="ml-auto flex gap-2">
          {Object.entries(CAMPUS_MAPS).map(([key, val]) => (
            <Button
              key={key}
              variant={campus === key ? "default" : "outline"}
              onClick={() => setCampus(key)}
            >
              {val.name}
            </Button>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground">Click on hotspots to view incident details.</p>
      <div className="relative w-4/5 mx-auto aspect-[16/9] rounded-lg overflow-hidden glass-card border border-border" ref={mapRef}>
        <Image
          src={CAMPUS_MAPS[campus].image}
          alt={`${CAMPUS_MAPS[campus].name} Campus Map`}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className="object-cover"
          data-ai-hint="map campus"
          priority
        />
        {!loading && incidents.length === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{
              background: "rgba(200, 255, 200, 0.07)",
              borderRadius: "0.5rem",
            }}
          >
            <span className="font-bold text-green-600 text-base" style={{
              background: "rgba(0, 0, 0, 0.7)",
              borderRadius: "0.375rem",
              padding: "0.5rem 1.25rem",
              display: "inline-block"
            }}>
              No incidents found for this campus.
            </span>
          </div>
        )}
        {/* Markers and cards (final: classic dot+ring inside large transparent clickable div) */}
        {!loading && incidents.map((incident) => {
          const coords =
            incident.marker && typeof incident.marker.x === 'number' && typeof incident.marker.y === 'number'
              ? incident.marker
              : (LOCATION_COORDS[incident.location] && LOCATION_COORDS[incident.location].campus === campus
                  ? LOCATION_COORDS[incident.location]
                  : { x: 50, y: 50, campus }); // fallback to center
          const severityStyles = getSeverityStyles(incident.severity || "Critical");
          return (
            <div
              key={incident.id}
              style={{ top: `${coords.y}%`, left: `${coords.x}%`, width: 48, height: 48, background: 'transparent', zIndex: 9999, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'absolute', transform: 'translate(-50%, -50%)' }}
              onMouseEnter={() => setHoveredIncident(incident.id)}
              onMouseLeave={() => setHoveredIncident(null)}
            >
              <span className={cn("custom-pulse border border-white/30", severityStyles.dot)} />
              <span className={cn(
                "relative inline-flex rounded-full h-4 w-4 border-2 border-white",
                severityStyles.dot
              )} />
              {hoveredIncident === incident.id && (
                <div
                  className="z-50 w-80 p-4 rounded-2xl shadow-xl border-none bg-[#181924] absolute left-1/2 -translate-x-1/2 mt-16 pointer-events-auto"
                  style={{ minWidth: 260 }}
                  onMouseEnter={() => setHoveredIncident(incident.id)}
                  onMouseLeave={() => setHoveredIncident(null)}
                >
                  <div className="space-y-2">
                    <h4 className="font-bold text-lg text-white leading-tight">{incident.title}</h4>
                    <p className="text-sm text-gray-400">{incident.location}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <Badge className={cn("text-xs px-3 py-1 font-semibold rounded-full", severityStyles.badge)}>{incident.severity || 'Unknown'}</Badge>
                      <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold rounded-full bg-[#23243a] text-white border-none">{incident.type || 'Unknown'}</Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">Loading incidents...</div>}
      </div>
    </div>
  );
}
