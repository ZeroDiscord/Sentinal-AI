import { NextResponse } from 'next/server';
import { getIncidentById, updateIncident, deleteIncident } from '@/lib/data';
import { verifyIdToken } from '@/lib/server-auth';

export async function GET(req, { params }) {
  try {
    const incident = await getIncidentById(params.id);
    if (!incident) return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    return NextResponse.json({ incident });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyIdToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    const data = await req.json();
    const updated = await updateIncident(params.id, data);
    return NextResponse.json({ incident: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyIdToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    const ok = await deleteIncident(params.id);
    if (ok) return NextResponse.json({ success: true });
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 