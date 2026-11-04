import React, { useEffect, useState } from 'react';
import { X, Tv, Maximize2, Minimize2, Monitor, Filter } from 'lucide-react';
import { Booking, DayOfWeek, Facility, Period } from '../types/schedule';
import { FACILITIES } from '../data/defaultData';
import { formatIndonesianDate, getFacilityLiveStatus, getJpTimeRangeLabel } from '../utils/timeUtils';

interface TvDisplayViewProps {
  currentDate: Date;
  effectiveDay: DayOfWeek;
  effectiveTimeStr: string;
  bookings: Booking[];
  periods: Period[];
  onClose: () => void;
}

export const TvDisplayView: React.FC<TvDisplayViewProps> = ({
  currentDate,
  effectiveDay,
  effectiveTimeStr,
  bookings,
  periods,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | Facility>('ALL');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const allStatuses = FACILITIES.map((fac) =>
    getFacilityLiveStatus(fac.id, effectiveDay, effectiveTimeStr, bookings, periods, currentDate)
  );

  const displayedStatuses = selectedFilter === 'ALL'
    ? allStatuses
    : allStatuses.filter((s) => s.facility === selectedFilter);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* Top Header Bar for TV */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 sm:pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
            <Tv className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
              <span>SMPN 1 KAWALI</span>
              <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black tracking-normal">
                DISPLAY TV MONITOR
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Sistem Penjadwalan Laboratorium Komputer & Papan Interaktif Digital
            </p>
          </div>
        </div>

        {/* Filter Selector & Controls */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
          {/* Facility Filter Pills */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <span className="text-slate-400 px-2 flex items-center gap-1 font-semibold text-[11px]">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Tampilan:</span>
            </span>
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              2 LABKOM
            </button>
            <button
              onClick={() => setSelectedFilter('LABKOM 1 PID')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'LABKOM 1 PID'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              LABKOM 1 PID
            </button>
            <button
              onClick={() => setSelectedFilter('LABKOM 2')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'LABKOM 2'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              LABKOM 2
            </button>
          </div>

          {/* Big Live Clock & Action Buttons */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] sm:text-xs uppercase tracking-widest text-amber-400 font-bold">
                {effectiveDay}, {formatIndonesianDate(currentDate)}
              </div>
              <div className="text-2xl sm:text-4xl font-mono font-black text-white tracking-widest tabular-nums leading-none">
                {effectiveTimeStr}
                <span className="text-xs font-sans text-slate-400 ml-1 font-normal">WIB</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleBrowserFullscreen}
                title="Layar Penuh Browser"
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={onClose}
                title="Tutup Mode TV (Esc)"
                className="p-2 sm:p-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 transition-colors border border-red-800 cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Facility Columns for TV Display */}
      <div className={`grid gap-6 my-4 flex-1 items-stretch ${
        displayedStatuses.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
      }`}>
        {displayedStatuses.map((status) => {
          const isOngoing = status.isOngoing && status.currentBooking;
          const isLab1Pid = status.facility === 'LABKOM 1 PID';
          const isSingleView = displayedStatuses.length === 1;

          return (
            <div
              key={status.facility}
              className={`rounded-2xl border flex flex-col justify-between p-5 sm:p-8 transition-all ${
                isOngoing
                  ? isLab1Pid
                    ? 'bg-gradient-to-b from-blue-950/90 via-slate-900 to-slate-950 border-blue-500 shadow-2xl shadow-blue-900/30 ring-2 ring-blue-500/50'
                    : 'bg-gradient-to-b from-emerald-950/90 via-slate-900 to-slate-950 border-emerald-500 shadow-2xl shadow-emerald-900/30 ring-2 ring-emerald-500/50'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-6 border-b border-slate-800/80 gap-3 sm:gap-4">
                <div>
                  <div className={`font-black text-white tracking-tight ${
                    isSingleView ? 'text-3xl sm:text-5xl lg:text-6xl' : 'text-2xl sm:text-4xl'
                  }`}>
                    {status.facility}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-1">
                    {isLab1Pid
                      ? 'Gedung Multimedia · 40 PC Siswa + Papan Interaktif (IFP 75")'
                      : 'Gedung Multimedia · 36 PC Siswa'}
                  </div>
                </div>

                <div className={`px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl font-black uppercase tracking-wider shrink-0 flex items-center gap-2.5 sm:gap-3.5 shadow-2xl transition-all ${
                  isOngoing
                    ? 'bg-amber-400 text-slate-950 border-2 border-amber-300 text-xl sm:text-2xl lg:text-3xl shadow-amber-400/40'
                    : 'bg-slate-800/90 text-slate-300 border border-slate-700 text-sm sm:text-lg lg:text-xl'
                }`}>
                  {isOngoing ? (
                    <>
                      <span className="relative flex h-3.5 w-3.5 sm:h-5 sm:w-5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-80"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 sm:h-5 sm:w-5 bg-red-600"></span>
                      </span>
                      <span className="tracking-wide">SEDANG DIGUNAKAN</span>
                    </>
                  ) : (
                    <>
                      <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-400 shrink-0"></span>
                      <span className="text-slate-200">TERSEDIA / KOSONG</span>
                    </>
                  )}
                </div>
              </div>

              {/* Huge Body: Current Booking */}
              <div className="py-6 flex-1 flex flex-col justify-center space-y-4 sm:space-y-6">
                {isOngoing && status.currentBooking ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
                        Kelas yang Menggunakan:
                      </span>
                      <div className={`font-black text-white tracking-tight drop-shadow-md ${
                        isSingleView ? 'text-6xl sm:text-8xl' : 'text-5xl sm:text-7xl'
                      }`}>
                        {status.currentBooking.className}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80">
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
                        Guru Pengajar:
                      </span>
                      <div className={`font-bold text-amber-300 ${
                        isSingleView ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                      }`}>
                        {status.currentBooking.teacherName}
                      </div>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
                      <div className="text-sm sm:text-base font-bold text-slate-100">
                        Mata Pelajaran: <span className="text-white font-black">{status.currentBooking.subject}</span>
                      </div>
                      {status.currentBooking.notes && (
                        <div className="text-xs sm:text-sm text-slate-300 italic">
                          "{status.currentBooking.notes}"
                        </div>
                      )}
                      <div className="text-xs font-mono text-amber-400 font-semibold pt-1">
                        Rentang Jam: {getJpTimeRangeLabel(status.currentBooking.startJp, status.currentBooking.endJp, periods)}
                      </div>
                    </div>

                    {status.timeRemainingMinutes !== undefined && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300">
                          <span>Sisa Waktu Penggunaan:</span>
                          <span className="text-amber-400 font-black font-mono text-sm sm:text-base bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded">
                            {status.timeRemainingMinutes} Menit Lagi
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full ${isLab1Pid ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${status.progressPercent || 50}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-2.5">
                    <div className={`font-black text-slate-500 ${
                      isSingleView ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                    }`}>
                      Ruangan Kosong / Bebas
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                      Fasilitas saat ini dapat digunakan / dipesan oleh guru pengajar.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom: Jadwal Berikutnya */}
              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Jadwal Berikutnya:
                </span>
                {status.nextBooking ? (
                  <div className="bg-slate-800/70 p-3.5 sm:p-4 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-black text-white">
                          Kelas {status.nextBooking.className}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-300 font-bold">
                          • {status.nextBooking.teacherName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {status.nextBooking.subject}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-950 bg-amber-400 px-2.5 py-1 rounded border border-amber-300 shrink-0">
                      {status.nextPeriodLabel}
                    </span>
                  </div>
                ) : (
                  <div className="bg-slate-800/30 p-3 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 text-center italic">
                    Tidak ada jadwal lanjutan berikutnya hari ini
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer ticker */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div>
          <span>SMPN 1 KAWALI · Sistem Informasi Jadwal LABKOM & PID</span>
        </div>
        <div>
          <span>Tekan <strong className="text-amber-400">Esc</strong> untuk keluar dari mode TV</span>
        </div>
      </div>
    </div>
  );
};

