import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { HodDashboard } from './components/hod/HodDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { ProfileEditModal } from './components/common/ProfileEditModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { GraduationCap, Wifi, Battery, Signal } from 'lucide-react';

function MainApp() {
  const { currentUser, role, loading } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Frame simulation toggle (Mobile App vs Full Web)
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center mb-4 shadow-xl shadow-blue-500/25 animate-pulse">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white">MBA Notes</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to Cloud Firestore...</p>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!currentUser || !role) {
    return (
      <>
        <LoginPage />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  // Dashboard content renderer
  const renderDashboard = () => {
    switch (role) {
      case 'hod':
        return (
          <HodDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showToast={showToast}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onOpenChangePassword={() => setShowPasswordModal(true)}
          />
        );
      case 'teacher':
        return (
          <TeacherDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showToast={showToast}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onOpenChangePassword={() => setShowPasswordModal(true)}
          />
        );
      case 'student':
        return (
          <StudentDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            showToast={showToast}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onOpenChangePassword={() => setShowPasswordModal(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${isMobileFrame ? 'bg-slate-900 py-6 px-2 flex justify-center items-center' : 'bg-slate-50'}`}>
      {/* If Mobile Frame mode is enabled on desktop */}
      {isMobileFrame ? (
        <div className="w-full max-w-[420px] h-[880px] bg-slate-950 rounded-[48px] shadow-2xl ring-8 ring-slate-800 border-4 border-slate-700/80 flex flex-col overflow-hidden relative">
          {/* Smartphone Hardware Notch & Status Bar */}
          <div className="bg-slate-900 text-white px-6 pt-3 pb-1.5 flex items-center justify-between text-[11px] font-bold select-none shrink-0 z-50">
            <span>09:41</span>
            <div className="w-20 h-4 bg-black rounded-full mx-auto" />
            <div className="flex items-center gap-1.5 text-slate-300">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* App Header */}
          <Header
            isMobileFrame={isMobileFrame}
            onToggleFrame={setIsMobileFrame}
            onOpenPasswordModal={() => setShowPasswordModal(true)}
            onOpenProfileModal={() => setShowProfileModal(true)}
          />

          {/* Scrollable Mobile Body */}
          <main className="flex-1 overflow-y-auto p-3.5 bg-slate-50">
            {renderDashboard()}
          </main>

          {/* Mobile Bottom Navigation */}
          <BottomNav
            role={role}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Smartphone Home Indicator Bar */}
          <div className="w-32 h-1 bg-slate-400 rounded-full mx-auto mb-1.5 shrink-0" />
        </div>
      ) : (
        /* Full Screen Web View */
        <div className="min-h-screen flex flex-col">
          <Header
            isMobileFrame={isMobileFrame}
            onToggleFrame={setIsMobileFrame}
            onOpenPasswordModal={() => setShowPasswordModal(true)}
            onOpenProfileModal={() => setShowProfileModal(true)}
          />

          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
            {renderDashboard()}
          </main>

          {/* Bottom Nav for mobile screens in responsive mode */}
          <BottomNav
            role={role}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        isFirstLoginPrompt={currentUser.mustChangePassword}
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSaved={() => showToast('success', 'Profile updated successfully!')}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
