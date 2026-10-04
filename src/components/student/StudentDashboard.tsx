import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Assignment,
  Submission,
  TimetableEntry,
  Note,
  NoteFileType,
  SubmissionStatus,
} from '../../types';
import {
  getAssignments,
  getSubmissions,
  getTimetable,
  getNotes,
  saveSubmission,
} from '../../firebase/services';
import {
  FileText,
  FileCheck,
  CalendarDays,
  User,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  Presentation,
  FileSpreadsheet,
  BookOpen,
  FileQuestion,
  Search,
  Upload,
  CheckCircle2,
  Sparkles,
  Eye,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import { downloadNoteFile } from '../../utils/fileDownloader';
import { NotePreviewModal } from '../common/NotePreviewModal';

interface StudentDashboardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onOpenChangePassword: () => void;
  onOpenProfileModal?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  activeTab,
  setActiveTab,
  showToast,
  onOpenChangePassword,
  onOpenProfileModal,
}) => {
  const { currentUser } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  // Filters
  const [notesSearch, setNotesSearch] = useState('');
  const [notesSubjectFilter, setNotesSubjectFilter] = useState('all');
  const [notesTypeFilter, setNotesTypeFilter] = useState('all');
  const [timetableDay, setTimetableDay] = useState<TimetableEntry['day']>('Monday');

  // Submit Assignment Modal
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionRemarks, setSubmissionRemarks] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const studentBatch = currentUser?.batchId || '2025-27';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aList, sList, tList, nList] = await Promise.all([
        getAssignments(),
        getSubmissions(),
        getTimetable(),
        getNotes(),
      ]);

      // Filter notes strictly for student's batch or "All"
      const batchNotes = (nList || []).filter(
        (n) => n.batchId === studentBatch || n.batchId === 'All'
      );
      setNotes(batchNotes);

      // Filter assignments for student's batch
      const batchAssignments = (aList || []).filter(
        (a) => a.batchId === studentBatch || a.batchId === 'All'
      );
      setAssignments(batchAssignments);

      // Filter submissions for this student
      const studentSubs = (sList || []).filter(
        (s) => s.studentId === currentUser?.userId
      );
      setSubmissions(studentSubs);

      // Filter timetable for this batch
      const batchTimetable = (tList || []).filter(
        (t) => t.batchId === studentBatch
      );
      setTimetable(batchTimetable);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load student curriculum data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.userId, studentBatch]);

  // Handle student submitting assignment
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment || !currentUser) return;

    setSubmitLoading(true);
    try {
      const subId = `SUB-${submittingAssignment.assignmentId}-${currentUser.userId}`;
      const today = new Date().toISOString().split('T')[0];
      const isLate = today > submittingAssignment.dueDate;
      const status: SubmissionStatus = isLate ? 'Late' : 'Submitted';

      let submissionFileUrl: string | undefined = undefined;
      if (submissionFile) {
        submissionFileUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(submissionFile);
        });
      }

      const newSubmission: Submission = {
        submissionId: subId,
        assignmentId: submittingAssignment.assignmentId,
        studentId: currentUser.userId,
        studentName: currentUser.name,
        batchId: studentBatch,
        submittedDate: today,
        status,
        remarks: submissionRemarks.trim() || 'Assignment submission uploaded via student portal.',
        fileUrl: submissionFileUrl || undefined,
        updatedAt: new Date().toISOString(),
      };

      await saveSubmission(newSubmission);
      showToast('success', `Assignment submitted as ${status}!`);
      setSubmittingAssignment(null);
      setSubmissionRemarks('');
      setSubmissionFile(null);
      await fetchData();
    } catch (err) {
      showToast('error', 'Failed to submit assignment.');
    } finally {
      setSubmitLoading(false);
    }
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

  // Filters for notes
  const uniqueSubjects = Array.from(new Set(notes.map((n) => n.subject)));
  const filteredNotes = notes.filter((n) => {
    const matchesSubject = notesSubjectFilter === 'all' || n.subject === notesSubjectFilter;
    const matchesType = notesTypeFilter === 'all' || n.fileType === notesTypeFilter;
    const matchesQuery =
      n.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
      n.subject.toLowerCase().includes(notesSearch.toLowerCase()) ||
      (n.description && n.description.toLowerCase().includes(notesSearch.toLowerCase()));
    return matchesSubject && matchesType && matchesQuery;
  });

  const filteredTimetable = timetable.filter((t) => t.day === timetableDay);

  // Statistics
  const totalNotes = notes.length;
  const totalAssignments = assignments.length;
  const submittedCount = submissions.filter((s) => s.status === 'Submitted' || s.status === 'Late').length;
  const pendingCount = totalAssignments - submittedCount;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl border border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white rounded-md">
              MBA Student Portal
            </span>
            <span className="text-xs text-blue-200">
              Batch: <span className="font-bold">{studentBatch}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Welcome, {currentUser?.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Roll No: <span className="font-mono font-bold text-blue-300">{currentUser?.userId}</span> • Access official lecture notes, coursework assignments, and period timetable.
          </p>
        </div>

        {/* Quick Nav on Desktop */}
        <div className="hidden md:flex flex-wrap items-center gap-1.5 p-1 bg-slate-800/80 rounded-2xl border border-slate-700">
          {[
            { id: 'overview', label: 'Dashboard', icon: CalendarDays },
            { id: 'notes', label: 'Notes Material', icon: FileText },
            { id: 'assignments', label: 'Assignments', icon: FileCheck },
            { id: 'timetable', label: 'My Timetable', icon: CalendarDays },
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Notes</span>
              <p className="text-2xl font-black text-blue-600 mt-2">{totalNotes}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PDF, PPTX, XLSX, DOCX</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Tasks</span>
              <p className="text-2xl font-black text-amber-600 mt-2">{pendingCount > 0 ? pendingCount : 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Due assignments</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{submittedCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Turned-in work</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Periods / Day</span>
              <p className="text-2xl font-black text-indigo-600 mt-2">5</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Scheduled daily</p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setActiveTab('notes')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                  Browse Notes →
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900">Download Lecture Notes</h4>
              <p className="text-xs text-slate-500 mt-1">
                Access faculty presentations, case studies, formula sheets, and study materials.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('timetable')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                  View Schedule →
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900">Check Period Timetable</h4>
              <p className="text-xs text-slate-500 mt-1">
                View your daily timetable, classroom allocations, and faculty lecture timings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NOTES REPOSITORY (READ ONLY) */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Batch {studentBatch} Lecture Notes</h3>
            <p className="text-xs text-slate-500">
              Download and study faculty approved course presentations and reading materials.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={notesSearch}
                onChange={(e) => setNotesSearch(e.target.value)}
                placeholder="Search notes by title, topic, or keyword..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={notesSubjectFilter}
                onChange={(e) => setNotesSubjectFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
              >
                <option value="all">All Subjects</option>
                {uniqueSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={notesTypeFilter}
                onChange={(e) => setNotesTypeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF Docs</option>
                <option value="pptx">PowerPoint</option>
                <option value="docx">Word Docs</option>
                <option value="xlsx">Excel Sheets</option>
              </select>
            </div>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No notes found for current selection.</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.noteId}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        {renderFileIcon(note.fileType)}
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {note.fileType}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{note.title}</h4>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">{note.subject}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{note.description || 'Official lecture material.'}</p>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Faculty:</span>
                        <span className="font-medium text-slate-800">{note.uploadedByName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Uploaded Date:</span>
                        <span className="font-medium text-slate-800">{note.uploadDate}</span>
                      </div>
                      {note.fileSize && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">File Size:</span>
                          <span className="font-mono text-slate-700">{(note.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Batch {note.batchId}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewNote(note)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Preview lecture material outline"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadNoteFile(note)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Download directly to your device"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS & SUBMISSION LIST */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Course Assignments</h3>
            <p className="text-xs text-slate-500">
              View assignment tasks, due dates, submission dates, and grading status (Submitted / Pending / Late).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No active assignments for Batch {studentBatch}.</p>
              </div>
            ) : (
              assignments.map((asg) => {
                const sub = submissions.find((s) => s.assignmentId === asg.assignmentId);
                const status: SubmissionStatus = sub?.status || 'Pending';

                return (
                  <div
                    key={asg.assignmentId}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800">
                          {asg.subject}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            status === 'Submitted'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : status === 'Late'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{asg.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-3">{asg.description}</p>

                      <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-blue-500" /> Given Date:
                          </span>
                          <span className="font-medium text-slate-800">{asg.givenDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-500">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Due Date:
                          </span>
                          <span className="font-bold text-rose-600">{asg.dueDate}</span>
                        </div>
                        {sub?.submittedDate && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-emerald-700 font-semibold">
                            <span>Submitted On:</span>
                            <span>{sub.submittedDate}</span>
                          </div>
                        )}
                        {sub?.remarks && (
                          <div className="pt-1 text-[11px] text-slate-500 italic">
                            Faculty remarks: "{sub.remarks}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">By {asg.createdByName}</span>
                      <button
                        onClick={() => {
                          setSubmittingAssignment(asg);
                          setSubmissionRemarks(sub?.remarks || '');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          status === 'Submitted'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs active:scale-95'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{status === 'Submitted' ? 'Update Submission' : 'Submit Assignment'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PERIOD TIME TABLE */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Period Time Table (Batch {studentBatch})</h3>
            <p className="text-xs text-slate-500">
              Daily and weekly class schedule with period timings and assigned faculty.
            </p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1 overflow-x-auto">
            {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as TimetableEntry['day'][]).map(
              (day) => (
                <button
                  key={day}
                  onClick={() => setTimetableDay(day)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                {timetableDay} Schedule
              </h4>
              <span className="text-xs text-slate-500 font-semibold">{filteredTimetable.length} Periods</span>
            </div>

            {filteredTimetable.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No classes scheduled for {timetableDay}.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTimetable
                  .sort((a, b) => a.periodNo - b.periodNo)
                  .map((slot) => (
                    <div key={slot.timetableId} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                          P{slot.periodNo}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{slot.subject}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ⏰ {slot.time} • Instructor: <span className="font-medium text-slate-700">{slot.teacherName}</span>
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {slot.room || 'Lecture Hall 1'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT PROFILE */}
      {activeTab === 'profile' && (
        <div className="max-w-xl mx-auto bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md ring-4 ring-blue-100 shrink-0">
              {currentUser?.photoUrl ? (
                <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser?.name?.substring(0, 2).toUpperCase() || 'ST'}</span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{currentUser?.name}</h3>
                  <p className="font-mono text-xs font-bold text-blue-700">Roll No: {currentUser?.userId}</p>
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
              <p className="text-xs text-slate-500 mt-1">Enrolled in MBA Batch {currentUser?.batchId}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-100">
            <p className="flex justify-between">
              <span className="text-slate-400">Department:</span>
              <span className="font-bold text-slate-800">{currentUser?.department || 'Department of Management Studies'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Academic Batch:</span>
              <span className="font-bold text-blue-700">Batch {currentUser?.batchId}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="font-bold text-slate-800">{currentUser?.email}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Phone:</span>
              <span className="font-bold text-slate-800">{currentUser?.phone || '+91 98111 22334'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Campus Address:</span>
              <span className="font-bold text-slate-800">{currentUser?.address || 'Hostel Campus'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400">Default Password:</span>
              <span className="font-mono font-bold text-amber-700">Roll No ({currentUser?.userId})</span>
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
            <button
              onClick={onOpenChangePassword}
              className="w-full sm:w-auto flex-1 py-2.5 px-4 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT ASSIGNMENT */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Submit Coursework: {submittingAssignment.title}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Due Date: <span className="font-bold text-rose-600">{submittingAssignment.dueDate}</span>
            </p>

            <form onSubmit={handleSubmitAssignment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Upload Response File (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Comments for Faculty</label>
                <textarea
                  value={submissionRemarks}
                  onChange={(e) => setSubmissionRemarks(e.target.value)}
                  placeholder="Notes about your case study response, model assumptions..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-60"
                >
                  {submitLoading ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Preview & Direct Device Download Modal */}
      <NotePreviewModal
        note={previewNote}
        onClose={() => setPreviewNote(null)}
      />
    </div>
  );
};
