import React from 'react';
import { Plus, ShieldCheck, Clock, Layers, BookOpen } from 'lucide-react';
import { Booking, DayOfWeek, Facility, Period, UserSession } from '../types/schedule';
import { FACILITIES } from '../data/defaultData';
import {
  formatIndonesianDate,
  getFacilityLiveStatus,
  getJpTimeRangeLabel,
  getCurrentPeriod,
  formatDateToIndonesianShort,
  timeToMinutes,
  getPeriodById,
  getBookingTimeRangeLabel,
  getBookingStartEndMinutes,
} from '../utils/timeUtils';

interface DashboardViewProps {
  currentDate: Date;
  effectiveDay: DayOfWeek;
  effectiveTimeStr: string;
  bookings: Booking[];
  periods: Period[];
  onOpenBookingModal: (preselectedFacility?: Facility) => void;
  onNavigateToAdmin: () => void;
  currentUser?: UserSession | null;
  isFirebaseConnected?: boolean;
  onEditBooking?: (booking: Booking) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentDate,
  effectiveDay,
  effectiveTimeStr,
  bookings,
  periods,
  onOpenBookingModal,
  onNavigateToAdmin,
  currentUser,
  isFirebaseConnected = true,
  onEditBooking,
}) => {
  const facilityStatuses = FACILITIES.map((fac) =>
    getFacilityLiveStatus(fac.id, effectiveDay, effectiveTimeStr, bookings, periods, currentDate)
  );

  const currentPeriod = getCurrentPeriod(effectiveTimeStr, periods);

  const myBookings = currentUser?.role === 'guru'
    ? bookings.filter((b) => b.teacherName === currentUser.name)
    : [];

  const todayStr = (() => {
    const d = currentDate;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const currentTimeMin = timeToMinutes(effectiveTimeStr);

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8 py-2.5 sm:py-4">
      {/* BAR AKSI RINGKAS: Status KBM Aktif, Waktu, Tombol Pesan & Admin */}
      <div className="bg-white rounded-xl border border-blue-200/90 p-2.5 sm:px-4 sm:py-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-black text-blue-950 tracking-tight shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Jadwal Saat Ini:</span>
          </div>

          {/* Jam & Tanggal */}
          <span className="font-mono font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
            {effectiveDay}, {effectiveTimeStr} WIB
          </span>

          <span className="text-slate-500 hidden lg:inline text-[11px]">
            ({formatIndonesianDate(currentDate)})
          </span>

          {/* Status KBM Aktif */}
          <div className="flex items-center gap-1.5 pl-1 sm:border-l sm:border-slate-200">
            <span className="text-slate-500 font-semibold text-[11px]">KBM:</span>
            {currentPeriod ? (
              <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                currentPeriod.isBreak
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
              }`}>
                {currentPeriod.label} ({currentPeriod.startTime}-{currentPeriod.endTime})
              </span>
            ) : (
              <span className="text-slate-400 italic text-[11px]">Di luar KBM</span>
            )}
          </div>
        </div>

        {/* Tombol Pesan LABKOM & Admin: Presisi Mobile & Desktop */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          <button
            onClick={() => onOpenBookingModal()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 rounded-lg text-xs font-black shadow-xs transition-all border border-amber-300 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Pesan LABKOM</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={onNavigateToAdmin}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-900 rounded-lg text-xs font-bold border border-blue-200 transition-all cursor-pointer"
              title="Pengaturan Jam Pelajaran (Login: ega / ega)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* PESANAN LABKOM SAYA (KHUSUS AKUN GURU) */}
      {currentUser?.role === 'guru' && (
        <div className="bg-white rounded-xl border border-blue-200 p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-900 text-amber-400 rounded-lg">
                <BookOpen className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm sm:text-base">
                  Pesanan Labkom Saya
                </h3>
                <p className="text-[11px] text-slate-500">
                  Daftar jadwal laboratorium yang Anda pesan ({currentUser.name})
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenBookingModal()}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Pesan Baru</span>
            </button>
          </div>

          {myBookings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {myBookings.map((b) => {
                const isLab1Pid = b.facility === 'LABKOM 1 PID';
                const timeLabel = getBookingTimeRangeLabel(b, periods);
                
                // Calculate if booking is ongoing
                const { startMin, endMin } = getBookingStartEndMinutes(b, periods);
                const isOngoing = b.bookingDate === todayStr && 
                                 startMin > 0 &&
                                 currentTimeMin >= startMin &&
                                 currentTimeMin < endMin;

                return (
                  <div
                    key={b.id}
                    onClick={() => onEditBooking && onEditBooking(b)}
                    className={`bg-slate-50 hover:bg-blue-50/50 border p-3 rounded-xl transition-all cursor-pointer flex flex-col justify-between space-y-2 shadow-2xs ${
                      isOngoing 
                        ? 'border-blue-500 ring-2 ring-blue-100 animate-pulse' 
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          isLab1Pid ? 'bg-indigo-100 text-indigo-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {b.facility}
                        </span>
                        {isOngoing && (
                          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {b.day}{b.bookingDate ? `, ${formatDateToIndonesianShort(b.bookingDate)}` : ''}
                      </span>
                    </div>

                    <div>
                      <div className="font-black text-blue-950 text-sm">
                        Kelas {b.className}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 truncate">
                        {b.subject}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-blue-900 font-bold">
                      <span>{timeLabel}</span>
                      <span className="text-blue-600 font-sans font-semibold text-[10px]">
                        {isOngoing ? 'Sedang Berlangsung' : 'Ubah &rarr;'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
              Belum ada pemesanan laboratorium yang Anda buat. Klik tombol <strong>Pesan Baru</strong> untuk membuat jadwal.
            </div>
          )}
        </div>
      )}

      {/* JADWAL SEKARANG (RANGKA PUTIH, DOMINAN BIRU, AKSEN KUNING, MOBIL-EFISIEN) */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
          {facilityStatuses.map((status) => {
            const isOngoing = status.isOngoing && status.currentBooking;
            const isLab1Pid = status.facility === 'LABKOM 1 PID';

            return (
              <div
                key={status.facility}
                className={`bg-white rounded-xl sm:rounded-2xl border-2 transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs ${
                  isOngoing
                    ? 'border-blue-600 ring-2 ring-blue-100'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Fasilitas: Dominan Biru dengan Aksen Kuning */}
                <div className="bg-gradient-to-r from-blue-900 via-blue-850 to-blue-800 text-white p-3 sm:p-4 border-b-2 border-amber-400 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isOngoing ? 'bg-amber-400 animate-pulse' : 'bg-blue-300'
                      }`} />
                      <h2 className="font-black text-white text-lg sm:text-xl tracking-tight truncate">
                        {status.facility}
                      </h2>
                    </div>
                    <div className="text-[11px] text-blue-200 truncate mt-0.5">
                      {isLab1Pid
                        ? '35 PC + 2 Server + 1 IFP'
                        : '20 PC + 8 Chromebook + 25 Tablet'}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shrink-0 shadow-2xs ${
                    isOngoing
                      ? 'bg-amber-400 text-slate-950 border border-amber-300'
                      : 'bg-blue-950/80 text-blue-200 border border-blue-700'
                  }`}>
                    {isOngoing ? '● Digunakan' : 'Kosong'}
                  </span>
                </div>

                {/* Body Rangka Putih: JADWAL SEKARANG (RINGKAS & EFISIEN) */}
                <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-900">
                      <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        JADWAL SAAT INI:
                      </span>
                      {isOngoing && status.currentPeriod && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-bold font-mono">
                          {status.currentPeriod.label}
                        </span>
                      )}
                    </div>

                    {isOngoing && status.currentBooking ? (
                      <div className="space-y-3">
                        {/* NAMA KELAS & GURU: Ringkas Proposional */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-blue-100 space-y-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">
                                Kelas:
                              </span>
                              <div className="text-4xl sm:text-5xl font-black text-blue-950 tracking-tight leading-none">
                                {status.currentBooking.className}
                              </div>
                            </div>
                            <div className="text-right min-w-0">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">
                                Pengajar:
                              </span>
                              <div className="text-base sm:text-lg font-black text-blue-700 truncate">
                                {status.currentBooking.teacherName}
                              </div>
                            </div>
                          </div>

                          {/* MATA PELAJARAN & WAKTU */}
                          <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-1 text-xs">
                            <div>
                              <span className="text-slate-500">Mapel: </span>
                              <span className="font-bold text-slate-900">{status.currentBooking.subject}</span>
                            </div>
                            <div className="font-mono text-blue-800 font-bold text-[11px]">
                              {getBookingTimeRangeLabel(status.currentBooking, periods)}
                            </div>
                          </div>
                        </div>

                        {/* SISA WAKTU PENGGUNAAN */}
                        {status.timeRemainingMinutes !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-600">
                              <span>Sisa waktu:</span>
                              <span className="font-extrabold font-mono text-amber-950 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                                {status.timeRemainingMinutes} Menit Lagi
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-amber-400"
                                style={{ width: `${status.progressPercent || 50}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-center space-y-2 bg-blue-50/50 rounded-xl border border-blue-100 p-3.5">
                        <div className="text-lg sm:text-xl font-black text-blue-950">
                          Saat Ini Bebas / Kosong
                        </div>
                        <p className="text-[11px] text-slate-600 max-w-xs mx-auto leading-tight">
                          Tidak ada kelas yang sedang menggunakan {status.facility}.
                        </p>
                        <button
                          onClick={() => onOpenBookingModal(status.facility)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pesan {status.facility}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* JAM BERIKUTNYA */}
                  <div className="pt-2.5 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                      JAM BERIKUTNYA:
                    </span>
                    {status.nextBooking ? (
                      <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-blue-950 text-sm">
                              Kelas {status.nextBooking.className}
                            </span>
                            <span className="text-[11px] text-slate-600 truncate">
                              • {status.nextBooking.teacherName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {status.nextBooking.subject}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-950 border border-amber-300 font-extrabold rounded text-[10px] shrink-0 font-mono">
                          {status.nextPeriodLabel}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-lg p-2 border border-dashed border-slate-200 text-[11px] text-slate-400 text-center italic">
                        Tidak ada jadwal lanjutan berikutnya hari ini
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

