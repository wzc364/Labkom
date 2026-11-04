import React, { useState, useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, CheckCircle, Calendar, Clock, User, BookOpen, Layers, Info } from 'lucide-react';
import { Booking, DayOfWeek, Facility, Period, Teacher, UserSession } from '../types/schedule';
import { checkBookingConflict } from '../utils/storage';
import { DAYS_OF_WEEK, SAMPLE_CLASSES, SAMPLE_SUBJECTS } from '../data/defaultData';
import { getJpTimeRangeLabel, getIndonesianDayFromDateString, getJpNumber } from '../utils/timeUtils';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, 'id' | 'createdAt'>, existingId?: string) => void;
  existingBookings: Booking[];
  periods: Period[];
  daySchedules?: Record<DayOfWeek, { periods: Period[] }>;
  editingBooking?: Booking | null;
  defaultFacility?: Facility;
  teachers?: Teacher[];
  currentUser?: UserSession | null;
}


export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingBookings,
  periods,
  daySchedules,
  editingBooking,
  defaultFacility = 'LABKOM 1 PID',
  currentUser,
}) => {
  const [teacherName, setTeacherName] = useState('');
  const [subject, setSubject] = useState('Informatika');
  const [customSubject, setCustomSubject] = useState('');
  const [className, setClassName] = useState('IX A');
  const [customClass, setCustomClass] = useState('');
  const [facility, setFacility] = useState<Facility>(defaultFacility);
  const [day, setDay] = useState<DayOfWeek>('Senin');
  const [startJp, setStartJp] = useState<number>(1);
  const [endJp, setEndJp] = useState<number>(2);
  const [notes, setNotes] = useState('');
  const [sharedLabAcknowledged, setSharedLabAcknowledged] = useState(false);

  const getTodayDateStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [bookingDate, setBookingDate] = useState<string>(getTodayDateStr());

  // Use day-specific periods if provided, otherwise fallback to general periods
  const activeDayPeriods = daySchedules && daySchedules[day]?.periods
    ? daySchedules[day].periods
    : periods;

  // Available teaching JP periods (exclude pure breaks)
  const availablePeriods = activeDayPeriods.filter((p) => !p.isBreak);

  useEffect(() => {
    if (editingBooking) {
      setTeacherName(currentUser?.role === 'guru' && currentUser?.name ? currentUser.name : editingBooking.teacherName);
      const targetSub = currentUser?.role === 'guru' && currentUser?.subject ? currentUser.subject : editingBooking.subject;
      if (SAMPLE_SUBJECTS.includes(targetSub)) {
        setSubject(targetSub);
        setCustomSubject('');
      } else {
        setSubject('CUSTOM');
        setCustomSubject(targetSub);
      }
      if (SAMPLE_CLASSES.includes(editingBooking.className)) {
        setClassName(editingBooking.className);
        setCustomClass('');
      } else {
        setClassName('CUSTOM');
        setCustomClass(editingBooking.className);
      }
      setFacility(editingBooking.facility);
      setDay(editingBooking.day);
      setBookingDate(editingBooking.bookingDate || getTodayDateStr());
      setStartJp(editingBooking.startJp);
      setEndJp(editingBooking.endJp);
      setNotes(editingBooking.notes || '');
      setSharedLabAcknowledged(!!editingBooking.sharedLabAcknowledgment);
    } else {
      const defaultTeacherName = currentUser?.role === 'guru' && currentUser?.name ? currentUser.name : '';
      const defaultSub = currentUser?.role === 'guru' && currentUser?.subject ? currentUser.subject : 'Informatika';

      setTeacherName(defaultTeacherName);
      if (SAMPLE_SUBJECTS.includes(defaultSub)) {
        setSubject(defaultSub);
        setCustomSubject('');
      } else {
        setSubject('CUSTOM');
        setCustomSubject(defaultSub);
      }
      setClassName('IX A');
      setCustomClass('');
      setFacility(defaultFacility);
      const todayStr = getTodayDateStr();
      setBookingDate(todayStr);
      setDay(getIndonesianDayFromDateString(todayStr));
      setStartJp(1);
      setEndJp(2);
      setNotes('');
      setSharedLabAcknowledged(false);
    }
  }, [editingBooking, defaultFacility, isOpen, currentUser]);

  const handleDateChange = (val: string) => {
    setBookingDate(val);
    if (val) {
      const computedDay = getIndonesianDayFromDateString(val);
      setDay(computedDay);
    }
  };

  // Ensure endJp is not smaller than startJp
  const handleStartJpChange = (val: number) => {
    setStartJp(val);
    if (endJp < val) {
      setEndJp(val);
    }
  };

  const handleEndJpChange = (val: number) => {
    if (val >= startJp) {
      setEndJp(val);
    }
  };

  const finalClassName = className === 'CUSTOM' ? customClass.trim() : className;
  const finalSubject = subject === 'CUSTOM' ? customSubject.trim() : subject;

  // Real-time conflict evaluation
  const conflictResult = checkBookingConflict(
    {
      teacherName: teacherName.trim() || 'Pengajar',
      subject: finalSubject || 'Mata Pelajaran',
      className: finalClassName || 'Kelas',
      facility,
      day,
      bookingDate,
      startJp,
      endJp,
      notes,
    },
    existingBookings,
    activeDayPeriods,
    editingBooking?.id
  );

  const hasBlockingConflict = conflictResult.hasConflict;
  const hasCoLocationNotice = conflictResult.conflictType === 'COLOCATION_SHARED';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) {
      alert('Mohon isi nama pengajar / guru.');
      return;
    }
    if (!finalClassName) {
      alert('Mohon pilih atau masukkan nama kelas.');
      return;
    }
    if (!finalSubject) {
      alert('Mohon pilih atau masukkan mata pelajaran.');
      return;
    }
    if (hasBlockingConflict) {
      alert('Jadwal bentrok! Silakan pilih jam atau fasilitas lain.');
      return;
    }

    onSave(
      {
        teacherName: teacherName.trim(),
        subject: finalSubject,
        className: finalClassName,
        facility,
        day,
        bookingDate,
        startJp,
        endJp,
        notes: notes.trim(),
        sharedLabAcknowledgment: sharedLabAcknowledged,
      },
      editingBooking?.id
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header (Fixed at top) */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b-2 border-amber-400 bg-blue-900 text-white shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white leading-snug">
              {editingBooking ? 'Ubah Pemesanan' : 'Form Pemesanan LABKOM & PID'}
            </h2>
            <p className="text-[11px] text-blue-200">
              SMPN 1 Kawali · Penjadwalan Otomatis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable inside max height) */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* STREAMLINED FACILITY NOTICE */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-2.5 text-[11px] text-blue-950 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>LABKOM 1 PID</strong> mencakup 40 PC Siswa + Papan Interaktif (IFP 75").
            </span>
          </div>

          {/* Teacher Name & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nama Guru / Pengajar *</span>
                </div>
                {currentUser?.role === 'guru' && (
                  <span className="text-[10px] text-emerald-600 font-bold">Otomatis dari Akun</span>
                )}
              </label>
              <input
                type="text"
                required
                disabled={currentUser?.role === 'guru'}
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Contoh: Ega Nugraha, S.Pd."
                className={`w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  currentUser?.role === 'guru' ? 'bg-slate-100 text-slate-700 cursor-not-allowed font-semibold' : ''
                }`}
              />
            </div>

            {/* Subject Dropdown Menu */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mata Pelajaran / Kegiatan *</span>
                </div>
                {currentUser?.role === 'guru' && (
                  <span className="text-[10px] text-emerald-600 font-bold">Otomatis dari Akun</span>
                )}
              </label>
              <div className="flex gap-1.5">
                <select
                  value={subject}
                  disabled={currentUser?.role === 'guru'}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium ${
                    currentUser?.role === 'guru' ? 'bg-slate-100 text-slate-700 cursor-not-allowed font-semibold' : ''
                  }`}
                >
                  <optgroup label="Mata Pelajaran SMP (Fase D)">
                    <option value="Informatika">Informatika</option>
                    <option value="IPA (Ilmu Pengetahuan Alam)">IPA (Ilmu Pengetahuan Alam)</option>
                    <option value="IPS (Ilmu Pengetahuan Sosial)">IPS (Ilmu Pengetahuan Sosial)</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Pendidikan Pancasila (PPKn)">Pendidikan Pancasila (PPKn)</option>
                    <option value="PAI & Budi Pekerti">PAI & Budi Pekerti</option>
                    <option value="PJOK (Jasmani & Kesehatan)">PJOK (Jasmani & Kesehatan)</option>
                    <option value="Seni Budaya">Seni Budaya</option>
                    <option value="Prakarya">Prakarya</option>
                    <option value="Bahasa Sunda (Mulok)">Bahasa Sunda (Mulok)</option>
                    <option value="Kokurikuler">Kokurikuler</option>
                  </optgroup>
                  <optgroup label="Bimbingan & Pelayanan">
                    <option value="Bimbingan Konseling (BK)">Bimbingan Konseling (BK)</option>
                  </optgroup>
                  <optgroup label="Asesmen, Latihan & Kegiatan">
                    <option value="Asesmen / ANBK / Try Out">Asesmen / ANBK / Try Out</option>
                    <option value="Latihan / Simulasi Digital">Latihan / Simulasi Digital</option>
                    <option value="Ekstrakurikuler / Klub Komputer">Ekstrakurikuler / Klub Komputer</option>
                    <option value="Pelatihan Guru / Rapat Sekolah">Pelatihan Guru / Rapat Sekolah</option>
                  </optgroup>
                  <option value="CUSTOM">+ Tulis Mapel Lain...</option>
                </select>
                {subject === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Nama Mapel"
                    className="w-28 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Class & Facility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 text-[11px]">Kelas *</label>
              <div className="flex gap-1.5">
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                >
                  <optgroup label="Kelas VII">
                    {SAMPLE_CLASSES.filter((c) => c.startsWith('VII')).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Kelas VIII">
                    {SAMPLE_CLASSES.filter((c) => c.startsWith('VIII')).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Kelas IX">
                    {SAMPLE_CLASSES.filter((c) => c.startsWith('IX')).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                  <option value="CUSTOM">+ Tulis Kelas</option>
                </select>
                {className === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    value={customClass}
                    onChange={(e) => setCustomClass(e.target.value)}
                    placeholder="Nama Kelas"
                    className="w-24 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Fasilitas *</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['LABKOM 1 PID', 'LABKOM 2'] as Facility[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFacility(f)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-black border transition-all text-center cursor-pointer ${
                      facility === f
                        ? f === 'LABKOM 1 PID'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Time Pickers: Tanggal, Hari, Jam Mulai, Jam Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Tanggal Pelaksanaan *</span>
              </label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Hari *</span>
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as DayOfWeek)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Free Periods Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-600">
            <p className="font-semibold text-slate-800">Jam yang tersedia untuk fasilitas {facility}:</p>
            <p className="mt-0.5">
              {availablePeriods
                .filter((p, idx) => {
                  const jpNum = getJpNumber(p, idx);
                  return !existingBookings.some((b) => {
                    if (b.facility !== facility || b.day !== day) return false;
                    const dateA = bookingDate || '';
                    const dateB = b.bookingDate || '';
                    if (dateA && dateB && dateA !== dateB) return false;
                    return jpNum >= b.startJp && jpNum <= b.endJp;
                  });
                })
                .map((p) => p.label)
                .join(', ') || 'Tidak ada jam tersedia.'}
            </p>
          </div>

          {/* ALERT BOXES */}
          {hasBlockingConflict && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-2.5 text-[11px] text-red-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-red-800 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Bentrok Jadwal!</span>
              </div>
              <p className="leading-snug">{conflictResult.message}</p>
            </div>
          )}

          {!hasBlockingConflict && hasCoLocationNotice && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-[11px] text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pemberitahuan Ruang Bersama:</span>
              </div>
              <p className="leading-snug">{conflictResult.message}</p>
              <label className="flex items-start gap-1.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sharedLabAcknowledged}
                  onChange={(e) => setSharedLabAcknowledged(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                />
                <span className="font-semibold text-amber-900">
                  Saya memahami dan siap berkoordinasi.
                </span>
              </label>
            </div>
          )}

          {!hasBlockingConflict && !hasCoLocationNotice && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-[11px] text-emerald-900 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Jadwal tersedia tanpa bentrok.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Jam Mulai *</span>
              </label>
              <select
                value={startJp}
                onChange={(e) => handleStartJpChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono"
              >
                {availablePeriods.map((p, idx) => {
                  const jpNum = getJpNumber(p, idx);
                  return (
                    <option key={p.id + '-' + jpNum} value={jpNum}>
                      {p.label} ({p.startTime}-{p.endTime})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Jam Selesai *</span>
              </label>
              <select
                value={endJp}
                onChange={(e) => handleEndJpChange(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono"
              >
                {availablePeriods
                  .filter((p, idx) => getJpNumber(p, idx) >= startJp)
                  .map((p, idx) => {
                    const jpNum = getJpNumber(p, idx);
                    return (
                      <option key={p.id + '-' + jpNum} value={jpNum}>
                        {p.label} ({p.startTime}-{p.endTime})
                      </option>
                    );
                  })}
              </select>
            </div>
          </div>

          {/* Time Summary */}
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-[11px] text-slate-600 flex items-center justify-between font-mono">
            <span>Rentang Waktu:</span>
            <span className="font-bold text-blue-900">
              {getJpTimeRangeLabel(startJp, endJp, activeDayPeriods)}
            </span>
          </div>

          {/* Notes / Topic */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 text-[11px]">
              Keterangan / Materi (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Praktik Pemrograman Algoritma"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={hasBlockingConflict}
              className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all shadow-xs ${
                hasBlockingConflict
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 active:scale-95 cursor-pointer'
              }`}
            >
              {editingBooking ? 'Simpan Perubahan' : 'Simpan Pemesanan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

