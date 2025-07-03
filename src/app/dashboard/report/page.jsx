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
import React, { useState } from "react";
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
      return { dot: "bg-cyan-500", badge: "bg-cyan-500" };
  }
};

export default function ReportIncidentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [campus, setCampus] = useState("bidholi");
  const [marker, setMarker] = useState(null); // { x: %, y: % }

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
    },
  });

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
        marker, // { x, y }
      };
      // Remove undefined fields (especially media)
      Object.keys(incidentData).forEach(
        (key) => incidentData[key] === undefined && delete incidentData[key]
      );
      // POST to API instead of direct Firestore write
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.accessToken || ""}`,
        },
        body: JSON.stringify(incidentData),
      });
      // Show loader while waiting for AI enrichment
      let result;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error("Server error: " + text);
      }
      if (!res.ok) throw new Error(result.error || "Failed to submit report");
      toast({
        title: "Incident Reported Successfully",
        description: `Report for \"${values.title}\" has been submitted.`,
        variant: "default"
      });
      if (user && user.isAnonymous) {
        router.push("/dashboard/report/thank-you");
      } else if (result.incident && result.incident.id) {
        router.push(`/dashboard/incidents/${result.incident.id}`);
      } else {
        router.push("/dashboard/my-reports");
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
        <CardDescription>Fill out the form below to submit an incident report. Please be as detailed as possible.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Campus Switcher and Map */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
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
          </div>
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden glass-card border border-border cursor-crosshair" onClick={handleMapClick}>
            <Image
              src={CAMPUS_MAPS[campus].image}
              alt={`${CAMPUS_MAPS[campus].name} Campus Map`}
              fill
              className="object-cover select-none"
              data-ai-hint="map campus"
              priority
            />
            {marker && (
              <button
                type="button"
                style={{ top: `${marker.y}%`, left: `${marker.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                tabIndex={-1}
                aria-label="Incident location marker"
                disabled
              >
                <span className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse",
                  getSeverityStyles().dot
                )} />
                <span className={cn(
                  "relative inline-flex rounded-full h-3 w-3",
                  getSeverityStyles().dot
                )} />
              </button>
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
                Click on the map to place a marker
              </span>
            )}
          </div>
        </div>
        {/* Incident Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Vandalism in West Wing" {...field} />
                  </FormControl>
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
                    <Textarea
                      placeholder="Provide a full account of the incident..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Hostel Block C, 2nd Floor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="media"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Media (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-accent/30 hover:bg-accent/50 border-border">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-muted-foreground"/>
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, MP4, etc.</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" />
                        </label>
                    </div> 
                  </FormControl>
                  <FormDescription>
                    You can upload images or videos related to the incident.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || !marker} size="lg">
              {isSubmitting ? "Submitting & analyzing..." : "Submit Report"}
            </Button>
          </form>
        </Form>
        {isSubmitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 shadow-xl flex flex-col items-center">
              <span className="loader mb-4" />
              <span className="font-semibold text-lg">Analyzing your report with AI...</span>
              <span className="text-muted-foreground mt-2">This may take a few seconds.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
