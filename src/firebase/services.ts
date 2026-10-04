import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import {
  Batch,
  UserProfile,
  Assignment,
  Submission,
  TimetableEntry,
  Note,
} from '../types';
import {
  INITIAL_BATCHES,
  INITIAL_USERS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_TIMETABLE,
  INITIAL_NOTES,
} from './seed';

// Memory caches to ensure instant responsive UX even if Firestore is syncing
let cachedUsers: UserProfile[] = [...INITIAL_USERS];
let cachedBatches: Batch[] = [...INITIAL_BATCHES];
let cachedAssignments: Assignment[] = [...INITIAL_ASSIGNMENTS];
let cachedSubmissions: Submission[] = [...INITIAL_SUBMISSIONS];
let cachedTimetable: TimetableEntry[] = [...INITIAL_TIMETABLE];
let cachedNotes: Note[] = [...INITIAL_NOTES];

export function userIdToEmail(userId: string): string {
  const cleanId = userId.trim().toLowerCase();
  return `${cleanId}@mbanotes.app`;
}

export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

// ----------------------------------------------------
// BATCH SERVICES
// ----------------------------------------------------
export async function getBatches(): Promise<Batch[]> {
  const path = 'batches';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const batches: Batch[] = [];
      snap.forEach((d) => batches.push(d.data() as Batch));
      cachedBatches = batches.sort((a, b) => b.year.localeCompare(a.year));
      return cachedBatches;
    }
  } catch (error) {
    console.warn(`Firestore getBatches note (using cached):`, error);
  }
  return cachedBatches;
}

export async function saveBatch(batch: Batch): Promise<void> {
  const path = `batches/${batch.batchId}`;
  try {
    await setDoc(doc(db, 'batches', batch.batchId), batch, { merge: true });
  } catch (error) {
    console.warn('Firestore saveBatch error:', error);
  }
  const idx = cachedBatches.findIndex((b) => b.batchId === batch.batchId);
  if (idx >= 0) cachedBatches[idx] = batch;
  else cachedBatches.push(batch);
}

export async function deleteBatch(batchId: string): Promise<void> {
  const path = `batches/${batchId}`;
  try {
    await deleteDoc(doc(db, 'batches', batchId));
  } catch (error) {
    console.warn('Firestore deleteBatch error:', error);
  }
  cachedBatches = cachedBatches.filter((b) => b.batchId !== batchId);
}

// ----------------------------------------------------
// USER SERVICES
// ----------------------------------------------------
export async function getUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const users: UserProfile[] = [];
      snap.forEach((d) => users.push(d.data() as UserProfile));
      cachedUsers = users;
      return cachedUsers;
    }
  } catch (error) {
    console.warn('Firestore getUsers note (using cached):', error);
  }
  return cachedUsers;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  const cleanId = userId.trim().toUpperCase();
  const path = `users/${cleanId}`;
  try {
    const snap = await getDoc(doc(db, 'users', cleanId));
    if (snap.exists()) {
      const u = snap.data() as UserProfile;
      const idx = cachedUsers.findIndex((cu) => cu.userId.toUpperCase() === cleanId);
      if (idx >= 0) cachedUsers[idx] = u;
      else cachedUsers.push(u);
      return u;
    }
  } catch (error) {
    console.warn(`Firestore getUserById ${path} issue (fallback check):`, error);
  }

  // Fallback to local cache
  const found = cachedUsers.find((u) => u.userId.toUpperCase() === cleanId);
  return found || null;
}

export async function saveUser(user: UserProfile): Promise<void> {
  const path = `users/${user.userId}`;
  try {
    await setDoc(doc(db, 'users', user.userId), user, { merge: true });
  } catch (error) {
    console.warn('Firestore saveUser error:', error);
  }
  const idx = cachedUsers.findIndex((u) => u.userId.toUpperCase() === user.userId.toUpperCase());
  if (idx >= 0) cachedUsers[idx] = user;
  else cachedUsers.push(user);
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), data);
  } catch (error) {
    console.warn('Firestore updateUserProfile error:', error);
  }
  const idx = cachedUsers.findIndex((u) => u.userId.toUpperCase() === userId.toUpperCase());
  if (idx >= 0) {
    cachedUsers[idx] = { ...cachedUsers[idx], ...data };
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    console.warn('Firestore deleteUser error:', error);
  }
  cachedUsers = cachedUsers.filter((u) => u.userId.toUpperCase() !== userId.toUpperCase());
}

// Auto-generate batch students
export async function autoGenerateBatchStudents(
  batchId: string,
  batchYear: string,
  studentCount: number
): Promise<UserProfile[]> {
  const match = batchYear.match(/(\d{4})/);
  const year2Digit = match ? match[1].slice(-2) : '25';
  const prefix = `${year2Digit}MBA`;

  const newStudents: UserProfile[] = [];
  const defaultNames = [
    'Aarav Sharma', 'Diya Patel', 'Karan Verma', 'Priya Iyer', 'Rohan Mehta',
    'Ananya Sen', 'Vikram Singh', 'Sneha Nair', 'Arjun Kapoor', 'Ishita Joshi',
    'Rahul Das', 'Meera Rao', 'Siddharth Pillai', 'Tanvi Reddy', 'Aditya Roy',
    'Nisha Gupta', 'Kabir Saxena', 'Rhea Chopra', 'Varun Menon', 'Pooja Bhatia',
    'Harsh Vardhan', 'Shreya Nambiar', 'Gaurav Kulkarni', 'Kavita Pillai', 'Dev Malhotra',
  ];

  for (let i = 1; i <= studentCount; i++) {
    const numStr = i < 10 ? `0${i}` : `${i}`;
    const rollNo = `${prefix}${numStr}`;
    const studentName = defaultNames[(i - 1) % defaultNames.length] + (i > defaultNames.length ? ` (${i})` : '');

    const student: UserProfile = {
      userId: rollNo,
      role: 'student',
      name: studentName,
      email: `${rollNo.toLowerCase()}@mbanotes.app`,
      batchId,
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: 'University Campus Hostel, Block B',
      mustChangePassword: true,
      passwordHash: hashPassword(rollNo), // Password = User ID
      createdAt: new Date().toISOString(),
    };

    await saveUser(student);
    newStudents.push(student);
  }

  await saveBatch({
    batchId,
    name: `MBA Batch ${batchYear}`,
    year: batchYear,
    studentCount,
    prefix,
    createdAt: new Date().toISOString(),
  });

  return newStudents;
}

