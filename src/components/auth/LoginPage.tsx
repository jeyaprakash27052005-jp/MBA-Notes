import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  GraduationCap,
  KeyRound,
  User,
  Shield,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  LogIn,
} from 'lucide-react';

interface LoginPageProps {
  onOpenApkGuide: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenApkGuide }) => {
  const { login, loginWithGoogle } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    // Auto-fill default ID suggestion for convenience
    if (role === 'student' && !userId) setUserId('25MBA01');
    if (role === 'teacher' && !userId) setUserId('TCH01');
    if (role === 'hod' && !userId) setUserId('HOD01');
  };

  const handleQuickFill = (role: UserRole, id: string) => {
    setSelectedRole(role);
    setUserId(id);
    setPassword(id);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(userId, password, selectedRole);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (!res.success) {
      setError(res.error || 'Google sign-in could not be completed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-between text-slate-100 p-4 sm:p-6">
      {/* Top Banner & APK Guide Link */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black tracking-tight text-white text-base">MBA Notes</span>
            <span className="hidden sm:inline text-xs text-slate-400 ml-2">Department Academic Portal</span>
          </div>
        </div>

        <button
          onClick={onOpenApkGuide}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-blue-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>APK & Deploy Guide</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-6 bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 text-slate-900 animate-in fade-in duration-300">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 ring-4 ring-blue-100">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            MBA Department Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your notes, assignments, timetable, and batch records
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                selectedRole === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🎓 Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('teacher')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                selectedRole === 'teacher'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👨‍🏫 Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('hod')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                selectedRole === 'hod'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏛️ HOD</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Credentials */}
        <div className="mb-5 p-3 rounded-2xl bg-blue-50/80 border border-blue-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              1-Click Demo Login
            </span>
            <span className="text-[10px] text-blue-600 font-medium">Password = User ID</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('student', '25MBA01')}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors shadow-2xs"
            >
              Student: <span className="font-mono font-bold">25MBA01</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('teacher', 'TCH01')}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors shadow-2xs"
            >
              Teacher: <span className="font-mono font-bold">TCH01</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('hod', 'HOD01')}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors shadow-2xs"
            >
              HOD Admin: <span className="font-mono font-bold">HOD01</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {selectedRole === 'student'
                ? 'Student Roll Number (User ID)'
                : selectedRole === 'teacher'
                ? 'Teacher Staff ID (User ID)'
                : 'HOD User ID'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value.toUpperCase())}
                placeholder={
                  selectedRole === 'student'
                    ? 'e.g. 25MBA01'
                    : selectedRole === 'teacher'
                    ? 'e.g. TCH01'
                    : 'e.g. HOD01'
                }
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono font-semibold tracking-wide text-slate-900"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {selectedRole === 'student' && 'Format: Batch Year (YY) + MBA + Number (e.g. 25MBA01)'}
              {selectedRole === 'teacher' && 'Format: TCH + Number (e.g. TCH01 to TCH04)'}
              {selectedRole === 'hod' && 'Main administrator login (e.g. HOD01)'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (default = User ID)"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember login (stay signed in)</span>
            </label>
            <span className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer" onClick={() => setPassword(userId)}>
              Default: ID = Pass
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block animate-spin mr-1">⌛</span>
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>Sign In to {selectedRole.toUpperCase()} Dashboard</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </form>

        {/* Google Sign In option */}
        <div className="mt-5 pt-5 border-t border-slate-200">
          <p className="text-[11px] text-center text-slate-400 mb-3">Or sign in with Google Workspace</p>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Signing in...' : 'Sign in with Google Account'}</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-md mx-auto text-center text-xs text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Connected to Google Cloud Firestore (Live Online Cloud Database)</span>
        </p>
        <p className="text-[11px] text-slate-500">
          MBA Notes © 2026 • Designed for Department of Management Studies
        </p>
      </div>
    </div>
  );
};
