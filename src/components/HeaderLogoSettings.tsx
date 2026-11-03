import React, { useState } from 'react';
import {
  Image,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Save,
  CheckCircle2,
  Laptop,
  GraduationCap,
  School,
  Shield,
  BookOpen,
  Sparkles,
  Info
} from 'lucide-react';

export interface HeaderLogoConfig {
  logoUrl: string;
  logoType: 'preset' | 'upload' | 'url';
  presetName: 'laptop' | 'graduation' | 'school' | 'shield' | 'book';
  updatedAt?: string;
}

interface HeaderLogoSettingsProps {
  logoConfig: HeaderLogoConfig;
  onSaveLogo: (config: HeaderLogoConfig) => Promise<void>;
}

export const PRESET_ICONS = [
  { id: 'laptop', label: 'Laptop / Labkom', icon: Laptop },
  { id: 'school', label: 'Gedung Sekolah', icon: School },
  { id: 'graduation', label: 'Toga / Edukasi', icon: GraduationCap },
  { id: 'shield', label: 'Lambang Sekolah / Shield', icon: Shield },
  { id: 'book', label: 'Buku Pelajaran', icon: BookOpen },
] as const;

export const DEFAULT_LOGO_CONFIG: HeaderLogoConfig = {
  logoUrl: '',
  logoType: 'preset',
  presetName: 'laptop',
};

export const HeaderLogoSettings: React.FC<HeaderLogoSettingsProps> = ({
  logoConfig,
  onSaveLogo,
}) => {
  const [logoType, setLogoType] = useState<'preset' | 'upload' | 'url'>(
    logoConfig?.logoType || 'preset'
  );
  const [presetName, setPresetName] = useState<HeaderLogoConfig['presetName']>(
    logoConfig?.presetName || 'laptop'
  );
  const [customUrl, setCustomUrl] = useState<string>(
    logoConfig?.logoType === 'url' ? logoConfig.logoUrl : ''
  );
  const [previewDataUrl, setPreviewDataUrl] = useState<string>(
    logoConfig?.logoType === 'upload' ? logoConfig.logoUrl : ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Handle File Upload (PNG/JPEG -> Base64 Data URL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewDataUrl(reader.result);
        setLogoType('upload');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      let finalUrl = '';
      if (logoType === 'upload') {
        finalUrl = previewDataUrl;
      } else if (logoType === 'url') {
        finalUrl = customUrl.trim();
      }

      const newConfig: HeaderLogoConfig = {
        logoType,
        presetName,
        logoUrl: finalUrl,
        updatedAt: new Date().toISOString(),
      };

      await onSaveLogo(newConfig);
      setSuccessMessage('Logo Header berhasil diperbarui dan disimpan ke Firestore!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      alert('Gagal menyimpan logo: ' + err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Kembalikan logo header ke ikon standar (Laptop)?')) return;
    setLogoType('preset');
    setPresetName('laptop');
    setCustomUrl('');
    setPreviewDataUrl('');
    await onSaveLogo(DEFAULT_LOGO_CONFIG);
    setSuccessMessage('Logo header telah dikembalikan ke standar bawaan.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Render effective icon/image for preview
  const renderPreviewLogo = () => {
    if (logoType === 'upload' && previewDataUrl) {
      return (
        <img
          src={previewDataUrl}
          alt="Preview Upload"
          className="w-full h-full object-contain p-0.5"
        />
      );
    }
    if (logoType === 'url' && customUrl) {
      return (
        <img
          src={customUrl}
          alt="Preview URL"
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    const matchedPreset = PRESET_ICONS.find((p) => p.id === presetName);
    const IconComponent = matchedPreset ? matchedPreset.icon : Laptop;
    return <IconComponent className="w-6 h-6 text-blue-900" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-900 rounded-lg border border-blue-200">
              <Image className="w-5 h-5 text-blue-800" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Pengaturan Logo Header Sekolah</h2>
          </div>
          <p className="text-xs text-slate-500">
            Ubah logo sekolah yang tampil pada Header aplikasi dan halaman login. Perubahan akan tersinkron secara real-time ke semua perangkat.
          </p>
        </div>

        {/* Live Preview Box */}
        <div className="bg-blue-900 text-white p-3 rounded-2xl border-2 border-amber-400 shadow-md flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-inner overflow-hidden border border-white">
            {renderPreviewLogo()}
          </div>
          <div>
            <span className="text-xs font-black text-amber-300 block">PRATINJAU HEADER</span>
            <span className="text-[11px] font-bold text-white tracking-tight">SMPN 1 KAWALI</span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Mode Selection Tabs */}
      <div className="space-y-4">
        <label className="text-xs font-extrabold text-slate-800 block">
          Pilih Metode Logo:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setLogoType('preset')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              logoType === 'preset'
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Ikon Vektor Standar</span>
              <span className="text-[11px] text-slate-500">Pilih dari koleksi ikon resmi yang siap pakai.</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLogoType('upload')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              logoType === 'upload'
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Upload className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Unggah Gambar Logo</span>
              <span className="text-[11px] text-slate-500">Unggah file PNG/JPG logo SMPN 1 Kawali dari perangkat.</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setLogoType('url')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              logoType === 'url'
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <LinkIcon className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Tautan Gambar (URL)</span>
              <span className="text-[11px] text-slate-500">Masukkan tautan langsung gambar logo di internet.</span>
            </div>
          </button>
        </div>
      </div>

      {/* Mode 1: Preset Selection */}
      {logoType === 'preset' && (
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-800 block">Pilih Ikon Preset:</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {PRESET_ICONS.map((p) => {
              const IconComp = p.icon;
              const isSelected = presetName === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPresetName(p.id as any)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900 text-amber-300 border-2 border-amber-400 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-white text-blue-900' : 'bg-slate-100 text-blue-800'
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 2: Upload File */}
      {logoType === 'upload' && (
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-800 block">Unggah File Logo dari Komputer / HP:</span>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="flex-1 w-full flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-blue-300 rounded-xl bg-white hover:bg-blue-50/50 cursor-pointer transition-colors text-center">
              <Upload className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-xs font-bold text-slate-800">Klik untuk memilih file logo</span>
              <span className="text-[10px] text-slate-400 mt-1">Format PNG (transparan), JPG, SVG (Maksimal 2 MB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {previewDataUrl && (
              <div className="w-24 h-24 rounded-xl border border-slate-300 bg-white p-2 flex flex-col items-center justify-center shrink-0 shadow-xs relative">
                <img
                  src={previewDataUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                  Siap Simpan
                </span>
              </div>
            )}
          </div>
          {uploadError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {uploadError}
            </p>
          )}
        </div>
      )}

      {/* Mode 3: Image URL */}
      {logoType === 'url' && (
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <label className="text-xs font-bold text-slate-800 block">Masukkan Tautan Gambar (URL Direct):</label>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://contoh.com/logo-smpn1kawali.png"
            className="w-full px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-mono bg-white"
          />
          <p className="text-[11px] text-slate-500">
            Pastikan tautan dapat diakses secara publik dan langsung mengarah ke file gambar.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <span>Logo yang disimpan akan langsung diperbarui di header aplikasi & form login.</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Standar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Logo Header'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
