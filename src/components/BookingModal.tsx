import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, AlertTriangle, CheckCircle, CheckCircle2, Lock, Calendar, Clock, User, BookOpen, Layers, Info, Sparkles } from 'lucide-react';
import { Booking, DayOfWeek, Facility, Period, Teacher, UserSession } from '../types/schedule';
import { checkBookingConflict } from '../utils/storage';
import { DAYS_OF_WEEK, SAMPLE_CLASSES, SAMPLE_SUBJECTS } from '../data/defaultData';
import { getJpTimeRangeLabel, getIndonesianDayFromDateString, getJpNumber, timeToMinutes, getBookingTimeRangeLabel } from '../utils/timeUtils';

const PRESET_CUSTOM_TIMES = [
  { label: 'Sore / Ekskul', start: '14:30', end: '16:30' },
  { label: 'Pagi Pra-KBM', start: '06:30', end: '07:15' },
  { label: 'Siang Istirahat', start: '11:40', end: '13:00' },
  { label: 'Pelatihan / Rapat', start: '13:30', end: '15:30' },
  { label: 'Sore Lanjutan', start: '15:30', end: '17:00' },
];

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
  teachers = [],
  currentUser,
}) => {
  const [teacherName, setTeacherName] = useState('');
  const [isManualTeacher, setIsManualTeacher] = useState(false);
  const isAdmin = currentUser?.role === 'admin';
  const [subject, setSubject] = useState('Informatika');
  const [customSubject, setCustomSubject] = useState('');
  const [className, setClassName] = useState('');
  const [customClass, setCustomClass] = useState('');
  const [facility, setFacility] = useState<Facility | ''>('');
  const [day, setDay] = useState<DayOfWeek>('Senin');
  const [startJp, setStartJp] = useState<number>(1);
  const [endJp, setEndJp] = useState<number>(2);
  const [timeType, setTimeType] = useState<'jp' | 'custom'>('jp');
  const [customStartTime, setCustomStartTime] = useState<string>('14:30');
  const [customEndTime, setCustomEndTime] = useState<string>('16:30');
  const [notes, setNotes] = useState('');
  const [sharedLabAcknowledged, setSharedLabAcknowledged] = useState(false);

  // Dynamic subjects from registered teachers
  const dynamicTeacherSubjects = useMemo(() => {
    const list = teachers
      .map((t) => t.subject?.trim())
      .filter((s): s is string => Boolean(s) && !SAMPLE_SUBJECTS.includes(s));
    return Array.from(new Set(list));
  }, [teachers]);

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
      setTeacherName(editingBooking.teacherName);
      const isKnownInDb = teachers.some(
        (t) => t.name.toLowerCase().trim() === editingBooking.teacherName.toLowerCase().trim()
      );
      setIsManualTeacher(!isKnownInDb && teachers.length > 0);

      const targetSub = editingBooking.subject;
      if (SAMPLE_SUBJECTS.includes(targetSub) || dynamicTeacherSubjects.includes(targetSub)) {
        setSubject(targetSub);
        setCustomSubject('');
      } else {
        setSubject('CUSTOM');
        setCustomSubject(targetSub);
      }
      if (SAMPLE_CLASSES.includes(editingBooking.className)) {
        setClassName(editingBooking.className);
        setCustomClass('');
      } else if (editingBooking.className === 'Tanpa Kelas') {
        setClassName('Tanpa Kelas');
        setCustomClass('');
      } else {
        setClassName('CUSTOM');
        setCustomClass(editingBooking.className);
      }
      setFacility(editingBooking.facility);
      setDay(editingBooking.day);
      setBookingDate(editingBooking.bookingDate || getTodayDateStr());
      setTimeType(editingBooking.timeType || (editingBooking.customStartTime ? 'custom' : 'jp'));
      setCustomStartTime(editingBooking.customStartTime || '14:30');
      setCustomEndTime(editingBooking.customEndTime || '16:30');
      setStartJp(editingBooking.startJp || 1);
      setEndJp(editingBooking.endJp || 1);
      setNotes(editingBooking.notes || '');
      setSharedLabAcknowledged(!!editingBooking.sharedLabAcknowledgment);
    } else {
      // Find matching teacher in teachers list if currentUser exists and is a teacher
      const isTeacherRole = currentUser?.role === 'guru';
      const matchedTeacher = isTeacherRole
        ? teachers.find(
            (t) =>
              (currentUser?.teacherId && t.id === currentUser.teacherId) ||
              t.name.toLowerCase().trim() === (currentUser?.name || '').toLowerCase().trim()
          )
        : null;

      const defaultTeacherName = isTeacherRole ? (currentUser?.name || '') : '';
      const defaultSub = matchedTeacher?.subject || (isTeacherRole ? currentUser?.subject : '') || 'Informatika';

      setTeacherName(defaultTeacherName);
      setIsManualTeacher(false);

      if (SAMPLE_SUBJECTS.includes(defaultSub) || dynamicTeacherSubjects.includes(defaultSub)) {
        setSubject(defaultSub);
        setCustomSubject('');
      } else {
        setSubject('CUSTOM');
        setCustomSubject(defaultSub);
      }

      // Default kelas kosong & fasilitas tanpa memilih
      setClassName('');
      setCustomClass('');
      setFacility('');

      const todayStr = getTodayDateStr();
      setBookingDate(todayStr);
      setDay(getIndonesianDayFromDateString(todayStr));
      setTimeType('jp');
      setCustomStartTime('14:30');
      setCustomEndTime('16:30');
      setStartJp(1);
      setEndJp(2);
      setNotes('');
      setSharedLabAcknowledged(false);
    }
  }, [editingBooking, defaultFacility, isOpen, currentUser, teachers, dynamicTeacherSubjects]);

  // When teacher name changes, auto-set subject if matched with a registered teacher
  const handleTeacherNameChange = (val: string) => {
    setTeacherName(val);

    const matched = teachers.find(
      (t) => t.name.toLowerCase().trim() === val.toLowerCase().trim()
    );
    if (matched && matched.subject) {
      const targetSub = matched.subject.trim();
      if (SAMPLE_SUBJECTS.includes(targetSub) || dynamicTeacherSubjects.includes(targetSub)) {
        setSubject(targetSub);
        setCustomSubject('');
      } else {
        setSubject('CUSTOM');
        setCustomSubject(targetSub);
      }
    }
  };

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

  // Real-time conflict evaluation (evaluated only when facility is selected)
  const conflictResult = facility
    ? checkBookingConflict(
        {
          teacherName: teacherName.trim() || 'Pengajar',
          subject: finalSubject || 'Mata Pelajaran',
          className: finalClassName || 'Kelas',
          facility: facility as Facility,
          day,
          bookingDate,
          startJp: timeType === 'custom' ? 0 : startJp,
          endJp: timeType === 'custom' ? 0 : endJp,
          timeType,
          customStartTime: timeType === 'custom' ? customStartTime : undefined,
          customEndTime: timeType === 'custom' ? customEndTime : undefined,
          notes,
        },
        existingBookings,
        activeDayPeriods,
        editingBooking?.id
      )
    : { hasConflict: false, conflictType: 'NONE' as const, message: '' };

  const hasBlockingConflict = conflictResult.hasConflict;
  const hasCoLocationNotice = conflictResult.conflictType === 'COLOCATION_SHARED';

  // Progressive filling flags (each step is locked until the previous one is completed)
  const isStep1Complete = Boolean(teacherName.trim());
  const isStep2Complete = isStep1Complete && Boolean(finalSubject);
  const isStep3Complete = isStep2Complete && Boolean(finalClassName);
  const isStep4Complete = isStep3Complete && Boolean(facility);
  const isStep5Complete = isStep4Complete && Boolean(bookingDate);
  const isStep6Complete = isStep5Complete && (
    timeType === 'jp'
      ? (startJp >= 1 && endJp >= startJp)
      : Boolean(customStartTime && customEndTime && timeToMinutes(customEndTime) > timeToMinutes(customStartTime))
  );

  const canSubmit = isStep1Complete && isStep2Complete && isStep3Complete && isStep4Complete && isStep5Complete && isStep6Complete && !hasBlockingConflict;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Nama Guru
    if (!teacherName.trim()) {
      alert('1. Mohon isi nama guru / pengajar.');
      return;
    }

    // 2. Mapel / Kegiatan
    if (!finalSubject) {
      alert('2. Mohon pilih atau masukkan mata pelajaran / kegiatan.');
      return;
    }

    // 3. Kelas (bisa kelas reguler atau Tanpa Kelas)
    if (!finalClassName) {
      alert('3. Mohon pilih kelas atau pilih "Tanpa Kelas".');
      return;
    }

    // 4. Fasilitas Laboratorium
    if (!facility) {
      alert('4. Mohon pilih fasilitas laboratorium (LABKOM 1 PID atau LABKOM 2).');
      return;
    }

    // 5. Tanggal Pelaksanaan
    if (!bookingDate) {
      alert('5. Mohon tentukan tanggal pelaksanaan.');
      return;
    }

    // 6. Pilihan Waktu Pemesanan
    if (timeType === 'custom') {
      if (!customStartTime || !customEndTime) {
        alert('6. Mohon isi jam mulai dan jam selesai (pukul).');
        return;
      }
      if (timeToMinutes(customEndTime) <= timeToMinutes(customStartTime)) {
        alert('Jam selesai harus lebih akhir dari jam mulai (contoh: 14:30 s/d 16:30).');
        return;
      }
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
        facility: facility as Facility,
        day,
        bookingDate,
        startJp: timeType === 'custom' ? 0 : startJp,
        endJp: timeType === 'custom' ? 0 : endJp,
        timeType,
        customStartTime: timeType === 'custom' ? customStartTime : undefined,
        customEndTime: timeType === 'custom' ? customEndTime : undefined,
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
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* 1. NAMA GURU / PENGAJAR */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Nama Guru / Pengajar *</span>
              </label>
              <div className="flex items-center gap-1.5">
                {isStep1Complete ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                    Wajib Diisi
                  </span>
                )}
                {currentUser?.role === 'guru' && (
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Akun Guru Aktif
                  </span>
                )}
              </div>
            </div>

            {isAdmin ? (
              /* Admin / Selection Mode: Dropdown from database or Manual Input */
              !isManualTeacher && teachers.length > 0 ? (
                <div className="space-y-1">
                  <select
                    value={teachers.some((t) => t.name === teacherName) ? teacherName : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__MANUAL__') {
                        setIsManualTeacher(true);
                        setTeacherName('');
                      } else {
                        handleTeacherNameChange(val);
                      }
                    }}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium transition-colors shadow-2xs ${
                      !teacherName ? 'border-amber-400 text-slate-500' : 'border-slate-300 text-slate-900 font-bold'
                    }`}
                  >
                    <option value="" disabled>-- Pilih Nama Guru dari Database ({teachers.length} Guru) * --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} {t.nip ? `(NIP. ${t.nip})` : ''} — {t.subject || 'Guru'}
                      </option>
                    ))}
                    <option value="__MANUAL__" className="font-bold text-blue-900 bg-amber-50">
                      + Tulis Nama Guru Lain (Manual)
                    </option>
                  </select>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5">
                    <span>Admin dapat memilih guru dari database atau mengetik manual.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualTeacher(true);
                        setTeacherName('');
                      }}
                      className="text-blue-700 hover:text-blue-900 underline font-semibold cursor-pointer"
                    >
                      Ketik manual
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={teacherName}
                      onChange={(e) => handleTeacherNameChange(e.target.value)}
                      placeholder="Ketik nama guru pengajar..."
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-900 shadow-2xs"
                    />
                    {teachers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManualTeacher(false)}
                        className="px-2.5 py-1.5 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition-colors shrink-0 cursor-pointer"
                      >
                        Pilih dari Database ({teachers.length})
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 px-0.5">
                    Mode input nama manual untuk admin.
                  </p>
                </div>
              )
            ) : (
              /* Non-Admin (Guru): Locked to their account name, cannot choose others */
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-900 font-bold">
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="flex-1 truncate">{teacherName || currentUser?.name || 'Guru Pengampu'}</span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
                    Terkunci (Akun Anda)
                  </span>
                </div>
                <input type="hidden" value={teacherName} />
                <p className="text-[10px] text-slate-500 px-0.5">
                  Nama pengajar terkunci otomatis sesuai akun guru Anda dan tidak dapat memilih guru lain.
                </p>
              </div>
            )}
          </div>

          {/* 2. MATA PELAJARAN / KEGIATAN */}
          <div className={`space-y-1.5 transition-all ${!isStep1Complete ? 'opacity-40 pointer-events-none select-none grayscale' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Mata Pelajaran / Kegiatan *</span>
              </label>
              {!isStep1Complete ? (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-400" /> Terkunci (Isi Langkah 1)
                </span>
              ) : isStep2Complete ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                  Wajib Dipilih
                </span>
              )}
            </div>
            <select
              disabled={!isStep1Complete}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-900 transition-colors shadow-2xs disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="CUSTOM" className="font-bold text-blue-900 bg-amber-50">
                + Kegiatan/Mapel Lain
              </option>
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
              {dynamicTeacherSubjects.length > 0 && (
                <optgroup label="Mata Pelajaran Guru Lainnya">
                  {dynamicTeacherSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Bimbingan & Pelayanan">
                <option value="Bimbingan Konseling (BK)">Bimbingan Konseling (BK)</option>
              </optgroup>
              <optgroup label="Asesmen, Latihan & Kegiatan">
                <option value="Asesmen / ANBK / Try Out">Asesmen / ANBK / Try Out</option>
                <option value="Latihan / Simulasi Digital">Latihan / Simulasi Digital</option>
                <option value="Ekstrakurikuler / Klub Komputer">Ekstrakurikuler / Klub Komputer</option>
                <option value="Pelatihan Guru / Rapat Sekolah">Pelatihan Guru / Rapat Sekolah</option>
              </optgroup>
            </select>

            {/* Form Input Kegiatan/Mapel Lain Dipindahkan ke Bawah (Tidak Sejajar) */}
            {subject === 'CUSTOM' && (
              <div className="pt-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-600 block">
                  Tulis Nama Kegiatan/Lain *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isStep1Complete}
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Tulis Nama Kegiatan/Lain"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-slate-900 shadow-2xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </div>

          {/* 3. KELAS */}
          <div className={`space-y-1 transition-all ${!isStep2Complete ? 'opacity-40 pointer-events-none select-none grayscale' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <span>3. Kelas *</span>
              </label>
              {!isStep2Complete ? (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-400" /> Terkunci (Isi Langkah 2)
                </span>
              ) : isStep3Complete ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai: {finalClassName}
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                  Wajib Dipilih
                </span>
              )}
            </div>
            <select
              disabled={!isStep2Complete}
              value={className}
              required
              onChange={(e) => setClassName(e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium transition-colors shadow-2xs disabled:bg-slate-100 disabled:cursor-not-allowed ${
                !className ? 'border-amber-400 text-slate-400' : 'border-slate-300 text-slate-900'
              }`}
            >
              <option value="" disabled>-- Pilih Kelas / Tanpa Kelas * --</option>
              <option value="Tanpa Kelas" className="font-bold text-blue-900 bg-blue-50">
                Tanpa Kelas
              </option>
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
              <option value="CUSTOM">+ Tulis Kelas Lain</option>
            </select>
            {className === 'CUSTOM' && (
              <div className="pt-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-600 block">
                  Tulis Nama Kelas *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isStep2Complete}
                  value={customClass}
                  onChange={(e) => setCustomClass(e.target.value)}
                  placeholder="Contoh: Gabungan VII A & B / Ekskul"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-slate-900 shadow-2xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </div>

          {/* 4. FASILITAS LABORATORIUM */}
          <div className={`space-y-1.5 transition-all ${!isStep3Complete ? 'opacity-40 pointer-events-none select-none grayscale' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>4. Fasilitas Laboratorium *</span>
              </label>
              {!isStep3Complete ? (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-400" /> Terkunci (Isi Langkah 3)
                </span>
              ) : !facility ? (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                  Wajib Dipilih
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terpilih: {facility}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['LABKOM 1 PID', 'LABKOM 2'] as Facility[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  disabled={!isStep3Complete}
                  onClick={() => setFacility(f)}
                  className={`py-2 px-3 rounded-xl text-xs font-black border transition-all text-center flex items-center justify-center gap-1.5 shadow-2xs disabled:cursor-not-allowed ${
                    facility === f
                      ? f === 'LABKOM 1 PID'
                        ? 'bg-blue-900 text-amber-300 border-2 border-amber-400 shadow-sm cursor-pointer'
                        : 'bg-emerald-700 text-white border-2 border-emerald-400 shadow-sm cursor-pointer'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      facility === f ? (f === 'LABKOM 1 PID' ? 'bg-amber-400' : 'bg-white') : 'bg-slate-300'
                    }`}
                  />
                  <span>{f}</span>
                </button>
              ))}
            </div>
            {facility === 'LABKOM 1 PID' && (
              <p className="text-[11px] text-blue-900 bg-blue-50 p-2 rounded-lg border border-blue-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span><strong>LABKOM 1 PID:</strong> 40 PC Siswa + Papan Interaktif Digital (IFP 75").</span>
              </p>
            )}
            {facility === 'LABKOM 2' && (
              <p className="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong>LABKOM 2:</strong> 20 PC Siswa + 8 Chromebook + 25 Tablet.</span>
              </p>
            )}
          </div>

          {/* 5. TANGGAL PELAKSANAAN (HARI OTOMATIS) */}
          <div className={`space-y-1 transition-all ${!isStep4Complete ? 'opacity-40 pointer-events-none select-none grayscale' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>5. Tanggal Pelaksanaan *</span>
              </label>
              {!isStep4Complete ? (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-400" /> Terkunci (Isi Langkah 4)
                </span>
              ) : (
                <span className="text-[11px] font-black text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Hari: {day} (Otomatis)
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="date"
                  required
                  disabled={!isStep4Complete}
                  value={bookingDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium shadow-2xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="sm:col-span-1">
                <div className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-100 text-slate-800 font-bold text-center flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hari {day}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. PILIHAN WAKTU PEMESANAN */}
          <div className={`space-y-1.5 pt-1 border-t border-slate-100 transition-all ${!isStep5Complete ? 'opacity-40 pointer-events-none select-none grayscale' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>6. Pilihan Waktu Pemesanan *</span>
              </label>
              {!isStep5Complete ? (
                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-400" /> Terkunci (Isi Langkah 5)
                </span>
              ) : isStep6Complete ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Waktu Terpilih
                </span>
              ) : (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                  Tentukan Jam
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                disabled={!isStep5Complete}
                onClick={() => setTimeType('jp')}
                className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 disabled:cursor-not-allowed ${
                  timeType === 'jp'
                    ? 'bg-blue-900 text-amber-300 shadow-xs border border-blue-800 cursor-pointer'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer'
                }`}
              >
                <span>Jam Pelajaran (JP)</span>
              </button>
              <button
                type="button"
                disabled={!isStep5Complete}
                onClick={() => setTimeType('custom')}
                className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 disabled:cursor-not-allowed ${
                  timeType === 'custom'
                    ? 'bg-blue-900 text-amber-300 shadow-xs border border-blue-800 cursor-pointer'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Jam Pukul / Di Luar Jam</span>
              </button>
            </div>
          </div>

          {/* JP MODE SELECTORS */}
          {timeType === 'jp' ? (
            <div className={`space-y-2.5 transition-all ${!isStep5Complete ? 'opacity-40 pointer-events-none select-none grayscale' : ''}`}>
              {/* Free Periods Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-600">
                <p className="font-semibold text-slate-800">Jam yang tersedia untuk fasilitas {facility || '-'}:</p>
                <p className="mt-0.5">
                  {facility && isStep5Complete ? (
                    availablePeriods
                      .filter((p, idx) => {
                        const jpNum = getJpNumber(p, idx);
                        return !existingBookings.some((b) => {
                          if (b.facility !== facility || b.day !== day) return false;
                          const dateA = bookingDate || '';
                          const dateB = b.bookingDate || '';
                          if (dateA && dateB && dateA !== dateB) return false;
                          if (b.timeType === 'custom') return false;
                          return jpNum >= b.startJp && jpNum <= b.endJp;
                        });
                      })
                      .map((p) => p.label)
                      .join(', ') || 'Tidak ada jam tersedia.'
                  ) : (
                    'Selesaikan langkah 4 (Fasilitas) dan 5 (Tanggal) untuk melihat ketersediaan jam.'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Jam Mulai *</span>
                  </label>
                  <select
                    disabled={!isStep5Complete}
                    value={startJp}
                    onChange={(e) => handleStartJpChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                    disabled={!isStep5Complete}
                    value={endJp}
                    onChange={(e) => handleEndJpChange(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono disabled:bg-slate-100 disabled:cursor-not-allowed"
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
            </div>
          ) : (
            /* CUSTOM CLOCK TIME (DI LUAR JAM) MODE */
            <div className={`space-y-2.5 transition-all ${!isStep5Complete ? 'opacity-40 pointer-events-none select-none grayscale' : ''}`}>
              <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-950 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Pemesanan Memakai Jam Pukul (Di Luar Jam Pelajaran)</span>
                </div>
                <p className="text-[10px] text-amber-800 leading-tight">
                  Gunakan opsi ini untuk memesan di luar jam KBM reguler (seperti ekskul, bimbingan, rapat guru, simulasi digital, atau kegiatan sore/akhir pekan).
                </p>

                {/* Quick Presets */}
                <div className="space-y-1 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-700 block">Pilihan Cepat Waktu:</span>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_CUSTOM_TIMES.map((pr) => {
                      const isSelected = customStartTime === pr.start && customEndTime === pr.end;
                      return (
                        <button
                          key={pr.label}
                          type="button"
                          disabled={!isStep5Complete}
                          onClick={() => {
                            setCustomStartTime(pr.start);
                            setCustomEndTime(pr.end);
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all border disabled:cursor-not-allowed ${
                            isSelected
                              ? 'bg-blue-900 text-amber-300 border-blue-900 shadow-2xs'
                              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100 cursor-pointer'
                          }`}
                        >
                          {pr.label} ({pr.start} - {pr.end})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Custom Time Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Jam Mulai (Pukul) *</span>
                  </label>
                  <input
                    type="time"
                    required
                    disabled={!isStep5Complete}
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Jam Selesai (Pukul) *</span>
                  </label>
                  <input
                    type="time"
                    required
                    disabled={!isStep5Complete}
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono font-bold disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Time Summary */}
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-[11px] text-slate-600 flex items-center justify-between font-mono">
            <span>Rentang Waktu:</span>
            <span className="font-bold text-blue-900">
              {timeType === 'custom'
                ? `Pukul ${customStartTime || '--:--'} - ${customEndTime || '--:--'} WIB (Di Luar Jam)`
                : getJpTimeRangeLabel(startJp, endJp, activeDayPeriods)}
            </span>
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

          {!hasBlockingConflict && !hasCoLocationNotice && isStep5Complete && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-[11px] text-emerald-900 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Jadwal tersedia tanpa bentrok.</span>
            </div>
          )}

          {/* Notes / Topic */}
          <div className={`space-y-1 transition-all ${!isStep5Complete ? 'opacity-40 pointer-events-none select-none grayscale' : ''}`}>
            <label className="font-bold text-slate-700 text-[11px]">
              Keterangan / Materi (Opsional)
            </label>
            <input
              type="text"
              disabled={!isStep5Complete}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Praktik Pemrograman Algoritma"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all shadow-xs flex items-center gap-1.5 ${
                !canSubmit
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 active:scale-95 cursor-pointer'
              }`}
            >
              {!isStep1Complete ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>1. Isi Nama Guru Dulu</span>
                </>
              ) : !isStep2Complete ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>2. Pilih Mapel / Kegiatan</span>
                </>
              ) : !isStep3Complete ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>3. Pilih Kelas / Tanpa Kelas</span>
                </>
              ) : !isStep4Complete ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>4. Pilih Fasilitas LAB</span>
                </>
              ) : !isStep5Complete ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>5. Tentukan Tanggal</span>
                </>
              ) : !isStep6Complete ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>6. Tentukan Jam Pemesanan</span>
                </>
              ) : hasBlockingConflict ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Jadwal Bentrok</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{editingBooking ? 'Simpan Perubahan' : 'Simpan Pemesanan'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

