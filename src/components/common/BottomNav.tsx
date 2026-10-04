import React from 'react';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  Layers,
  GraduationCap,
  Users,
  FileCheck,
  CalendarDays,
  FileText,
  User,
} from 'lucide-react';

interface BottomNavProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  role,
  activeTab,
  onTabChange,
}) => {
  const getNavItems = () => {
    if (role === 'hod') {
      return [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'batches', label: 'Batches', icon: Layers },
        { id: 'students', label: 'Students', icon: GraduationCap },
        { id: 'teachers', label: 'Faculty', icon: Users },
        { id: 'assignments', label: 'Assignments', icon: FileCheck },
        { id: 'timetable', label: 'Timetable', icon: CalendarDays },
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'profile', label: 'Profile', icon: User },
      ];
    } else if (role === 'teacher') {
      return [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'notes', label: 'My Notes', icon: FileText },
        { id: 'assignments', label: 'Assignments', icon: FileCheck },
        { id: 'timetable', label: 'Timetable', icon: CalendarDays },
        { id: 'students', label: 'Students', icon: GraduationCap },
        { id: 'profile', label: 'Profile', icon: User },
      ];
    } else {
      // student
      return [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'notes', label: 'Notes', icon: FileText },
        { id: 'assignments', label: 'Assignments', icon: FileCheck },
        { id: 'timetable', label: 'Timetable', icon: CalendarDays },
        { id: 'profile', label: 'Profile', icon: User },
      ];
    }
  };

  const items = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 shadow-lg md:hidden">
      <div className="flex items-center justify-around overflow-x-auto no-scrollbar gap-1 py-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[54px] py-1.5 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-600 font-bold bg-blue-50/80 scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
