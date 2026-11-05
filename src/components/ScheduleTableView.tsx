import React, { useState } from 'react';
import { Calendar as CalendarIcon, Filter, Search, Printer, Plus, ChevronLeft, ChevronRight, LayoutGrid, Layers, CalendarDays } from 'lucide-react';
import { Booking, DayOfWeek, Facility, Period, UserSession, DayScheduleConfig } from '../types/schedule';
import { DAYS_OF_WEEK, FACILITIES } from '../data/defaultData';
import {
  getJpTimeRangeLabel,
  isJpOverlap,
  formatDateToIndonesianShort,
  INDONESIAN_MONTHS,
  getIndonesianDay,
  getJpNumber,
  getBookingTimeRangeLabel,
  getBookingStartEndMinutes,
  isTimeOverlap,
  timeToMinutes
} from '../utils/timeUtils';

interface ScheduleTableViewProps {
  bookings: Booking[];
  periods: Period[];
  daySchedules?: Record<DayOfWeek, DayScheduleConfig>;
  onOpenBookingModal: (preselectedFacility?: Facility, preselectedDay?: DayOfWeek, preselectedDate?: string) => void;
  onEditBooking: (booking: Booking) => void;
  currentUser?: UserSession | null;
}

export const ScheduleTableView: React.FC<ScheduleTableViewProps> = ({
  bookings,
  periods,
  daySchedules,
  onOpenBookingModal,
  onEditBooking,
  currentUser,
}) => {
  const handleBookingClick = (b: Booking) => {
    const isOwner = currentUser?.role === 'admin' || !currentUser || b.teacherName === currentUser.name;
    if (!isOwner) {
      alert('Anda hanya dapat melihat atau mengubah jadwal milik Anda sendiri.');
      return;
    }
    onEditBooking(b);
  };
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-indexed (0 = Jan, 10 = Nov)
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'SEMUA'>('SEMUA');
  const [selectedFacility, setSelectedFacility] = useState<Facility | 'SEMUA'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'cards' | 'calendar'>('calendar');

  const teachingPeriods = periods.filter((p) => !p.isBreak);

  // Helper for formatting YYYY-MM
  const currentMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (selectedDay !== 'SEMUA' && b.day !== selectedDay) return false;
    if (selectedFacility !== 'SEMUA' && b.facility !== selectedFacility) return false;
    
    // Filter by selected Month if bookingDate is set
    if (b.bookingDate) {
      if (!b.bookingDate.startsWith(currentMonthStr)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTeacher = b.teacherName.toLowerCase().includes(q);
      const matchSubject = b.subject.toLowerCase().includes(q);
      const matchClass = b.className.toLowerCase().includes(q);
      const matchNotes = (b.notes || '').toLowerCase().includes(q);
      return matchTeacher || matchSubject || matchClass || matchNotes;
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  // Generate Monthly Calendar Grid Data
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayObj = new Date(selectedYear, selectedMonth, 1);
  // Shift Sunday (0) to 6, Monday (1) to 0
  const monthStartDayOffset = (firstDayObj.getDay() + 6) % 7;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-900 text-amber-400 rounded-xl shrink-0">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Jadwal Bulanan LABKOM & PID
                </h2>
                <p className="text-xs text-slate-500">
                  SMPN 1 Kawali · Monitoring Penggunaan Fasilitas Per Bulan ({INDONESIAN_MONTHS[selectedMonth]} {selectedYear})
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Jadwal</span>
            </button>
            <button
              onClick={() => onOpenBookingModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 rounded-lg text-xs font-black shadow-xs transition-all border border-amber-300 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Pemesanan</span>
            </button>
          </div>
        </div>

        {/* MONTH / YEAR NAVIGATOR BAR */}
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs transition-all cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-black text-blue-950 text-sm sm:text-base px-2">
              {INDONESIAN_MONTHS[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs transition-all cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Month Select Dropdown */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-blue-900 text-xs hidden sm:inline">Pilih Bulan:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-2.5 py-1.5 border border-blue-300 rounded-lg bg-white font-bold text-blue-950 outline-none text-xs"
            >
              {INDONESIAN_MONTHS.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1.5 border border-blue-300 rounded-lg bg-white font-bold text-blue-950 outline-none text-xs"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Day Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600">Filter Hari:</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as any)}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="SEMUA">Semua Hari (Senin - Sabtu)</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Facility Filter */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600">Filter Fasilitas:</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value as any)}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="SEMUA">Semua Fasilitas</option>
              <option value="LABKOM 1 PID">LABKOM 1 PID</option>
              <option value="LABKOM 2">LABKOM 2</option>
            </select>
          </div>

          {/* Search */}
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-slate-600">Cari Guru / Mapel / Kelas:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama guru, kelas, atau materi..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-1 gap-2">
          <span className="text-slate-500">
            Ditemukan <strong>{filteredBookings.length}</strong> jadwal untuk {INDONESIAN_MONTHS[selectedMonth]} {selectedYear}
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'calendar' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Kalender Bulanan</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid Matriks</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kartu</span>
            </button>
          </div>
        </div>
      </div>

      {/* MONTHLY CALENDAR VIEW MODE */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-3 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-extrabold text-blue-950 text-base sm:text-lg flex items-center gap-2">
              <span>Kalender Jadwal {INDONESIAN_MONTHS[selectedMonth]} {selectedYear}</span>
            </h3>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-indigo-500 inline-block" />
                <span>LABKOM 1 PID</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span>LABKOM 2</span>
              </span>
            </div>
          </div>

          {/* Calendar Grid 7 Columns */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-black border-b border-slate-200 pb-1.5">
            {[
              { full: 'Senin', short: 'Sen' },
              { full: 'Selasa', short: 'Sel' },
              { full: 'Rabu', short: 'Rab' },
              { full: 'Kamis', short: 'Kam' },
              { full: 'Jumat', short: 'Jum' },
              { full: 'Sabtu', short: 'Sab' },
              { full: 'Minggu', short: 'Min' },
            ].map((d) => (
              <div key={d.full} className={`py-1 rounded ${d.full === 'Minggu' ? 'text-red-500' : 'text-slate-700'}`}>
                <span className="sm:hidden">{d.short}</span>
                <span className="hidden sm:inline">{d.full}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[10px] sm:text-xs">
            {/* Empty offset tiles */}
            {Array.from({ length: monthStartDayOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-slate-50/40 rounded-lg sm:rounded-xl min-h-[50px] sm:min-h-[90px] border border-slate-100/50" />
            ))}

            {/* Date tiles 1..daysInMonth */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateObj = new Date(selectedYear, selectedMonth, dayNum);
              const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayName = getIndonesianDay(dateObj);
              const isSunday = dateObj.getDay() === 0;
              const isToday =
                today.getFullYear() === selectedYear &&
                today.getMonth() === selectedMonth &&
                today.getDate() === dayNum;

              // Find bookings for this specific date only
              const dayBookings = filteredBookings.filter((b) => {
                if (b.bookingDate) {
                  return b.bookingDate === dateStr;
                }
                return false;
              });

              return (
                <div
                  key={dateStr}
                  className={`rounded-lg sm:rounded-xl border p-1 sm:p-2 min-h-[60px] sm:min-h-[110px] flex flex-col justify-between transition-all ${
                    isToday
                      ? 'bg-blue-50/95 border-blue-500 ring-1 sm:ring-2 ring-blue-300'
                      : isSunday
                      ? 'bg-slate-50/80 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between pb-0.5 border-b border-slate-100 gap-0.5">
                    <span className={`font-black text-[11px] sm:text-xs leading-none ${
                      isToday
                        ? 'text-blue-900 bg-blue-200/90 px-1 py-0.2 rounded'
                        : isSunday
                        ? 'text-red-500'
                        : 'text-slate-800'
                    }`}>
                      {dayNum}
                    </span>
                    {!isSunday && (
                      <button
                        onClick={() => onOpenBookingModal(undefined, dayName, dateStr)}
                        className="text-[9px] sm:text-[10px] text-blue-600 hover:text-blue-800 font-black hover:bg-blue-100 px-1 py-0.2 rounded transition-colors cursor-pointer"
                        title={`Tambah jadwal ${dayNum} ${INDONESIAN_MONTHS[selectedMonth]}`}
                      >
                        +
                      </button>
                    )}
                  </div>

                  {/* Day Bookings List - Highly Optimized for Mobile */}
                  <div className="space-y-0.5 sm:space-y-1 my-0.5 overflow-y-auto max-h-[65px] sm:max-h-[85px] scrollbar-none">
                    {dayBookings.length > 0 ? (
                      dayBookings.map((b) => {
                        const isLab1Pid = b.facility === 'LABKOM 1 PID';
                        return (
                          <button
                            key={b.id}
                            onClick={() => handleBookingClick(b)}
                            className={`w-full text-left px-1 py-0.5 sm:p-1 rounded text-[9px] sm:text-[10px] leading-tight font-black border transition-all cursor-pointer truncate ${
                              isLab1Pid
                                ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                                : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                            }`}
                            title={`Kelas ${b.className} · ${b.teacherName} (${b.subject}) - ${
                              b.timeType === 'custom' || b.customStartTime
                                ? `Pukul ${b.customStartTime}-${b.customEndTime}`
                                : `JP ${b.startJp}-${b.endJp}`
                            } - ${b.facility}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">{b.className}</span>
                              <span className="text-[8px] font-mono opacity-90 shrink-0">
                                {b.timeType === 'custom' || b.customStartTime
                                  ? `${b.customStartTime}`
                                  : `JP ${b.startJp}`}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-[9px] text-slate-300 italic block text-center pt-1">
                        {isSunday ? 'Libur' : '-'}
                      </span>
                    )}
                  </div>

                  <div className="text-[8px] sm:text-[9px] text-slate-400 text-right font-mono hidden sm:block">
                    {dayName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MATRIX VIEW */}
      {viewMode === 'matrix' && (
        <div className="space-y-8">
          {(selectedFacility === 'SEMUA' ? FACILITIES : FACILITIES.filter((f) => f.id === selectedFacility)).map((fac) => {
            const isLab1Pid = fac.id === 'LABKOM 1 PID';

            return (
              <div key={fac.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Facility Header */}
                <div className={`p-4 border-b flex items-center justify-between ${
                  isLab1Pid ? 'bg-indigo-50/80 border-indigo-100' : 'bg-emerald-50/80 border-emerald-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${
                      isLab1Pid ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`} />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {fac.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {fac.location} · {fac.roomDesc}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenBookingModal(fac.id)}
                    className="text-xs font-semibold text-blue-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pesan {fac.id}</span>
                  </button>
                </div>

                {/* Grid Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-2.5 px-3 w-28 border-r border-slate-200">Hari</th>
                        {teachingPeriods.map((p) => (
                          <th key={p.id} className="py-2.5 px-2 text-center border-r border-slate-200 font-mono">
                            <div>{p.label}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{p.startTime}-{p.endTime}</div>
                          </th>
                        ))}
                        <th className="py-2.5 px-2 text-center border-r border-slate-200 font-mono bg-amber-50/80 text-amber-950 min-w-[125px]">
                          <div>Di Luar Jam</div>
                          <div className="text-[10px] text-amber-700 font-normal">Pukul / Waktu</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(selectedDay === 'SEMUA' ? DAYS_OF_WEEK : [selectedDay]).map((d) => (
                        <tr key={d} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold text-slate-800 bg-slate-50/70 border-r border-slate-200 whitespace-nowrap">
                            {d}
                          </td>
                          {teachingPeriods.map((p, pIdx) => {
                            const targetJp = getJpNumber(p, pIdx);
                            const pStartMin = timeToMinutes(p.startTime);
                            const pEndMin = timeToMinutes(p.endTime);

                            const cellBookings = filteredBookings.filter(
                              (b) => {
                                if (b.facility !== fac.id) return false;
                                if (b.bookingDate) {
                                  if (!b.bookingDate.startsWith(currentMonthStr) || b.day !== d) return false;
                                } else if (b.day !== d) {
                                  return false;
                                }

                                if (b.timeType === 'custom' || b.customStartTime) {
                                  const bMin = getBookingStartEndMinutes(b, teachingPeriods);
                                  return isTimeOverlap(pStartMin, pEndMin, bMin.startMin, bMin.endMin);
                                }

                                return isJpOverlap(targetJp, targetJp, b.startJp, b.endJp);
                              }
                            );

                            return (
                              <td
                                key={p.id}
                                className="py-2 px-1 border-r border-slate-200 align-top text-center h-20 min-w-[95px]"
                              >
                                {cellBookings.length > 0 ? (
                                  <div className="space-y-1">
                                    {cellBookings.map((booking) => (
                                      <button
                                        key={booking.id}
                                        onClick={() => handleBookingClick(booking)}
                                        className={`w-full p-1.5 rounded text-left transition-all shadow-2xs flex flex-col justify-between cursor-pointer ${
                                          isLab1Pid
                                            ? 'bg-indigo-100/95 text-indigo-950 hover:bg-indigo-200 border border-indigo-200'
                                            : 'bg-emerald-100/95 text-emerald-950 hover:bg-emerald-200 border border-emerald-200'
                                        }`}
                                      >
                                        <div>
                                          <div className="font-extrabold text-[11px] leading-tight flex items-center justify-between">
                                            <span>{booking.className}</span>
                                            {booking.bookingDate && (
                                              <span className="text-[9px] font-mono opacity-80">
                                                {booking.bookingDate.slice(8, 10)}/{booking.bookingDate.slice(5, 7)}
                                              </span>
                                            )}
                                          </div>
                                          <div className="font-semibold text-[10px] truncate leading-tight mt-0.5" title={booking.teacherName}>
                                            {booking.teacherName}
                                          </div>
                                          {booking.timeType === 'custom' && (
                                            <div className="text-[9px] font-mono font-bold text-amber-800">
                                              {booking.customStartTime}-{booking.customEndTime}
                                            </div>
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => onOpenBookingModal(fac.id, d)}
                                    className="w-full h-full rounded-lg border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-300 hover:text-blue-600 flex items-center justify-center transition-all group cursor-pointer"
                                    title={`Klik untuk memesan ${fac.id} di hari ${d} pada ${p.label}`}
                                  >
                                    <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100">
                                      + Pesan
                                    </span>
                                  </button>
                                )}
                              </td>
                            );
                          })}

                          {/* Extra Column: Di Luar Jam (Pukul / Waktu) */}
                          {(() => {
                            const customBookings = filteredBookings.filter((b) => {
                              if (b.facility !== fac.id) return false;
                              if (b.timeType !== 'custom' && !b.customStartTime) return false;
                              if (b.bookingDate) {
                                return b.bookingDate.startsWith(currentMonthStr) && b.day === d;
                              }
                              return b.day === d;
                            });

                            return (
                              <td className="py-2 px-1 border-r border-slate-200 align-top text-center h-20 min-w-[125px] bg-amber-50/30">
                                {customBookings.length > 0 ? (
                                  <div className="space-y-1">
                                    {customBookings.map((booking) => (
                                      <button
                                        key={booking.id}
                                        onClick={() => handleBookingClick(booking)}
                                        className="w-full p-1.5 rounded text-left transition-all shadow-2xs flex flex-col justify-between cursor-pointer bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300"
                                      >
                                        <div className="font-extrabold text-[11px] leading-tight flex items-center justify-between">
                                          <span>{booking.className}</span>
                                          <span className="text-[9px] font-mono font-bold text-amber-900">
                                            {booking.customStartTime}-{booking.customEndTime}
                                          </span>
                                        </div>
                                        <div className="font-semibold text-[10px] truncate leading-tight mt-0.5" title={booking.teacherName}>
                                          {booking.teacherName}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => onOpenBookingModal(fac.id, d)}
                                    className="w-full h-full rounded-lg border border-dashed border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-amber-600/70 hover:text-amber-900 flex items-center justify-center transition-all group cursor-pointer"
                                    title={`Klik untuk memesan jam khusus / di luar jam di hari ${d}`}
                                  >
                                    <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100">
                                      + Pukul
                                    </span>
                                  </button>
                                )}
                              </td>
                            );
                          })()}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => {
            const isLab1Pid = b.facility === 'LABKOM 1 PID';
            const timeLabel = getBookingTimeRangeLabel(b, periods);

            return (
              <div
                key={b.id}
                onClick={() => handleBookingClick(b)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      isLab1Pid
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {b.facility}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {b.day}{b.bookingDate ? `, ${formatDateToIndonesianShort(b.bookingDate)}` : ''}
                    </span>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      Kelas {b.className}
                    </div>
                    <div className="text-sm font-bold text-blue-900 mt-0.5">
                      {b.teacherName}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>Mata Pelajaran: <strong>{b.subject}</strong></div>
                    {b.notes && (
                      <div className="text-slate-500 italic mt-1">"{b.notes}"</div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
                  <span className="font-semibold text-blue-950">{timeLabel}</span>
                  <span className="text-blue-600 font-sans font-semibold text-[11px]">
                    Ubah / Hapus &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

