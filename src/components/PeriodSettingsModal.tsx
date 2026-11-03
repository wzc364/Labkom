import React, { useState } from 'react';
import { X, Clock, Plus, Trash2, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Period } from '../types/schedule';
import { DEFAULT_PERIODS, FRIDAY_PERIODS } from '../data/defaultData';

interface PeriodSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  periods: Period[];
  onSavePeriods: (newPeriods: Period[]) => void;
}

export const PeriodSettingsModal: React.FC<PeriodSettingsModalProps> = ({
  isOpen,
  onClose,
  periods: initialPeriods,
  onSavePeriods,
}) => {
  const [periods, setPeriods] = useState<Period[]>(initialPeriods);
  const [durationPresetNotice, setDurationPresetNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdate = (index: number, field: keyof Period, value: any) => {
    const updated = [...periods];
    updated[index] = { ...updated[index], [field]: value };
    setPeriods(updated);
  };

  const handleAddPeriod = () => {
    const last = periods[periods.length - 1];
    const newId = periods.length + 1;
    const newPeriod: Period = {
      id: newId,
      label: `JP ${newId}`,
      startTime: last ? last.endTime : '13:50',
      endTime: '14:30',
      isBreak: false,
    };
    setPeriods([...periods, newPeriod]);
  };

  const handleRemovePeriod = (index: number) => {
    if (periods.length <= 1) {
      alert('Minimal harus ada 1 sesi jam pelajaran.');
      return;
    }
    const updated = periods.filter((_, i) => i !== index);
    setPeriods(updated);
  };

  const applyPreset40Min = () => {
    setPeriods(DEFAULT_PERIODS);
    setDurationPresetNotice('Preset 40 Menit (Bawaan SMPN 1 Kawali) diterapkan.');
    setTimeout(() => setDurationPresetNotice(null), 3000);
  };

  const applyPreset45Min = () => {
    const preset45: Period[] = [
      { id: 1, label: 'JP 1', startTime: '07:15', endTime: '08:00' },
      { id: 2, label: 'JP 2', startTime: '08:00', endTime: '08:45' },
      { id: 3, label: 'JP 3', startTime: '08:45', endTime: '09:30' },
      { id: 4, label: 'Istirahat 1', startTime: '09:30', endTime: '09:50', isBreak: true },
      { id: 5, label: 'JP 4', startTime: '09:50', endTime: '10:35' },
      { id: 6, label: 'JP 5', startTime: '10:35', endTime: '11:20' },
      { id: 7, label: 'Istirahat 2 (Dzuhur)', startTime: '11:20', endTime: '12:20', isBreak: true },
      { id: 8, label: 'JP 6', startTime: '12:20', endTime: '13:05' },
      { id: 9, label: 'JP 7', startTime: '13:05', endTime: '13:50' },
    ];
    setPeriods(preset45);
    setDurationPresetNotice('Preset 45 Menit diterapkan.');
    setTimeout(() => setDurationPresetNotice(null), 3000);
  };

  const applyPresetFriday = () => {
    setPeriods(FRIDAY_PERIODS);
    setDurationPresetNotice('Preset Khusus Hari Jumat diterapkan.');
    setTimeout(() => setDurationPresetNotice(null), 3000);
  };

  const handleSave = () => {
    onSavePeriods(periods);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pengaturan Waktu Jam Pelajaran (JP)
              </h2>
              <p className="text-xs text-slate-500">
                Sesuaikan jam mulai dan selesai setiap JP di SMPN 1 Kawali
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-700">Preset Cepat:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={applyPreset40Min}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-800 shadow-2xs transition-colors"
            >
              Standar 40 Menit
            </button>
            <button
              onClick={applyPreset45Min}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-800 shadow-2xs transition-colors"
            >
              Standar 45 Menit
            </button>
            <button
              onClick={applyPresetFriday}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-800 shadow-2xs transition-colors"
            >
              Khusus Hari Jumat
            </button>
          </div>
        </div>

        {durationPresetNotice && (
          <div className="mx-5 mt-3 p-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-blue-600" />
            <span>{durationPresetNotice}</span>
          </div>
        )}

        {/* Period Rows */}
        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-2">
          {periods.map((p, index) => (
            <div
              key={p.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                p.isBreak ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 w-36">
                <span className="font-mono text-slate-400 font-semibold w-6">#{p.id}</span>
                <input
                  type="text"
                  value={p.label}
                  onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                  className="font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 w-24 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 font-mono">
                <input
                  type="time"
                  value={p.startTime}
                  onChange={(e) => handleUpdate(index, 'startTime', e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="time"
                  value={p.endTime}
                  onChange={(e) => handleUpdate(index, 'endTime', e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 text-[11px]">
                  <input
                    type="checkbox"
                    checked={!!p.isBreak}
                    onChange={(e) => handleUpdate(index, 'isBreak', e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Istirahat</span>
                </label>

                <button
                  onClick={() => handleRemovePeriod(index)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  title="Hapus JP ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddPeriod}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 mt-3"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jam Pelajaran Baru</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={applyPreset40Min}
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan (40 Menit)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Simpan Pengaturan Jam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
