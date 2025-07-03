import { NextResponse } from 'next/server';
import { getAllIncidents, createIncident, updateIncident } from '@/lib/data';
import { verifyIdToken } from '@/lib/server-auth';
import { classifyIncidentType } from '@/ai/flows/classify-incident-type';

export async function GET() {
  try {
    const incidents = await getAllIncidents();
    return NextResponse.json({ incidents });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    console.log('[API] POST /api/incidents called');
    const authHeader = req.headers.get('authorization');
    console.log('[API] Auth header:', authHeader);
    if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyIdToken(token);
    console.log('[API] User:', user);
    if (!user) return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    const data = await req.json();
    console.log('[API] Incident data:', data);

    // 1. Create the incident with basic fields
    const incident = await createIncident({ ...data, createdBy: user.uid, reportedBy: user.uid, status: 'pending_analysis' });
    console.log('[API] Incident created:', incident);

    // 2. Run AI analysis
    const aiResult = await classifyIncidentType({ description: data.description });
    console.log('[API] AI result:', aiResult);

    // 3. Update the incident with AI results
    await updateIncident(incident.id, {
      type: aiResult.incidentType,
      tags: aiResult.suggestedTags,
      severity: aiResult.severityEstimate,
      escalate: aiResult.escalationRequired,
      status: 'analyzed'
    });
    console.log('[API] Incident updated with AI results');

    // 4. Return the enriched incident
    return NextResponse.json({
      incident: {
        ...incident,
        type: aiResult.incidentType,
        tags: aiResult.suggestedTags,
        severity: aiResult.severityEstimate,
        escalate: aiResult.escalationRequired,
        status: 'analyzed'
      }
    });
  } catch (err) {
    console.error('[API] Error in POST /api/incidents:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 