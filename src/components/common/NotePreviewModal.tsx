import React from 'react';
import { Note, NoteFileType } from '../../types';
import { downloadNoteFile } from '../../utils/fileDownloader';
import {
  FileText,
  Presentation,
  FileSpreadsheet,
  BookOpen,
  FileQuestion,
  Download,
  X,
  User,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface NotePreviewModalProps {
  note: Note | null;
  onClose: () => void;
}

export const NotePreviewModal: React.FC<NotePreviewModalProps> = ({
  note,
  onClose,
}) => {
  if (!note) return null;

  const renderIcon = (type: NoteFileType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-rose-600" />;
      case 'pptx':
        return <Presentation className="w-8 h-8 text-amber-600" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
      case 'docx':
        return <BookOpen className="w-8 h-8 text-blue-600" />;
      default:
        return <FileQuestion className="w-8 h-8 text-slate-500" />;
    }
  };

  const handleDownload = () => {
    downloadNoteFile(note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
              {renderIcon(note.fileType)}
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-600 text-white">
                {note.fileType} Document
              </span>
              <h3 className="font-bold text-base text-white mt-1 leading-snug">
                {note.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-800 text-xs">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-slate-400 font-medium">Course Subject</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{note.subject}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-slate-400 font-medium">Target MBA Batch</span>
              <p className="font-bold text-blue-700 text-sm mt-0.5">Batch {note.batchId}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-slate-400 font-medium">Faculty Instructor</span>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {note.uploadedByName}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-slate-400 font-medium">Uploaded Date</span>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {note.uploadDate}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Lecture & Material Overview</h4>
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-slate-700 leading-relaxed">
              {note.description || 'Official lecture material approved for MBA coursework.'}
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verified department syllabus file • Direct device download ready</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Note File (.{note.fileType})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
