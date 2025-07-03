import { NextResponse } from 'next/server';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyIdToken } from '@/lib/server-auth';

export async function GET() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyIdToken(token);
    if (!user) return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    const data = await req.json();
    const docRef = await addDoc(collection(db, 'users'), data);
    return NextResponse.json({ id: docRef.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 