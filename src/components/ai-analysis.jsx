"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, Check, Tags, ShieldAlert, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AIAnalysis({ analysis, isLoading = false, error = null }) {
  const getConfidenceColor = (score) => {
    if (score >= 0.8) return "text-emerald-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceLabel = (score) => {
    if (score >= 0.8) return "High";
    if (score >= 0.6) return "Medium";
    return "Low";
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const normalizeSeverity = (severity) => {
    const sev = (severity || '').toLowerCase();
    if (sev === 'critical') return 'Critical';
    if (sev === 'high') return 'High';
    if (sev === 'medium' || sev === 'moderate') return 'Medium';
    if (sev === 'low') return 'Low';
    return 'Low';
  };

  const ConfidenceIndicator = ({ score, label }) => (
    <div className="flex items-center gap-2 text-sm">
      <span className={`font-medium ${getConfidenceColor(score)}`}>
        {getConfidenceLabel(score)}
      </span>
      <span className="text-slate-400">Confidence</span>
      <Progress value={score * 100} className="w-16 h-1.5" />
    </div>
  );

  const SectionCard = ({ icon: Icon, title, confidence, children, className = "" }) => (
    <Card className={`bg-slate-800/50 border-slate-700/50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-sm font-medium text-slate-200">{title}</CardTitle>
          </div>
          {confidence && <ConfidenceIndicator score={confidence} />}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 bg-slate-900/30 rounded-lg border border-slate-700/30">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-900/30 rounded-lg border border-slate-700/30">
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="pt-6">
            <div className="text-center text-red-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6 bg-slate-900/30 rounded-lg border border-slate-700/30">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="text-center text-slate-400">
              <Lightbulb className="w-8 h-8 mx-auto mb-2" />
              <p>No analysis available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-900/30 rounded-lg border border-slate-700/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/30 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-400" />
            AI Analysis
          </h2>
          <p className="text-sm text-slate-400 mt-1">Generated by SentinelAI</p>
        </div>
      </div>

      {/* AI Summary - Full Width */}
      <SectionCard 
        icon={Lightbulb} 
        title="AI Summary" 
        confidence={analysis.confidence?.summary}
      >
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
          <p className="text-slate-300 leading-relaxed text-sm">
            {analysis.summary}
          </p>
        </div>
      </SectionCard>

      {/* Analysis Cards - Stacked Vertically */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Suggested Tags */}
        <SectionCard 
          icon={Tags} 
          title="Suggested Tags" 
          confidence={analysis.confidence?.tags}
        >
          <div className="flex flex-wrap gap-2">
            {analysis.tags?.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs px-2 py-1"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </SectionCard>

        {/* Estimated Severity */}
        <SectionCard 
          icon={AlertTriangle} 
          title="Estimated Severity" 
          confidence={analysis.confidence?.severity}
        >
          <div className="flex items-center gap-3">
            <Badge className={`${getSeverityColor(normalizeSeverity(analysis.severity))} text-sm px-3 py-1.5 capitalize font-medium`}>
              {normalizeSeverity(analysis.severity)}
            </Badge>
            <span className="text-xs text-slate-400">
              Risk Level Assessment
            </span>
          </div>
        </SectionCard>

        {/* Escalation Recommendation */}
        <SectionCard 
          icon={analysis.escalate ? ShieldAlert : ShieldCheck} 
          title="Escalation Recommendation" 
          confidence={analysis.confidence?.escalate}
        >
          <div className="space-y-3">
            <Badge 
              className={`text-sm px-3 py-1.5 font-medium ${
                analysis.escalate 
                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                  : 'bg-green-500/20 text-green-400 border-green-500/30'
              }`}
            >
              {analysis.escalate ? 'Escalate Required' : 'No Escalation Needed'}
            </Badge>
            {analysis.escalationReason && (
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {analysis.escalationReason}
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Classified Type */}
        {analysis.type && (
          <SectionCard 
            icon={Check} 
            title="Classified Type" 
            confidence={analysis.confidence?.type}
          >
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm px-3 py-1.5 capitalize font-medium">
                {analysis.type}
              </Badge>
              <span className="text-xs text-slate-400">
                Incident Classification
              </span>
            </div>
          </SectionCard>
        )}
      </div>

      {/* Overall Confidence */}
      {analysis.confidence && (
        <div className="pt-4 border-t border-slate-700/30">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-200">Overall Confidence Metrics</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(analysis.confidence).map(([key, value]) => (
                  <div key={key} className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                    <div className="text-xs text-slate-400 mb-1 capitalize font-medium">{key}</div>
                    <div className={`text-lg font-bold ${getConfidenceColor(value)}`}>
                      {Math.round(value * 100)}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {getConfidenceLabel(value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}