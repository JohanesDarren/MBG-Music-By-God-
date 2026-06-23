"use client";

import { useState, useEffect, useRef } from "react";
import { useMediaPlayer } from "../contexts/MediaPlayerContext";

export default function AnalysisDashboard() {
  const { mediaRef, chordMap, isProcessingChords, fetchChords } = useMediaPlayer();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeChordIndex, setActiveChordIndex] = useState(0);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    let animId: number;
    const update = () => {
      const currentTime = media.currentTime;

      let activeIndex = 0;
      for (let i = 0; i < chordMap.length; i++) {
        if (currentTime >= chordMap[i].time) {
          activeIndex = i;
        } else {
          break;
        }
      }

      setActiveChordIndex(activeIndex);
      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [mediaRef.current, chordMap]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeElement = container.children[activeChordIndex] as HTMLElement;
      if (activeElement) {
        const containerWidth = container.clientWidth;
        const elementWidth = activeElement.clientWidth;
        const elementOffset = activeElement.offsetLeft;

        const scrollPosition = elementOffset - containerWidth / 2 + elementWidth / 2;

        container.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  }, [activeChordIndex]);

  return (
    <div className="flex flex-col md:flex-row w-full gap-4">
      {/* PANEL A: The Chord Timeline */}
      <div className="flex-grow p-4 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 relative overflow-hidden flex flex-col min-h-[160px]">
        <h3 className="text-[10px] tracking-widest text-slate-400 uppercase mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse"></span>
          Chord Timeline
        </h3>

        <div className="flex-1 relative flex items-center">
          {/* Vertical Playhead */}
          <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-brand-purple to-transparent z-20 shadow-[0_0_10px_rgba(139,92,246,0.8)]"></div>

          <div
            ref={scrollContainerRef}
            className="flex flex-row gap-3 overflow-x-auto items-center h-full w-full no-scrollbar pb-2 px-[50%]"
            style={{ scrollBehavior: "smooth" }}
          >
            {isProcessingChords ? (
              <div className="flex flex-col items-center justify-center w-full gap-2">
                <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest animate-pulse">Extracting Chords...</span>
              </div>
            ) : chordMap.length > 0 ? (
              chordMap.map((item, index) => {
                const isActive = index === activeChordIndex;
                return (
                  <div
                    key={index}
                    className={`flex-shrink-0 flex flex-col items-center justify-center px-6 py-4 rounded-lg border transition-all duration-300 ${
                      isActive
                        ? "border-brand-purple bg-brand-purple/20 text-white shadow-[0_0_25px_rgba(139,92,246,0.8)] scale-110 z-10"
                        : "border-white/10 bg-white/5 text-slate-400"
                    }`}
                  >
                    <span className="font-mono text-sm tracking-wider font-medium">{item.chord}</span>
                    <span className="text-[8px] font-mono text-slate-500 mt-1">
                      {item.time.toFixed(1)}s
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500 italic">No chords available</div>
            )}
          </div>
        </div>
      </div>

      {/* PANEL B: The Track Stats */}
      <div className="w-full md:w-64 p-4 rounded-xl flex flex-col justify-center backdrop-blur-md bg-white/5 border border-white/10 min-h-[160px] gap-6">
        <div>
          <h4 className="text-[10px] tracking-[0.2em] text-slate-400 uppercase mb-1">Detected Tempo</h4>
          <div className="flex items-end gap-1.5 text-brand-indigo">
            <span className="text-4xl font-light tracking-tighter">124</span>
            <span className="text-xs font-medium mb-1 opacity-70">BPM</span>
          </div>
        </div>

        <div className="w-full h-px bg-white/5"></div>

        <div>
          <h4 className="text-[10px] tracking-[0.2em] text-slate-400 uppercase mb-1">Key</h4>
          <div className="text-2xl font-light text-brand-purple tracking-tighter">
            {isProcessingChords ? "..." : chordMap[activeChordIndex]?.chord || "C Maj"}
          </div>
        </div>
      </div>
    </div>
  );
}
