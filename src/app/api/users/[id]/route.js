import { db } from '@/src/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export async function GET(req, contextPromise) {
  const { params } = await contextPromise;
  try {
    const userRef = doc(db, 'users', params.id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ id: userSnap.id, ...userSnap.data() }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function PUT(req, contextPromise) {
  const { params } = await contextPromise;
  try {
    const data = await req.json();
    await setDoc(doc(db, 'users', params.id), data, { merge: true });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(req, contextPromise) {
  const { params } = await contextPromise;
  try {
    await deleteDoc(doc(db, 'users', params.id));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
} 