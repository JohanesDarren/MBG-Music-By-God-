"use client";

import { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";

interface MediaInjectorProps {
  onFileSelect: (file: File, url: string) => void;
}

export default function MediaInjector({ onFileSelect }: MediaInjectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Only accept audio/video
    if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      onFileSelect(file, url);
    } else {
      alert("Please upload an audio or video file.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 z-10 relative">
      <div
        className={`glass-panel rounded-2xl p-12 flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 cursor-pointer ${
          isDragging
            ? "border-brand-purple bg-brand-purple/10 shadow-[0_0_40px_rgba(139,92,246,0.3)]"
            : "border-glass-border hover:border-brand-purple/50 hover:bg-white/5"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-20 h-20 mb-6 rounded-full glass-panel flex items-center justify-center text-brand-purple/80 shadow-lg">
          <UploadCloud size={40} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-medium text-slate-200 mb-2">
          Inject Media
        </h3>
        <p className="text-slate-400 text-center text-sm max-w-sm">
          Drag and drop your track or video here, or click to browse.
          <br />
          <span className="text-xs mt-2 block opacity-70">
            Supports .mp3, .wav, .mp4
          </span>
        </p>
        <input
          type="file"
          className="hidden"
          accept="audio/*,video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
