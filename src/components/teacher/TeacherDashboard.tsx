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
  getUsers,
  getAssignments,
  saveAssignment,
  deleteAssignment,
  getSubmissions,
  saveSubmission,
  getTimetable,
  getNotes,
  saveNote,
  deleteNote,
} from '../../firebase/services';
import {
  FileText,
  FileCheck,
  CalendarDays,
  GraduationCap,
  User,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Presentation,
  FileSpreadsheet,
  BookOpen,
  FileQuestion,
  Filter,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import { ConfirmModal } from '../common/Toast';
import { downloadNoteFile } from '../../utils/fileDownloader';
import { NotePreviewModal } from '../common/NotePreviewModal';

interface TeacherDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onOpenProfileModal?: () => void;
  onOpenChangePassword?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  activeTab,
  setActiveTab,
  showToast,
  onOpenProfileModal,
  onOpenChangePassword,
}) => {
  const { currentUser } = useAuth();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [myTimetable, setMyTimetable] = useState<TimetableEntry[]>([]);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  // Filters
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('all');
  const [timetableDay, setTimetableDay] = useState<TimetableEntry['day']>('Monday');
  const [studentSearch, setStudentSearch] = useState('');

  // Modals
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState<Partial<Note>>({
    noteId: '',
    title: '',
    subject: currentUser?.subject || 'Marketing Management',
    batchId: '2025-27',
    fileType: 'pdf',
    fileUrl: '',
    fileSize: 2800000,
    description: '',
  });
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<Partial<Assignment>>({
    assignmentId: '',
    title: '',
    subject: currentUser?.subject || 'Marketing Management',
    batchId: '2025-27',
    description: '',
    givenDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);

  const [trackingAssignment, setTrackingAssignment] = useState<Assignment | null>(null);

  // Delete modal
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
      const allStudents = (uList || []).filter((u) => u.role === 'student');
      setStudents(allStudents);

      // Filter notes created by this teacher
      const filteredN = (nList || []).filter(
        (n) => n.uploadedBy === currentUser?.userId || n.uploadedByName?.includes(currentUser?.name || '')
      );
      setMyNotes(filteredN);

      // Filter assignments created by this teacher
      const filteredA = (aList || []).filter(
        (a) => a.createdBy === currentUser?.userId || a.createdByName?.includes(currentUser?.name || '')
      );
      setMyAssignments(filteredA);

      setSubmissions(sList || []);

      // Timetable for this teacher
      const filteredT = (tList || []).filter(
        (t) => t.teacherId === currentUser?.userId || t.teacherName?.includes(currentUser?.name || '')
      );
      setMyTimetable(filteredT);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to retrieve faculty dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.userId]);

  // Handle note upload & validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const allowed = ['pdf', 'pptx', 'ppt', 'docx', 'doc', 'xlsx', 'xls'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // RULE 1: Only PPT/PPTX, PDF, XLS/XLSX, DOC/DOCX
    if (!allowed.includes(ext)) {
      setFileError('Rejected! Only PDF, PPT/PPTX, DOC/DOCX, and XLS/XLSX are allowed.');
      setSelectedFile(null);
      return;
    }

    // RULE 2: Max file size: 20 MB
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError(`File exceeds 20 MB limit (Selected: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    let canonical: NoteFileType = 'pdf';
    if (ext.includes('ppt')) canonical = 'pptx';
    if (ext.includes('doc')) canonical = 'docx';
    if (ext.includes('xls')) canonical = 'xlsx';

    setNoteForm((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
      fileType: canonical,
      fileSize: file.size,
    }));
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title) {
      showToast('error', 'Title is required.');
      return;
    }

    try {
      const nId = noteForm.noteId || `NOTE-TCH-${Date.now().toString().slice(-6)}`;
      let downloadUrl = noteForm.fileUrl || '';
      if (selectedFile) {
        downloadUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(selectedFile);
        });
      }

      const note: Note = {
        noteId: nId,
        title: noteForm.title.trim(),
        subject: currentUser?.subject || noteForm.subject || 'Management Studies',
        batchId: noteForm.batchId || '2025-27',
        fileType: (noteForm.fileType as NoteFileType) || 'pdf',
        fileUrl: downloadUrl,
        fileSize: noteForm.fileSize || (selectedFile ? selectedFile.size : 2500000),
        uploadedBy: currentUser?.userId || 'TCH01',
        uploadedByName: currentUser?.name || 'Faculty Member',
        uploadDate: new Date().toISOString().split('T')[0],
        description: noteForm.description || '',
      };

      await saveNote(note);
      showToast('success', `Note "${note.title}" uploaded successfully!`);
      setShowNoteModal(false);
      setSelectedFile(null);
      await fetchData();
    } catch (err) {
      showToast('error', 'Failed to save note.');
    }
  };

  const handleDeleteNote = (note: Note) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Note Material?',
      message: `Are you sure you want to delete "${note.title}"?`,
      onConfirm: async () => {
        try {
          await deleteNote(note.noteId);
          showToast('success', 'Note removed.');
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));
          await fetchData();
        } catch (err) {
          showToast('error', 'Failed to delete note.');
        }
      },
    });
  };

  // Assignment actions
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.title) {
      showToast('error', 'Title is required.');
      return;
    }

    try {
      const aId = assignmentForm.assignmentId || `ASG-TCH-${Date.now().toString().slice(-5)}`;
      const newAsg: Assignment = {
        assignmentId: aId,
        title: assignmentForm.title.trim(),
        subject: currentUser?.subject || assignmentForm.subject || 'Management Studies',
        batchId: assignmentForm.batchId || '2025-27',
        description: assignmentForm.description || '',
        givenDate: assignmentForm.givenDate || new Date().toISOString().split('T')[0],
        dueDate: assignmentForm.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        createdBy: currentUser?.userId || 'TCH01',
        createdByName: currentUser?.name || 'Faculty Member',
        createdAt: new Date().toISOString(),
      };

      await saveAssignment(newAsg);
      showToast('success', `Assignment "${newAsg.title}" published!`);
      setShowAssignmentModal(false);
      await fetchData();
    } catch (err) {
      showToast('error', 'Failed to save assignment.');
    }
  };

  const handleDeleteAssignment = (asg: Assignment) => {
    setDeleteConfirm({
      isOpen: true,
      title: 'Delete Assignment?',
      message: `Delete "${asg.title}"?`,
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
      showToast('success', `Student submission marked as ${newStatus}.`);
      await fetchData();
    } catch (err) {
      showToast('error', 'Failed to update submission status.');
    }
  };

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

  const filteredTimetable = myTimetable.filter((t) => t.day === timetableDay);

  const filteredStudents = students.filter((s) => {
    const matchesBatch = selectedBatchFilter === 'all' || s.batchId === selectedBatchFilter;
    const matchesQuery =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.userId.toLowerCase().includes(studentSearch.toLowerCase());
    return matchesBatch && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 rounded-3xl p-6 text-white shadow-xl border border-purple-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-purple-400 text-purple-950 rounded-md">
              Faculty / Instructor Portal
            </span>
            <span className="text-xs text-purple-200">
              Specialization: {currentUser?.subject || 'MBA Department'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Welcome, {currentUser?.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Staff ID: <span className="font-mono font-bold text-purple-300">{currentUser?.userId}</span> • Upload course notes, create assignments, track submissions, and check your teaching schedule.
          </p>
        </div>

        {/* Quick Nav on Desktop */}
        <div className="hidden md:flex flex-wrap items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700">
          {[
            { id: 'overview', label: 'Overview', icon: CalendarDays },
            { id: 'notes', label: 'My Notes', icon: FileText },
            { id: 'assignments', label: 'Assignments', icon: FileCheck },
            { id: 'timetable', label: 'My Timetable', icon: CalendarDays },
            { id: 'students', label: 'Students', icon: GraduationCap },
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
                    ? 'bg-purple-600 text-white shadow-sm'
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">My Uploaded Notes</span>
              <p className="text-2xl font-black text-purple-600 mt-2">{myNotes.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Lecture docs & slides</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">My Assignments</span>
              <p className="text-2xl font-black text-blue-600 mt-2">{myAssignments.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Coursework posted</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Classes This Week</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{myTimetable.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Assigned period slots</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enrolled Scholars</span>
              <p className="text-2xl font-black text-amber-600 mt-2">{students.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Across all MBA batches</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Faculty Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setNoteForm({
                    noteId: '',
                    title: '',
                    subject: currentUser?.subject || 'Marketing Management',
                    batchId: batches[0]?.batchId || '2025-27',
                    fileType: 'pdf',
                    fileUrl: '',
                    fileSize: 2800000,
                    description: '',
                  });
                  setSelectedFile(null);
                  setFileError('');
                  setShowNoteModal(true);
                }}
                className="p-4 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition-all flex items-center gap-3.5 cursor-pointer"
              >
                <div className="p-3 bg-purple-600 text-white rounded-xl shadow-md">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-purple-950">Upload New Notes</p>
                  <p className="text-xs text-purple-700">Strict file check: PDF, PPT/PPTX, XLSX, DOC/DOCX (20MB)</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setAssignmentForm({
                    assignmentId: '',
                    title: '',
                    subject: currentUser?.subject || 'Marketing Management',
                    batchId: batches[0]?.batchId || '2025-27',
                    description: '',
                    givenDate: new Date().toISOString().split('T')[0],
                    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                  });
                  setShowAssignmentModal(true);
                }}
                className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-left transition-all flex items-center gap-3.5 cursor-pointer"
              >
                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-blue-950">Post New Assignment</p>
                  <p className="text-xs text-blue-700">Assign case studies and grade student submissions</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">My Lecture Notes & Materials</h3>
              <p className="text-xs text-slate-500">
                Upload, edit, or delete notes for your subject. Allowed formats: PPT/PPTX, PDF, XLS/XLSX, DOC/DOCX (Max 20 MB).
              </p>
            </div>
            <button
              onClick={() => {
                setNoteForm({
                  noteId: '',
                  title: '',
                  subject: currentUser?.subject || 'Marketing Management',
                  batchId: batches[0]?.batchId || '2025-27',
                  fileType: 'pdf',
                  fileUrl: '',
                  fileSize: 2800000,
                  description: '',
                });
                setSelectedFile(null);
                setFileError('');
                setIsEditingNote(false);
                setShowNoteModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Notes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myNotes.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No notes uploaded yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Upload lecture slides and reading material for your students.</p>
              </div>
            ) : (
              myNotes.map((note) => (
                <div
                  key={note.noteId}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        {renderFileIcon(note.fileType)}
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {note.fileType}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{note.title}</h4>
                    <p className="text-xs text-purple-700 font-semibold mt-0.5">{note.subject}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{note.description || 'No description provided.'}</p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Batch:</span>
                        <span className="font-bold text-slate-800">{note.batchId}</span>
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
                        className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                        title="Download file directly"
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
                        className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-slate-100 rounded-lg"
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
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Assignments & Evaluation</h3>
              <p className="text-xs text-slate-500">
                Create assignments and mark student submissions with status (Submitted / Pending / Late) and submitted date.
              </p>
            </div>
            <button
              onClick={() => {
                setAssignmentForm({
                  assignmentId: '',
                  title: '',
                  subject: currentUser?.subject || 'Marketing Management',
                  batchId: batches[0]?.batchId || '2025-27',
                  description: '',
                  givenDate: new Date().toISOString().split('T')[0],
                  dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
                });
                setIsEditingAssignment(false);
                setShowAssignmentModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAssignments.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No assignments posted yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Post a coursework assignment to track student submissions.</p>
              </div>
            ) : (
              myAssignments.map((a) => {
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
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-800">
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
                            <Clock className="w-3.5 h-3.5 text-blue-500" /> Given:
                          </span>
                          <span className="font-medium text-slate-800">{a.givenDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Due:
                          </span>
                          <span className="font-bold text-rose-600">{a.dueDate}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                          <span className="text-slate-500">Status:</span>
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
                        className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Mark Submissions</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setAssignmentForm(a);
                            setIsEditingAssignment(true);
                            setShowAssignmentModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-slate-100 rounded-lg"
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
              })
            )}
          </div>
        </div>
      )}

      {/* SUBMISSION MARKING MODAL FOR TEACHER */}
      {trackingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-purple-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Mark Student Submissions</h3>
                <p className="text-xs text-purple-300 mt-0.5">{trackingAssignment.title} (Batch: {trackingAssignment.batchId})</p>
              </div>
              <button
                onClick={() => setTrackingAssignment(null)}
                className="text-purple-300 hover:text-white p-1"
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
                          <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            {student.userId}
                          </span>
                        </div>
                        {existingSub?.submittedDate && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Submitted Date: <span className="font-semibold text-slate-700">{existingSub.submittedDate}</span>
                          </p>
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
                          Mark Submitted
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
                          Mark Late
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

      {/* TAB 4: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">My Teaching Schedule</h3>
            <p className="text-xs text-slate-500">
              Timetable slots assigned to you by the HOD department administrator.
            </p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1 overflow-x-auto">
            {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as TimetableEntry['day'][]).map(
              (day) => (
                <button
                  key={day}
                  onClick={() => setTimetableDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    timetableDay === day
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              )
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                {timetableDay} Lectures
              </h4>
              <span className="text-xs text-slate-500">{filteredTimetable.length} Slots</span>
            </div>

            {filteredTimetable.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No assigned lectures for {timetableDay}.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTimetable.map((slot) => (
                  <div key={slot.timetableId} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <span className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center">
                        P{slot.periodNo}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{slot.subject}</h4>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Batch {slot.batchId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ⏰ {slot.time} • Room: {slot.room || 'Lecture Hall 1'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STUDENTS DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Enrolled Students</h3>
            <p className="text-xs text-slate-500">
              Browse student roll numbers, batch allocations, and directory info.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search by student name or roll number..."
              className="w-full sm:flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500">Batch:</span>
              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
              >
                <option value="all">All Batches</option>
                {batches.map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStudents.map((st) => (
              <div key={st.userId} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  {st.name.substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{st.name}</h4>
                  <p className="font-mono text-[10px] text-blue-700 font-bold">{st.userId} • Batch {st.batchId}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{st.phone || 'Phone: N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-xl mx-auto bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md ring-4 ring-purple-100 shrink-0">
              {currentUser?.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser?.name.substring(0, 2).toUpperCase() || 'TC'}</span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{currentUser?.name}</h3>
                  <p className="text-xs text-purple-700 font-bold">{currentUser?.subject}</p>
                </div>
                {onOpenProfileModal && (
                  <button
                    onClick={onOpenProfileModal}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer self-center sm:self-start"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Update Profile</span>
                  </button>
                )}
              </div>
              <p className="font-mono text-xs text-slate-500 mt-1">Staff ID: {currentUser?.userId}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-100">
            <p className="flex justify-between">
              <span className="text-slate-400">Department:</span>
              <span className="font-bold text-slate-800">{currentUser?.department || 'Department of Management Studies'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Specialization:</span>
              <span className="font-bold text-purple-700">{currentUser?.subject || 'Management'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="font-bold text-slate-800">{currentUser?.email}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Phone:</span>
              <span className="font-bold text-slate-800">{currentUser?.phone || '+91 98200 45678'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Role:</span>
              <span className="font-bold text-purple-700 uppercase">Faculty Member</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            {onOpenProfileModal && (
              <button
                onClick={onOpenProfileModal}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Update Profile Details</span>
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
      )}

      {/* MODAL: UPLOAD NOTE */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Upload Course Material</h3>
            <p className="text-xs text-slate-500 mb-4">
              Allowed file types ONLY: PPT/PPTX, PDF, XLS/XLSX, DOC/DOCX. Max 20 MB.
            </p>

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select File</label>
                <input
                  type="file"
                  accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {fileError && <p className="text-xs text-rose-600 font-bold mt-1">{fileError}</p>}
                {selectedFile && <p className="text-xs text-emerald-600 font-semibold mt-1">Ready: {selectedFile.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="e.g. Chapter 4: Case Discussion Notes"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch</label>
                  <select
                    value={noteForm.batchId}
                    onChange={(e) => setNoteForm({ ...noteForm, batchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">File Type</label>
                  <select
                    value={noteForm.fileType}
                    onChange={(e) => setNoteForm({ ...noteForm, fileType: e.target.value as NoteFileType })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="pdf">PDF</option>
                    <option value="pptx">PowerPoint (.pptx)</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={noteForm.description}
                  onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                  placeholder="Optional brief notes..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
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
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md"
                >
                  Upload Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ASSIGNMENT */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Post Assignment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Create student assignment for your subject.
            </p>

            <form onSubmit={handleSaveAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="e.g. Market Research Survey Analysis"
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch</label>
                  <select
                    value={assignmentForm.batchId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, batchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="Task instructions..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
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
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
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
