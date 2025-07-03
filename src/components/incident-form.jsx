import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const token = user && (await user.getIdToken());
      let res, data;
      if (incident) {
        // Edit mode: PUT
        res = await fetch(`/api/incidents/${incident.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        });
      } else {
        // Create mode: POST
        res = await fetch("/api/incidents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        });
      }
      data = await res.json();
      if (res.ok) {
        setSuccess(true);
        if (!incident) setForm(initialState);
        if (onSuccess) onSuccess(data.incident);
      } else {
        setError(data.error || "Failed to save incident");
      }
    } catch (err) {
      setError("Failed to save incident");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 glass-card p-6 mb-8">
      <h3 className="text-xl font-bold mb-2">{incident ? "Edit Incident" : "Report New Incident"}</h3>
      <div className="flex flex-col gap-2">
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title"
          className="input input-bordered"
          required
        />
        <input
          name="type"
          value={form.type}
          onChange={handleChange}
          placeholder="Type (e.g. Vandalism, Bullying)"
          className="input input-bordered"
          required
        />
        <select
          name="severity"
          value={form.severity}
          onChange={handleChange}
          className="input input-bordered"
        >
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="input input-bordered"
          required
        />
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location"
          className="input input-bordered"
          required
        />
      </div>
      <Button type="submit" disabled={loading || !user}>
        {loading ? (incident ? "Updating..." : "Submitting...") : incident ? "Update Incident" : "Submit Incident"}
      </Button>
      {error && <div className="text-destructive mt-2">{error}</div>}
      {success && <div className="text-emerald-500 mt-2">Incident {incident ? "updated" : "reported"} successfully!</div>}
      {!user && <div className="text-muted-foreground mt-2">Sign in to {incident ? "edit" : "report"} an incident.</div>}
    </form>
  );
} 