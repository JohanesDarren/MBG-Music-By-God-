"use client";

import { UploadCloud } from "lucide-react";
import { useRef } from "react";

interface CompactInjectorProps {
  onFileSelect: (file: File, url: string) => void;
}

export default function CompactInjector({ onFileSelect }: CompactInjectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validExtensions = /\.(wav|mp3|mp4|m4a|aac|ogg|flac|wma|webm|mkv|avi|mov)$/i;
      if (file.type.startsWith("audio/") || file.type.startsWith("video/") || validExtensions.test(file.name)) {
        const url = URL.createObjectURL(file);
        onFileSelect(file, url);
      } else {
        alert("Please upload an audio or video file.");
      }
    }
  };

  return (
    <div className="absolute top-8 right-8 z-50 animate-slide-in-down">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="glass-panel flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-white/10 hover:border-brand-purple/50 transition-all duration-300 group"
      >
        <UploadCloud size={16} className="text-brand-purple group-hover:text-white transition-colors" />
        <span className="text-xs font-medium tracking-wide text-slate-300 group-hover:text-white transition-colors">
          Swap Track
        </span>
      </button>
      <input
        type="file"
        className="hidden"
        accept="audio/*,video/*,.wav,.mp3,.mp4,.m4a,.aac,.ogg,.flac,.wma,.webm,.mkv,.avi,.mov"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
