import React, { useState } from 'react';
import { X, User, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, BookOpen, IdCard, Lock } from 'lucide-react';
import { UserSession } from '../types/schedule';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onChangePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onChangePassword,
  onLogout,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!oldPassword || !newPassword) {
      setNotice({ type: 'error', message: 'Mohon isi password lama dan password baru.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', message: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    if (newPassword.length < 4) {
      setNotice({ type: 'error', message: 'Password baru minimal 4 karakter.' });
      return;
    }

    setIsSaving(true);
    try {
      const success = await onChangePassword(oldPassword, newPassword);
      if (success) {
        setNotice({ type: 'success', message: 'Password Anda telah berhasil diperbarui!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setNotice({ type: 'error', message: 'Password saat ini salah. Mohon periksa kembali.' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Gagal memperbarui password: ' + String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-amber-400 bg-blue-900 text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">Halaman Profil & Akun</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs">
          {/* User Profile Card */}
          <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-amber-50/50 p-4 rounded-2xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider border shadow-2xs ${
                currentUser.role === 'admin'
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-blue-900 text-amber-300 border-blue-800'
              }`}>
                {currentUser.role === 'admin' ? 'Administrator' : 'Guru Pengampu'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SMPN 1 Kawali</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-900 text-amber-400 font-black flex items-center justify-center shrink-0 border-2 border-amber-400 text-lg shadow-sm">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">{currentUser.name}</h4>
                {currentUser.nip && (
                  <p className="text-xs text-slate-600 flex items-center gap-1 font-mono">
                    <IdCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>NIP: {currentUser.nip}</span>
                  </p>
                )}
                {currentUser.subject && (
                  <p className="text-xs text-amber-900 font-bold flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Mapel: {currentUser.subject}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {notice && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2.5 border shadow-2xs ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-semibold">{notice.message}</span>
            </div>
          )}

          {/* Change Password Form */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-800" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Ubah Password Akun</h4>
            </div>

            <form onSubmit={handleSubmitPasswordChange} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Password Saat Ini *</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Password lama (default Nesaka)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Password Baru *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password baru Anda"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold rounded-xl text-xs transition-all shadow-sm border border-blue-800 flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-1"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{isSaving ? 'Memproses...' : 'Ubah Password'}</span>
              </button>
            </form>
          </div>

          {/* Logout Section */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition-colors border border-red-200 cursor-pointer"
            >
              Keluar Akun (Logout)
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
