import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyIdToken } from '@/lib/server-auth';

export async function GET(req, { params }) {
  try {
    const ref = doc(db, 'users', params.id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user: { id: snapshot.id, ...snapshot.data() } });
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
    const ref = doc(db, 'users', params.id);
    await updateDoc(ref, data);
    return NextResponse.json({ success: true });
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
    const ref = doc(db, 'users', params.id);
    await deleteDoc(ref);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 