import React from 'react';
import {
  Monitor,
  Calendar,
  BookOpen,
  Info,
  Laptop,
  ShieldCheck,
  User as UserIcon,
  School,
  GraduationCap,
  Shield,
  LogOut,
} from 'lucide-react';
import { UserSession } from '../types/schedule';
import { HeaderLogoConfig, PRESET_ICONS } from './HeaderLogoSettings';

interface HeaderProps {
  activeTab: 'dashboard' | 'schedule' | 'bookings' | 'pid-info' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'schedule' | 'bookings' | 'pid-info' | 'admin') => void;
  onOpenBookingModal?: () => void;
  onOpenPeriodSettings?: () => void;
  currentUser?: UserSession | null;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  headerLogo?: HeaderLogoConfig | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenProfile,
  onLogout,
  headerLogo,
}) => {

  const renderHeaderLogoIcon = () => {
    if (!headerLogo) {
      return <Laptop className="w-5 h-5 text-blue-800" />;
    }

    if (headerLogo.logoType === 'preset') {
      const preset = PRESET_ICONS.find((p) => p.id === headerLogo.presetName);
      const IconComponent = preset ? preset.icon : Laptop;
      return <IconComponent className="w-5 h-5 text-blue-800" />;
    }

    if (headerLogo.logoUrl) {
      return (
        <img
          src={headerLogo.logoUrl}
          alt="Logo Sekolah"
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    return <Laptop className="w-5 h-5 text-blue-800" />;
  };

  return (
    <header className="sticky top-0 z-30 bg-blue-900 text-white border-b-4 border-amber-400 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Zone 1: Brand wordmark (Rangka Putih & Aksen Kuning + Custom Logo) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white flex items-center justify-center text-blue-900 shadow-sm border border-white overflow-hidden shrink-0">
              {renderHeaderLogoIcon()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-white tracking-tight text-sm sm:text-base md:text-lg whitespace-nowrap">
                  SMPN 1 KAWALI
                </span>
                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded font-black bg-amber-400 text-slate-950 shadow-2xs whitespace-nowrap">
                  E-Labkom
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-blue-200 hidden lg:block">
                Sistem Jadwal Laboratorium & Papan Interaktif Digital
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs lg:text-sm font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-800 text-amber-300 font-bold border-b-2 border-amber-400 shadow-inner'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-blue-800 text-amber-300 font-bold border-b-2 border-amber-400 shadow-inner'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400" />
              <span>Jadwal Bulanan</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-blue-800 text-amber-300 font-bold border-b-2 border-amber-400 shadow-inner'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400" />
              <span>Pemesanan</span>
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-amber-300 hover:text-amber-200 hover:bg-blue-800/80'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400" />
                <span>Admin</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('facilities')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'facilities'
                  ? 'bg-blue-800 text-amber-300 font-bold border-b-2 border-amber-400 shadow-inner'
                  : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
              }`}
            >
              <Info className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400" />
              <span>Fasilitas</span>
            </button>
          </nav>

          {/* Zone 3: User Profile & Actions (Tombol Pesan LABKOM telah dihilangkan sesuai permintaan) */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser && onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-blue-100 bg-blue-950/80 hover:bg-blue-800 rounded-lg border border-blue-700 transition-all cursor-pointer"
                title="Lihat Profil & Ubah Password"
              >
                <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>

              </button>
            )}
            
            {currentUser && onLogout && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="block p-2 text-blue-200 hover:text-white hover:bg-red-900/50 hover:text-red-100 rounded-lg border border-blue-800 transition-all cursor-pointer"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
