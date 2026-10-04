import { writeBatch, doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { Batch, UserProfile, Assignment, Submission, TimetableEntry, Note } from '../types';
import { hashPassword } from './services';

export const INITIAL_BATCHES: Batch[] = [
  {
    batchId: '2025-27',
    name: 'MBA Batch 2025-2027',
    year: '2025-2027',
    studentCount: 30,
    prefix: '25MBA',
    createdAt: new Date().toISOString(),
  },
  {
    batchId: '2024-26',
    name: 'MBA Batch 2024-2026',
    year: '2024-2026',
    studentCount: 25,
    prefix: '24MBA',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    userId: 'HOD01',
    role: 'hod',
    name: 'Dr. Rajesh Sharma (HOD)',
    email: 'jeyaprakash27052005@gmail.com',
    phone: '+91 98450 12345',
    department: 'Department of Management Studies',
    address: 'Dean Office, Management Block A',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: hashPassword('HOD01'),
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'TCH01',
    role: 'teacher',
    name: 'Prof. Ananya Iyer',
    email: 'ananya.iyer@mbanotes.app',
    phone: '+91 98200 45678',
    subject: 'Marketing Management',
    department: 'MBA - Marketing & Strategy',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: hashPassword('TCH01'),
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'TCH02',
    role: 'teacher',
    name: 'Dr. Vikram Malhotra',
    email: 'vikram.malhotra@mbanotes.app',
    phone: '+91 98200 87654',
    subject: 'Financial Management',
    department: 'MBA - Finance & Accounting',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: hashPassword('TCH02'),
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'TCH03',
    role: 'teacher',
    name: 'Prof. Sneha Kapoor',
    email: 'sneha.kapoor@mbanotes.app',
    phone: '+91 98200 11223',
    subject: 'Human Resource Management',
    department: 'MBA - HR & OB',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: hashPassword('TCH03'),
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'TCH04',
    role: 'teacher',
    name: 'Prof. Arjun Verma',
    email: 'arjun.verma@mbanotes.app',
    phone: '+91 98200 99887',
    subject: 'Operations & Supply Chain',
    department: 'MBA - Operations Research',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: hashPassword('TCH04'),
    createdAt: new Date().toISOString(),
  },
  {
    userId: '25MBA01',
    role: 'student',
    name: 'Aarav Patel',
    email: '25mba01@mbanotes.app',
    phone: '+91 98111 22334',
    batchId: '2025-27',
    address: 'MBA Hostel Block B, Room 204',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    mustChangePassword: false,
    passwordHash: hashPassword('25MBA01'),
    createdAt: new Date().toISOString(),
  },
  {
    userId: '25MBA02',
    role: 'student',
    name: 'Diya Sen',
    email: '25mba02@mbanotes.app',
    phone: '+91 98111 55667',
    batchId: '2025-27',
    address: 'MBA Hostel Block C, Room 102',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    mustChangePassword: true,
    passwordHash: hashPassword('25MBA02'),
    createdAt: new Date().toISOString(),
  },
  {
    userId: '25MBA03',
    role: 'student',
    name: 'Karan Mehra',
    email: '25mba03@mbanotes.app',
    phone: '+91 98111 88990',
    batchId: '2025-27',
    address: 'MBA Hostel Block B, Room 310',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    mustChangePassword: true,
    passwordHash: hashPassword('25MBA03'),
    createdAt: new Date().toISOString(),
  },
  {
    userId: '25MBA04',
    role: 'student',
    name: 'Priya Nair',
    email: '25mba04@mbanotes.app',
    phone: '+91 98111 33445',
    batchId: '2025-27',
    address: 'MBA Hostel Block C, Room 208',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    mustChangePassword: true,
    passwordHash: hashPassword('25MBA04'),
    createdAt: new Date().toISOString(),
  },
  {
    userId: '25MBA05',
    role: 'student',
    name: 'Rohan Gupta',
    email: '25mba05@mbanotes.app',
    phone: '+91 98111 77889',
    batchId: '2025-27',
    address: 'MBA Hostel Block B, Room 115',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    mustChangePassword: true,
    passwordHash: hashPassword('25MBA05'),
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    assignmentId: 'ASG-001',
    title: 'HBR Case: Zara Fast Fashion Agile Supply Chain Analysis',
    subject: 'Operations & Supply Chain',
    batchId: '2025-27',
    description: 'Analyze Zara’s agile manufacturing cycle, lead-time reduction strategy, and RFID inventory visibility. Prepare a 4-page report with recommendations for Asian retail expansion.',
    givenDate: '2026-09-20',
    dueDate: '2026-10-15',
    createdBy: 'TCH04',
    createdByName: 'Prof. Arjun Verma',
    createdAt: new Date().toISOString(),
  },
  {
    assignmentId: 'ASG-002',
    title: 'Capital Budgeting & DCF Valuation of Green Energy Project',
    subject: 'Financial Management',
    batchId: '2025-27',
    description: 'Build a financial DCF model computing NPV, IRR, and payback period under 3 cost of capital scenarios (8%, 10%, 12%). Submit the workbook with sensitivity analysis.',
    givenDate: '2026-09-25',
    dueDate: '2026-10-10',
    createdBy: 'TCH02',
    createdByName: 'Dr. Vikram Malhotra',
    createdAt: new Date().toISOString(),
  },
  {
    assignmentId: 'ASG-003',
    title: 'Omnichannel D2C Brand Launch & Customer Acquisition Strategy',
    subject: 'Marketing Management',
    batchId: '2025-27',
    description: 'Design a comprehensive go-to-market plan for an organic wellness brand targeting Gen Z consumers. Formulate CAC, LTV assumptions and promotional mix.',
    givenDate: '2026-10-01',
    dueDate: '2026-10-25',
    createdBy: 'TCH01',
    createdByName: 'Prof. Ananya Iyer',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    submissionId: 'SUB-ASG001-25MBA01',
    assignmentId: 'ASG-001',
    studentId: '25MBA01',
    studentName: 'Aarav Patel',
    batchId: '2025-27',
    submittedDate: '2026-10-02',
    status: 'Submitted',
    remarks: 'Excellent case analysis of RFID and vertical integration.',
    updatedAt: new Date().toISOString(),
  },
  {
    submissionId: 'SUB-ASG001-25MBA02',
    assignmentId: 'ASG-001',
    studentId: '25MBA02',
    studentName: 'Diya Sen',
    batchId: '2025-27',
    submittedDate: '2026-10-03',
    status: 'Submitted',
    remarks: 'Thorough flow diagrams included.',
    updatedAt: new Date().toISOString(),
  },
  {
    submissionId: 'SUB-ASG002-25MBA01',
    assignmentId: 'ASG-002',
    studentId: '25MBA01',
    studentName: 'Aarav Patel',
    batchId: '2025-27',
    submittedDate: '2026-10-01',
    status: 'Submitted',
    remarks: 'Accurate sensitivity matrix.',
    updatedAt: new Date().toISOString(),
  },
  {
    submissionId: 'SUB-ASG002-25MBA03',
    assignmentId: 'ASG-002',
    studentId: '25MBA03',
    studentName: 'Karan Mehra',
    batchId: '2025-27',
    submittedDate: '2026-10-12',
    status: 'Late',
    remarks: 'Submitted after cutoff, 5% deduction.',
    updatedAt: new Date().toISOString(),
  },
  {
    submissionId: 'SUB-ASG003-25MBA01',
    assignmentId: 'ASG-003',
    studentId: '25MBA01',
    studentName: 'Aarav Patel',
    batchId: '2025-27',
    status: 'Pending',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_TIMETABLE: TimetableEntry[] = [
  { timetableId: 'TT-MON-1', batchId: '2025-27', day: 'Monday', periodNo: 1, time: '09:00 AM - 10:15 AM', subject: 'Financial Management', teacherId: 'TCH02', teacherName: 'Dr. Vikram Malhotra', room: 'Lecture Hall 1' },
  { timetableId: 'TT-MON-2', batchId: '2025-27', day: 'Monday', periodNo: 2, time: '10:30 AM - 11:45 AM', subject: 'Marketing Management', teacherId: 'TCH01', teacherName: 'Prof. Ananya Iyer', room: 'Lecture Hall 1' },
  { timetableId: 'TT-MON-3', batchId: '2025-27', day: 'Monday', periodNo: 3, time: '12:00 PM - 01:15 PM', subject: 'Operations & Supply Chain', teacherId: 'TCH04', teacherName: 'Prof. Arjun Verma', room: 'Lecture Hall 1' },
  { timetableId: 'TT-MON-4', batchId: '2025-27', day: 'Monday', periodNo: 4, time: '02:00 PM - 03:15 PM', subject: 'Human Resource Management', teacherId: 'TCH03', teacherName: 'Prof. Sneha Kapoor', room: 'Lecture Hall 1' },
  { timetableId: 'TT-MON-5', batchId: '2025-27', day: 'Monday', periodNo: 5, time: '03:30 PM - 04:45 PM', subject: 'Case Study Lab', teacherId: 'HOD01', teacherName: 'Dr. Rajesh Sharma (HOD)', room: 'Executive Seminar Room' },

  { timetableId: 'TT-TUE-1', batchId: '2025-27', day: 'Tuesday', periodNo: 1, time: '09:00 AM - 10:15 AM', subject: 'Marketing Management', teacherId: 'TCH01', teacherName: 'Prof. Ananya Iyer', room: 'Lecture Hall 1' },
  { timetableId: 'TT-TUE-2', batchId: '2025-27', day: 'Tuesday', periodNo: 2, time: '10:30 AM - 11:45 AM', subject: 'Operations & Supply Chain', teacherId: 'TCH04', teacherName: 'Prof. Arjun Verma', room: 'Lecture Hall 1' },
  { timetableId: 'TT-TUE-3', batchId: '2025-27', day: 'Tuesday', periodNo: 3, time: '12:00 PM - 01:15 PM', subject: 'Financial Management', teacherId: 'TCH02', teacherName: 'Dr. Vikram Malhotra', room: 'Lecture Hall 1' },
  { timetableId: 'TT-TUE-4', batchId: '2025-27', day: 'Tuesday', periodNo: 4, time: '02:00 PM - 03:15 PM', subject: 'Managerial Economics', teacherId: 'HOD01', teacherName: 'Dr. Rajesh Sharma (HOD)', room: 'Lecture Hall 1' },

  { timetableId: 'TT-WED-1', batchId: '2025-27', day: 'Wednesday', periodNo: 1, time: '09:00 AM - 10:15 AM', subject: 'Human Resource Management', teacherId: 'TCH03', teacherName: 'Prof. Sneha Kapoor', room: 'Lecture Hall 1' },
  { timetableId: 'TT-WED-2', batchId: '2025-27', day: 'Wednesday', periodNo: 2, time: '10:30 AM - 11:45 AM', subject: 'Financial Management', teacherId: 'TCH02', teacherName: 'Dr. Vikram Malhotra', room: 'Lecture Hall 1' },
  { timetableId: 'TT-WED-3', batchId: '2025-27', day: 'Wednesday', periodNo: 3, time: '12:00 PM - 01:15 PM', subject: 'Marketing Management', teacherId: 'TCH01', teacherName: 'Prof. Ananya Iyer', room: 'Lecture Hall 1' },
  { timetableId: 'TT-WED-4', batchId: '2025-27', day: 'Wednesday', periodNo: 4, time: '02:00 PM - 03:15 PM', subject: 'Business Analytics Lab', teacherId: 'TCH04', teacherName: 'Prof. Arjun Verma', room: 'Computer Lab 3' },

  { timetableId: 'TT-THU-1', batchId: '2025-27', day: 'Thursday', periodNo: 1, time: '09:00 AM - 10:15 AM', subject: 'Operations & Supply Chain', teacherId: 'TCH04', teacherName: 'Prof. Arjun Verma', room: 'Lecture Hall 1' },
  { timetableId: 'TT-THU-2', batchId: '2025-27', day: 'Thursday', periodNo: 2, time: '10:30 AM - 11:45 AM', subject: 'Human Resource Management', teacherId: 'TCH03', teacherName: 'Prof. Sneha Kapoor', room: 'Lecture Hall 1' },
  { timetableId: 'TT-THU-3', batchId: '2025-27', day: 'Thursday', periodNo: 3, time: '12:00 PM - 01:15 PM', subject: 'Corporate Governance', teacherId: 'HOD01', teacherName: 'Dr. Rajesh Sharma (HOD)', room: 'Lecture Hall 1' },
  { timetableId: 'TT-THU-4', batchId: '2025-27', day: 'Thursday', periodNo: 4, time: '02:00 PM - 03:15 PM', subject: 'Financial Management', teacherId: 'TCH02', teacherName: 'Dr. Vikram Malhotra', room: 'Lecture Hall 1' },

  { timetableId: 'TT-FRI-1', batchId: '2025-27', day: 'Friday', periodNo: 1, time: '09:00 AM - 10:15 AM', subject: 'Marketing Management', teacherId: 'TCH01', teacherName: 'Prof. Ananya Iyer', room: 'Lecture Hall 1' },
  { timetableId: 'TT-FRI-2', batchId: '2025-27', day: 'Friday', periodNo: 2, time: '10:30 AM - 11:45 AM', subject: 'Strategic Management', teacherId: 'HOD01', teacherName: 'Dr. Rajesh Sharma (HOD)', room: 'Lecture Hall 1' },
  { timetableId: 'TT-FRI-3', batchId: '2025-27', day: 'Friday', periodNo: 3, time: '12:00 PM - 01:15 PM', subject: 'Operations Research', teacherId: 'TCH04', teacherName: 'Prof. Arjun Verma', room: 'Lecture Hall 1' },
  { timetableId: 'TT-FRI-4', batchId: '2025-27', day: 'Friday', periodNo: 4, time: '02:00 PM - 03:15 PM', subject: 'Executive Colloquium', teacherId: 'HOD01', teacherName: 'Dr. Rajesh Sharma (HOD)', room: 'Auditorium' },
];

export const INITIAL_NOTES: Note[] = [
  {
    noteId: 'NOTE-001',
    title: 'Module 1: Corporate Valuation & Working Capital Dynamics',
    subject: 'Financial Management',
    batchId: '2025-27',
    fileType: 'pdf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: 4520000,
    uploadedBy: 'TCH02',
    uploadedByName: 'Dr. Vikram Malhotra',
    uploadDate: '2026-09-28',
    description: 'Comprehensive lecture slides covering discounted cash flows, enterprise value, and working capital ratios.',
  },
  {
    noteId: 'NOTE-002',
    title: 'Lecture Slides: Strategic Brand Architecture & Positioning',
    subject: 'Marketing Management',
    batchId: '2025-27',
    fileType: 'pptx',
    fileUrl: 'https://view.officeapps.live.com/op/view.aspx',
    fileSize: 12400000,
    uploadedBy: 'TCH01',
    uploadedByName: 'Prof. Ananya Iyer',
    uploadDate: '2026-10-01',
    description: '35 presentation slides detailing brand equity pyramids, perceptual mapping, and differentiated positioning.',
  },
  {
    noteId: 'NOTE-003',
    title: 'Financial DCF & Ratio Analysis Template Workbook',
    subject: 'Financial Management',
    batchId: '2025-27',
    fileType: 'xlsx',
    fileUrl: '#download-template',
    fileSize: 2150000,
    uploadedBy: 'TCH02',
    uploadedByName: 'Dr. Vikram Malhotra',
    uploadDate: '2026-10-02',
    description: 'Excel modeling sheet with dynamic formulas for Dupont analysis and automated 5-year balance sheet projections.',
  },
  {
    noteId: 'NOTE-004',
    title: 'Global Supply Chain Bottleneck Solutions & Lean Sigma',
    subject: 'Operations & Supply Chain',
    batchId: '2025-27',
    fileType: 'docx',
    fileUrl: '#download-docx',
    fileSize: 3400000,
    uploadedBy: 'TCH04',
    uploadedByName: 'Prof. Arjun Verma',
    uploadDate: '2026-10-03',
    description: 'Detailed reading note for Bullwhip effect mitigation, kanban scheduling, and Six Sigma DMAIC framework.',
  },
  {
    noteId: 'NOTE-005',
    title: 'Talent Acquisition & Competency Mapping Framework',
    subject: 'Human Resource Management',
    batchId: '2025-27',
    fileType: 'pdf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: 5800000,
    uploadedBy: 'TCH03',
    uploadedByName: 'Prof. Sneha Kapoor',
    uploadDate: '2026-10-04',
    description: 'Guide for behavioural event interviews (BEI), 360-degree feedback, and performance scorecards.',
  },
];

export async function checkAndSeedInitialData(): Promise<void> {
  try {
    // Quick single document check to avoid multi-collection scans
    const hodDoc = await getDoc(doc(db, 'users', 'HOD01'));
    if (hodDoc.exists()) {
      return;
    }

    console.log('Seeding MBA department data in single atomic writeBatch...');
    const batch = writeBatch(db);

    // Batches
    for (const b of INITIAL_BATCHES) {
      batch.set(doc(db, 'batches', b.batchId), b, { merge: true });
    }

    // Users
    for (const u of INITIAL_USERS) {
      batch.set(doc(db, 'users', u.userId), u, { merge: true });
    }

    // Assignments
    for (const a of INITIAL_ASSIGNMENTS) {
      batch.set(doc(db, 'assignments', a.assignmentId), a, { merge: true });
    }

    // Submissions
    for (const sub of INITIAL_SUBMISSIONS) {
      batch.set(doc(db, 'submissions', sub.submissionId), sub, { merge: true });
    }

    // Timetable
    for (const tt of INITIAL_TIMETABLE) {
      batch.set(doc(db, 'timetable', tt.timetableId), tt, { merge: true });
    }

    // Notes
    for (const n of INITIAL_NOTES) {
      batch.set(doc(db, 'notes', n.noteId), n, { merge: true });
    }

    await batch.commit();
    console.log('Atomic seed commit succeeded!');
  } catch (error) {
    console.warn('Initial seeding note (non-fatal):', error);
  }
}
