import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export async function verifyIdToken(token) {
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded;
  } catch (err) {
    return null;
  }
} 