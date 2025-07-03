// Handles GET and POST requests for /api/incidents

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, getDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { verifyIdToken } from '@/lib/server-auth';
import { summarizeIncidentReport } from '@/ai/flows/summarize-incident-report';

export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'incidents'));
    const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ incidents });
  } catch (err) {
    console.error("Error in GET /api/incidents:", err);
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const authHeader = req.headers.get('authorization');
    let user = null;

    if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        user = await verifyIdToken(token);
    }

    // Prepare initial data
    const incidentData = {
        ...data,
        reportedBy: user ? user.uid : 'anonymous',
        reporterRole: user ? (user.role || 'student') : 'anonymous',
        status: 'pending_analysis',
        createdAt: serverTimestamp(),
        date: new Date().toISOString(),
    };

    // 1. Create the incident with basic fields
    const docRef = await addDoc(collection(db, 'incidents'), incidentData);
    console.log('[API] Incident created with ID:', docRef.id);

    // 2. Run AI analysis
    const aiResult = await summarizeIncidentReport({ report: data.description });
    console.log('[API] AI analysis result:', aiResult);

    // 3. Update the incident with AI results
    const incidentUpdate = {
        type: aiResult.type || aiResult.incidentType || "Uncategorized",
        tags: aiResult.tags || [],
        severity: aiResult.severity || "Low",
        escalate: aiResult.escalate || false,
        summary: aiResult.summary || "AI summary not available.",
        status: 'analyzed',
    };
    await updateDoc(doc(db, 'incidents', docRef.id), incidentUpdate);
    console.log('[API] Incident updated with AI results.');

    // 4. Return the enriched incident
    const finalIncident = { id: docRef.id, ...incidentData, ...incidentUpdate };
    return NextResponse.json({ incident: finalIncident });

  } catch (err) {
    console.error('[API] Error in POST /api/incidents:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 