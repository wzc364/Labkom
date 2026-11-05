import React, { useState } from 'react';
import { ImageIcon, Maximize2, X, Info, Plus, Upload, Trash2, Loader2, Sparkles } from 'lucide-react';
import { GalleryImage, UserSession } from '../types/schedule';
import { saveGalleryImageToFirestore, deleteGalleryImageFromFirestore } from '../services/firestoreService';

interface FacilityGalleryProps {
  images: GalleryImage[];
  currentUser?: UserSession | null;
}

export const FacilityGallery: React.FC<FacilityGalleryProps> = ({ images, currentUser }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Mohon pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ukuran file awal maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // High quality resize within Firestore 1MB document limit
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 1000;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.72 quality (~120KB - 300KB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          setPreviewUrl(dataUrl);
        }
      };
      img.onerror = () => {
        setUploadError('Gagal memproses gambar. Coba file lain.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) {
      setUploadError('Silakan pilih foto terlebih dahulu.');
      return;
    }
    if (!newTitle.trim()) {
      setUploadError('Silakan isi judul atau nama foto.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const newImage: GalleryImage = {
        id: `img-${Date.now()}`,
        title: newTitle.trim(),
        description: newDescription.trim(),
        imageUrl: previewUrl,
        createdAt: new Date().toISOString(),
      };

      await saveGalleryImageToFirestore(newImage);
      setShowUploadModal(false);
      setNewTitle('');
      setNewDescription('');
      setPreviewUrl(null);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError('Gagal mengunggah foto: ' + (err?.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Yakin ingin menghapus foto ini dari galeri fasilitas?')) return;
    try {
      await deleteGalleryImageFromFirestore(id);
      if (selectedImage?.id === id) {
        setSelectedImage(null);
      }
    } catch (err: any) {
      alert('Gagal menghapus foto: ' + (err?.message || err));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner with Action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-900 text-amber-400 rounded-xl shadow-xs shrink-0">
            <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                Galeri Fasilitas
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                {images.length} Foto
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Dokumentasi Laboratorium Komputer & Papan Interaktif Digital (PID) SMPN 1 Kawali
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => {
            setUploadError(null);
            setShowUploadModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-blue-900 hover:bg-blue-800 active:scale-95 text-amber-300 font-black rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg border-2 border-amber-400 cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4 stroke-[2.5]" />
          <span>Unggah Foto Fasilitas</span>
        </button>
      </div>

      {/* Facility Specs Info Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs sm:text-sm text-amber-950 shadow-2xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-blue-950">Informasi Fasilitas Multimedia SMPN 1 Kawali:</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-700">
            <li><strong>LABKOM 1 PID:</strong> 35 PC Siswa + 2 Server + Papan Interaktif Digital (IFP 75" 4K)</li>
            <li><strong>LABKOM 2:</strong> 20 PC Siswa + 8 Chromebook + 25 Tablet Android</li>
            <li>Terhubung jaringan Internet LAN Gigabyte & Wi-Fi Nesaka</li>
          </ul>
        </div>
      </div>

      {/* Gallery Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              onClick={() => setSelectedImage(img)}
            >
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img
                  src={img.imageUrl}
                  alt={img.title || 'Fasilitas'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-3.5">
                  <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                    <Maximize2 className="w-4 h-4 text-amber-400" />
                    <span>Perbesar</span>
                  </div>
                  {/* Delete button (Admin or accessible) */}
                  <button
                    onClick={(e) => handleDeleteImage(img.id, e)}
                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    {img.title || 'Foto Fasilitas'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(img.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
                {img.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">
                    "{img.description}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-14 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-blue-100">
            <ImageIcon className="w-8 h-8 text-blue-800" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-900">Belum Ada Foto Fasilitas</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Dokumentasi foto Labkom 1 PID dan Labkom 2 dapat diunggah langsung di sini.
            </p>
          </div>
          <button
            onClick={() => {
              setUploadError(null);
              setShowUploadModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all border border-amber-400 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Unggah Foto Sekarang</span>
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b-2 border-amber-400 bg-blue-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm sm:text-base uppercase tracking-wider">
                  Unggah Foto Fasilitas
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Image Picker */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wide text-[11px] block">
                  Pilih Gambar (JPG / PNG) *
                </label>
                <div
                  onClick={() => document.getElementById('facility-photo-file-input')?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    previewUrl
                      ? 'border-blue-500 bg-blue-50/40'
                      : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'
                  }`}
                >
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-52 mx-auto rounded-lg shadow-sm border border-slate-200 object-contain"
                      />
                      <p className="text-[11px] text-blue-700 font-bold hover:underline">
                        Klik di sini untuk mengganti foto
                      </p>
                    </div>
                  ) : (
                    <div className="py-6 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-700 text-xs sm:text-sm">
                        Klik untuk memilih foto dari perangkat
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Foto akan otomatis dikompresi agar hemat kuota database Firestore
                      </p>
                    </div>
                  )}
                  <input
                    id="facility-photo-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wide text-[11px] block">
                  Judul / Nama Foto *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Labkom 1 Multimedia & IFP 75 Inci"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wide text-[11px] block">
                  Keterangan Tambahan (Opsional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Deskripsi singkat ruangan, fasilitas, atau aktivitas praktik..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-normal text-slate-800 h-20 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900 text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !previewUrl || !newTitle.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-black rounded-xl text-xs sm:text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer border border-amber-400"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah ke Firebase...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Simpan & Terbitkan Foto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-60 cursor-pointer"
            onClick={() => setSelectedImage(null)}
            title="Tutup (Esc)"
          >
            <X className="w-6 h-6 sm:w-8 h-8" />
          </button>

          <div
            className="max-w-5xl w-full h-full flex flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="w-full text-center text-white space-y-1.5 p-4 sm:p-5 bg-slate-900/80 rounded-2xl border border-white/10 backdrop-blur-sm shrink-0">
              <h3 className="text-lg sm:text-2xl font-black tracking-tight text-amber-300">
                {selectedImage.title || 'Foto Fasilitas'}
              </h3>
              {selectedImage.description && (
                <p className="text-xs sm:text-sm text-slate-200 font-medium italic max-w-3xl mx-auto">
                  "{selectedImage.description}"
                </p>
              )}
              <div className="text-[11px] text-slate-400 font-mono pt-1">
                Diunggah pada: {new Date(selectedImage.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
