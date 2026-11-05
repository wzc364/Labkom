import React, { useState } from 'react';
import { Search, Trash2, Edit2, Plus, Download, Upload, RotateCcw, AlertCircle, FileText, Check, Lock } from 'lucide-react';
import { Booking, DayOfWeek, Facility, Period, UserSession } from '../types/schedule';
import { DAYS_OF_WEEK } from '../data/defaultData';
import { getJpTimeRangeLabel, formatDateToIndonesianShort, getBookingTimeRangeLabel } from '../utils/timeUtils';
import { exportDataAsJson, importDataFromJson, resetToDefaultData } from '../utils/storage';

interface BookingManagementProps {
  bookings: Booking[];
  periods: Period[];
  onOpenBookingModal: () => void;
  onEditBooking: (booking: Booking) => void;
  onDeleteBooking: (id: string) => void;
  onResetData: () => void;
  onImportSuccess: (bookings: Booking[], periods: Period[]) => void;
  currentUser?: UserSession | null;
}

export const BookingManagement: React.FC<BookingManagementProps> = ({
  bookings,
  periods,
  onOpenBookingModal,
  onEditBooking,
  onDeleteBooking,
  onResetData,
  onImportSuccess,
  currentUser,
}) => {
  const [search, setSearch] = useState('');
  const [filterFacility, setFilterFacility] = useState<Facility | 'SEMUA'>('SEMUA');
  const [filterDay, setFilterDay] = useState<DayOfWeek | 'SEMUA'>('SEMUA');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const filtered = bookings.filter((b) => {
    if (filterFacility !== 'SEMUA' && b.facility !== filterFacility) return false;
    if (filterDay !== 'SEMUA' && b.day !== filterDay) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.teacherName.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q) ||
        b.className.toLowerCase().includes(q) ||
        (b.notes || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const jsonStr = exportDataAsJson(bookings, periods);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal-labkom-pid-smpn1kawali-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataFromJson(content);
      if (res.success && res.bookings && res.periods) {
        onImportSuccess(res.bookings, res.periods);
        setImportNotice(res.message);
        setTimeout(() => setImportNotice(null), 4000);
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner and actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Daftar & Manajemen Pemesanan Jadwal
            </h2>
            <p className="text-xs text-slate-500">
              Kelola seluruh pemesanan LABKOM 1, LABKOM 2, dan PID SMPN 1 Kawali. Data tersimpan di browser Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
              title="Ekspor seluruh data pemesanan ke file JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Impor JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                if (window.confirm('Reset semua data ke contoh bawaan SMPN 1 Kawali?')) {
                  onResetData();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
              title="Kembalikan data ke jadwal contoh awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Contoh Data</span>
            </button>

            <button
              onClick={onOpenBookingModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Pesan Jadwal Baru</span>
            </button>
          </div>
        </div>

        {importNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importNotice}</span>
          </div>
        )}

        {/* Filters and search */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-600 block mb-1">Cari:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari guru, kelas, mapel..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Filter Fasilitas:</label>
            <select
              value={filterFacility}
              onChange={(e) => setFilterFacility(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="SEMUA">Semua Fasilitas</option>
              <option value="LABKOM 1 PID">LABKOM 1 PID</option>
              <option value="LABKOM 2">LABKOM 2</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Filter Hari:</label>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="SEMUA">Semua Hari</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Menampilkan <strong>{filtered.length}</strong> dari total {bookings.length} pemesanan</span>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Hari & Jam</th>
                  <th className="py-3 px-4">Fasilitas</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Nama Pengajar</th>
                  <th className="py-3 px-4">Mata Pelajaran & Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => {
                  const isLab1Pid = b.facility === 'LABKOM 1 PID';
                  const timeLabel = getBookingTimeRangeLabel(b, periods);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-900 font-sans flex items-center gap-1">
                          <span>{b.day}</span>
                          {b.bookingDate && (
                            <span className="text-[11px] font-normal text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              {formatDateToIndonesianShort(b.bookingDate)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{timeLabel}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded font-bold text-[11px] ${
                          isLab1Pid
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {b.facility}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-sm text-slate-900">
                          {b.className}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 text-xs">
                          {b.teacherName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-semibold text-slate-900">{b.subject}</div>
                        {b.notes && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            "{b.notes}"
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {(() => {
                          const isOwner = currentUser?.role === 'admin' || !currentUser || b.teacherName === currentUser.name;
                          if (!isOwner) {
                            return (
                              <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] italic" title="Hanya dapat diubah oleh pemilik jadwal">
                                <Lock className="w-3 h-3" /> Milik Guru Lain
                              </span>
                            );
                          }
                          return deleteConfirmId === b.id ? (
                            <div className="inline-flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-200">
                              <span className="text-[10px] text-red-700 font-bold px-1">Yakin hapus?</span>
                              <button
                                onClick={() => {
                                  onDeleteBooking(b.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                              >
                                Ya
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => onEditBooking(b)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Ubah Pemesanan"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(b.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Hapus Pemesanan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada pemesanan yang cocok dengan kriteria filter.
          </div>
        )}
      </div>
    </div>
  );
};
