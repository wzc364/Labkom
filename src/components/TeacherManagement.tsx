import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  IdCard,
  User,
  Sparkles
} from 'lucide-react';
import { Teacher } from '../types/schedule';
import { SAMPLE_SUBJECTS } from '../data/defaultData';

interface TeacherManagementProps {
  teachers: Teacher[];
  onSaveTeacher: (teacher: Teacher) => Promise<void>;
  onDeleteTeacher: (teacherId: string) => Promise<void>;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  onSaveTeacher,
  onDeleteTeacher,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [subject, setSubject] = useState('Informatika');
  const [customSubject, setCustomSubject] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Delete Confirmation State
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold rounded-xl text-xs transition-all shadow-sm border border-blue-800 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah Guru Baru</span>
          </button>
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
    </div>
  );
};
