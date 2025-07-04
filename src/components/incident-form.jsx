// File: src/components/incident-form.jsx

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import the custom Select component
import Image from "next/image";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

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

const initialState = {
  title: "",
  type: "",
  severity: "Low",
  description: "",
  location: "",
  campus: "bidholi",
  mapType: "default",
  marker: null,
};

const SCHOOL_OPTIONS = [
  "School of Computer Science",
  'School of Engineering',
  'School of Business',
  'School of Law',
  'School of Design',
  'School of Health Sciences',
];

export default function IncidentForm({ incident, onSuccess }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const { user } = useAuth();

  useEffect(() => {
    if (incident) {
      setForm({
        title: incident.title || "",
        type: incident.type || "",
        severity: incident.severity
          ? (() => {
              const sev = incident.severity.toLowerCase();
              if (sev === "critical") return "Critical";
              if (sev === "high") return "High";
              if (sev === "medium" || sev === "moderate") return "Medium";
              if (sev === "low") return "Low";
              return "Low";
            })()
          : "Low",
        description: incident.description || "",
        location: incident.location || "",
        campus: incident.campus || "bidholi",
        mapType: incident.mapType || "default",
        marker: incident.marker || null,
      });
      setIsSatellite(incident.mapType === "satellite");
    } else {
      setForm(initialState);
      setIsSatellite(false);
    }
  }, [incident]);

  // Reset satellite view to default when campus changes
  useEffect(() => {
    setIsSatellite(false);
  }, [form.campus]);

  // Generic handler for standard input fields
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Specific handler for the Select component's value change
  const handleSeverityChange = (value) => {
    setForm({ ...form, severity: value });
  };

  // Map click handler
  const handleMapClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setForm({
      ...form,
      marker: { x, y },
      mapType: isSatellite ? "satellite" : "default",
    });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const token = user && (await user.getIdToken());
      let res, data;
      const url = incident ? `/api/incidents/${incident.id}` : "/api/incidents";
      const method = incident ? "PUT" : "POST";
      
      res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, school: form.school }),
      });
      
      data = await res.json();
      if (res.ok) {
        setSuccess(true);
        if (!incident) setForm(initialState);
        if (onSuccess) onSuccess(data.incident);
      } else {
        setError(data.error || "Failed to save incident");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 glass-card p-6 mb-8">
      <h3 className="text-xl font-bold mb-2">{incident ? "Edit Incident" : "Report New Incident"}</h3>
      <div className="flex flex-col gap-4">
        {/* Campus selection */}
        <Select value={form.campus} onValueChange={campus => setForm(f => ({ ...f, campus }))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bidholi">Bidholi</SelectItem>
            <SelectItem value="kandoli">Kandoli</SelectItem>
          </SelectContent>
        </Select>
        {/* Map controls and image */}
        <div>
          <div className="flex gap-2 mb-2 items-center">
            {/* Zoom controls */}
            <div className="flex gap-1 mr-4">
              <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.2))} disabled={zoom >= 3} title="Zoom In" style={{ fontSize: 18, padding: '0 10px', borderRadius: 4, border: '1px solid #444', background: zoom >= 3 ? '#222' : '#333', color: '#fff', cursor: zoom >= 3 ? 'not-allowed' : 'pointer' }}>+</button>
              <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.2))} disabled={zoom <= 1} title="Zoom Out" style={{ fontSize: 18, padding: '0 10px', borderRadius: 4, border: '1px solid #444', background: zoom <= 1 ? '#222' : '#333', color: '#fff', cursor: zoom <= 1 ? 'not-allowed' : 'pointer' }}>-</button>
              <button type="button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} disabled={zoom === 1 && offset.x === 0 && offset.y === 0} title="Reset Zoom/Pan" style={{ fontSize: 18, padding: '0 10px', borderRadius: 4, border: '1px solid #444', background: (zoom === 1 && offset.x === 0 && offset.y === 0) ? '#222' : '#333', color: '#fff', cursor: (zoom === 1 && offset.x === 0 && offset.y === 0) ? 'not-allowed' : 'pointer' }}>⟳</button>
            </div>
            {/* Map toggle */}
            <Button
              type="button"
              variant={!isSatellite ? "default" : "outline"}
              onClick={() => setIsSatellite(false)}
            >
              Default
            </Button>
            <Button
              type="button"
              variant={isSatellite ? "default" : "outline"}
              onClick={() => setIsSatellite(true)}
            >
              Satellite
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">Drag to pan, use buttons to zoom/reset</span>
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
              cursor: zoom > 1 ? "grab" : "crosshair",
            }}
            onClick={handleMapClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
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
                src={isSatellite ? CAMPUS_MAPS[form.campus].satellite : CAMPUS_MAPS[form.campus].image}
                alt={`${CAMPUS_MAPS[form.campus].name} Campus Map ${isSatellite ? '(Satellite)' : ''}`}
                fill
                className="object-contain"
                priority
                draggable={false}
                style={{ userSelect: "none", pointerEvents: "none" }}
              />
              {form.marker && (
                <span
                  style={{
                    position: "absolute",
                    top: `${form.marker.y}%`,
                    left: `${form.marker.x}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                  className="inline-block w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-lg"
                />
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Click on the map to place a marker for the incident location.</div>
        </div>
        <Input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          required
        />
        <Input
          name="type"
          value={form.type}
          onChange={handleChange}
          placeholder="Type (e.g. Vandalism, Bullying)"
          required
        />
        <Select value={form.severity} onValueChange={handleSeverityChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="min-h-[120px]"
          required
        />
        <Input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location"
          required
        />
        <FormField
          control={form.control}
          name="school"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={user?.role === 'student' || user?.isAnonymous}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <Button type="submit" disabled={loading || !user}>
        {loading && (
          <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        )}
        {loading ? (incident ? "Updating..." : "Submitting...") : incident ? "Update Incident" : "Submit Incident"}
      </Button>
      {error && <div className="text-destructive mt-2 text-sm">{error}</div>}
      {success && <div className="text-emerald-500 mt-2 text-sm">Incident {incident ? "updated" : "reported"} successfully!</div>}
      {!user && <div className="text-muted-foreground mt-2 text-sm">Sign in to {incident ? "edit" : "report"} an incident.</div>}
    </form>
  );
}