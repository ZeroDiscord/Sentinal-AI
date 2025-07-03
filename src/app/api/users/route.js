import { db } from '@/src/lib/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';

export async function GET() {
  try {
    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return new Response(JSON.stringify({ users }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { uid, ...userData } = await req.json();
    if (!uid) return new Response(JSON.stringify({ error: 'Missing UID' }), { status: 400 });
    await setDoc(doc(db, 'users', uid), userData);
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
} 