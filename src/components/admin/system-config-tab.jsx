"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

// Firestore client imports
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, onSnapshot, doc } from "firebase/firestore";

function useSubcollection(subcollection) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const subcolRef = collection(db, 'system_config', 'main', subcollection);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(subcolRef, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [subcollection]);

  async function addItem(data) {
    await addDoc(subcolRef, data);
  }

  async function deleteItem(id) {
    await deleteDoc(doc(subcolRef, id));
  }

  return { items, loading, addItem, deleteItem };
}

export default function SystemConfigTab() {
  // Incident Categories
  const [newCategory, setNewCategory] = useState("");
  const {
    items: categories,
    addItem: addCategory,
    deleteItem: deleteCategory,
    loading: loadingCategories,
  } = useSubcollection("incident_categories");

  // Locations
  const [newLocation, setNewLocation] = useState("");
  const {
    items: locations,
    addItem: addLocation,
    deleteItem: deleteLocation,
    loading: loadingLocations,
  } = useSubcollection("locations");

  // AI Prompt Configuration
  const [customPrompt, setCustomPrompt] = useState("");
  const {
    items: aiPrompts,
    addItem: addPrompt,
    deleteItem: deletePrompt,
    loading: loadingPrompts,
  } = useSubcollection("ai_prompts");

  // Load the first (and only) prompt template
  useEffect(() => {
    if (aiPrompts.length > 0) {
      setCustomPrompt(aiPrompts[0].template || "");
    } else {
      // Set default template
      setCustomPrompt(`Analyze the following incident report and respond ONLY with valid JSON in this format:
{
  "summary": string,
  "tags": string[],
  "severity": "low" | "medium" | "high" | "critical",
  "escalate": boolean,
  "escalationReason": string,
  "type": string,
  "confidence": {
    "summary": number (0-1),
    "tags": number (0-1),
    "severity": number (0-1),
    "escalate": number (0-1),
    "type": number (0-1)
  }
}
Incident Description: {description}
Type (if provided): {type}
Location: {location}
Language: {language}
School: {school}
Hostel: {hostel}
Example:
{
  "summary": "A student reported theft in Hostel Block C.",
  "tags": ["theft", "hostel", "student"],
  "severity": "medium",
  "escalate": true,
  "escalationReason": "Theft incidents require immediate attention.",
  "type": "theft",
  "confidence": {
    "summary": 0.85,
    "tags": 0.92,
    "severity": 0.78,
    "escalate": 0.88,
    "type": 0.95
  }
}`);
    }
  }, [aiPrompts]);

  // Save custom prompt
  async function handleSavePrompt() {
    if (!customPrompt.trim()) return;
    if (aiPrompts.length > 0) {
      // Update existing prompt
      await deletePrompt(aiPrompts[0].id);
    }
    await addPrompt({ template: customPrompt.trim() });
  }

  // Add category
  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    await addCategory({ name: newCategory.trim() });
    setNewCategory("");
  }

  // Add location
  async function handleAddLocation() {
    if (!newLocation.trim()) return;
    await addLocation({ name: newLocation.trim() });
    setNewLocation("");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
      {/* Incident Category Management */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Incident Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add new category..."
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="glass-card"
            />
            <Button onClick={handleAddCategory} variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <ul className="space-y-2">
            {loadingCategories ? (
              <li>Loading...</li>
            ) : (
              categories.map(cat => (
                <li key={cat.id} className="flex items-center justify-between bg-background/40 rounded px-3 py-2">
                  <span>{cat.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
      {/* Campus Hotspot Location Management */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Campus Hotspot Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add new location..."
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              className="glass-card"
            />
            <Button onClick={handleAddLocation} variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          <ul className="space-y-2">
            {loadingLocations ? (
              <li>Loading...</li>
            ) : (
              locations.map(loc => (
                <li key={loc.id} className="flex items-center justify-between bg-background/40 rounded px-3 py-2">
                  <span>{loc.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => deleteLocation(loc.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>
      {/* AI Prompt Configuration */}
      <Card className="glass-card mt-8">
        <CardHeader>
          <CardTitle>AI Prompt Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Custom Gemini Prompt Template</label>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                className="w-full h-48 p-3 rounded-md border bg-background/50 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                placeholder="Enter your custom prompt template..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use placeholders: {"{description}"}, {"{type}"}, {"{location}"}, {"{language}"}, {"{school}"}, {"{hostel}"}
              </p>
            </div>
            <Button onClick={handleSavePrompt} variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Save Prompt Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 