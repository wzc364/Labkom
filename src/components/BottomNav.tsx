import React from 'react';
import {
  Monitor,
  Calendar,
  BookOpen,
  Info,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { UserSession } from '../types/schedule';

interface BottomNavProps {
  activeTab: 'dashboard' | 'schedule' | 'bookings' | 'facilities' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'schedule' | 'bookings' | 'facilities' | 'admin') => void;
  onLogout: () => void;
  currentUser?: UserSession | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  currentUser,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Monitor },
    { id: 'schedule', label: 'Jadwal', icon: Calendar },
    { id: 'bookings', label: 'Pemesanan', icon: BookOpen },
    ...(currentUser?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
    { id: 'facilities', label: 'Fasilitas', icon: Info },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-blue-900 z-50 px-2 py-1 md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all duration-300 flex-1 ${
                isActive
                  ? 'text-amber-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