// ----------------------------------------------------
// ASSIGNMENT SERVICES
// ----------------------------------------------------
export async function getAssignments(): Promise<Assignment[]> {
  const path = 'assignments';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: Assignment[] = [];
      snap.forEach((d) => list.push(d.data() as Assignment));
      cachedAssignments = list.sort((a, b) => new Date(b.givenDate).getTime() - new Date(a.givenDate).getTime());
      return cachedAssignments;
    }
  } catch (error) {
    console.warn('Firestore getAssignments note:', error);
  }
  return cachedAssignments;
}

export async function saveAssignment(assignment: Assignment): Promise<void> {
  const path = `assignments/${assignment.assignmentId}`;
  try {
    await setDoc(doc(db, 'assignments', assignment.assignmentId), assignment, {
      merge: true,
    });
  } catch (error) {
    console.warn('Firestore saveAssignment error:', error);
  }
  const idx = cachedAssignments.findIndex((a) => a.assignmentId === assignment.assignmentId);
  if (idx >= 0) cachedAssignments[idx] = assignment;
  else cachedAssignments.unshift(assignment);
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const path = `assignments/${assignmentId}`;
  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
  } catch (error) {
    console.warn('Firestore deleteAssignment error:', error);
  }
  cachedAssignments = cachedAssignments.filter((a) => a.assignmentId !== assignmentId);
}

// ----------------------------------------------------
// SUBMISSION SERVICES
// ----------------------------------------------------
export async function getSubmissions(): Promise<Submission[]> {
  const path = 'submissions';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: Submission[] = [];
      snap.forEach((d) => list.push(d.data() as Submission));
      cachedSubmissions = list;
      return cachedSubmissions;
    }
  } catch (error) {
    console.warn('Firestore getSubmissions note:', error);
  }
  return cachedSubmissions;
}

export async function saveSubmission(submission: Submission): Promise<void> {
  const path = `submissions/${submission.submissionId}`;
  try {
    await setDoc(doc(db, 'submissions', submission.submissionId), submission, {
      merge: true,
    });
  } catch (error) {
    console.warn('Firestore saveSubmission error:', error);
  }
  const idx = cachedSubmissions.findIndex((s) => s.submissionId === submission.submissionId);
  if (idx >= 0) cachedSubmissions[idx] = submission;
  else cachedSubmissions.push(submission);
}

// ----------------------------------------------------
// TIMETABLE SERVICES
// ----------------------------------------------------
export async function getTimetable(): Promise<TimetableEntry[]> {
  const path = 'timetable';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: TimetableEntry[] = [];
      snap.forEach((d) => list.push(d.data() as TimetableEntry));
      cachedTimetable = list.sort((a, b) => a.periodNo - b.periodNo);
      return cachedTimetable;
    }
  } catch (error) {
    console.warn('Firestore getTimetable note:', error);
  }
  return cachedTimetable;
}

export async function saveTimetableEntry(entry: TimetableEntry): Promise<void> {
  const path = `timetable/${entry.timetableId}`;
  try {
    await setDoc(doc(db, 'timetable', entry.timetableId), entry, {
      merge: true,
    });
  } catch (error) {
    console.warn('Firestore saveTimetableEntry error:', error);
  }
  const idx = cachedTimetable.findIndex((t) => t.timetableId === entry.timetableId);
  if (idx >= 0) cachedTimetable[idx] = entry;
  else cachedTimetable.push(entry);
}

export async function deleteTimetableEntry(timetableId: string): Promise<void> {
  const path = `timetable/${timetableId}`;
  try {
    await deleteDoc(doc(db, 'timetable', timetableId));
  } catch (error) {
    console.warn('Firestore deleteTimetableEntry error:', error);
  }
  cachedTimetable = cachedTimetable.filter((t) => t.timetableId !== timetableId);
}

// ----------------------------------------------------
// NOTES SERVICES
// ----------------------------------------------------
export async function getNotes(): Promise<Note[]> {
  const path = 'notes';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: Note[] = [];
      snap.forEach((d) => list.push(d.data() as Note));
      cachedNotes = list.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      return cachedNotes;
    }
  } catch (error) {
    console.warn('Firestore getNotes note:', error);
  }
  return cachedNotes;
}

export async function saveNote(note: Note): Promise<void> {
  const path = `notes/${note.noteId}`;
  try {
    await setDoc(doc(db, 'notes', note.noteId), note, { merge: true });
  } catch (error) {
    console.warn('Firestore saveNote error:', error);
  }
  const idx = cachedNotes.findIndex((n) => n.noteId === note.noteId);
  if (idx >= 0) cachedNotes[idx] = note;
  else cachedNotes.unshift(note);
}

export async function deleteNote(noteId: string): Promise<void> {
  const path = `notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'notes', noteId));
  } catch (error) {
    console.warn('Firestore deleteNote error:', error);
  }
  cachedNotes = cachedNotes.filter((n) => n.noteId !== noteId);
}
