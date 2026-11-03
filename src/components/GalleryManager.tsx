import React, { useState } from 'react';
import { ImageIcon, Plus, Trash2, Upload, X, Loader2, Image as ImageLucide } from 'lucide-react';
import { GalleryImage } from '../types/schedule';
import { saveGalleryImageToFirestore, deleteGalleryImageFromFirestore } from '../services/firestoreService';

interface GalleryManagerProps {
  images: GalleryImage[];
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ images }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic size check (warn if > 2MB, though we'll resize)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Mohon pilih gambar di bawah 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize logic to keep it within Firestore limits (~1MB)
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to Base64 JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPreviewUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewUrl) return;
    setIsUploading(true);

    try {
      const newImage: GalleryImage = {
        id: `img-${Date.now()}`,
        title: newTitle || 'Foto Fasilitas',
        description: newDescription,
        imageUrl: previewUrl,
        createdAt: new Date().toISOString(),
      };

      await saveGalleryImageToFirestore(newImage);
      setShowUploadModal(false);
      setNewTitle('');
      setNewDescription('');
      setPreviewUrl(null);
    } catch (err) {
      alert('Gagal mengunggah gambar: ' + err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus foto ini dari galeri?')) return;
    try {
      await deleteGalleryImageFromFirestore(id);
    } catch (err) {
      alert('Gagal menghapus gambar: ' + err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-900" />
            <span>Manajemen Galeri Fasilitas</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Unggah foto dokumentasi Labkom & PID. Foto akan dikompresi otomatis untuk efisiensi penyimpanan database.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Foto Baru</span>
        </button>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all relative">
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-2 right-2 p-2 bg-red-600/90 hover:bg-red-700 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus Foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3">
                <h4 className="font-bold text-slate-900 text-sm truncate">{img.title}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  {new Date(img.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
          <ImageLucide className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Belum ada foto yang diunggah.</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-900 text-white">
              <h3 className="font-black text-sm uppercase tracking-wider">Unggah Foto Baru</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pilih Gambar *</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    previewUrl ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                  }`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm border border-white" />
                      <p className="text-[10px] text-blue-600 font-bold">Klik untuk mengganti gambar</p>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500">Klik atau seret file gambar ke sini (JPG/PNG)</p>
                    </div>
                  )}
                  <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Judul / Nama Foto *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Labkom 1 PID Tampak Depan"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Keterangan (Opsional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Berikan sedikit deskripsi tentang foto ini..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium h-20 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                disabled={isUploading || !previewUrl || !newTitle}
                onClick={handleUpload}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-amber-300 font-black rounded-xl text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-all"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{isUploading ? 'Mengunggah...' : 'Simpan ke Galeri'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
