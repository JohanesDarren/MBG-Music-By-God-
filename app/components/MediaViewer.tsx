"use client";

import { useEffect, useRef } from "react";
import { Activity } from "lucide-react";
import { useMediaPlayer } from "../contexts/MediaPlayerContext";

interface MediaViewerProps {
  file: File;
  url: string;
}

export default function MediaViewer({ file, url }: MediaViewerProps) {
  const isVideo = file.type.startsWith("video/");
  const { mediaRef, isPlaying, setSourceFile } = useMediaPlayer();

  const lastProcessedFile = useRef<File | null>(null);
  
  // Store the original File object in the context so the HPSS processor can access it
  useEffect(() => {
    if (lastProcessedFile.current !== file) {
      lastProcessedFile.current = file;
      setSourceFile(file);
    }
  }, [file, setSourceFile]);

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 z-10 relative flex flex-col items-center">
      <div className="glass-panel w-full rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header bar */}
        <div className="w-full px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300 truncate max-w-[70%]">
            {file.name}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-brand-purple">
            {isVideo ? "Video Track" : "Audio Track"}
          </span>
        </div>

        {/* Media Content */}
        <div className="w-full min-h-[300px] flex items-center justify-center bg-black/40 relative">
          {isVideo ? (
            <video
              src={url}
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              className="w-full h-auto max-h-[60vh] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] gap-6">
              {/* Abstract Visualizer Placeholder */}
              <div className="flex items-center gap-2 h-32">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 bg-brand-purple/60 rounded-full ${isPlaying ? "animate-pulse" : "opacity-30"}`}
                    style={{
                      height: `${Math.max(20, Math.random() * 100)}%`,
                      animationDelay: `${i * 0.1}s`,
                      boxShadow: "0 0 10px rgba(139,92,246,0.5)",
                      transition: "all 0.3s ease",
                    }}
                  />
                ))}
              </div>
              <audio src={url} ref={mediaRef as React.RefObject<HTMLAudioElement>} className="hidden" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
