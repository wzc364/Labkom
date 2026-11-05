import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  IdCard,
  User,
  Sparkles,
  Upload,
  FileText,
  ClipboardPaste,
  Layers,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Teacher } from '../types/schedule';
import { SAMPLE_SUBJECTS } from '../data/defaultData';

export interface ParsedTeacherItem {
  id: string;
  name: string;
  nip: string;
  subject: string;
}

interface TeacherManagementProps {
  teachers: Teacher[];
  onSaveTeacher: (teacher: Teacher) => Promise<void>;
  onSaveTeachersBulk?: (teachers: Teacher[]) => Promise<void>;
  onDeleteTeacher: (teacherId: string) => Promise<void>;
  onClearAllTeachers?: () => Promise<void>;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  onSaveTeacher,
  onSaveTeachersBulk,
  onDeleteTeacher,
  onClearAllTeachers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form State (Single)
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [subject, setSubject] = useState('Informatika');
  const [customSubject, setCustomSubject] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bulk Input State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkDefaultSubject, setBulkDefaultSubject] = useState('Guru Mata Pelajaran');
  const [bulkCustomSubject, setBulkCustomSubject] = useState('');
  const [parseMode, setParseMode] = useState<'alternating' | 'excel' | 'auto'>('alternating');
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  // Delete Confirmation State (Single)
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear All Confirmation State
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Parse bulk text into teachers
  const effectiveDefaultSubject = bulkDefaultSubject === 'CUSTOM'
    ? (bulkCustomSubject.trim() || 'Guru Mata Pelajaran')
    : bulkDefaultSubject;

  const parsedTeachers = useMemo<ParsedTeacherItem[]>(() => {
    if (!bulkRawText.trim()) return [];

    const rawLines = bulkRawText.split(/\r?\n/).map((l) => l.trim());

    // Check if mode is Excel / Tab separated or auto-detected with tabs
    const hasTabs = rawLines.some((l) => l.includes('\t'));
    if (parseMode === 'excel' || (parseMode === 'auto' && hasTabs)) {
      const results: ParsedTeacherItem[] = [];
      rawLines.forEach((line, idx) => {
        if (!line) return;
        const parts = line.split('\t').map((p) => p.trim());
        const name = parts[0] || '';
        const nip = parts[1] || '-';
        const subject = parts[2] || effectiveDefaultSubject;
        if (name) {
          results.push({
            id: `t-bulk-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            name,
            nip: nip || '-',
            subject,
          });
        }
      });
      return results;
    }

    // Default & requested format: Nama [Enter] NIP (alternating non-empty lines)
    const cleanLines = rawLines.filter((l) => l.length > 0);
    const results: ParsedTeacherItem[] = [];

    for (let i = 0; i < cleanLines.length; i += 2) {
      const name = cleanLines[i];
      const nip = cleanLines[i + 1] !== undefined ? cleanLines[i + 1] : '-';

      if (name) {
        results.push({
          id: `t-bulk-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          nip: nip || '-',
          subject: effectiveDefaultSubject,
        });
      }
    }

    return results;
  }, [bulkRawText, parseMode, effectiveDefaultSubject]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const newTeachers: Teacher[] = [];
      for (const row of jsonData) {
        const name = row['Nama'] || row['nama'];
        const nip = row['NIP'] || row['nip'] || '-';
        const subject = row['Mapel'] || row['mapel'] || 'Informatika';

        if (name) {
          newTeachers.push({
            id: `t-${Date.now()}-${Math.random()}`,
            name: String(name).trim(),
            nip: String(nip).trim(),
            subject: String(subject).trim(),
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (onSaveTeachersBulk && newTeachers.length > 0) {
        await onSaveTeachersBulk(newTeachers);
      } else {
        for (const t of newTeachers) {
          await onSaveTeacher(t);
        }
      }

      setNotice({ type: 'success', message: `${newTeachers.length} data guru berhasil diunggah.` });
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setNotice({ type: 'error', message: 'Gagal mengunggah file Excel: ' + String(err) });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleSaveBulk = async () => {
    if (parsedTeachers.length === 0) {
      alert('Tidak ada data guru yang valid untuk disimpan.');
      return;
    }

    setIsBulkSaving(true);
    try {
      const teachersToSave: Teacher[] = parsedTeachers.map((p) => ({
        id: p.id,
        name: p.name,
        nip: p.nip,
        subject: p.subject,
        createdAt: new Date().toISOString(),
      }));

      if (onSaveTeachersBulk) {
        await onSaveTeachersBulk(teachersToSave);
      } else {
        for (const t of teachersToSave) {
          await onSaveTeacher(t);
        }
      }

      setNotice({
        type: 'success',
        message: `Berhasil menambahkan ${teachersToSave.length} data guru secara massal!`,
      });
      setIsBulkModalOpen(false);
      setBulkRawText('');
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      setNotice({
        type: 'error',
        message: 'Gagal menyimpan bulk guru: ' + String(err),
      });
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleClearAllConfirm = async () => {
    if (!onClearAllTeachers) return;
    setIsClearingAll(true);
    try {
      await onClearAllTeachers();
      setIsClearAllModalOpen(false);
      setNotice({
        type: 'success',
        message: 'Seluruh data guru berhasil dikosongkan.',
      });
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setNotice({
        type: 'error',
        message: 'Gagal mengosongkan data guru: ' + String(err),
      });
    } finally {
      setIsClearingAll(false);
    }
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter((t) => {
    const query = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      (t.nip && t.nip.toLowerCase().includes(query)) ||
      t.subject.toLowerCase().includes(query)
    );
  });

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    setName('');
    setNip('');
    setSubject('Informatika');
    setCustomSubject('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setNip(teacher.nip === '-' ? '' : teacher.nip);
    if (SAMPLE_SUBJECTS.includes(teacher.subject)) {
      setSubject(teacher.subject);
      setCustomSubject('');
    } else {
      setSubject('CUSTOM');
      setCustomSubject(teacher.subject);
    }
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === 'CUSTOM' ? customSubject.trim() : subject;

    if (!name.trim()) {
      alert('Mohon isi nama lengkap guru.');
      return;
    }
    if (!finalSubject) {
      alert('Mohon pilih atau tulis mata pelajaran.');
      return;
    }

    setIsSaving(true);
    setNotice(null);

    const teacherData: Teacher = {
      id: editingTeacher ? editingTeacher.id : `t-${Date.now()}`,
      name: name.trim(),
      nip: nip.trim() || '-',
      subject: finalSubject,
      createdAt: editingTeacher?.createdAt || new Date().toISOString(),
    };

    try {
      await onSaveTeacher(teacherData);
      setIsModalOpen(false);
      setNotice({
        type: 'success',
        message: editingTeacher
          ? `Data guru "${teacherData.name}" berhasil diperbarui.`
          : `Guru baru "${teacherData.name}" berhasil ditambahkan.`,
      });
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setNotice({
        type: 'error',
        message: 'Gagal menyimpan data guru: ' + String(err),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!teacherToDelete) return;

    setIsDeleting(true);
    try {
      await onDeleteTeacher(teacherToDelete.id);
      setNotice({
        type: 'success',
        message: `Guru "${teacherToDelete.name}" berhasil dihapus.`,
      });
      setTeacherToDelete(null);
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setNotice({
        type: 'error',
        message: 'Gagal menghapus data guru: ' + String(err),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-800" />
              <span>Daftar Guru & Mata Pelajaran</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                {teachers.length} Guru
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Kelola data pengampu, NIP, serta Mata Pelajaran di SMPN 1 Kawali secara terstruktur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
            />

            {/* Bulk Input button - prominent */}
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2.5 bg-blue-800 hover:bg-blue-700 text-amber-300 hover:text-amber-200 font-bold rounded-xl text-xs transition-all shadow-sm border border-blue-700 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              title="Bulk Input banyak guru sekaligus format Nama [Enter] NIP"
            >
              <ClipboardPaste className="w-4 h-4 stroke-[2.5]" />
              <span>Bulk Input (Nama & NIP)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-sm border border-emerald-500 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>Unggah Excel</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold rounded-xl text-xs transition-all shadow-sm border border-blue-800 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Guru</span>
            </button>

            {onClearAllTeachers && teachers.length > 0 && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition-all border border-red-200 flex items-center justify-center gap-1.5 cursor-pointer"
                title="Hapus semua data guru untuk mengulang atau mengosongkan data bawaan"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari guru berdasarkan nama, NIP, atau mata pelajaran..."
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3 border shadow-xs ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{notice.message}</span>
        </div>
      )}

      {/* Teacher Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-900 text-slate-200 uppercase font-black tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Lengkap Guru</th>
                <th className="py-3.5 px-4 w-52">NIP (Nomor Induk Pegawai)</th>
                <th className="py-3.5 px-4 w-60">Mata Pelajaran</th>
                <th className="py-3.5 px-4 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="font-bold text-slate-600 text-sm">Tidak ada data guru ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchTerm ? 'Coba ubah kata kunci pencarian Anda.' : 'Klik "Tambah Guru Baru" untuk membuat entry data guru.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Index */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Nama Guru */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-black flex items-center justify-center shrink-0 border border-blue-200 text-xs">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block leading-snug">
                            {t.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* NIP */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <IdCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.nip || '-'}</span>
                      </div>
                    </td>

                    {/* Mata Pelajaran */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300 shadow-2xs">
                        <BookOpen className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>{t.subject}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg font-bold text-xs transition-colors border border-blue-200 flex items-center gap-1 cursor-pointer"
                          title="Edit data guru"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setTeacherToDelete(t)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold text-xs transition-colors border border-red-200 flex items-center gap-1 cursor-pointer"
                          title="Hapus data guru"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT TEACHER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-amber-400 bg-blue-900 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
              {/* Nama Guru */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Nama Lengkap Guru *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Ega Nugraha, S.Pd."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              {/* NIP */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <IdCard className="w-4 h-4 text-blue-600" />
                  <span>NIP (Nomor Induk Pegawai)</span>
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 19880412 201403 1 002 (Isi '-' jika PPPK/Non-NIP)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              {/* Mata Pelajaran */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Mata Pelajaran yang Diampu *</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                >
                  <optgroup label="Mata Pelajaran Wajib">
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
                    <option value="Bimbingan Konseling (BK)">Bimbingan Konseling (BK)</option>
                  </optgroup>
                  <option value="CUSTOM">+ Tulis Mapel Lain...</option>
                </select>

                {subject === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Nama Mata Pelajaran"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mt-2 font-medium"
                  />
                )}
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all shadow-md border border-amber-300 cursor-pointer active:scale-95"
                >
                  {isSaving ? 'Menyimpan...' : editingTeacher ? 'Simpan Perubahan' : 'Tambah Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Hapus Guru</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data guru <strong className="text-slate-900">{teacherToDelete.name}</strong> ({teacherToDelete.subject})?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs transition-colors shadow-md border border-red-500"
              >
                {isDeleting ? 'Meninggalkan...' : 'Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK INPUT MODAL (NAMA ENTER NIP) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-amber-400 bg-blue-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    Bulk Input Data Guru
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Masukkan banyak nama & NIP sekaligus dengan format berulang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Petunjuk Format */}
              <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-950 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Petunjuk Format Input (Bisa Input Ratusan Guru Sekaligus):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Format Utama (Nama Enter NIP):</span>
                    <pre className="text-[10px] bg-slate-50 p-2 rounded text-slate-700 font-mono leading-relaxed border border-slate-200">
                      Dra. Hj. Aan Anisah, M.Pd.&#10;196803151998022002&#10;Asep Saepudin, S.Pd.&#10;197405102008011006&#10;Guru Non-NIP&#10;-
                    </pre>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100 space-y-1">
                    <span className="font-bold text-blue-900 block">Atau Copy Paste Excel (2 Kolom):</span>
                    <pre className="text-[10px] bg-slate-50 p-2 rounded text-slate-700 font-mono leading-relaxed border border-slate-200">
                      Nama Guru [Tab] NIP&#10;Dedi Supriadi	1988...&#10;Ega Nugraha	-
                    </pre>
                    <p className="text-[10px] text-slate-500">
                      *Cukup salin kolom Nama & NIP langsung dari Excel / Spreadsheet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Setting Default Mapel & Mode Penguraian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {/* Default Mapel */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mata Pelajaran Bawaan:</span>
                  </label>
                  <select
                    value={bulkDefaultSubject}
                    onChange={(e) => setBulkDefaultSubject(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Guru Mata Pelajaran">Guru Mata Pelajaran (Umum)</option>
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
                    <option value="CUSTOM">+ Tulis Mapel Lain...</option>
                  </select>

                  {bulkDefaultSubject === 'CUSTOM' && (
                    <input
                      type="text"
                      value={bulkCustomSubject}
                      onChange={(e) => setBulkCustomSubject(e.target.value)}
                      placeholder="Ketik nama mata pelajaran..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white mt-1 font-medium"
                    />
                  )}
                </div>

                {/* Mode Penguraian Baris */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Metode Pembacaan Teks:</span>
                  </label>
                  <select
                    value={parseMode}
                    onChange={(e) => setParseMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="alternating">Nama [Enter] NIP (Bergantian per baris)</option>
                    <option value="excel">Kolom Excel / Tab Separated (Nama [Tab] NIP)</option>
                    <option value="auto">Deteksi Otomatis</option>
                  </select>
                  <p className="text-[10px] text-slate-500">
                    Pilihan default cocok untuk format Nama lalu enter NIP.
                  </p>
                </div>
              </div>

              {/* Textarea Input Form */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Tempelkan / Ketik Daftar Guru & NIP Di Sini:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {bulkRawText.length.toLocaleString()} karakter
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      {parsedTeachers.length} guru terdeteksi
                    </span>
                  </div>
                </div>

                <textarea
                  value={bulkRawText}
                  onChange={(e) => setBulkRawText(e.target.value)}
                  rows={8}
                  placeholder={`Contoh tempelkan teks:\nDra. Hj. Aan Anisah, M.Pd.\n19680315 199802 2 002\n\nAsep Saepudin, S.Pd.\n19740510 200801 1 006\n\nDedi Supriadi, S.Kom.\n-\n\n(Bisa memasukkan puluhan hingga ratusan guru sekaligus)`}
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono leading-relaxed bg-slate-50/50 focus:bg-white transition-all resize-y min-h-[140px]"
                />
              </div>

              {/* Live Preview Table */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pratinjau Hasil Pembacaan ({parsedTeachers.length} Guru):</span>
                  </h4>
                  {bulkRawText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBulkRawText('')}
                      className="text-[11px] text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer"
                    >
                      Kosongkan Teks
                    </button>
                  )}
                </div>

                {parsedTeachers.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
                    <ClipboardPaste className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="font-semibold text-xs text-slate-500">
                      Belum ada teks yang dimasukkan.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Silakan ketik atau tempelkan teks daftar guru dan NIP pada kolom di atas.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center">No</th>
                          <th className="py-2 px-3">Nama Guru</th>
                          <th className="py-2 px-3 w-44">NIP</th>
                          <th className="py-2 px-3 w-40">Mata Pelajaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {parsedTeachers.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-blue-50/50">
                            <td className="py-1.5 px-3 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-slate-900">
                              {item.name}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-slate-600">
                              {item.nip}
                            </td>
                            <td className="py-1.5 px-3 text-slate-700">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
                                {item.subject}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">
                {parsedTeachers.length > 0
                  ? `Siap menyimpan ${parsedTeachers.length} guru ke Firestore`
                  : 'Masukkan data guru untuk melanjutkan'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors border border-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulk}
                  disabled={parsedTeachers.length === 0 || isBulkSaving}
                  className="px-5 py-2 text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all shadow-md border border-amber-300 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isBulkSaving ? (
                    <span>Menyimpan ke Database...</span>
                  ) : (
                    <>
                      <span>Simpan {parsedTeachers.length} Guru</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL TEACHERS CONFIRMATION MODAL */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Kosongkan Semua Data Guru?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tindakan ini akan menghapus seluruh <strong className="text-slate-900">{teachers.length} data guru</strong> dari server Firestore dan penyimpanan lokal. Anda dapat mengisi data guru baru dengan fitur Bulk Input atau Excel.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearAllConfirm}
                disabled={isClearingAll}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs transition-colors shadow-md border border-red-500 cursor-pointer"
              >
                {isClearingAll ? 'Menghapus...' : 'Ya, Kosongkan Semua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
