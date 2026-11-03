import React, { useState } from 'react';
import { ImageIcon, Maximize2, X, Info } from 'lucide-react';
import { GalleryImage } from '../types/schedule';

interface FacilityGalleryProps {
  images: GalleryImage[];
}

export const FacilityGallery: React.FC<FacilityGalleryProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900 text-amber-400 rounded-xl shadow-sm">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              Galeri Fasilitas
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Dokumentasi Laboratorium Komputer & Papan Interaktif Digital (PID) SMPN 1 Kawali
            </p>
          </div>
        </div>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => setSelectedImage(img)}
            >
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img
                  src={img.imageUrl}
                  alt={img.title || 'Fasilitas'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Maximize2 className="w-4 h-4" />
                    <span>Klik untuk memperbesar</span>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  {img.title || 'Foto Fasilitas'}
                </h3>
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
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Belum ada foto fasilitas</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Administrator belum mengunggah dokumentasi foto fasilitas saat ini.
            </p>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6 sm:w-8 h-8" />
          </button>
          
          <div 
            className="max-w-5xl w-full h-full flex flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full flex-1 flex items-center justify-center">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
            
            <div className="w-full text-center text-white space-y-2 p-4 bg-slate-900/50 rounded-2xl border border-white/10 backdrop-blur-sm">
              <h3 className="text-lg sm:text-xl font-black tracking-tight">
                {selectedImage.title || 'Foto Fasilitas'}
              </h3>
              {selectedImage.description && (
                <p className="text-sm sm:text-base text-slate-300 font-medium italic">
                  {selectedImage.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900 space-y-1">
          <p className="font-bold">Informasi Fasilitas:</p>
          <ul className="list-disc list-inside space-y-0.5 opacity-90">
            <li>LABKOM 1 PID: Dilengkapi 35 PC + 2 Server + IFP 75"</li>
            <li>LABKOM 2: Dilengkapi 20 PC + 8 Chromebook + 25 Tablet</li>
            <li>Seluruh ruangan telah terintegrasi dengan jaringan Internet & Intranet</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
