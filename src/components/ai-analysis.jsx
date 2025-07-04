"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, Check, Tags, ShieldAlert, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AIAnalysis({ reportText }) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reportText) return;
    const getAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use a simple API call to analyze the text
        const response = await fetch('/api/analyze-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: reportText }),
        });
        
        if (response.ok) {
          const result = await response.json();
          setAnalysis(result.analysis);
        } else {
          throw new Error('Failed to analyze text');
        }
      } catch (err) {
        setError("Failed to get AI analysis. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    getAnalysis();
  }, [reportText]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-1/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive">{error}</p>;
    }

    if (!analysis) {
      return <p>No analysis available.</p>;
    }

    // Helper function to get confidence color
    function getConfidenceColor(score) {
      if (score >= 0.8) return "text-green-500";
      if (score >= 0.6) return "text-yellow-500";
      return "text-red-500";
    }

    // Helper function to get confidence label
    function getConfidenceLabel(score) {
      if (score >= 0.8) return "High";
      if (score >= 0.6) return "Medium";
      return "Low";
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold">AI Summary</h3>
            {analysis.confidence?.summary && (
              <div className="flex items-center gap-2 ml-auto">
                <span className={`text-xs font-medium ${getConfidenceColor(analysis.confidence.summary)}`}>
                  {getConfidenceLabel(analysis.confidence.summary)} Confidence
                </span>
                <Progress value={analysis.confidence.summary * 100} className="w-16 h-2" />
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tags className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold">Suggested Tags</h3>
            {analysis.confidence?.tags && (
              <div className="flex items-center gap-2 ml-auto">
                <span className={`text-xs font-medium ${getConfidenceColor(analysis.confidence.tags)}`}>
                  {getConfidenceLabel(analysis.confidence.tags)} Confidence
                </span>
                <Progress value={analysis.confidence.tags * 100} className="w-16 h-2" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.tags?.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold">Estimated Severity</h3>
            {analysis.confidence?.severity && (
              <div className="flex items-center gap-2 ml-auto">
                <span className={`text-xs font-medium ${getConfidenceColor(analysis.confidence.severity)}`}>
                  {getConfidenceLabel(analysis.confidence.severity)} Confidence
                </span>
                <Progress value={analysis.confidence.severity * 100} className="w-16 h-2" />
              </div>
            )}
          </div>
          <Badge className="capitalize" variant={analysis.severity === 'high' ? 'destructive' : 'secondary'}>
            {analysis.severity}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {analysis.escalate ? (
              <ShieldAlert className="w-4 h-4 text-red-500" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-green-500" />
            )}
            <h3 className="font-semibold">Escalation Recommendation</h3>
            {analysis.confidence?.escalate && (
              <div className="flex items-center gap-2 ml-auto">
                <span className={`text-xs font-medium ${getConfidenceColor(analysis.confidence.escalate)}`}>
                  {getConfidenceLabel(analysis.confidence.escalate)} Confidence
                </span>
                <Progress value={analysis.confidence.escalate * 100} className="w-16 h-2" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={analysis.escalate ? 'destructive' : 'secondary'}>
              {analysis.escalate ? 'Escalate' : 'No Escalation'}
            </Badge>
            {analysis.escalationReason && (
              <span className="text-sm text-muted-foreground">- {analysis.escalationReason}</span>
            )}
          </div>
        </div>
        {analysis.type && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold">Classified Type</h3>
              {analysis.confidence?.type && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className={`text-xs font-medium ${getConfidenceColor(analysis.confidence.type)}`}>
                    {getConfidenceLabel(analysis.confidence.type)} Confidence
                  </span>
                  <Progress value={analysis.confidence.type * 100} className="w-16 h-2" />
                </div>
              )}
            </div>
            <Badge variant="outline" className="capitalize">{analysis.type}</Badge>
          </div>
        )}
        {analysis.confidence && (
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold text-sm">Overall AI Confidence</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              <div className="text-center">
                <div className={`font-medium ${getConfidenceColor(analysis.confidence.summary)}`}>
                  Summary: {Math.round(analysis.confidence.summary * 100)}%
                </div>
              </div>
              <div className="text-center">
                <div className={`font-medium ${getConfidenceColor(analysis.confidence.tags)}`}>
                  Tags: {Math.round(analysis.confidence.tags * 100)}%
                </div>
              </div>
              <div className="text-center">
                <div className={`font-medium ${getConfidenceColor(analysis.confidence.severity)}`}>
                  Severity: {Math.round(analysis.confidence.severity * 100)}%
                </div>
              </div>
              <div className="text-center">
                <div className={`font-medium ${getConfidenceColor(analysis.confidence.escalate)}`}>
                  Escalation: {Math.round(analysis.confidence.escalate * 100)}%
                </div>
              </div>
              <div className="text-center">
                <div className={`font-medium ${getConfidenceColor(analysis.confidence.type)}`}>
                  Type: {Math.round(analysis.confidence.type * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="glass-card sticky top-24">
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
        <CardDescription>Generated by SentinelAI</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
