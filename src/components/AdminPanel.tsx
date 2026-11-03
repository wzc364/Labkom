import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  Copy,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Coffee,
  BookOpen,
  Info,
  Tv,
  Printer,
  Users,
  Image,
} from 'lucide-react';
import { Booking, DayOfWeek, Period, DayScheduleConfig, Teacher } from '../types/schedule';
import { DAYS_OF_WEEK, DEFAULT_DAY_SCHEDULES } from '../data/defaultData';
import { timeToMinutes, minutesToTime } from '../utils/timeUtils';
import { PrintScheduleModal } from './PrintScheduleModal';
import { TeacherManagement } from './TeacherManagement';
import { HeaderLogoSettings, HeaderLogoConfig, DEFAULT_LOGO_CONFIG } from './HeaderLogoSettings';

interface AdminPanelProps {
  daySchedules: Record<DayOfWeek, DayScheduleConfig>;
  onSaveDaySchedule: (config: DayScheduleConfig) => Promise<void>;
  onClose: () => void;
  onLogout?: () => void;
  isFirebaseConnected?: boolean;
  onOpenTvMode?: () => void;
  bookings?: Booking[];
  teachers?: Teacher[];
  onSaveTeacher?: (teacher: Teacher) => Promise<void>;
  onDeleteTeacher?: (teacherId: string) => Promise<void>;
  headerLogo?: HeaderLogoConfig | null;
  onSaveHeaderLogo?: (config: HeaderLogoConfig) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  daySchedules,
  onSaveDaySchedule,
  onClose,
  onLogout,
  isFirebaseConnected = true,
  onOpenTvMode,
  bookings = [],
  teachers = [],
  onSaveTeacher,
  onDeleteTeacher,
  headerLogo,
  onSaveHeaderLogo,
}) => {
  const [adminSubTab, setAdminSubTab] = useState<'schedules' | 'teachers' | 'logo'>('schedules');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Senin');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [currentConfig, setCurrentConfig] = useState<DayScheduleConfig>(() => {
    return daySchedules['Senin'] || {
      day: 'Senin',
      totalHours: 8,
      periods: DEFAULT_DAY_SCHEDULES['Senin'].periods,
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Quick generator parameters
  const [generatorStartTime, setGeneratorStartTime] = useState('07:20');
  const [generatorDuration, setGeneratorDuration] = useState(40);
  const [showGenerator, setShowGenerator] = useState(false);

  // When switching day tab
  const handleSelectDay = (day: DayOfWeek) => {
    setSelectedDay(day);
    const existing = daySchedules[day] || {
      day,
      totalHours: DEFAULT_DAY_SCHEDULES[day]?.totalHours || 8,
      periods: DEFAULT_DAY_SCHEDULES[day]?.periods || DEFAULT_DAY_SCHEDULES['Senin'].periods,
    };
    setCurrentConfig({ ...existing });
    setSaveSuccessNotice(null);
  };

  // Change total hours for the selected day (e.g. "hari senin misal hanya ada 8 jam")
  const handleChangeTotalHours = (newTotal: number) => {
    if (newTotal < 1 || newTotal > 12) return;

    // Filter current teaching periods vs breaks
    const teachingPeriods = currentConfig.periods.filter((p) => !p.isBreak);
    const currentBreaks = currentConfig.periods.filter((p) => p.isBreak);

    let updatedPeriods: Period[] = [];

    if (newTotal > teachingPeriods.length) {
      // Add more teaching JP
      const lastPeriod = currentConfig.periods[currentConfig.periods.length - 1];
      let startMin = lastPeriod ? timeToMinutes(lastPeriod.endTime) : 440; // 07:20
      const additionalCount = newTotal - teachingPeriods.length;

      const newJps: Period[] = [];
      for (let i = 1; i <= additionalCount; i++) {
        const nextId = teachingPeriods.length + i;
        const endMin = startMin + 40;
        newJps.push({
          id: nextId,
          label: `JP ${nextId}`,
          startTime: minutesToTime(startMin),
          endTime: minutesToTime(endMin),
          isBreak: false,
        });
        startMin = endMin;
      }
      updatedPeriods = [...currentConfig.periods, ...newJps];
    } else {
      // Trim teaching JP to newTotal
      let keepTeachingCount = 0;
      updatedPeriods = currentConfig.periods.filter((p) => {
        if (!p.isBreak) {
          keepTeachingCount++;
          return keepTeachingCount <= newTotal;
        }
        return true;
      });
    }

    // Re-index JP labels to keep numbering clean
    let jpCounter = 1;
    const reindexed = updatedPeriods.map((p) => {
      if (!p.isBreak) {
        const label = `JP ${jpCounter}`;
        jpCounter++;
        return { ...p, id: jpCounter - 1, label };
      }
      return p;
    });

    setCurrentConfig({
      ...currentConfig,
      totalHours: newTotal,
      periods: reindexed,
    });
  };

  // Update a single period's start, end, label, or break status
  const handleUpdatePeriod = (index: number, field: keyof Period, value: any) => {
    const updated = [...currentConfig.periods];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentConfig({ ...currentConfig, periods: updated });
  };

  // Add a new break / session row
  const handleAddBreak = () => {
    const last = currentConfig.periods[currentConfig.periods.length - 1];
    const startTime = last ? last.endTime : '09:20';
    const endMin = timeToMinutes(startTime) + 20;
    const endTime = minutesToTime(endMin);

    const newBreak: Period = {
      id: currentConfig.periods.length + 1,
      label: 'Istirahat',
      startTime,
      endTime,
      isBreak: true,
    };
    setCurrentConfig({
      ...currentConfig,
      periods: [...currentConfig.periods, newBreak],
    });
  };

  // Remove a row
  const handleRemovePeriod = (index: number) => {
    const target = currentConfig.periods[index];
    const updated = currentConfig.periods.filter((_, i) => i !== index);

    // If it was a teaching period, decrement total hours
    const newTotal = target.isBreak ? currentConfig.totalHours : Math.max(1, currentConfig.totalHours - 1);

    // Reindex
    let jpCounter = 1;
    const reindexed = updated.map((p) => {
      if (!p.isBreak) {
        const label = `JP ${jpCounter}`;
        jpCounter++;
        return { ...p, id: jpCounter - 1, label };
      }
      return p;
    });

    setCurrentConfig({
      ...currentConfig,
      totalHours: newTotal,
      periods: reindexed,
    });
  };

  // Auto-generate hours using start time & duration
  const handleAutoGenerate = () => {
    let currentMin = timeToMinutes(generatorStartTime);
    const newPeriods: Period[] = [];

    for (let i = 1; i <= currentConfig.totalHours; i++) {
      const endMin = currentMin + generatorDuration;
      newPeriods.push({
        id: i,
        label: `JP ${i}`,
        startTime: minutesToTime(currentMin),
        endTime: minutesToTime(endMin),
        isBreak: false,
      });
      currentMin = endMin;

      // Auto insert Istirahat 1 after JP 3
      if (i === 3 && currentConfig.totalHours > 3) {
        const breakEnd = currentMin + 20;
        newPeriods.push({
          id: i + 100, // break identifier
          label: 'Istirahat 1',
          startTime: minutesToTime(currentMin),
          endTime: minutesToTime(breakEnd),
          isBreak: true,
        });
        currentMin = breakEnd;
      }

      // Auto insert Istirahat 2 (Dzuhur) after JP 6
      if (i === 6 && currentConfig.totalHours > 6) {
        const breakEnd = currentMin + 45; // 45 mins for Dzuhur
        newPeriods.push({
          id: i + 200,
          label: 'Istirahat 2 (Dzuhur)',
          startTime: minutesToTime(currentMin),
          endTime: minutesToTime(breakEnd),
          isBreak: true,
        });
        currentMin = breakEnd;
      }
    }

    setCurrentConfig({
      ...currentConfig,
      periods: newPeriods,
    });
    setShowGenerator(false);
    setSaveSuccessNotice('Jadwal berhasil dihitung otomatis. Klik "Simpan Jadwal" untuk menerapkan ke server.');
  };

  // Save current day configuration to Firebase and Local
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveDaySchedule(currentConfig);
      setSaveSuccessNotice(`Jadwal hari ${selectedDay} berhasil disimpan ke Server Firebase!`);
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (err) {
      alert('Gagal menyimpan jadwal: ' + err);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy current day's schedule to other days
  const handleCopyToOtherDays = async (targetDays: DayOfWeek[]) => {
    if (!window.confirm(`Salin jadwal hari ${selectedDay} ke hari ${targetDays.join(', ')}?`)) return;

    setIsSaving(true);
    try {
      for (const tDay of targetDays) {
        await onSaveDaySchedule({
          ...currentConfig,
          day: tDay,
        });
      }
      setSaveSuccessNotice(`Jadwal berhasil disalin ke hari ${targetDays.join(', ')}!`);
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (err) {
      alert('Gagal menyalin jadwal: ' + err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border-b-4 border-amber-400 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white rounded-lg text-blue-900 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Panel Pengaturan Admin · SMPN 1 Kawali
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Panel Pengelolaan Admin SMPN 1 Kawali
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Atur konfigurasi jam pelajaran (JP) per hari dan kelola daftar guru pengampu serta mata pelajaran yang tersinkronisasi ke server Firestore.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-emerald-500 active:scale-95"
            title="Cetak jadwal yang terisi dalam format resmi A4 / PDF"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Cetak Jadwal Terisi</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-950/80 hover:bg-blue-800 text-blue-100 rounded-xl text-xs font-semibold transition-colors border border-blue-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-red-950/70 hover:bg-red-900 text-red-200 rounded-xl text-xs font-semibold transition-colors border border-red-800/80 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Keluar dari akun admin"
            >
              <span>Logout (ega)</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Navigation Sub-Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setAdminSubTab('schedules')}
          className={`flex-1 min-w-[200px] py-3 px-5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminSubTab === 'schedules'
              ? 'bg-blue-900 text-amber-300 shadow-md border-2 border-amber-400'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Pengaturan Jam Pelajaran (JP)</span>
        </button>

        <button
          onClick={() => setAdminSubTab('teachers')}
          className={`flex-1 min-w-[180px] py-3 px-5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminSubTab === 'teachers'
              ? 'bg-blue-900 text-amber-300 shadow-md border-2 border-amber-400'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Daftar Guru & Mapel</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
            {teachers.length}
          </span>
        </button>

        <button
          onClick={() => setAdminSubTab('logo')}
          className={`flex-1 min-w-[180px] py-3 px-5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            adminSubTab === 'logo'
              ? 'bg-blue-900 text-amber-300 shadow-md border-2 border-amber-400'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Image className="w-4 h-4 text-amber-400" />
          <span>Logo Header Sekolah</span>
        </button>
      </div>

      {adminSubTab === 'teachers' ? (
        <TeacherManagement
          teachers={teachers}
          onSaveTeacher={onSaveTeacher || (async () => {})}
          onDeleteTeacher={onDeleteTeacher || (async () => {})}
        />
      ) : adminSubTab === 'logo' ? (
        <HeaderLogoSettings
          logoConfig={headerLogo || DEFAULT_LOGO_CONFIG}
          onSaveLogo={onSaveHeaderLogo || (async () => {})}
        />
      ) : (
        <>
          {/* Admin Quick Action Cards: Mode TV Display & Cetak Jadwal */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode TV Display Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center shrink-0 shadow-sm border border-blue-800">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Mode TV Display Monitor</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Layar Penuh
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tampilkan monitor TV layar penuh Laboratorium Komputer & PID (Mendukung pilihan tampilan 1 Labkom atau 2 Labkom berdampingan).
              </p>
            </div>
          </div>
          {onOpenTvMode && (
            <button
              onClick={onOpenTvMode}
              className="w-full px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 hover:text-amber-200 font-bold rounded-xl text-xs transition-all shadow-sm border border-blue-800 flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-auto"
            >
              <Tv className="w-4 h-4 text-amber-400" />
              <span>Buka Display Mode TV</span>
            </button>
          )}
        </div>

        {/* Cetak Jadwal Terisi Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-emerald-100 flex items-center justify-center shrink-0 shadow-sm border border-emerald-800">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Cetak Rekapitulasi Jadwal Terisi</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  PDF / Hardcopy
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Cetak atau ekspor jadwal yang terisi ke format resmi A4 lengkap dengan Kop Surat SMPN 1 Kawali & tanda tangan pengelola lab.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="w-full px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm border border-emerald-500 flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-auto"
          >
            <Printer className="w-4 h-4 text-emerald-100" />
            <span>Cetak Jadwal Terisi (PDF)</span>
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveSuccessNotice}</span>
        </div>
      )}

      {/* Day Selector Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        {DAYS_OF_WEEK.map((d) => {
          const cfg = daySchedules[d] || DEFAULT_DAY_SCHEDULES[d];
          const isSelected = selectedDay === d;

          return (
            <button
              key={d}
              onClick={() => handleSelectDay(d)}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                isSelected
                  ? 'bg-blue-900 text-amber-300 border-2 border-amber-400 shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Hari {d}</span>
              </div>
              <span className={`text-[11px] font-medium ${isSelected ? 'text-amber-200' : 'text-slate-500'}`}>
                {cfg?.totalHours || 8} Jam Pelajaran
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Admin Config Box for Selected Day */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Row 1: Setting Total Jam for Selected Day */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Pengaturan Hari {selectedDay}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {currentConfig.totalHours} JP KBM
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Tentukan berapa jam pelajaran yang berlaku pada hari {selectedDay} (misal: 8 jam di hari Senin).
            </p>
          </div>

          {/* Total Jam Quick Selector */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 px-1">Total Jam:</span>
            {[4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleChangeTotalHours(num)}
                className={`w-9 h-8 rounded-lg text-xs font-bold transition-colors ${
                  currentConfig.totalHours === num
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {num}
              </button>
            ))}
            <span className="text-xs text-slate-500 ml-1">Jam</span>
          </div>
        </div>

        {/* Row 2: Automated Time Calculator Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs text-blue-950">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Alat Hitung Waktu Cepat:</strong> Hitung jam otomatis setiap 40 menit dari jam masuk.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!showGenerator ? (
              <button
                type="button"
                onClick={() => setShowGenerator(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-2xs"
              >
                Buka Pengisi Otomatis
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-lg border border-blue-200">
                <label className="font-semibold text-slate-700">Mulai Pukul:</label>
                <input
                  type="time"
                  value={generatorStartTime}
                  onChange={(e) => setGeneratorStartTime(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                />
                <label className="font-semibold text-slate-700 ml-2">Durasi JP:</label>
                <select
                  value={generatorDuration}
                  onChange={(e) => setGeneratorDuration(Number(e.target.value))}
                  className="border border-slate-300 rounded px-2 py-1 text-xs"
                >
                  <option value={35}>35 Menit</option>
                  <option value={40}>40 Menit (Standar)</option>
                  <option value={45}>45 Menit</option>
                </select>
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold transition-colors ml-1"
                >
                  Terapkan Hitungan
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerator(false)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Table / List of Periods (Jam ke-1 dari jam berapa s.d. jam berapa) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Jam Pelajaran & Jam Istirahat Hari {selectedDay}:
            </h3>
            <button
              type="button"
              onClick={handleAddBreak}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Sisipkan Jam Istirahat</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-16 text-center">No</th>
                  <th className="py-3 px-4 w-44">Label Sesi</th>
                  <th className="py-3 px-4 w-40">Jam Mulai</th>
                  <th className="py-3 px-4 w-40">Jam Selesai</th>
                  <th className="py-3 px-4 w-28 text-center">Durasi</th>
                  <th className="py-3 px-4 w-32">Kategori</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentConfig.periods.map((p, index) => {
                  const startM = timeToMinutes(p.startTime);
                  const endM = timeToMinutes(p.endTime);
                  const duration = Math.max(0, endM - startM);

                  return (
                    <tr
                      key={p.id + '-' + index}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        p.isBreak ? 'bg-amber-50/50' : 'bg-white'
                      }`}
                    >
                      {/* Number */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Label Sesi (e.g. JP 1, JP 2, Istirahat) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {p.isBreak ? (
                            <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <input
                            type="text"
                            value={p.label}
                            onChange={(e) => handleUpdatePeriod(index, 'label', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </td>

                      {/* Jam Mulai */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="time"
                            value={p.startTime}
                            onChange={(e) => handleUpdatePeriod(index, 'startTime', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </td>

                      {/* Jam Selesai */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="time"
                            value={p.endTime}
                            onChange={(e) => handleUpdatePeriod(index, 'endTime', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">
                        {duration} Menit
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-4">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!p.isBreak}
                            onChange={(e) => handleUpdatePeriod(index, 'isBreak', e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span className={p.isBreak ? 'text-amber-800 font-bold' : 'text-slate-600'}>
                            {p.isBreak ? 'Istirahat' : 'KBM'}
                          </span>
                        </label>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemovePeriod(index)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Copy to Other Days Toolbar */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 block">
              Salin Jadwal Hari {selectedDay} ke Hari Lain:
            </span>
            <span className="text-slate-500">
              Terapkan jam mulai & selesai yang sama ke hari lain dengan sekali klik.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCopyToOtherDays(['Selasa', 'Rabu', 'Kamis'])}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium transition-colors"
            >
              Salin ke Selasa, Rabu, Kamis
            </button>
            <button
              type="button"
              onClick={() => handleCopyToOtherDays(DAYS_OF_WEEK.filter((d) => d !== selectedDay))}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium transition-colors"
            >
              Salin ke Semua Hari
            </button>
          </div>
        </div>

        {/* Final Save Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-blue-500" />
            <span>
              Perubahan jadwal akan langsung berlaku pada form pemesanan dan dashboard monitor.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/30 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : `Simpan Jadwal Hari ${selectedDay}`}</span>
          </button>
        </div>
      </div>
      </>
      )}

      {/* Printable Schedule Modal */}

      <PrintScheduleModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        bookings={bookings}
        daySchedules={daySchedules}
      />
    </div>
  );
};
