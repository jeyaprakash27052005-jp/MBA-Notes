import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Batch,
  UserProfile,
  Assignment,
  Submission,
  TimetableEntry,
  Note,
  NoteFileType,
  SubmissionStatus,
} from '../../types';
import {
  getBatches,
  saveBatch,
  deleteBatch,
  getUsers,
  saveUser,
  updateUserProfile,
  deleteUser,
  autoGenerateBatchStudents,
  getAssignments,
  saveAssignment,
  deleteAssignment,
  getSubmissions,
  saveSubmission,
  getTimetable,
  saveTimetableEntry,
  deleteTimetableEntry,
  getNotes,
  saveNote,
  deleteNote,
  hashPassword,
} from '../../firebase/services';
import {
  Layers,
  GraduationCap,
  Users,
  FileCheck,
  CalendarDays,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Search,
  Sparkles,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  FileQuestion,
  Presentation,
  BookOpen,
  Filter,
  UserCheck,
  KeyRound,
  Shield,
  User,
} from 'lucide-react';
import { ConfirmModal } from '../common/Toast';
import { downloadNoteFile } from '../../utils/fileDownloader';
import { NotePreviewModal } from '../common/NotePreviewModal';

interface HodDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onOpenProfileModal?: () => void;
  onOpenChangePassword?: () => void;
}

