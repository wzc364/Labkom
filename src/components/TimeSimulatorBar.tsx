import React from 'react';
import { Clock, Play, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { DayOfWeek, Period } from '../types/schedule';
import { getCurrentPeriod } from '../utils/timeUtils';
import { DAYS_OF_WEEK } from '../data/defaultData';

interface TimeSimulatorBarProps {
  currentDate: Date;
  effectiveDay: DayOfWeek;
  effectiveTimeStr: string;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  simulatedDay: DayOfWeek;
  setSimulatedDay: (day: DayOfWeek) => void;
  simulatedTime: string;
  setSimulatedTime: (time: string) => void;
  periods: Period[];
}

export const TimeSimulatorBar: React.FC<TimeSimulatorBarProps> = ({
  effectiveDay,
  effectiveTimeStr,
  isSimulating,
  setIsSimulating,
  simulatedDay,
  setSimulatedDay,
  simulatedTime,
  setSimulatedTime,
  periods,
}) => {
  const currentPeriod = getCurrentPeriod(effectiveTimeStr, periods);

  const presets = [
    { label: 'JP 1 (07:30)', time: '07:30' },
    { label: 'JP 2 (08:15)', time: '08:15' },
    { label: 'JP 4 (10:00)', time: '10:00' },
    { label: 'Istirahat (11:50)', time: '11:50' },
    { label: 'JP 7 (12:45)', time: '12:45' },
  ];

  return (
    <div className="bg-blue-950 text-white border-b border-blue-900 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Real-time Indicator & Current Session */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 font-mono tabular-nums bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-white tracking-wide">{effectiveDay}, {effectiveTimeStr} WIB</span>
              {isSimulating && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-sans font-medium">
                  Mode Simulasi
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <span>Status KBM:</span>
              {currentPeriod ? (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  currentPeriod.isBreak
                    ? 'bg-amber-900/60 text-amber-200 border border-amber-700/60'
                    : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/60'
                }`}>
                  {currentPeriod.label} ({currentPeriod.startTime} - {currentPeriod.endTime})
                </span>
              ) : (
                <span className="text-slate-400 italic">Di luar jam KBM aktif</span>
              )}
            </div>
          </div>

          {/* Time simulation controls */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            {!isSimulating ? (
              <button
                onClick={() => {
                  setIsSimulating(true);
                  setSimulatedDay('Senin');
                  setSimulatedTime('08:15');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors"
                title="Coba simulasi jam KBM untuk melihat tampilan jadwal aktif"
              >
                <Play className="w-3 h-3 text-blue-400" />
                <span>Uji Coba Waktu KBM</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700 w-full sm:w-auto">
                <span className="text-xs text-amber-300 font-medium hidden sm:inline">Simulasi:</span>
                
                {/* Day selector */}
                <select
                  value={simulatedDay}
                  onChange={(e) => setSimulatedDay(e.target.value as DayOfWeek)}
                  className="bg-slate-900 text-white border border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Time input */}
                <input
                  type="time"
                  value={simulatedTime}
                  onChange={(e) => setSimulatedTime(e.target.value)}
                  className="bg-slate-900 text-white border border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                />

                {/* Quick presets */}
                <div className="hidden md:flex items-center gap-1">
                  {presets.map((p) => (
                    <button
                      key={p.time}
                      onClick={() => setSimulatedTime(p.time)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        simulatedTime === p.time
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Reset button */}
                <button
                  onClick={() => setIsSimulating(false)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors ml-auto sm:ml-0"
                  title="Kembali ke jam nyata"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Waktu Nyata</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Firebase Server Status Banner */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>
              <strong className="text-emerald-300">Server Firebase Aktif:</strong> Database Firestore terhubung secara real-time. Setiap pemesanan langsung tersimpan dan tersinkronisasi antar-perangkat guru.
            </span>
          </div>
          <div className="text-slate-400 text-right sm:text-left">
            <span>Standar JP awal: 40 Menit (Dapat diatur di menu Pengaturan Jam)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
