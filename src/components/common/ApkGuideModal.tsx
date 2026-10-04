import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Copy,
  Check,
  Terminal,
  FileCode,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ApkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkGuideModal: React.FC<ApkGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa' | 'firebase' | 'architecture'>('apk');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const capacitorCommands = `# 1. Install Capacitor in your project directory
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "MBA Notes" com.mbanotes.department --web-dir dist

# 2. Build the optimized production bundle
npm run build

# 3. Add Android platform and copy assets
npx cap add android
npx cap copy android

# 4. Open in Android Studio & Generate Signed or Debug APK
npx cap open android
# (In Android Studio: Build -> Build Bundle(s) / APK(s) -> Build APK(s))
# The generated APK will be in:
# android/app/build/outputs/apk/debug/app-debug.apk`;

  const flutterConfig = `# Flutter Alternative Architecture:
# lib/
#   ├── models/ (batch.dart, user_profile.dart, note.dart, assignment.dart)
#   ├── services/ (firebase_auth_service.dart, firestore_service.dart)
#   ├── views/
#   │    ├── hod/ (batch_screen.dart, student_screen.dart, notes_screen.dart)
#   │    ├── teacher/ (teacher_notes.dart, assignment_grading.dart)
#   │    └── student/ (student_notes.dart, timetable_view.dart)
#   └── main.dart

# Build APK command in Flutter:
flutter build apk --release --split-per-abi`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                MBA Notes • Mobile APK & Deployment Guide
              </h2>
              <p className="text-xs text-slate-400">
                Turn-key instructions to build Android APK, iOS App, and manage Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('apk')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'apk'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Generate Android APK</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Mobile Install (PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'firebase'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Firebase & Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture & Scaling</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-slate-800 text-sm">
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
                <p className="font-bold text-sm mb-1 text-blue-950">
                  📦 1-Click Android APK Build with Capacitor
                </p>
                <p className="leading-relaxed">
                  Because this app is built with modern mobile-first web technologies (React 19 + Tailwind + Firebase Cloud Firestore), you can bundle it into a native Android APK in under 2 minutes using standard Capacitor.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-blue-600" />
                    Terminal Build Commands
                  </span>
                  <button
                    onClick={() => handleCopy(capacitorCommands, 1)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIndex === 1 ? 'Copied!' : 'Copy commands'}
                  </button>
                </div>
                <pre className="bg-slate-950 text-slate-200 font-mono text-xs p-3.5 rounded-xl overflow-x-auto leading-relaxed border border-slate-800">
                  {capacitorCommands}
                </pre>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Flutter Codebase Equivalent Reference
                </h4>
                <p className="text-xs text-slate-600 mb-2">
                  If your department requires a raw Flutter repository, the exact data contracts and Firestore structure mapped here are 100% compatible with Flutter’s <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">cloud_firestore</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">firebase_auth</code> plugins:
                </p>
                <pre className="bg-slate-900 text-slate-300 font-mono text-xs p-3 rounded-xl overflow-x-auto">
                  {flutterConfig}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950">
                <p className="font-bold text-sm mb-1 text-emerald-900">
                  📲 Instant Mobile Installation (No Store Approval Required)
                </p>
                <p className="leading-relaxed">
                  Students and faculty can immediately install "MBA Notes" on their phones directly from Chrome (Android) or Safari (iOS). It opens with full-screen native standalone windowing, offline caching, and bottom nav.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase">
                    🤖 On Android (Chrome)
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                    <li>Open this URL in Google Chrome</li>
                    <li>Tap the <strong>three-dots menu</strong> (top right)</li>
                    <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                    <li>Launch "MBA Notes" icon directly from your home screen launcher</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase">
                    🍎 On iPhone / iPad (Safari)
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
                    <li>Open this URL in Safari</li>
                    <li>Tap the <strong>Share</strong> button (square with arrow)</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Confirm <strong>Add</strong> to use the app in native full-screen mode</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Live Provisioned Firebase Backend
                </h4>
                <p className="text-slate-600">
                  This deployment is fully linked to Google Cloud Firestore with zero mock data. All operations persist directly to online cloud collections:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li><code className="font-bold text-blue-700">/users</code>: Accounts for HOD, Teachers, and Students with default password hashes</li>
                  <li><code className="font-bold text-blue-700">/batches</code>: MBA Batches (e.g. 2025-27) with auto-generated student count</li>
                  <li><code className="font-bold text-blue-700">/assignments</code>: Academic tasks, subjects, due dates, created by faculty/HOD</li>
                  <li><code className="font-bold text-blue-700">/submissions</code>: Student assignment progress (Submitted, Pending, Late)</li>
                  <li><code className="font-bold text-blue-700">/timetable</code>: Class schedule mapped by batch, day (Mon-Sat), period, teacher</li>
                  <li><code className="font-bold text-blue-700">/notes</code>: Online material repository supporting PDF, PPTX, XLSX, DOCX with 20MB guard</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-2">
                <h4 className="font-bold text-blue-900">
                  🛡️ Deployed Security Rules (ABAC Fortress)
                </h4>
                <p className="text-blue-800">
                  Firestore rules have been compiled and deployed directly to Firebase via Google Cloud RPC. They enforce:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-900">
                  <li><strong>HOD</strong> has full Add / Edit / Delete access across all collections</li>
                  <li><strong>Teachers</strong> can only manage notes and assignments created by themselves</li>
                  <li><strong>Students</strong> are strictly Read-Only and restricted to their own batch</li>
                  <li>File types are validated at rule level (<code className="bg-blue-100 px-1 py-0.5 rounded">pdf, pptx, docx, xlsx</code>)</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  Key Implementation Highlights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900">Single Login Formula</p>
                    <p className="text-slate-600 mt-1">
                      User ID = Password by default. Student IDs conform to Roll No format (e.g. <span className="font-mono font-bold">25MBA01</span>). Teacher IDs follow staff codes (<span className="font-mono font-bold">TCH01</span>).
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900">Batch Auto-Generator</p>
                    <p className="text-slate-600 mt-1">
                      HOD can input Batch Year and Student Count; the system instantaneously mints unique student records from 25MBA01 to 25MBAxx in Firestore.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900">Strict Note Upload Guards</p>
                    <p className="text-slate-600 mt-1">
                      Enforces MIME & extension checks for PPTX, PDF, XLSX, and DOCX up to 20 MB. Rejects unsupported formats with descriptive feedback.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900">Live Submission Tracking</p>
                    <p className="text-slate-600 mt-1">
                      Faculty and HOD can mark submissions with date, status (Submitted, Pending, Late), and remarks with automated submission statistics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            MBA Notes • Version 1.0 Production
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
