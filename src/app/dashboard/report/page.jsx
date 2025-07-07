"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  location: z.string().min(3, "Location is required."),
  media: z.any().optional(),
});

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

// Unified getSeverityStyles to match map/page.jsx
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
      return { dot: "bg-gray-500", badge: "bg-gray-500" }; // Changed default to gray for consistency
  }
};

export default function ReportIncidentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, role } = useAuth(); // Destructure role from useAuth
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [campus, setCampus] = useState("bidholi");
  const [marker, setMarker] = useState(null); // { x: %, y: % }
  const [step, setStep] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
    },
  });

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

  function handleMapClick(e) {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMarker({ x, y });
  }

  async function onSubmit(values) {
    setIsSubmitting(true);
    try {
      const incidentData = {
        ...values,
        campus,
        marker, // { x, y } or null
        // Assuming severity and type might come from form, for now use default/placeholder if not explicitly in values
        severity: form.getValues('severity') || 'Low', // Ensure severity is included if form doesn't provide it
        type: form.getValues('type') || 'Other' // Ensure type is included
      };
      Object.keys(incidentData).forEach(
        (key) => incidentData[key] === undefined && delete incidentData[key]
      );
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.accessToken || ""}`, // Ensure accessToken is used if available
        },
        body: JSON.stringify(incidentData),
      });
      let result;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error("Server error: " + text);
      }
      if (!res.ok) throw new new Error(result.error || "Failed to submit report");
      toast({
        title: "Incident Reported Successfully",
        description: `Report for \"${values.title}\" has been submitted.`,
        variant: "default"
      });
      
      // Redirect logic based on user role
      if (user) { 
          if (user.isAnonymous) {
              router.push("/dashboard/report/thank-you");
          } else if (role === 'student') { 
              router.push("/dashboard/my-reports"); // Redirect to My Reports for signed-in students
          } else { // For other signed-in roles (e.g., CPO, secretary)
              if (result.incident && result.incident.id) {
                  router.push(`/dashboard/incidents/${result.incident.id}`); // Redirect to individual incident page
              } else {
                  router.push("/dashboard/my-reports"); // Fallback for other roles
              }
          }
      } else { // Fallback for genuinely unauthenticated (shouldn't happen with current useAuth setup, but as a safeguard)
          router.push("/dashboard/report/thank-you");
      }
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="glass-card max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Report a New Incident</CardTitle>
        <CardDescription>
          {step === 1
            ? "Step 1: Where was the incident found? (Optional)"
            : "Step 2: Fill out the form below to submit an incident report. Please be as detailed as possible."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 ? (
          <>
            {/* Campus Switcher and Map */}
            <div className="mb-8">
              <div className="flex gap-2 mb-2 items-center">
                <span className="font-semibold">Select Campus:</span>
                {Object.entries(CAMPUS_MAPS).map(([key, val]) => (
                  <Button
                    key={key}
                    variant={campus === key ? "default" : "outline"}
                    onClick={() => { setCampus(key); setMarker(null); }}
                    size="sm"
                  >
                    {val.name}
                  </Button>
                ))}
                {/* Zoom controls */}
                <div className="flex gap-1 ml-4">
                  <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.2))} disabled={zoom >= 3} title="Zoom In" style={{ fontSize: 18, padding: '0 10px', borderRadius: 4, border: '1px solid #444', background: zoom >= 3 ? '#222' : '#333', color: '#fff', cursor: zoom >= 3 ? 'not-allowed' : 'pointer' }}>+</button>
                  <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.2))} disabled={zoom <= 1} title="Zoom Out" style={{ fontSize: 18, padding: '0 10px', borderRadius: 4, border: '1px solid #444', background: zoom <= 1 ? '#222' : '#333', color: '#fff', cursor: zoom <= 1 ? 'not-allowed' : 'pointer' }}>-</button>
                  <button type="button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} disabled={zoom === 1 && offset.x === 0 && offset.y === 0} title="Reset Zoom/Pan" style={{ fontSize: 18, padding: '0 10px', borderRadius: 4, border: '1px solid #444', background: (zoom === 1 && offset.x === 0 && offset.y === 0) ? '#222' : '#333', color: '#fff', cursor: (zoom === 1 && offset.x === 0 && offset.y === 0) ? 'not-allowed' : 'pointer' }}>⟳</button>
                </div>
              </div>
              <div
                className="relative w-full aspect-[16/9] rounded-lg overflow-hidden glass-card border border-border cursor-crosshair"
                onClick={handleMapClick}
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
                    src={CAMPUS_MAPS[campus].image}
                    alt={`${CAMPUS_MAPS[campus].name} Campus Map`}
                    fill
                    className="object-cover select-none"
                    data-ai-hint="map campus"
                    priority
                  />
                  {marker && (
                    // Marker styling updated to match live map markers
                    (() => {
                        const normalizedSeverity = form.getValues('severity') || "Low"; // Use form's severity
                        const severityStyles = getSeverityStyles(normalizedSeverity);
                        // Extract only the background and border classes from the badge style
                        const badgeBgBorderClasses = severityStyles.badge.split(' ').filter(cls => cls.startsWith('bg-') || cls.startsWith('border-')).join(' ');

                        return (
                            <div
                                style={{
                                    position: "absolute",
                                    top: `${marker.y}%`,
                                    left: `${marker.x}%`,
                                    transform: "translate(-50%, -50%)",
                                    zIndex: 10,
                                    pointerEvents: "none",
                                    width: '48px', // Consistent size with live map markers
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <span className={cn("custom-pulse border border-white/30 z-10", badgeBgBorderClasses)} />
                                <span className={cn(
                                    "relative inline-flex rounded-full h-6 w-6 border-2 border-white z-10", // Consistent dot size
                                    badgeBgBorderClasses
                                )} />
                            </div>
                        );
                    })()
                  )}
                  {!marker && (
                    <span
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-red-400 pointer-events-none select-none px-3 py-2 rounded-md"
                      style={{
                        background: "rgba(0, 0, 0, 0.7)",
                        boxShadow: "0 2px 12px 0 rgba(0,0,0,0.10)",
                        border: "1px solid rgba(80,80,80,0.25)",
                      }}
                    >
                      Click on the map to place a marker (optional)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setStep(2)}>
                Skip this step
              </Button>
              <Button onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incident Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Bullying in the football field" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give a short, descriptive title for the incident.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide a full account of the incident..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Please include as much detail as possible.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Add severity and type fields to formSchema and render if not already present */}
              {/* Assuming formSchema is updated to include these, or they are implicitly handled */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Near the football field" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where did the incident occur? (You can be specific or general.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Incident"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}