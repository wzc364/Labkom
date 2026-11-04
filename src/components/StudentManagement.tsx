import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Users, Plus, Edit2, Trash2, X, IdCard, User, GraduationCap } from 'lucide-react';
import { Student } from '../types/schedule';

interface StudentManagementProps {
  students: Student[];
  onSaveStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  onSaveStudent,
  onDeleteStudent,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [name, setName] = useState('');
  const [nisn, setNisn] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const studentData: Student = {
      id: editingStudent ? editingStudent.id : `s-${Date.now()}`,
      name: name.trim(),
      nisn: nisn.trim(),
      createdAt: editingStudent?.createdAt || new Date().toISOString(),
    };
    await onSaveStudent(studentData);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      for (const row of jsonData) {
        // Expected columns: NISN, Nama
        const nisn = row['NISN'] || row['nisn'];
        const name = row['Nama'] || row['nama'];

        if (nisn && name) {
          await onSaveStudent({
            id: `s-${Date.now()}-${Math.random()}`,
            name: String(name).trim(),
            nisn: String(nisn).trim(),
            createdAt: new Date().toISOString(),
          });
        }
      }
      alert('Data murid berhasil diimpor.');
    } catch (err) {
      alert('Gagal mengimpor file Excel.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-800" />
            Daftar Murid
        </h2>
        <div className="flex gap-2">
          <input type="file" id="studentExcel" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          <label htmlFor="studentExcel" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-500">
            Unggah Excel
          </label>
          <button
            onClick={() => { setEditingStudent(null); setName(''); setNisn(''); setIsModalOpen(true); }}
            className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold"
          >
            Tambah Murid
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-3 px-4">NISN</th>
              <th className="py-3 px-4">Nama</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono">{s.nisn}</td>
                <td className="py-3 px-4 font-bold">{s.name}</td>
                <td className="py-3 px-4 text-center">
                    <button onClick={() => { setEditingStudent(s); setName(s.name); setNisn(s.nisn); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                    <button onClick={() => onDeleteStudent(s.id)} className="text-red-600 hover:text-red-800">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4">
            <h3 className="font-black text-slate-800">{editingStudent ? 'Edit Murid' : 'Tambah Murid'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="NISN" value={nisn} onChange={(e) => setNisn(e.target.value)} className="w-full p-2 border rounded-lg" required />
                <input type="text" placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" required />
                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 rounded-lg">Batal</button>
                    <button type="submit" className="flex-1 py-2 bg-blue-900 text-white rounded-lg">{isSaving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
