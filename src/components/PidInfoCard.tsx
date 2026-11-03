import React from 'react';
import { Tv, Sparkles, MapPin, Layers, CheckCircle2, MonitorPlay, Laptop } from 'lucide-react';

interface PidInfoCardProps {
  compact?: boolean;
  onBookPid?: () => void;
}

export const PidInfoCard: React.FC<PidInfoCardProps> = ({ compact = false, onBookPid }) => {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-xl p-2.5 sm:p-3.5 text-xs text-blue-950 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-900 text-amber-400 rounded-lg shrink-0">
            <Tv className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-extrabold text-blue-950 text-xs sm:text-sm">
                Integrasi LABKOM 1 PID
              </span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded shadow-2xs">
                35 PC + 2 Server + 1 IFP
              </span>
            </div>
            <p className="text-[11px] text-slate-600 truncate sm:whitespace-normal mt-0.5">
              LABKOM 1 & PID digabung. Setiap pemesanan mencakup 35 PC Komputer Siswa, 2 Server UNBK/ANBK, & Papan Interaktif Digital (1 IFP 75" 4K).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: Visual image */}
        <div className="lg:col-span-5 relative bg-slate-900 min-h-[260px] lg:min-h-[380px] overflow-hidden">
          <img
            src="/src/assets/images/pid_interactive_panel_1793594372578.jpg"
            alt="Papan Interaktif Digital SMPN 1 Kawali"
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent flex flex-col justify-end p-6 text-white">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/90 text-white text-xs font-semibold w-max mb-2 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Flat Panel (IFP) 75" Terintegrasi</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Fasilitas Terpadu LABKOM 1 PID
            </h3>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Lokasi: Gedung Multimedia</span>
            </p>
          </div>
        </div>

        {/* Right Column: Educational Breakdown */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">
                Informasi Fasilitas Laboratorium
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Fasilitas LABKOM 1 PID & LABKOM 2
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Di SMPN 1 Kawali, penjadwalan fasilitas komputer kini disederhanakan menjadi 2 pilihan utama:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-1">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span>LABKOM 1 PID</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Laboratorium Komputer 1 lengkap dengan 35 PC client siswa, 2 server, serta Papan Interaktif Digital (1 IFP 75") di dinding presentasi utama.
                  </p>
                </div>
                <div className="mt-3 text-[11px] text-blue-800 font-medium">
                  Gedung Multimedia · 35 PC + 2 Server + 1 IFP
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-1">
                    <MonitorPlay className="w-4 h-4 text-emerald-600" />
                    <span>LABKOM 2</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Laboratorium Komputer 2 lengkap dengan 20 PC Client, 8 Chromebook, dan 25 Tablet untuk asesmen digital, pengetikan, dan riset pembelajaran.
                  </p>
                </div>
                <div className="mt-3 text-[11px] text-emerald-800 font-medium">
                  Gedung Multimedia · 20 PC + 8 Chromebook + 25 Tablet
                </div>
              </div>
            </div>

            {/* Crucial distinction rule box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Keuntungan Penggabungan LABKOM 1 PID:
              </span>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>
                    <strong>Satu Pemesanan untuk Semua:</strong> Guru tidak perlu lagi memesan PID dan ruang lab secara terpisah.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>
                    <strong>Tidak Ada Bentrok Ganda:</strong> Menjamin satu kelas menggunakan ruangan dan perangkat secara eksklusif dan tenang.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {onBookPid && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Siap menggunakan LABKOM 1 PID untuk pembelajaran interaktif?
              </span>
              <button
                onClick={onBookPid}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Pesan LABKOM 1 PID</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
