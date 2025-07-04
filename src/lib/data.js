import { db } from './firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

export const mockUser = {
  id: "user-1",
  name: "John Doe",
  email: "proctor@school.edu",
  role: "School Proctor",
  avatar: "https://placehold.co/100x100",
};

export const mockIncidents = [
  {
    id: "INC-001",
    title: "Vandalism in West Wing",
    type: "Vandalism",
    severity: "High",
    reportedBy: "Jane Smith",
    reporterRole: "Warden",
    date: "2024-07-22",
    status: "Pending",
    description: "Graffiti found on the walls of the west wing, near the chemistry lab. The content is offensive. Security cameras in the area might have captured the perpetrators. Immediate cleanup and investigation required.",
    location: "West Wing, Near Chemistry Lab",
  },
  {
    id: "INC-002",
    title: "Alleged Ragging Incident",
    type: "Ragging",
    severity: "Critical",
    reportedBy: "Anonymous Student",
    reporterRole: "Student",
    date: "2024-07-21",
    status: "In Progress",
    description: "A first-year student reported being subjected to ragging by seniors in Hostel Block C. The student is distressed but unharmed physically. This requires immediate and sensitive handling.",
    location: "Hostel Block C",
  },
  {
    id: "INC-003",
    title: "Unauthorized Entry",
    type: "Security Breach",
    severity: "Moderate",
    reportedBy: "Security Guard",
    reporterRole: "Security",
    date: "2024-07-21",
    status: "Resolved",
    description: "An unauthorized individual was found on campus after hours. They were apprehended and handed over to the local police. No damage or harm was caused. The perimeter security has been reviewed.",
    location: "Main Gate",
  },
  {
    id: "INC-004",
    title: "Minor fire in canteen",
    type: "Fire Hazard",
    severity: "Moderate",
    reportedBy: "Canteen Staff",
    reporterRole: "Staff",
    date: "2024-07-20",
    status: "Resolved",
    description: "A small fire broke out due to a short circuit in the canteen kitchen. It was extinguished quickly using fire extinguishers. No injuries, minor damage to equipment.",
    location: "Canteen Kitchen",
  },
  {
    id: "INC-005",
    title: "Bullying near playground",
    type: "Bullying",
    severity: "High",
    reportedBy: "Ayan Sharma",
    reporterRole: "Student",
    date: "2024-07-19",
    status: "Pending",
    description: "A student from class 8 was being repeatedly bullied by a group of senior students near the main playground. Verbal abuse and intimidation were reported. The student is scared to come to school.",
    location: "Main Playground",
  },
];

const INCIDENTS_COLLECTION = 'incidents';

export async function getAllIncidents() {
  const snapshot = await getDocs(collection(db, INCIDENTS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getIncidentById(id) {
  const ref = doc(db, INCIDENTS_COLLECTION, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function createIncident(data) {
  const ref = await addDoc(collection(db, INCIDENTS_COLLECTION), data);
  return { id: ref.id, ...data };
}

export async function updateIncident(id, data) {
  const ref = doc(db, INCIDENTS_COLLECTION, id);
  await updateDoc(ref, data);
  return { id, ...data };
}

export async function deleteIncident(id) {
  const ref = doc(db, INCIDENTS_COLLECTION, id);
  await deleteDoc(ref);
  return true;
}
