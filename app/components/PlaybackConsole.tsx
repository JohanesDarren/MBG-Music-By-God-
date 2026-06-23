"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Music,
  Activity,
  Layers,
  Wand2,
  Minus,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { useMediaPlayer } from "../contexts/MediaPlayerContext";

export default function PlaybackConsole() {
  const {
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    seek,
    volume,
    changeVolume,
    playbackRate,
    setSpeed,
    pitchShift,
    setPitch,
    trackVolumes,
    handleVolumeChange,
    stems,
    isProcessingStems,
    processAudioWithAI,
    trackMutes,
    toggleTrackMute,
  } = useMediaPlayer();

  const [activeTool, setActiveTool] = useState<string | null>(null);

  const toggleTool = (tool: string) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = (x / rect.width) * duration;
    seek(newTime);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newVol = Math.max(0, Math.min(1, x / rect.width));
    changeVolume(newVol);
  };

  const ToolButton = ({
    id,
    label,
    icon: Icon,
  }: {
    id: string;
    label: string;
    icon: any;
  }) => {
    const isActive = activeTool === id;
    return (
      <button
        onClick={() => toggleTool(id)}
        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all duration-300 ${
          isActive
            ? "bg-brand-purple/20 text-brand-purple shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-brand-purple/50"
            : "bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-slate-200"
        }`}
      >
        <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
        <span className="text-[10px] font-medium tracking-wider uppercase">
          {label}
        </span>
      </button>
    );
  };

  const renderToolDrawer = () => {
    if (!activeTool) return null;

    return (
      <div className="w-full p-6 rounded-xl backdrop-blur-md bg-zinc-900/60 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] animate-fade-in relative z-10 overflow-hidden">
        {activeTool === "split" && (
          <div className="flex flex-col gap-4 animate-slide-in-up">
            <h4 className="text-xs tracking-widest text-brand-purple uppercase mb-2 text-center">Track Splitter Mixer</h4>
            
            {isProcessingStems ? (
              <div className="flex flex-col items-center justify-center h-48 gap-4">
                <div className="w-16 h-16 relative flex items-center justify-center">
                  <div className="absolute w-full h-full border-4 border-brand-purple/20 rounded-full animate-ping"></div>
                  <div className="absolute w-full h-full border-4 border-t-brand-purple border-r-brand-indigo border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <Wand2 size={24} className="text-brand-purple animate-pulse" />
                </div>
                <p className="text-xs text-slate-400 max-w-[200px] text-center leading-relaxed">
                  Processing mathematical HPSS separation...
                </p>
              </div>
            ) : !stems.harmonic ? (
              <div className="flex items-center justify-center h-48">
                <button
                  onClick={processAudioWithAI}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-brand-indigo to-brand-purple text-white font-medium tracking-wide shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Wand2 size={18} />
                  Separate Tracks (HPSS)
                </button>
              </div>
            ) : (
              <div className="flex justify-around items-center h-48 max-w-sm mx-auto">
                {[
                  { key: "percussive", label: "BEAT (Percussive)" },
                  { key: "harmonic", label: "MELODY (Harmonic)" }
                ].map(({ key, label }) => {
                  const typedKey = key as "percussive" | "harmonic";
                  const vol = trackVolumes[typedKey];
                  const isMuted = trackMutes[typedKey];
                  
                  return (
                    <div key={key} className="flex flex-col items-center gap-3 h-full">
                      <div className="w-8 h-28 relative flex justify-center items-center">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.05"
                          value={vol}
                          onChange={(e) => handleVolumeChange(typedKey, parseFloat(e.target.value))}
                          className={`absolute top-1/2 left-1/2 w-24 h-1 -translate-x-1/2 -translate-y-1/2 -rotate-90 appearance-none bg-white/10 rounded-full outline-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(168,85,247,0.8)]
                            hover:[&::-webkit-slider-thumb]:scale-125 hover:[&::-webkit-slider-thumb]:brightness-125 [&::-webkit-slider-thumb]:transition-all ${isMuted ? 'opacity-50 grayscale' : ''}`}
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => toggleTrackMute(typedKey)}
                          className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-all ${isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                          M
                        </button>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
                        <span className="text-[9px] font-mono text-brand-purple mt-0.5">{vol.toFixed(1)}x</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTool === "tempo" && (
          <div className="flex flex-col items-center justify-center gap-6 animate-slide-in-up py-4">
            <div className="text-center">
              <h4 className="text-[10px] tracking-[0.2em] text-slate-400 uppercase mb-1">Detected BPM</h4>
              <div className="text-3xl font-light text-brand-indigo tracking-tighter">124</div>
            </div>
            
            <div className="flex items-center gap-6 w-full max-w-md">
              <button onClick={() => setSpeed(playbackRate - 0.05)} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:border-brand-purple hover:bg-brand-purple/10 transition-all">
                <Minus size={14} />
              </button>
              
              <div className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full h-1.5 bg-white/10 rounded-full relative cursor-pointer group"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    // slider represents 0.5 to 2.0
                    const newRate = 0.5 + (x / rect.width) * 1.5;
                    setSpeed(newRate);
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-indigo to-brand-purple rounded-full group-hover:brightness-125"
                    style={{ width: `${((playbackRate - 0.5) / 1.5) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-100 scale-100 group-hover:scale-125 transition-all"
                    style={{ left: `calc(${((playbackRate - 0.5) / 1.5) * 100}% - 6px)` }}
                  ></div>
                </div>
                <span className="text-xs font-mono text-brand-purple font-medium">{playbackRate.toFixed(2)}x</span>
              </div>

              <button onClick={() => setSpeed(playbackRate + 0.05)} className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:border-brand-purple hover:bg-brand-purple/10 transition-all">
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}

        {activeTool === "pitch" && (
          <div className="flex flex-col items-center justify-center gap-8 animate-slide-in-up py-4">
            <div className="text-center">
              <h4 className="text-[10px] tracking-[0.2em] text-slate-400 uppercase mb-1">Current Key</h4>
              <div className="text-3xl font-light text-brand-purple tracking-tighter">
                {pitchShift === 0 ? "Original" : `${pitchShift > 0 ? "+" : ""}${pitchShift} Semitone${Math.abs(pitchShift) > 1 ? "s" : ""}`}
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <button onClick={() => setPitch(pitchShift - 1)} className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-brand-purple/20 hover:border-brand-purple/50 text-slate-300 hover:text-white transition-all text-sm font-medium tracking-wide flex items-center gap-2">
                <Minus size={16} /> 1 Semitone
              </button>
              
              <button onClick={() => setPitch(0)} className="flex flex-col items-center gap-1 text-slate-500 hover:text-brand-indigo transition-colors">
                <RefreshCcw size={18} />
                <span className="text-[9px] uppercase tracking-wider">Reset</span>
              </button>

              <button onClick={() => setPitch(pitchShift + 1)} className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-brand-purple/20 hover:border-brand-purple/50 text-slate-300 hover:text-white transition-all text-sm font-medium tracking-wide flex items-center gap-2">
                <Plus size={16} /> 1 Semitone
              </button>
            </div>
          </div>
        )}

        {activeTool === "chord" && (
          <div className="flex flex-col gap-6 animate-slide-in-up max-w-lg mx-auto">
             <h4 className="text-xs tracking-widest text-brand-purple uppercase text-center mb-2">Timeline Settings</h4>
             <div className="flex flex-col gap-4 bg-black/20 p-6 rounded-xl border border-white/5">
                {[
                  { id: "minor7", label: "Show Minor 7ths", active: true },
                  { id: "simplify", label: "Simplify Chords", active: false },
                  { id: "instrument", label: "Change Instrument Display", active: false }
                ].map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between group cursor-pointer">
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{setting.label}</span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${setting.active ? 'bg-brand-purple' : 'bg-white/10'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${setting.active ? 'translate-x-5' : ''}`}></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full gap-4">
      {renderToolDrawer()}
      
      <div className="w-full p-4 rounded-2xl backdrop-blur-lg bg-zinc-950/80 border border-white/10 flex flex-col gap-4 shadow-2xl relative z-20">
        {/* TOP HALF: Timeline */}
        <div className="flex items-center gap-4 w-full px-2">
          <span className="text-xs font-mono text-slate-400 w-10 text-right">{formatTime(currentTime)}</span>
          <div 
            className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group"
            onClick={handleTimelineClick}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-indigo to-brand-purple transition-all duration-75 group-hover:brightness-125"
              style={{ width: `${progressPercentage}%` }}
            ></div>
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercentage}% - 6px)` }}
            ></div>
          </div>
          <span className="text-xs font-mono text-slate-400 w-10">{formatTime(duration)}</span>
        </div>

        {/* BOTTOM HALF: Controls */}
        <div className="flex flex-row justify-between items-center w-full">
          {/* Left Zone: Transport Controls */}
          <div className="flex gap-4 items-center">
            <button onClick={() => seek(0)} className="text-slate-300 hover:text-white transition-colors">
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-slate-200 hover:bg-white text-slate-900 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              {isPlaying ? (
                <Pause size={20} className="fill-current" />
              ) : (
                <Play size={20} className="fill-current ml-1" />
              )}
            </button>
            <button onClick={() => seek(Math.min(duration, currentTime + 10))} className="text-slate-300 hover:text-white transition-colors">
              <SkipForward size={20} />
            </button>
          </div>

          {/* Center Zone: MBG Tools */}
          <div className="flex gap-2">
            <ToolButton id="chord" label="Chord Det." icon={Music} />
            <ToolButton id="pitch" label="Pitch Shift" icon={Wand2} />
            <ToolButton id="tempo" label="Tempo Track" icon={Activity} />
            <ToolButton id="split" label="Splitter" icon={Layers} />
          </div>

          {/* Right Zone: Volume */}
          <div className="flex items-center gap-2 w-32 justify-end pr-2">
            <Volume2 size={16} className="text-slate-400" />
            <div 
              className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer max-w-[80px]"
              onClick={handleVolumeClick}
            >
              <div className="h-full bg-slate-300 rounded-full" style={{ width: `${volume * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