export const HodDashboard: React.FC<HodDashboardProps> = ({
  activeTab,
  setActiveTab,
  showToast,
  onOpenProfileModal,
  onOpenChangePassword,
}) => {
  const { currentUser } = useAuth();

  // State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  // Filters & Search
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [timetableDay, setTimetableDay] = useState<TimetableEntry['day']>('Monday');
  const [timetableBatch, setTimetableBatch] = useState<string>('2025-27');
  const [assignmentFilterBatch, setAssignmentFilterBatch] = useState<string>('all');
  const [notesFilterBatch, setNotesFilterBatch] = useState<string>('all');

  // Modal forms
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({ batchId: '', name: '', year: '2025-27', studentCount: 30, autoGenerateStudents: true });

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState<Partial<UserProfile>>({
    userId: '',
    name: '',
    role: 'student',
    batchId: '2025-27',
    email: '',
    phone: '',
    address: '',
    photoUrl: '',
  });
  const [isEditingStudent, setIsEditingStudent] = useState(false);

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState<Partial<UserProfile>>({
    userId: '',
    name: '',
    role: 'teacher',
    subject: '',
    email: '',
    phone: '',
    department: 'Department of Management Studies',
    photoUrl: '',
  });
  const [isEditingTeacher, setIsEditingTeacher] = useState(false);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<Partial<Assignment>>({
    assignmentId: '',
    title: '',
    subject: '',
    batchId: '2025-27',
    description: '',
    givenDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    createdBy: currentUser?.userId || 'HOD01',
    createdByName: currentUser?.name || 'Dr. Rajesh Sharma (HOD)',
  });
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);

  const [trackingAssignment, setTrackingAssignment] = useState<Assignment | null>(null);

  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [timetableForm, setTimetableForm] = useState<Partial<TimetableEntry>>({
    timetableId: '',
    batchId: '2025-27',
    day: 'Monday',
    periodNo: 1,
    time: '09:00 AM - 10:15 AM',
    subject: '',
    teacherId: '',
    teacherName: '',
    room: 'Lecture Hall 1',
  });
  const [isEditingTimetable, setIsEditingTimetable] = useState(false);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState<Partial<Note>>({
    noteId: '',
    title: '',
    subject: '',
    batchId: '2025-27',
    fileType: 'pdf',
    fileUrl: '',
    fileSize: 2500000,
    description: '',
  });
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  // Delete Confirm modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bList, uList, aList, sList, tList, nList] = await Promise.all([
        getBatches(),
        getUsers(),
        getAssignments(),
        getSubmissions(),
        getTimetable(),
        getNotes(),
      ]);

      setBatches(bList || []);
      setUsers(uList || []);
      setAssignments(aList || []);
      setSubmissions(sList || []);
      setTimetable(tList || []);
      setNotes(nList || []);

      if (bList && bList.length > 0 && !timetableBatch) {
        setTimetableBatch(bList[0].batchId);
      }
    } catch (err) {
      console.error('Failed to load HOD data:', err);
      showToast('error', 'Failed to fetch academic data from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered queries
  const students = users.filter((u) => u.role === 'student');
  const teachers = users.filter((u) => u.role === 'teacher');

  const filteredStudents = students.filter((s) => {
    const matchesBatch = selectedBatchFilter === 'all' || s.batchId === selectedBatchFilter;
    const matchesQuery =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.userId.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.phone && s.phone.includes(studentSearch));
    return matchesBatch && matchesQuery;
  });

  const filteredTeachers = teachers.filter((t) => {
    return (
      t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      t.userId.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(teacherSearch.toLowerCase()))
    );
  });

  const filteredAssignments = assignments.filter((a) => {
    return assignmentFilterBatch === 'all' || a.batchId === assignmentFilterBatch;
  });

  const filteredNotes = notes.filter((n) => {
    return notesFilterBatch === 'all' || n.batchId === notesFilterBatch;
  });

  const filteredTimetable = timetable.filter((t) => {
    return t.batchId === timetableBatch && t.day === timetableDay;
  });

  // ----------------------------------------------------
  // BATCH ACTIONS
  // ----------------------------------------------------
  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bId = batchForm.batchId.trim() || batchForm.year.trim();
      const newBatch: Batch = {
        batchId: bId,
        name: batchForm.name.trim() || `MBA Batch ${batchForm.year}`,
        year: batchForm.year.trim(),
        studentCount: Number(batchForm.studentCount) || 30,
        createdAt: new Date().toISOString(),
      };

      await saveBatch(newBatch);

      if (batchForm.autoGenerateStudents) {
        showToast('info', 'Generating student roll numbers & passwords...');
        await autoGenerateBatchStudents(bId, batchForm.year, Number(batchForm.studentCount) || 30);
        showToast('success', `Batch created! Auto-generated ${batchForm.studentCount} student IDs (Password = Roll No).`);
      } else {
        showToast('success', `Batch ${newBatch.name} saved successfully.`);
      }

      setShowBatchModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', 'Could not save batch.');
    }
  };

  const handleDeleteBatch = (batch: Batch) => {
    setDeleteConfirm({
      isOpen: true,
      title: `Delete Batch "${batch.name}"?`,
      message: `Are you sure you want to delete this batch (${batch.year})? Associated students and timetable slots should be reviewed.`,
      onConfirm: async () => {
        try {
          await deleteBatch(batch.batchId);
          showToast('success', `Batch "${batch.name}" deleted.`);
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          await fetchData();
        } catch (err) {
          showToast('error', 'Failed to delete batch.');
        }
      },
    });
  };

  // ----------------------------------------------------
  // STUDENT ACTIONS
  // ----------------------------------------------------
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.userId || !studentForm.name) {
      showToast('error', 'Roll No and Name are required.');
      return;
    }

    try {
      const rollNo = studentForm.userId.trim().toUpperCase();
      const updatedProfile: UserProfile = {
        userId: rollNo,
        role: 'student',
        name: studentForm.name.trim(),
        email: studentForm.email || `${rollNo.toLowerCase()}@mbanotes.app`,
        phone: studentForm.phone || '',
        batchId: studentForm.batchId || (batches[0]?.batchId || '2025-27'),
        address: studentForm.address || '',
        photoUrl: studentForm.photoUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        mustChangePassword: !isEditingStudent,
        passwordHash: hashPassword(rollNo), // Default Password = Roll No
        createdAt: new Date().toISOString(),
      };

      await saveUser(updatedProfile);
      showToast('success', `Student ${updatedProfile.name} (${updatedProfile.userId}) saved!`);
      setShowStudentModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to save student profile.');
    }
  };

  const handleDeleteStudent = (student: UserProfile) => {
    setDeleteConfirm({
      isOpen: true,
      title: `Delete Student "${student.name}"?`,
      message: `Are you sure you want to delete roll number ${student.userId}? This action will remove the user permanently.`,
      onConfirm: async () => {
        try {
          await deleteUser(student.userId);
          showToast('success', `Student ${student.userId} removed.`);
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          await fetchData();
        } catch (err) {
          showToast('error', 'Failed to remove student.');
        }
      },
    });
  };

  // ----------------------------------------------------
  // TEACHER ACTIONS
  // ----------------------------------------------------
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.userId || !teacherForm.name) {
      showToast('error', 'Teacher ID and Name are required.');
      return;
    }

    try {
      const tId = teacherForm.userId.trim().toUpperCase();
      const updatedTeacher: UserProfile = {
        userId: tId,
        role: 'teacher',
        name: teacherForm.name.trim(),
        email: teacherForm.email || `${tId.toLowerCase()}@mbanotes.app`,
        phone: teacherForm.phone || '',
        subject: teacherForm.subject || 'Management Studies',
        department: teacherForm.department || 'Department of Management Studies',
        photoUrl: teacherForm.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        mustChangePassword: !isEditingTeacher,
        passwordHash: hashPassword(tId), // Default rule: Teacher Password = User ID
        createdAt: new Date().toISOString(),
      };

      await saveUser(updatedTeacher);
      showToast('success', `Teacher ${updatedTeacher.name} (${tId}) saved! Default Password: ${tId}`);
      setShowTeacherModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to save faculty profile.');
    }
  };

  const handleAutoTeacherId = () => {
    const existingNums = teachers
      .map((t) => parseInt(t.userId.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const formatted = `TCH${nextNum < 10 ? '0' + nextNum : nextNum}`;
    setTeacherForm((prev) => ({ ...prev, userId: formatted }));
  };

  const handleDeleteTeacher = (teacher: UserProfile) => {
    setDeleteConfirm({
      isOpen: true,
      title: `Delete Faculty "${teacher.name}"?`,
      message: `Are you sure you want to remove ${teacher.userId}? They will no longer be able to log in or upload notes.`,
      onConfirm: async () => {
        try {
          await deleteUser(teacher.userId);
          showToast('success', `Teacher ${teacher.userId} removed.`);
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          await fetchData();
        } catch (err) {
          showToast('error', 'Failed to remove faculty member.');
        }
      },
    });
  };

  // ----------------------------------------------------
  // ASSIGNMENT ACTIONS
  // ----------------------------------------------------
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.title || !assignmentForm.subject) {
      showToast('error', 'Title and Subject are required.');
      return;
    }

    try {
      const aId = assignmentForm.assignmentId || `ASG-${Date.now().toString().slice(-5)}`;
      const newAsg: Assignment = {
        assignmentId: aId,
        title: assignmentForm.title.trim(),
        subject: assignmentForm.subject.trim(),
        batchId: assignmentForm.batchId || '2025-27',
        description: assignmentForm.description || '',
        givenDate: assignmentForm.givenDate || new Date().toISOString().split('T')[0],
        dueDate: assignmentForm.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        createdBy: currentUser?.userId || 'HOD01',
        createdByName: currentUser?.name || 'Dr. Rajesh Sharma (HOD)',
        createdAt: new Date().toISOString(),
      };

      await saveAssignment(newAsg);
      showToast('success', `Assignment "${newAsg.title}" saved!`);
      setShowAssignmentModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to save assignment.');
    }
  };

  const handleDeleteAssignment = (asg: Assignment) => {
    setDeleteConfirm({
      isOpen: true,
      title: `Delete Assignment?`,
      message: `Are you sure you want to delete "${asg.title}"?`,
      onConfirm: async () => {
        try {
          await deleteAssignment(asg.assignmentId);
          showToast('success', 'Assignment deleted.');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          await fetchData();
        } catch (err) {
          showToast('error', 'Failed to delete assignment.');
        }
      },
    });
  };

  const handleUpdateSubmissionStatus = async (
    submission: Submission,
    newStatus: SubmissionStatus
  ) => {
    try {
      const updated: Submission = {
        ...submission,
        status: newStatus,
        submittedDate: newStatus === 'Pending' ? undefined : (submission.submittedDate || new Date().toISOString().split('T')[0]),
        updatedAt: new Date().toISOString(),
      };
      await saveSubmission(updated);
      showToast('success', `Submission marked as ${newStatus}.`);
      await fetchData();
    } catch (err) {
      showToast('error', 'Failed to update submission status.');
    }
  };

  // ----------------------------------------------------
  // TIMETABLE ACTIONS
  // ----------------------------------------------------
  const handleSaveTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timetableForm.subject || !timetableForm.time) {
      showToast('error', 'Subject and Time slot are required.');
      return;
    }

    try {
      const tId = timetableForm.timetableId || `TT-${timetableForm.day?.substring(0, 3).toUpperCase()}-${timetableForm.periodNo}-${Date.now().toString().slice(-4)}`;
      const teacherObj = teachers.find((t) => t.userId === timetableForm.teacherId);

      const entry: TimetableEntry = {
        timetableId: tId,
        batchId: timetableForm.batchId || timetableBatch,
        day: timetableForm.day || timetableDay,
        periodNo: Number(timetableForm.periodNo) || 1,
        time: timetableForm.time || '09:00 AM - 10:15 AM',
        subject: timetableForm.subject.trim(),
        teacherId: timetableForm.teacherId || undefined,
        teacherName: teacherObj ? teacherObj.name : timetableForm.teacherName || 'Faculty',
        room: timetableForm.room || 'Lecture Hall 1',
      };

      await saveTimetableEntry(entry);
      showToast('success', `Timetable slot saved for Period ${entry.periodNo} (${entry.day}).`);
      setShowTimetableModal(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to save timetable entry.');
    }
  };

  const handleDeleteTimetable = (tt: TimetableEntry) => {
    setDeleteConfirm({
      isOpen: true,
      title: `Delete Timetable Slot?`,
      message: `Delete Period ${tt.periodNo} (${tt.subject}) for ${tt.day}?`,
      onConfirm: async () => {
        try {
          await deleteTimetableEntry(tt.timetableId);
          showToast('success', 'Timetable slot removed.');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          await fetchData();
        } catch (err) {
          showToast('error', 'Failed to remove timetable slot.');
        }
      },
    });
  };

  // ----------------------------------------------------
  // NOTES UPLOAD & MANAGEMENT (STRICT RULES)
  // ----------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const allowedExtensions = ['pdf', 'pptx', 'ppt', 'docx', 'doc', 'xlsx', 'xls'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // RULE 1: Allowed file types ONLY: PPT/PPTX, PDF, XLS/XLSX, DOC/DOCX
    if (!allowedExtensions.includes(ext)) {
      setFileError('Rejected! Only PDF, PPT/PPTX, DOC/DOCX, and XLS/XLSX files are permitted.');
      setSelectedFile(null);
      return;
    }

    // RULE 2: Max file size: 20 MB (20,971,520 bytes)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError(`File exceeds 20 MB limit (Selected: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    // Map extension to canonical file type
    let canonicalType: NoteFileType = 'pdf';
    if (ext.includes('ppt')) canonicalType = 'pptx';
    if (ext.includes('doc')) canonicalType = 'docx';
    if (ext.includes('xls')) canonicalType = 'xlsx';

    setNoteForm((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      fileType: canonicalType,
      fileSize: file.size,
    }));
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title || !noteForm.subject) {
      showToast('error', 'Title and Subject are required.');
      return;
    }

    try {
      const nId = noteForm.noteId || `NOTE-${Date.now().toString().slice(-6)}`;

      let generatedUrl = noteForm.fileUrl || '';
      if (selectedFile) {
        generatedUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(selectedFile);
        });
      }

      const note: Note = {
        noteId: nId,
        title: noteForm.title.trim(),
        subject: noteForm.subject.trim(),
        batchId: noteForm.batchId || '2025-27',
        fileType: (noteForm.fileType as NoteFileType) || 'pdf',
        fileUrl: generatedUrl,
        fileSize: noteForm.fileSize || (selectedFile ? selectedFile.size : 2500000),
        uploadedBy: currentUser?.userId || 'HOD01',
        uploadedByName: currentUser?.name || 'Dr. Rajesh Sharma (HOD)',
        uploadDate: new Date().toISOString().split('T')[0],
        description: noteForm.description || '',
      };

      await saveNote(note);
      showToast('success', `Note material "${note.title}" uploaded!`);
      setShowNoteModal(false);
      setSelectedFile(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to save note material.');
    }
  };

  const handleDeleteNote = (note: Note) => {
    setDeleteConfirm({
      isOpen: true,
      title: `Delete Notes Material?`,
      message: `Are you sure you want to delete "${note.title}"? Students will no longer be able to download it.`,
      onConfirm: async () => {
        try {
          await deleteNote(note.noteId);
          showToast('success', 'Note removed from online repository.');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          await fetchData();
        } catch (err) {
          showToast('error', 'Failed to delete note.');
        }
      },
    });
  };

  // Helper file icons
  const renderFileIcon = (type: NoteFileType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'pptx':
        return <Presentation className="w-5 h-5 text-amber-600" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'docx':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      default:
        return <FileQuestion className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Welcome & Quick Navigation for Desktop */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded-md">
              HOD Administrative Control Center
            </span>
            <span className="text-xs text-blue-200">Online Cloud Firestore</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Welcome, Dr. Rajesh Sharma
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Full administrative control over MBA Batches, Students, Faculty, Period Timetables, Assignments, and Course Notes.
          </p>
        </div>

        {/* Quick Tabs on Desktop */}
        <div className="hidden md:flex flex-wrap items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'batches', label: 'Batches', icon: Layers },
            { id: 'students', label: 'Students', icon: GraduationCap },
            { id: 'teachers', label: 'Faculty', icon: Users },
            { id: 'assignments', label: 'Assignments', icon: FileCheck },
            { id: 'timetable', label: 'Timetable', icon: CalendarDays },
            { id: 'notes', label: 'Notes', icon: FileText },
            { id: 'profile', label: 'My Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Batches</span>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{batches.length}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Active Academic Batches</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-indigo-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Students</span>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{students.length}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Enrolled MBA Scholars</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-purple-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Faculty</span>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{teachers.length}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Professors & Instructors</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes Material</span>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{notes.length}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">PDF/PPTX/DOCX/XLSX</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-amber-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assignments</span>
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{assignments.length}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Live Case Studies & Tasks</p>
              </div>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Executive Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  setBatchForm({ batchId: '', name: '', year: '2026-28', studentCount: 30, autoGenerateStudents: true });
                  setShowBatchModal(true);
                }}
                className="p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-left transition-all group"
              >
                <Layers className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-xs text-blue-950">Create New Batch</p>
                <p className="text-[10px] text-blue-700 mt-0.5">Auto-generate 26MBAxx roll numbers</p>
              </button>

              <button
                onClick={() => {
                  handleAutoTeacherId();
                  setShowTeacherModal(true);
                  setIsEditingTeacher(false);
                }}
                className="p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition-all group"
              >
                <Users className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-xs text-purple-950">Add Teacher / Faculty</p>
                <p className="text-[10px] text-purple-700 mt-0.5">Auto-generates staff ID & pass</p>
              </button>

              <button
                onClick={() => {
                  setNoteForm({
                    noteId: '',
                    title: '',
                    subject: 'Financial Management',
                    batchId: batches[0]?.batchId || '2025-27',
                    fileType: 'pdf',
                    fileUrl: '',
                    fileSize: 3200000,
                    description: '',
                  });
                  setSelectedFile(null);
                  setShowNoteModal(true);
                  setIsEditingNote(false);
                }}
                className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-all group"
              >
                <Upload className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-xs text-emerald-950">Upload MBA Notes</p>
                <p className="text-[10px] text-emerald-700 mt-0.5">PDF, PPTX, XLSX, DOCX (20MB)</p>
              </button>

              <button
                onClick={() => {
                  setAssignmentForm({
                    assignmentId: '',
                    title: '',
                    subject: 'Strategic Management',
                    batchId: batches[0]?.batchId || '2025-27',
                    description: '',
                    givenDate: new Date().toISOString().split('T')[0],
                    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                    createdBy: currentUser?.userId || 'HOD01',
                    createdByName: currentUser?.name || 'Dr. Rajesh Sharma (HOD)',
                  });
                  setShowAssignmentModal(true);
                  setIsEditingAssignment(false);
                }}
                className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-all group"
              >
                <FileCheck className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-xs text-amber-950">Post Assignment</p>
                <p className="text-[10px] text-amber-700 mt-0.5">Set task with submission tracking</p>
              </button>
            </div>
          </div>

          {/* Recent Notes & Timetable Glance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Notes Glance */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Latest Uploaded Notes Material
                </h3>
                <button
                  onClick={() => setActiveTab('notes')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View All ({notes.length})
                </button>
              </div>
              <div className="space-y-2">
                {notes.slice(0, 4).map((n) => (
                  <div
                    key={n.noteId}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white shadow-2xs border border-slate-200">
                        {renderFileIcon(n.fileType)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">{n.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {n.subject} • Batch {n.batchId} • by {n.uploadedByName}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-slate-200 text-slate-700">
                      {n.fileType}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timetable Glance */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  Today’s Schedule Glance (Batch 2025-27)
                </h3>
                <button
                  onClick={() => setActiveTab('timetable')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  Full Timetable
                </button>
              </div>
              <div className="space-y-2">
                {timetable.filter((t) => t.batchId === '2025-27' && t.day === 'Monday').slice(0, 4).map((tt) => (
                  <div
                    key={tt.timetableId}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        P{tt.periodNo}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{tt.subject}</h4>
                        <p className="text-[11px] text-slate-500">{tt.time} • {tt.teacherName}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      {tt.room || 'Hall 1'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BATCH MANAGEMENT */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Academic Batches</h3>
              <p className="text-xs text-slate-500">
                Create batches and automatically generate student roll numbers (25MBA01..25MBAxx) with default passwords.
              </p>
            </div>
            <button
              onClick={() => {
                setBatchForm({ batchId: '', name: '', year: '2025-27', studentCount: 30, autoGenerateStudents: true });
                setShowBatchModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Batch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((b) => {
              const enrolledCount = students.filter((s) => s.batchId === b.batchId).length;
              return (
                <div
                  key={b.batchId}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                        {b.year}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Prefix: <span className="font-mono font-bold text-slate-800">{b.prefix || `${b.year.substring(2, 4)}MBA`}</span>
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{b.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Batch ID: <span className="font-mono font-semibold">{b.batchId}</span>
                    </p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-slate-500">Target Count</p>
                        <p className="font-bold text-slate-900">{b.studentCount} Students</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">Enrolled In System</p>
                        <p className="font-bold text-blue-600">{enrolledCount} Active Records</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedBatchFilter(b.batchId);
                        setActiveTab('students');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>View Students</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(b)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Student Directory</h3>
              <p className="text-xs text-slate-500">
                Manage MBA student profiles, roll numbers (User ID), passwords, and batch allocations.
              </p>
            </div>
            <button
              onClick={() => {
                setStudentForm({
                  userId: '',
                  name: '',
                  role: 'student',
                  batchId: batches[0]?.batchId || '2025-27',
                  email: '',
                  phone: '',
                  address: '',
                  photoUrl: '',
                });
                setIsEditingStudent(false);
                setShowStudentModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>

          {/* Filters & Search bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students by name, roll number, or phone..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter Batch:</span>
              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.name} ({b.year})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Students Grid / Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Roll No (User ID)</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Default Password</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No students found matching current search/filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.userId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                              {s.photoUrl ? (
                                <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                              ) : (
                                s.name.substring(0, 2)
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{s.name}</p>
                              <p className="text-[10px] text-slate-400">{s.address || 'Hostel campus'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {s.userId}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {s.batchId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-800 font-medium">{s.phone || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400">{s.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            {s.userId}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setStudentForm(s);
                                setIsEditingStudent(true);
                                setShowStudentModal(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                              title="Edit Student"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TEACHER MANAGEMENT */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Faculty & Teacher Directory</h3>
              <p className="text-xs text-slate-500">
                Add, edit, or remove faculty members. Auto-generate Teacher User ID (Password = ID).
              </p>
            </div>
            <button
              onClick={() => {
                handleAutoTeacherId();
                setTeacherForm({
                  userId: '',
                  name: '',
                  role: 'teacher',
                  subject: 'Financial Management',
                  email: '',
                  phone: '',
                  department: 'Department of Management Studies',
                  photoUrl: '',
                });
                setIsEditingTeacher(false);
                setShowTeacherModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Faculty</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((t) => (
              <div
                key={t.userId}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 shadow-2xs">
                      {t.photoUrl ? (
                        <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        t.name.substring(0, 2)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {t.userId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Password = {t.userId}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{t.name}</h4>
                      <p className="text-xs text-blue-600 font-semibold">{t.subject || 'Faculty'}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-medium text-slate-800">{t.email}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-medium text-slate-800">{t.phone || 'N/A'}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-medium text-slate-800">{t.department || 'MBA'}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setTeacherForm(t);
                      setIsEditingTeacher(true);
                      setShowTeacherModal(true);
                    }}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(t)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ASSIGNMENT MANAGEMENT */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">MBA Department Assignments</h3>
              <p className="text-xs text-slate-500">
                Create assignments, specify due dates, and track student submissions (Submitted / Pending / Late).
              </p>
            </div>
            <button
              onClick={() => {
                setAssignmentForm({
                  assignmentId: '',
                  title: '',
                  subject: 'Financial Management',
                  batchId: batches[0]?.batchId || '2025-27',
                  description: '',
                  givenDate: new Date().toISOString().split('T')[0],
                  dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                  createdBy: currentUser?.userId || 'HOD01',
                  createdByName: currentUser?.name || 'Dr. Rajesh Sharma (HOD)',
                });
                setIsEditingAssignment(false);
                setShowAssignmentModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Assignment</span>
            </button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Batch Filter:</span>
            <select
              value={assignmentFilterBatch}
              onChange={(e) => setAssignmentFilterBatch(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.name} ({b.year})
                </option>
              ))}
            </select>
          </div>

          {/* Assignments List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((a) => {
              const asgSubmissions = submissions.filter((s) => s.assignmentId === a.assignmentId);
              const submittedCount = asgSubmissions.filter((s) => s.status === 'Submitted' || s.status === 'Late').length;
              const pendingCount = asgSubmissions.filter((s) => s.status === 'Pending').length;

              return (
                <div
                  key={a.assignmentId}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800">
                        {a.subject}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Batch: <span className="font-bold text-slate-800">{a.batchId}</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{a.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.description}</p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-blue-500" /> Given Date:
                        </span>
                        <span className="font-medium text-slate-800">{a.givenDate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-500">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Due Date:
                        </span>
                        <span className="font-bold text-rose-600">{a.dueDate}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">Submissions Status:</span>
                        <div className="flex items-center gap-2 font-bold text-[11px]">
                          <span className="text-emerald-600">{submittedCount} Submitted</span>
                          <span className="text-amber-600">{pendingCount} Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setTrackingAssignment(a)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Track Submissions</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setAssignmentForm(a);
                          setIsEditingAssignment(true);
                          setShowAssignmentModal(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(a)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TRACKING SUBMISSIONS MODAL */}
      {trackingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Submission Tracking</h3>
                <p className="text-xs text-slate-400 mt-0.5">{trackingAssignment.title} (Batch: {trackingAssignment.batchId})</p>
              </div>
              <button
                onClick={() => setTrackingAssignment(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {students
                .filter((st) => st.batchId === trackingAssignment.batchId)
                .map((student) => {
                  const existingSub = submissions.find(
                    (s) => s.assignmentId === trackingAssignment.assignmentId && s.studentId === student.userId
                  );

                  const currentStatus: SubmissionStatus = existingSub?.status || 'Pending';

                  return (
                    <div key={student.userId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{student.name}</span>
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {student.userId}
                          </span>
                        </div>
                        {existingSub?.submittedDate && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Submitted on: <span className="font-semibold text-slate-700">{existingSub.submittedDate}</span>
                          </p>
                        )}
                        {existingSub?.remarks && (
                          <p className="text-[11px] text-slate-600 italic mt-0.5">"{existingSub.remarks}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() =>
                            handleUpdateSubmissionStatus(
                              existingSub || {
                                submissionId: `SUB-${trackingAssignment.assignmentId}-${student.userId}`,
                                assignmentId: trackingAssignment.assignmentId,
                                studentId: student.userId,
                                studentName: student.name,
                                batchId: trackingAssignment.batchId,
                                status: 'Submitted',
                              },
                              'Submitted'
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'Submitted'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Submitted
                        </button>

                        <button
                          onClick={() =>
                            handleUpdateSubmissionStatus(
                              existingSub || {
                                submissionId: `SUB-${trackingAssignment.assignmentId}-${student.userId}`,
                                assignmentId: trackingAssignment.assignmentId,
                                studentId: student.userId,
                                studentName: student.name,
                                batchId: trackingAssignment.batchId,
                                status: 'Late',
                              },
                              'Late'
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'Late'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Late
                        </button>

                        <button
                          onClick={() =>
                            handleUpdateSubmissionStatus(
                              existingSub || {
                                submissionId: `SUB-${trackingAssignment.assignmentId}-${student.userId}`,
                                assignmentId: trackingAssignment.assignmentId,
                                studentId: student.userId,
                                studentName: student.name,
                                batchId: trackingAssignment.batchId,
                                status: 'Pending',
                              },
                              'Pending'
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'Pending'
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Pending
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PERIOD TIME TABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Period Time Table Management</h3>
              <p className="text-xs text-slate-500">
                Add, edit, or delete period slots by Batch, Day (Mon-Sat), Period Number, and Faculty.
              </p>
            </div>
            <button
              onClick={() => {
                setTimetableForm({
                  timetableId: '',
                  batchId: timetableBatch,
                  day: timetableDay,
                  periodNo: 1,
                  time: '09:00 AM - 10:15 AM',
                  subject: '',
                  teacherId: teachers[0]?.userId || '',
                  teacherName: teachers[0]?.name || '',
                  room: 'Lecture Hall 1',
                });
                setIsEditingTimetable(false);
                setShowTimetableModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Timetable Slot</span>
            </button>
          </div>

          {/* Batch & Day Selectors */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Select Batch:</span>
                <select
                  value={timetableBatch}
                  onChange={(e) => setTimetableBatch(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {batches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.name} ({b.year})
                    </option>
                  ))}
                </select>
              </div>

              {/* Day pill selector */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as TimetableEntry['day'][]).map(
                  (day) => (
                    <button
                      key={day}
                      onClick={() => setTimetableDay(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        timetableDay === day
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Timetable slots */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                {timetableDay} Schedule • Batch {timetableBatch}
              </h4>
              <span className="text-xs text-slate-500 font-medium">
                {filteredTimetable.length} Periods Scheduled
              </span>
            </div>

            {filteredTimetable.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No period slots scheduled for {timetableDay}.</p>
                <p className="text-[11px] text-slate-400 mt-1">Click "Add Timetable Slot" to create one.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTimetable
                  .sort((a, b) => a.periodNo - b.periodNo)
                  .map((slot) => (
                    <div
                      key={slot.timetableId}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                          {slot.periodNo}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">{slot.subject}</h4>
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {slot.room || 'Lecture Hall'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ⏰ {slot.time} • Instructor: <span className="font-medium text-slate-700">{slot.teacherName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() => {
                            setTimetableForm(slot);
                            setIsEditingTimetable(true);
                            setShowTimetableModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTimetable(slot)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: NOTES MANAGEMENT */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Lecture Notes Repository</h3>
              <p className="text-xs text-slate-500">
                Upload and manage study materials. Allowed file types ONLY: PPT/PPTX, PDF, XLS/XLSX, DOC/DOCX (Max 20 MB).
              </p>
            </div>
            <button
              onClick={() => {
                setNoteForm({
                  noteId: '',
                  title: '',
                  subject: 'Financial Management',
                  batchId: batches[0]?.batchId || '2025-27',
                  fileType: 'pdf',
                  fileUrl: '',
                  fileSize: 3200000,
                  description: '',
                });
                setSelectedFile(null);
                setFileError('');
                setIsEditingNote(false);
                setShowNoteModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New Note</span>
            </button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Batch Filter:</span>
            <select
              value={notesFilterBatch}
              onChange={(e) => setNotesFilterBatch(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.name} ({b.year})
                </option>
              ))}
            </select>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.noteId}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      {renderFileIcon(note.fileType)}
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {note.fileType}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{note.title}</h4>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">{note.subject}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{note.description || 'No description provided.'}</p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Batch:</span>
                      <span className="font-bold text-slate-800">{note.batchId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Uploaded By:</span>
                      <span className="font-medium text-slate-800">{note.uploadedByName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="font-medium text-slate-800">{note.uploadDate}</span>
                    </div>
                    {note.fileSize && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Size:</span>
                        <span className="font-mono text-slate-700">{(note.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewNote(note)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadNoteFile(note)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Download directly to your device"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setNoteForm(note);
                        setIsEditingNote(true);
                        setShowNoteModal(true);
                      }}
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE BATCH */}
      {/* ---------------------------------------------------- */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create MBA Batch</h3>
            <p className="text-xs text-slate-500 mb-4">
              Auto-generate batch-wise student roll numbers (YY + MBA + number).
            </p>

            <form onSubmit={handleSaveBatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch Year</label>
                <input
                  type="text"
                  value={batchForm.year}
                  onChange={(e) => setBatchForm({ ...batchForm, year: e.target.value })}
                  placeholder="e.g. 2025-27"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch Title</label>
                <input
                  type="text"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g. MBA Batch 2025-2027"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Number of Students</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={batchForm.studentCount}
                  onChange={(e) => setBatchForm({ ...batchForm, studentCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-900">
                  <input
                    type="checkbox"
                    checked={batchForm.autoGenerateStudents}
                    onChange={(e) => setBatchForm({ ...batchForm, autoGenerateStudents: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Auto-generate student roll numbers (e.g. 25MBA01 to 25MBAxx)</span>
                </label>
                <p className="text-[11px] text-blue-700 mt-1 pl-5">
                  Each student's default password is set equal to their Roll Number.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT STUDENT */}
      {/* ---------------------------------------------------- */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {isEditingStudent ? 'Edit Student Profile' : 'Add New Student'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Default rule: Student Password = Roll Number.
            </p>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number (User ID)</label>
                <input
                  type="text"
                  value={studentForm.userId}
                  onChange={(e) => setStudentForm({ ...studentForm, userId: e.target.value.toUpperCase() })}
                  placeholder="e.g. 25MBA01"
                  required
                  disabled={isEditingStudent}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="Student Full Name"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch</label>
                  <select
                    value={studentForm.batchId}
                    onChange={(e) => setStudentForm({ ...studentForm, batchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address / Hostel</label>
                <input
                  type="text"
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                  placeholder="Hostel Block, Room No."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Photo URL (Optional)</label>
                <input
                  type="text"
                  value={studentForm.photoUrl}
                  onChange={(e) => setStudentForm({ ...studentForm, photoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT TEACHER */}
      {/* ---------------------------------------------------- */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {isEditingTeacher ? 'Edit Faculty Profile' : 'Add New Faculty Member'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Auto-generate teacher ID. Teacher login follows: Password = User ID.
            </p>

            <form onSubmit={handleSaveTeacher} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teacher ID</label>
                  <input
                    type="text"
                    value={teacherForm.userId}
                    onChange={(e) => setTeacherForm({ ...teacherForm, userId: e.target.value.toUpperCase() })}
                    placeholder="e.g. TCH01"
                    required
                    disabled={isEditingTeacher}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!isEditingTeacher && (
                  <button
                    type="button"
                    onClick={handleAutoTeacherId}
                    className="mt-5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                  >
                    Auto ID
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name & Title</label>
                <input
                  type="text"
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="Prof. / Dr. Full Name"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Specialization</label>
                <input
                  type="text"
                  value={teacherForm.subject}
                  onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                  placeholder="e.g. Financial Management, Marketing Strategy"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="+91 98..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    placeholder="staff@mbanotes.app"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Save Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: POST / EDIT ASSIGNMENT */}
      {/* ---------------------------------------------------- */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {isEditingAssignment ? 'Edit Assignment' : 'Post New Assignment'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure assignment title, subject, target batch, and submission due date.
            </p>

            <form onSubmit={handleSaveAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="e.g. HBR Case Study: Agile Supply Chains"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={assignmentForm.subject}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                    placeholder="e.g. Operations & Supply Chain"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch</label>
                  <select
                    value={assignmentForm.batchId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, batchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Given Date</label>
                  <input
                    type="date"
                    value={assignmentForm.givenDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, givenDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Guidelines</label>
                <textarea
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Provide instructions, required sections, and submission format..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD / EDIT TIMETABLE SLOT */}
      {/* ---------------------------------------------------- */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {isEditingTimetable ? 'Edit Timetable Slot' : 'Add Period Slot'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Map subject, faculty, period number, and time.
            </p>

            <form onSubmit={handleSaveTimetable} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day</label>
                  <select
                    value={timetableForm.day}
                    onChange={(e) => setTimetableForm({ ...timetableForm, day: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Period No.</label>
                  <select
                    value={timetableForm.periodNo}
                    onChange={(e) => setTimetableForm({ ...timetableForm, periodNo: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((p) => (
                      <option key={p} value={p}>
                        Period {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={timetableForm.subject}
                  onChange={(e) => setTimetableForm({ ...timetableForm, subject: e.target.value })}
                  placeholder="e.g. Financial Management"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={timetableForm.time}
                    onChange={(e) => setTimetableForm({ ...timetableForm, time: e.target.value })}
                    placeholder="e.g. 09:00 AM - 10:15 AM"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Classroom / Room</label>
                  <input
                    type="text"
                    value={timetableForm.room}
                    onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
                    placeholder="Lecture Hall 1"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Teacher</label>
                <select
                  value={timetableForm.teacherId}
                  onChange={(e) => setTimetableForm({ ...timetableForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Faculty Member</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>
                      {t.name} ({t.userId}) - {t.subject}
                    </option>
                  ))}
                  <option value="HOD01">Dr. Rajesh Sharma (HOD)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTimetableModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Save Timetable Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: UPLOAD / EDIT NOTE MATERIAL */}
      {/* ---------------------------------------------------- */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {isEditingNote ? 'Edit Notes Material' : 'Upload Lecture Notes'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Allowed file types ONLY: PPT/PPTX, PDF, XLS/XLSX, DOC/DOCX. Max size 20 MB.
            </p>

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              {/* File input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Document File (PPT/PPTX, PDF, XLS/XLSX, DOC/DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {fileError && (
                  <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fileError}
                  </p>
                )}
                {selectedFile && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note Title</label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="e.g. Module 1: Corporate Valuation & Working Capital"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={noteForm.subject}
                    onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                    placeholder="e.g. Financial Management"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Batch</label>
                  <select
                    value={noteForm.batchId}
                    onChange={(e) => setNoteForm({ ...noteForm, batchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">File Type</label>
                  <select
                    value={noteForm.fileType}
                    onChange={(e) => setNoteForm({ ...noteForm, fileType: e.target.value as NoteFileType })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="pptx">PowerPoint (.pptx)</option>
                    <option value="docx">Word Document (.docx)</option>
                    <option value="xlsx">Excel Spreadsheet (.xlsx)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">External File URL (Optional)</label>
                  <input
                    type="text"
                    value={noteForm.fileUrl}
                    onChange={(e) => setNoteForm({ ...noteForm, fileUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={noteForm.description}
                  onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                  placeholder="Topics covered, chapter references, key takeaways..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Upload Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 8: HOD PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-600 to-amber-700 text-white font-black text-2xl flex items-center justify-center shadow-lg ring-4 ring-amber-100 shrink-0">
                {currentUser?.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentUser?.name?.substring(0, 2).toUpperCase() || 'HD'}</span>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 rounded-md border border-amber-300">
                      Head of Department (Admin)
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{currentUser?.name}</h3>
                  </div>
                  {onOpenProfileModal && (
                    <button
                      onClick={onOpenProfileModal}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer self-center sm:self-start"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Update Profile</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Department Head & Academic Administrator • Full Authority
                </p>
                <p className="font-mono text-xs font-semibold text-blue-600 mt-0.5">
                  Admin User ID: {currentUser?.userId}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-medium">Department</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {currentUser?.department || 'Department of Management Studies'}
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-medium">Email Address</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {currentUser?.email || 'hod@mbanotes.app'}
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-medium">Phone Number</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {currentUser?.phone || '+91 98450 12345'}
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-medium">Office / Chamber</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {currentUser?.address || 'Dean Office, Management Block A'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
              {onOpenProfileModal && (
                <button
                  onClick={onOpenProfileModal}
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Update Profile Information</span>
                </button>
              )}
              {onOpenChangePassword && (
                <button
                  onClick={onOpenChangePassword}
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
              )}
            </div>
          </div>

          {/* Department Control Overview */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <h4 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Administrative Scope & Online Cloud Firestore Metrics</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xl font-black text-blue-400">{batches.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Batches</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xl font-black text-indigo-400">{students.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Students</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xl font-black text-purple-400">{teachers.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Faculty</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xl font-black text-emerald-400">{notes.length}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Notes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        onConfirm={deleteConfirm.onConfirm}
        onCancel={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Note Preview & Direct Download Modal */}
      <NotePreviewModal
        note={previewNote}
        onClose={() => setPreviewNote(null)}
      />
    </div>
  );
};
