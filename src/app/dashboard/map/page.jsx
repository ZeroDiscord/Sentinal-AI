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
import ReactDOM from "react-dom";

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

// Example: Map incident location to coordinates (customize as needed)
const LOCATION_COORDS = {
  // Bidholi
  "MAC Auditorium": { x: 30, y: 40, campus: "bidholi" },
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
    case "Medium":
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
  const [isSatellite, setIsSatellite] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalCoords, setModalCoords] = useState({ x: 0, y: 0 });
  const mapRef = useRef();
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Handlers for zoom and pan
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

  // Helper to get marker's screen position
  function getMarkerScreenPosition(coords) {
    if (!mapRef.current) return { x: 0, y: 0 };
    const rect = mapRef.current.getBoundingClientRect();
    return {
      x: rect.left + (coords.x / 100) * rect.width,
      y: rect.top + (coords.y / 100) * rect.height,
    };
  }

  // Click outside modal to close
  useEffect(() => {
    function handleClick(e) {
      if (!selectedIncident) return;
      const modal = document.getElementById("incident-modal-card");
      if (modal && !modal.contains(e.target)) {
        setSelectedIncident(null);
      }
    }
    if (selectedIncident) {
      document.addEventListener("mousedown", handleClick);
    } else {
      document.removeEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [selectedIncident]);

  useEffect(() => {
    setLoading(true);
    // Listen for real-time updates, filter by campus if possible
    const q = query(collection(db, "incidents"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter by campus if campus field exists, else show all, and exclude resolved
      setIncidents(all.filter(inc => (!inc.campus || inc.campus === campus) && inc.status !== 'resolved'));
      setLoading(false); // Always set loading to false after first snapshot
    }, (error) => {
      setIncidents([]);
      setLoading(false); // Also set loading to false on error
    });
    return () => unsubscribe();
  }, [campus]);

  return (
    <div className="space-y-8 overflow-visible">
      <div className="flex items-center gap-4 overflow-visible">
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
          <Button
            variant={isSatellite ? "default" : "outline"}
            onClick={() => setIsSatellite((prev) => !prev)}
          >
            {isSatellite ? "Satellite" : "Default"} View
          </Button>
        </div>
        {/* Zoom controls */}
        <div className="flex gap-1 ml-4">
          <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.2))} disabled={zoom >= 3} title="Zoom In" style={{ fontSize: 18, padding: '0 10px', borderRadius: 4, border: '1px solid #444', background: zoom >= 3 ? '#222' : '#333', color: '#fff', cursor: zoom >= 3 ? 'not-allowed' : 'pointer' }}>+</button>
          <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.2))} disabled={zoom <= 1} title="Zoom Out" style={{ fontSize: 18, padding: '0 10px', borderRadius: 4, border: '1px solid #444', background: zoom <= 1 ? '#222' : '#333', color: '#fff', cursor: zoom <= 1 ? 'not-allowed' : 'pointer' }}>-</button>
          <button type="button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} disabled={zoom === 1 && offset.x === 0 && offset.y === 0} title="Reset Zoom/Pan" style={{ fontSize: 18, padding: '0 10px', borderRadius: 4, border: '1px solid #444', background: (zoom === 1 && offset.x === 0 && offset.y === 0) ? '#222' : '#333', color: '#fff', cursor: (zoom === 1 && offset.x === 0 && offset.y === 0) ? 'not-allowed' : 'pointer' }}>⟳</button>
        </div>
      </div>
      <p className="text-muted-foreground">Click on hotspots to view incident details.</p>
      <div
        className="relative w-4/5 mx-auto aspect-[16/9] rounded-lg overflow-visible glass-card border border-border"
        ref={mapRef}
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
            src={isSatellite ? CAMPUS_MAPS[campus].satellite : CAMPUS_MAPS[campus].image}
            alt={`${CAMPUS_MAPS[campus].name} Campus Map ${isSatellite ? '(Satellite)' : ''}`}
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
          {/* Markers */}
          {!loading && incidents.map((incident) => {
            const coords =
              incident.marker && typeof incident.marker.x === 'number' && typeof incident.marker.y === 'number'
                ? incident.marker
                : (LOCATION_COORDS[incident.location] && LOCATION_COORDS[incident.location].campus === campus
                    ? LOCATION_COORDS[incident.location]
                    : { x: 50, y: 50, campus }); // fallback to center
            const normalizedSeverity = incident.severity
              ? (() => {
                  const sev = incident.severity.toLowerCase();
                  if (sev === "critical") return "Critical";
                  if (sev === "high") return "High";
                  if (sev === "medium" || sev === "moderate") return "Medium";
                  if (sev === "low") return "Low";
                  return "Low";
                })()
              : "Low";
            const severityStyles = getSeverityStyles(normalizedSeverity);

            // Extract only the background and border classes from the badge style
            const badgeBgBorderClasses = severityStyles.badge.split(' ').filter(cls => cls.startsWith('bg-') || cls.startsWith('border-')).join(' ');

            // Only render marker if not selected
            if (selectedIncident && selectedIncident.id === incident.id) return null;
            return (
              <div
                key={incident.id}
                style={{ top: `${coords.y}%`, left: `${coords.x}%`, width: 48, height: 48, background: 'transparent', zIndex: 9999, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'absolute', transform: 'translate(-50%, -50%)' }}
                onClick={e => {
                  setSelectedIncident({ ...incident, coords });
                  setModalCoords(getMarkerScreenPosition(coords));
                }}
              >
                <span className={cn("custom-pulse border border-white/30 z-10", badgeBgBorderClasses)} />
                <span className={cn(
                  "relative inline-flex rounded-full h-6 w-6 border-2 border-white z-10", // Increased size
                  badgeBgBorderClasses // Use badge color and border
                )} />
              </div>
            );
          })}
          {/* Modal Portal Target */}
          <div id="map-modal-portal" />
        </div>
        {/* Modal Card rendered in portal */}
        {selectedIncident && typeof window !== 'undefined' && ReactDOM.createPortal(
          (() => {
            // Position modal above or below marker, with pointer
            const { coords } = selectedIncident;
            const mapRect = mapRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
            const markerX = mapRect.left + (coords.x / 100) * mapRect.width;
            const markerY = mapRect.top + (coords.y / 100) * mapRect.height;
            // Adaptive: show below if near top, above if near bottom
            const showBelow = coords.y < 20;
            const showAbove = coords.y > 80;
            let modalLeft = markerX;
            let modalTop = showBelow ? markerY + 40 : markerY - 40;
            // Clamp modal within map horizontally
            const modalWidth = 320;
            if (modalLeft < mapRect.left + modalWidth / 2) modalLeft = mapRect.left + modalWidth / 2;
            if (modalLeft > mapRect.left + mapRect.width - modalWidth / 2) modalLeft = mapRect.left + mapRect.width - modalWidth / 2;
            return (
              <div
                id="incident-modal-card"
                className={cn(
                  "fixed z-[9999999] w-80 p-4 rounded-2xl shadow-xl border-none bg-[#181924] pointer-events-auto",
                  showBelow ? "" : ""
                )}
                style={{
                  left: modalLeft - mapRect.left,
                  top: showBelow ? modalTop - mapRect.top : modalTop - mapRect.top - 160,
                  minWidth: 260,
                  maxWidth: 320,
                  position: 'absolute',
                  transform: 'translate(-50%, 0)',
                }}
              >
                {/* Pointer triangle */}
                <div
                  className={cn(
                    "absolute w-0 h-0 border-x-8 border-x-transparent",
                    showBelow
                      ? "-top-4 left-1/2 -translate-x-1/2 border-b-8 border-b-[#181924]"
                      : "-bottom-4 left-1/2 -translate-x-1/2 border-t-8 border-t-[#181924]"
                  )}
                  style={{ zIndex: 1000000 }}
                />
                {/* Close button */}
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="absolute top-2 right-2 text-white/70 hover:text-white text-xl font-bold rounded-full bg-transparent border-none p-0 m-0 cursor-pointer"
                  aria-label="Close"
                  style={{ zIndex: 1000001 }}
                >
                  ×
                </button>
                <div className="space-y-2">
                  <h4 className="font-bold text-lg text-white leading-tight">{selectedIncident.title}</h4>
                  <p className="text-sm text-gray-400">{selectedIncident.location}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <Badge className={cn("text-xs px-3 py-1 font-semibold rounded-full", getSeverityStyles(selectedIncident.severity).badge)}>{selectedIncident.severity}</Badge>
                    <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold rounded-full bg-[#23243a] text-white border-none">{selectedIncident.type || 'Unknown'}</Badge>
                  </div>
                </div>
              </div>
            );
          })(),
          document.getElementById("map-modal-portal")
        )}
      </div>
    </div>
  );
}