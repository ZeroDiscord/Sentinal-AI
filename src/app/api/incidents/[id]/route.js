// File: src/app/api/incidents/[id]/route.js

import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyIdToken } from '@/lib/server-auth';

// Handles GET /api/incidents/:id
export async function GET(request, { params }) {
  try {
    const { id } = params; // Destructure id from params
    const incidentRef = doc(db, 'incidents', id);
    const incidentSnap = await getDoc(incidentRef);

    if (!incidentSnap.exists()) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ incident: { id: incidentSnap.id, ...incidentSnap.data() } });
  } catch (err) {
    console.error(`Error in GET /api/incidents/${params.id}:`, err);
    return NextResponse.json({ error: 'Failed to fetch incident' }, { status: 500 });
  }
}

// Handles PUT /api/incidents/:id
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyIdToken(token);
    if (!user) {
        return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }
    
    const data = await request.json();
    const incidentRef = doc(db, 'incidents', id);
    
    // Add an updatedAt timestamp for good practice
    await updateDoc(incidentRef, {
        ...data,
        updatedAt: serverTimestamp()
    });
    
    const updatedSnap = await getDoc(incidentRef);
    return NextResponse.json({ incident: { id: updatedSnap.id, ...updatedSnap.data() } });
  } catch (err) {
    console.error(`Error in PUT /api/incidents/${params.id}:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Handles DELETE /api/incidents/:id
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyIdToken(token);
    if (!user) {
        return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }
    
    const incidentRef = doc(db, 'incidents', id);
    await deleteDoc(incidentRef);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error in DELETE /api/incidents/${params.id}:`, err);
    return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 });
  }
}
