"use client";

import { createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";

interface MediaPlayerContextType {
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  isPlaying: boolean;
  togglePlay: () => void;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  volume: number;
  changeVolume: (vol: number) => void;
  playbackRate: number;
  setSpeed: (rate: number) => void;
  pitchShift: number;
  setPitch: (semitones: number) => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | null>(null);

export function MediaPlayerProvider({ children }: { children: ReactNode }) {
  const mediaRef = useRef<HTMLMediaElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [pitchShift, setPitchShift] = useState(0);

  // Web Audio / Tone.js Refs
  const toneInitialized = useRef(false);
  const pitchShiftNodeRef = useRef<any>(null);
  const sourceNodeRef = useRef<any>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => setDuration(media.duration);
    const onPlay = async () => {
      setIsPlaying(true);
      await initTone();
    };
    const onPause = () => setIsPlaying(false);

    media.addEventListener("timeupdate", updateTime);
    media.addEventListener("loadedmetadata", updateDuration);
    media.addEventListener("play", onPlay);
    media.addEventListener("pause", onPause);

    // Sync state to native properties
    media.playbackRate = playbackRate;
    media.volume = volume;

    return () => {
      media.removeEventListener("timeupdate", updateTime);
      media.removeEventListener("loadedmetadata", updateDuration);
      media.removeEventListener("play", onPlay);
      media.removeEventListener("pause", onPause);
    };
  }, [mediaRef.current]);

  const initTone = async () => {
    if (toneInitialized.current || !mediaRef.current) return;
    try {
      const Tone = await import("tone");
      await Tone.start();

      // Only create the source once for this specific media element
      if (!sourceNodeRef.current) {
        // We use Tone context directly
        const source = Tone.getContext().createMediaElementSource(mediaRef.current);
        const pitchShifter = new Tone.PitchShift({
          pitch: pitchShift,
          windowSize: 0.1,
          delayTime: 0,
          feedback: 0
        }).toDestination();

        Tone.connect(source, pitchShifter);
        
        sourceNodeRef.current = source;
        pitchShiftNodeRef.current = pitchShifter;
      }
      toneInitialized.current = true;
    } catch (e) {
      console.error("Tone.js initialization error:", e);
    }
  };

  const togglePlay = async () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        await initTone();
        mediaRef.current.play().catch(console.error);
      }
    }
  };

  const seek = (time: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeVolume = (vol: number) => {
    if (mediaRef.current) {
      mediaRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const setSpeed = (rate: number) => {
    // Clamp between 0.5x and 2.0x
    const newRate = Math.max(0.5, Math.min(2.0, rate));
    if (mediaRef.current) {
      mediaRef.current.playbackRate = newRate;
    }
    setPlaybackRate(newRate);
  };

  const setPitch = (semitones: number) => {
    // Clamp between -12 and +12
    const newPitch = Math.max(-12, Math.min(12, semitones));
    if (pitchShiftNodeRef.current) {
      pitchShiftNodeRef.current.pitch = newPitch;
    }
    setPitchShift(newPitch);
  };

  return (
    <MediaPlayerContext.Provider
      value={{
        mediaRef,
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
      }}
    >
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const context = useContext(MediaPlayerContext);
  if (!context) {
    throw new Error("useMediaPlayer must be used within a MediaPlayerProvider");
  }
  return context;
}
