"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";

export default function BatchProcessingTab() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ success: 0, failed: 0, total: 0 });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "incidents"), (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function batchReanalyze() {
    setProcessing(true);
    setProgress(0);
    setResults({ success: 0, failed: 0, total: incidents.length });

    for (let i = 0; i < incidents.length; i++) {
      const incident = incidents[i];
      try {
        const response = await fetch(`/api/incidents/${incident.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`,
          },
        });
        
        if (response.ok) {
          setResults(prev => ({ ...prev, success: prev.success + 1 }));
        } else {
          setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      } catch (error) {
        console.error(`Failed to re-analyze incident ${incident.id}:`, error);
        setResults(prev => ({ ...prev, failed: prev.failed + 1 }));
      }
      
      setProgress(((i + 1) / incidents.length) * 100);
      // Add a small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setProcessing(false);
  }

  async function getAuthToken() {
    // This is a placeholder - you'll need to implement proper auth token retrieval
    // For now, return null which will cause the API to handle anonymous requests
    return null;
  }

  const analyzedIncidents = incidents.filter(i => i.status === 'analyzed').length;
  const pendingIncidents = incidents.filter(i => i.status === 'pending_analysis').length;

  return (
    <div className="p-6 space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Batch AI Re-Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{incidents.length}</div>
                <div className="text-sm text-muted-foreground">Total Incidents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{analyzedIncidents}</div>
                <div className="text-sm text-muted-foreground">AI Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{pendingIncidents}</div>
                <div className="text-sm text-muted-foreground">Pending Analysis</div>
              </div>
            </div>

            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing incidents...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                <div className="text-sm text-muted-foreground">
                  Success: {results.success} | Failed: {results.failed} | Total: {results.total}
                </div>
              </div>
            )}

            <Button 
              onClick={batchReanalyze} 
              disabled={processing || incidents.length === 0}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
              {processing ? 'Processing...' : 'Re-Analyze All Incidents'}
            </Button>

            <p className="text-sm text-muted-foreground">
              This will re-analyze all incidents using the latest AI prompt template. 
              This process may take several minutes and will consume API quota.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading incidents...</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {incidents.slice(0, 10).map(incident => (
                <div key={incident.id} className="flex items-center justify-between p-3 bg-background/40 rounded">
                  <div className="flex-1">
                    <div className="font-medium truncate">{incident.description?.substring(0, 50)}...</div>
                    <div className="text-sm text-muted-foreground">ID: {incident.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={incident.status === 'analyzed' ? 'default' : 'secondary'}>
                      {incident.status === 'analyzed' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {incident.status}
                    </Badge>
                    {incident.severity && (
                      <Badge variant="outline" className="capitalize">
                        {incident.severity}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 