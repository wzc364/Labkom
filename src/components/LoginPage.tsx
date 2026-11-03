import React, { useState } from 'react';
import { Laptop, Lock, User, KeyRound, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, BookOpen } from 'lucide-react';
import { Teacher, UserSession } from '../types/schedule';

import { HeaderLogoConfig, PRESET_ICONS } from './HeaderLogoSettings';

interface LoginPageProps {
  teachers: Teacher[];
  onLoginSuccess: (session: UserSession) => void;
  getTeacherPassword: (nip: string) => string;
  headerLogo?: HeaderLogoConfig | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  teachers,
  onLoginSuccess,
  getTeacherPassword,
  headerLogo,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('Mohon isi Username / NIP dan Password Anda.');
      setIsSubmitting(false);
      return;
    }

    // 1. Check Admin Credentials (Username: ega, Password: ega)
    if (cleanUsername.toLowerCase() === 'ega' && cleanPassword === 'ega') {
      const adminSession: UserSession = {
        role: 'admin',
        name: 'Ega Nugraha (Administrator)',
        username: 'ega',
      };
      onLoginSuccess(adminSession);
      setIsSubmitting(false);
      return;
    }

    // 2. Check Teacher Credentials (Username: NIP or Teacher Name)
    // Find teacher by exact NIP or NIP without spaces
    const matchedTeacher = teachers.find((t) => {
      const normalizedInput = cleanUsername.replace(/\s+/g, '').toLowerCase();
      const normalizedNip = (t.nip || '').replace(/\s+/g, '').toLowerCase();
      const normalizedName = t.name.toLowerCase();

      return (
        (normalizedNip && normalizedNip === normalizedInput) ||
        normalizedName.includes(normalizedInput) ||
        t.id.toLowerCase() === normalizedInput
      );
    });

    if (matchedTeacher) {
      const validPassword = getTeacherPassword(matchedTeacher.nip || matchedTeacher.id);
      if (cleanPassword === validPassword) {
        const guruSession: UserSession = {
          role: 'guru',
          name: matchedTeacher.name,
          username: matchedTeacher.nip || matchedTeacher.id,
          teacherId: matchedTeacher.id,
          nip: matchedTeacher.nip,
          subject: matchedTeacher.subject,
        };
        onLoginSuccess(guruSession);
        setIsSubmitting(false);
        return;
      } else {
        setError(`Password salah untuk Guru ${matchedTeacher.name}. (Default password guru: Nesaka)`);
        setIsSubmitting(false);
        return;
      }
    }

    // Fallback: If username doesn't match a listed teacher NIP directly, check default "Nesaka"
    if (cleanPassword === 'Nesaka' && cleanUsername.length >= 3) {
      const fallbackSession: UserSession = {
        role: 'guru',
        name: `Guru (${cleanUsername})`,
        username: cleanUsername,
        nip: cleanUsername,
        subject: 'Mata Pelajaran',
      };
      onLoginSuccess(fallbackSession);
      setIsSubmitting(false);
      return;
    }

    setError('Username / NIP atau Password tidak cocok. Silakan periksa kembali data Anda.');
    setIsSubmitting(false);
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Subtle Shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10 my-auto">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white text-blue-900 flex items-center justify-center mx-auto shadow-xl border-2 border-amber-400 overflow-hidden">
            {headerLogo?.logoType === 'upload' && headerLogo.logoUrl ? (
              <img src={headerLogo.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : headerLogo?.logoType === 'url' && headerLogo.logoUrl ? (
              <img src={headerLogo.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : headerLogo?.logoType === 'preset' ? (
              (() => {
                const preset = PRESET_ICONS.find((p) => p.id === headerLogo.presetName);
                const IconComp = preset ? preset.icon : Laptop;
                return <IconComp className="w-9 h-9 text-blue-900" />;
              })()
            ) : (
              <Laptop className="w-9 h-9 text-blue-900" />
            )}
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider mb-2">
              <span>SMPN 1 KAWALI</span>
              <span>·</span>
              <span>LABKOM & PID</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sistem Login Portal Lab
            </h1>
            <p className="text-xs text-blue-200 mt-1 max-w-xs mx-auto">
              Silakan login untuk mengakses penjadwalan Laboratorium Komputer & Papan Interaktif Digital.
            </p>
          </div>
        </div>

        {/* Login Card Form */}
        <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-xs text-red-900 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Gagal Login:</span>
                <span className="leading-snug">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Username / NIP */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-700" />
                  <span>Username / NIP Guru</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Admin: <strong>ega</strong> | Guru: <strong>NIP</strong>)
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="masukan NIP di sini"
                  className="w-full px-4 py-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium bg-white text-slate-900 shadow-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-700" />
                  <span>Password</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Default Guru: <strong>Nesaka</strong>)
                </span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan Password"
                className="w-full px-4 py-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium bg-white text-slate-900 shadow-xs"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-black rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 border border-amber-300 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Memverifikasi Akun...' : 'Masuk ke Aplikasi'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>

          {/* Quick Demo Helper Accordion */}
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="text-[11px] font-bold text-blue-800 hover:text-blue-900 w-full text-center py-1 flex items-center justify-center gap-1"
            >
              <span>{showDemoCredentials ? 'Sembunyikan' : 'Petunjuk Login Admin & Guru'}</span>
            </button>

            {showDemoCredentials && (
              <div className="mt-3 p-3 bg-blue-50/80 rounded-xl border border-blue-200 space-y-2 text-[11px] text-slate-700">
                <div className="flex items-start justify-between bg-white p-2 rounded-lg border border-slate-200">
                  <div>
                    <span className="font-bold text-blue-900 block">Akun Administrator:</span>
                    <span>Username: <strong className="text-slate-900">ega</strong> | Password: <strong className="text-slate-900">ega</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('ega', 'ega')}
                    className="px-2 py-1 bg-blue-900 text-amber-300 rounded text-[10px] font-bold shrink-0 hover:bg-blue-800"
                  >
                    Isi Cepat
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-blue-900 block">Akun Guru (Pilih NIP):</span>
                  {teachers.slice(0, 3).map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="font-semibold block text-slate-900">{t.name}</span>
                        <span className="text-[10px] text-slate-500">NIP: {t.nip} | Pass: Nesaka</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickFill(t.nip, getTeacherPassword(t.nip))}
                        className="px-2 py-1 bg-amber-400 text-slate-950 rounded text-[10px] font-bold shrink-0 hover:bg-amber-300"
                      >
                        Isi Cepat
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-blue-300/80 text-center">
          SMPN 1 Kawali · Laboratorium Komputer 1 PID & Laboratorium Komputer 2
        </p>
      </div>
    </div>
  );
};
