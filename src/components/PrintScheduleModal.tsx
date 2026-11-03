import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  Filter,
  Calendar,
  Building2,
  FileText,
  Search,
  CheckCircle2,
  Download
} from 'lucide-react';
import { Booking, DayOfWeek, Facility, DayScheduleConfig } from '../types/schedule';
import { DAYS_OF_WEEK } from '../data/defaultData';

interface PrintScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  daySchedules: Record<DayOfWeek, DayScheduleConfig>;
}

export const PrintScheduleModal: React.FC<PrintScheduleModalProps> = ({
  isOpen,
  onClose,
  bookings,
  daySchedules,
}) => {
  const [selectedFacility, setSelectedFacility] = useState<Facility | 'SEMUA'>('SEMUA');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'SEMUA'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter only filled bookings matching criteria
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (selectedFacility !== 'SEMUA' && b.facility !== selectedFacility) {
          return false;
        }
        if (selectedDay !== 'SEMUA' && b.day !== selectedDay) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTeacher = b.teacherName.toLowerCase().includes(q);
          const matchSubject = b.subject.toLowerCase().includes(q);
          const matchClass = b.className.toLowerCase().includes(q);
          const matchNotes = b.notes?.toLowerCase().includes(q);
          if (!matchTeacher && !matchSubject && !matchClass && !matchNotes) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by day order
        const dayOrderA = DAYS_OF_WEEK.indexOf(a.day);
        const dayOrderB = DAYS_OF_WEEK.indexOf(b.day);
        if (dayOrderA !== dayOrderB) return dayOrderA - dayOrderB;

        // Then by facility
        if (a.facility !== b.facility) return a.facility.localeCompare(b.facility);

        // Then by start JP
        return a.startJp - b.startJp;
      });
  }, [bookings, selectedFacility, selectedDay, searchQuery]);

  if (!isOpen) return null;

  // Format time range for a booking based on day schedule
  const getTimeRange = (booking: Booking): string => {
    const dayConfig = daySchedules[booking.day];
    if (!dayConfig || !dayConfig.periods) return '';

    const startP = dayConfig.periods.find((p) => p.id === booking.startJp);
    const endP = dayConfig.periods.find((p) => p.id === booking.endJp);

    if (startP && endP) {
      return `${startP.startTime} - ${endP.endTime}`;
    }
    if (startP) {
      return `${startP.startTime} - ${startP.endTime}`;
    }
    return '';
  };

  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-[#0] z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Header Toolbar - Hidden in Print */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
              <Printer className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <span>Cetak Rekapitulasi Jadwal Terisi</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                  {filteredBookings.length} Sesi Terisi
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cetak dokumen fisik atau simpan sebagai file PDF jadwal penggunaan Labkom & PID yang terisi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer border border-amber-300 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar - Hidden in Print */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 no-print grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs shrink-0">
          {/* Facility Filter */}
          <div>
            <label className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Fasilitas Lab:</span>
            </label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="SEMUA">Semua Labkom (Lab 1 PID & Lab 2)</option>
              <option value="LABKOM 1 PID">LABKOM 1 PID (Fokus Utama)</option>
              <option value="LABKOM 2">LABKOM 2</option>
            </select>
          </div>

          {/* Day Filter */}
          <div>
            <label className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Hari:</span>
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="SEMUA">Semua Hari (Senin - Sabtu)</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  Hari {d}
                </option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>Cari Guru / Mapel / Kelas:</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Printable Paper Document Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white print:p-0 print:overflow-visible print:bg-white" id="printable-schedule-document">
          {/* Kop Surat Header (Official School Letterhead) */}
          <div className="text-center pb-4 mb-5 border-b-4 border-double border-slate-900 print:border-black">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 print:text-black">
              PEMERINTAH KABUPATEN CIAMIS · DINAS PENDIDIKAN
            </h3>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-blue-950 print:text-black mt-0.5">
              SMP NEGERI 1 KAWALI
            </h1>
            <p className="text-[11px] text-slate-600 print:text-black mt-0.5">
              Jalan Siliwangi No. 248 Kawali, Kabupaten Ciamis, Jawa Barat 46253 · Email: smpn1kawali@gmail.sch.id
            </p>
          </div>

          {/* Document Title */}
          <div className="text-center mb-6">
            <h2 className="text-base sm:text-lg font-extrabold uppercase underline decoration-2 underline-offset-4 text-slate-900 print:text-black">
              REKAPITULASI JADWAL TERISI LABORATORIUM KOMPUTER & PID
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-600 print:text-black mt-1.5">
              <span>Fasilitas: <strong className="text-slate-900 print:text-black">{selectedFacility}</strong></span>
              <span>•</span>
              <span>Hari: <strong className="text-slate-900 print:text-black">{selectedDay}</strong></span>
              <span>•</span>
              <span>Dicetak Pada: <strong className="text-slate-900 print:text-black">{currentDateFormatted}</strong></span>
            </div>
          </div>

          {/* Table of Filled Schedule */}
          {filteredBookings.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 no-print">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Tidak ada jadwal yang terisi</p>
              <p className="text-xs text-slate-500 mt-1">
                Tidak ditemukan sesi penggunaan labkom terisi sesuai kriteria filter yang dipilih.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 uppercase font-black border-2 border-slate-900 print:bg-slate-200 print:border-black print:text-black">
                    <th className="py-2.5 px-3 border border-slate-900 text-center w-10">No</th>
                    <th className="py-2.5 px-3 border border-slate-900 w-24">Hari / Tanggal</th>
                    <th className="py-2.5 px-3 border border-slate-900 w-32">Jam Pelajaran (Waktu)</th>
                    <th className="py-2.5 px-3 border border-slate-900 w-28">Fasilitas</th>
                    <th className="py-2.5 px-3 border border-slate-900">Mata Pelajaran / Kegiatan</th>
                    <th className="py-2.5 px-3 border border-slate-900 w-20 text-center">Kelas</th>
                    <th className="py-2.5 px-3 border border-slate-900">Nama Guru / Pengajar</th>
                    <th className="py-2.5 px-3 border border-slate-900 w-32">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b, idx) => {
                    const jpText = b.startJp === b.endJp ? `JP ${b.startJp}` : `JP ${b.startJp} - ${b.endJp}`;
                    const timeRange = getTimeRange(b);

                    return (
                      <tr
                        key={b.id || idx}
                        className="border border-slate-900 hover:bg-slate-50 print:hover:bg-transparent"
                      >
                        <td className="py-2 px-3 border border-slate-900 text-center font-bold font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border border-slate-900 font-bold">
                          <div>Hari {b.day}</div>
                          {b.bookingDate && (
                            <div className="text-[10px] font-mono text-slate-500 print:text-black">
                              {b.bookingDate}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 border border-slate-900 font-medium">
                          <div className="font-bold text-blue-900 print:text-black">{jpText}</div>
                          {timeRange && (
                            <div className="text-[10px] font-mono text-slate-600 print:text-black">
                              ({timeRange})
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 border border-slate-900 font-bold">
                          <span className={b.facility === 'LABKOM 1 PID' ? 'text-blue-900 print:text-black' : 'text-emerald-900 print:text-black'}>
                            {b.facility}
                          </span>
                        </td>
                        <td className="py-2 px-3 border border-slate-900 font-bold text-slate-900 print:text-black">
                          {b.subject}
                        </td>
                        <td className="py-2 px-3 border border-slate-900 text-center font-bold">
                          {b.className}
                        </td>
                        <td className="py-2 px-3 border border-slate-900 font-semibold text-slate-900 print:text-black">
                          {b.teacherName}
                        </td>
                        <td className="py-2 px-3 border border-slate-900 text-[11px] text-slate-600 print:text-black">
                          {b.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Document Summary Stats */}
          <div className="mt-4 pt-3 flex flex-wrap justify-between items-center text-xs font-semibold text-slate-700 print:text-black border-t border-slate-300">
            <div>
              Total Jadwal Terisi: <strong className="text-slate-900 print:text-black">{filteredBookings.length} Sesi</strong>
            </div>
            <div>
              Dicetak via Sistem Terpadu LABKOM & PID SMPN 1 Kawali
            </div>
          </div>

          {/* Official Signature Section */}
          <div className="mt-12 pt-4 grid grid-cols-2 gap-8 text-xs text-center font-medium print:mt-10">
            <div>
              <p className="text-slate-600 print:text-black">Mengetahui,</p>
              <p className="font-bold text-slate-900 print:text-black">Kepala SMPN 1 Kawali</p>
              <div className="h-20"></div>
              <p className="font-bold text-slate-900 print:text-black underline">H. DADA, S.Pd., M.Pd.</p>
              <p className="text-[11px] text-slate-600 print:text-black">NIP. 19680512 199403 1 004</p>
            </div>

            <div>
              <p className="text-slate-600 print:text-black">Kawali, {currentDateFormatted}</p>
              <p className="font-bold text-slate-900 print:text-black">Pengelola Laboratorium Komputer</p>
              <div className="h-20"></div>
              <p className="font-bold text-slate-900 print:text-black underline">EGA, S.Kom.</p>
              <p className="text-[11px] text-slate-600 print:text-black">NIP. -</p>
            </div>
          </div>
        </div>

        {/* Footer Bar - Hidden in Print */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 no-print shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Format telah disesuaikan untuk standar ukuran kertas A4 / PDF.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Mulai Cetak</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
