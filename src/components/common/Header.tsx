import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogOut, KeyRound, UserCheck } from 'lucide-react';
import { DeviceFrameToggle } from './DeviceFrameToggle';

interface HeaderProps {
  isMobileFrame: boolean;
  onToggleFrame: (val: boolean) => void;
  onOpenPasswordModal: () => void;
  onOpenProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isMobileFrame,
  onToggleFrame,
  onOpenPasswordModal,
  onOpenProfileModal,
}) => {
  const { currentUser, role, logout } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case 'hod':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            HOD Admin
          </span>
        );
      case 'teacher':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-purple-100 text-purple-800 border border-purple-300">
            Faculty / Teacher
          </span>
        );
      case 'student':
        return (
          <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-800 border border-blue-300">
            MBA Student
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white ring-2 ring-blue-400/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                MBA Notes
              </h1>
              {getRoleBadge()}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              Department of Management Studies • Cloud Academic Portal
            </p>
          </div>
        </div>

        {/* Center / Right: Action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Frame switcher toggle */}
          <div className="hidden md:block">
            <DeviceFrameToggle
              isMobileFrame={isMobileFrame}
              onToggle={onToggleFrame}
            />
          </div>

          {/* Edit Profile button */}
          <button
            onClick={onOpenProfileModal}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            title="Update Your Profile Information"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Profile</span>
          </button>

          {/* Change password button */}
          <button
            onClick={onOpenPasswordModal}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            title="Change Account Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Password</span>
          </button>

          {/* Current user chip */}
          {currentUser && (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-800 text-left hover:opacity-80 transition-opacity cursor-pointer group"
              title="Click to edit your profile"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 ring-1 ring-slate-600 shrink-0 group-hover:ring-blue-400 transition-all">
                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-blue-300">
                    {currentUser.userId.substring(0, 2)}
                  </div>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-100 leading-tight truncate max-w-[130px] group-hover:text-blue-300">
                  {currentUser.name}
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  {currentUser.userId}
                </p>
              </div>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-lg transition-all flex items-center gap-1.5"
            title="Sign out of MBA Notes"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
