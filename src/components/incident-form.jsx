// File: src/components/incident-form.jsx

import { useState, useEffect } from "react";
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

const initialState = {
  title: "",
  type: "",
  severity: "Low",
  description: "",
  location: "",
};

export default function IncidentForm({ incident, onSuccess }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (incident) {
      setForm({
        title: incident.title || "",
        type: incident.type || "",
        severity: incident.severity || "Low",
        description: incident.description || "",
        location: incident.location || "",
      });
    } else {
      setForm(initialState);
    }
  }, [incident]);

  // Generic handler for standard input fields
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Specific handler for the Select component's value change
  const handleSeverityChange = (value) => {
    setForm({ ...form, severity: value });
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
        body: JSON.stringify(form),
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
        
        {/* Use the custom Select component with its specific handler */}
        <Select value={form.severity} onValueChange={handleSeverityChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Moderate">Moderate</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
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