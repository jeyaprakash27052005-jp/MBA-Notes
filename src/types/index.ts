export type UserRole = 'hod' | 'teacher' | 'student';

export interface UserProfile {
  userId: string; // e.g. "HOD01", "TCH01", "25MBA01"
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  batchId?: string; // For students (e.g. "2025-27")
  address?: string;
  photoUrl?: string;
  subject?: string; // For teachers (e.g. "Financial Management")
  department?: string;
  mustChangePassword?: boolean;
  passwordHash?: string; // Stored securely for User ID = Password authentication
  createdAt?: string;
}

export interface Batch {
  batchId: string; // e.g. "2025-27"
  name: string; // e.g. "MBA Batch 2025-2027"
  year: string; // e.g. "2025-2027"
  studentCount: number;
  prefix?: string; // e.g. "25MBA"
  createdAt?: string;
}

export type SubmissionStatus = 'Submitted' | 'Pending' | 'Late';

export interface Assignment {
  assignmentId: string;
  title: string;
  subject: string;
  batchId: string;
  description: string;
  givenDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  createdBy: string; // teacherId or hodId
  createdByName?: string;
  createdAt?: string;
}

export interface Submission {
  submissionId: string;
  assignmentId: string;
  studentId: string; // e.g. "25MBA01"
  studentName?: string;
  batchId: string;
  submittedDate?: string; // YYYY-MM-DD
  status: SubmissionStatus;
  remarks?: string;
  fileUrl?: string;
  updatedAt?: string;
}

export interface TimetableEntry {
  timetableId: string;
  batchId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periodNo: number; // 1 to 6
  time: string; // e.g. "09:30 AM - 10:30 AM"
  subject: string;
  teacherId?: string;
  teacherName?: string;
  room?: string;
}

export type NoteFileType = 'pdf' | 'pptx' | 'docx' | 'xlsx';

export interface Note {
  noteId: string;
  title: string;
  subject: string;
  batchId: string; // "All" or specific batch ID like "2025-27"
  fileType: NoteFileType;
  fileUrl: string;
  fileSize?: number; // bytes
  uploadedBy: string; // userId
  uploadedByName?: string;
  uploadDate: string;
  description?: string;
}
