"use client";

import { createContext, useContext, useRef, useState, useEffect, useCallback, ReactNode } from "react";

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
  trackVolumes: {
    harmonic: number;
    percussive: number;
  };
  handleVolumeChange: (track: "harmonic" | "percussive", vol: number) => void;
  stems: { harmonic: string | null; percussive: string | null };
  isProcessingStems: boolean;
  trackMutes: { harmonic: boolean; percussive: boolean };
  processAudioWithAI: () => void;
  toggleTrackMute: (track: "harmonic" | "percussive") => void;
  setSourceFile: (file: File) => void;
  chordMap: { time: number; chord: string }[];
  isProcessingChords: boolean;
  fetchChords: (file: File) => Promise<void>;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | null>(null);

export function MediaPlayerProvider({ children }: { children: ReactNode }) {
  const mediaRef = useRef<HTMLMediaElement>(null);
  const sourceFileRef = useRef<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [pitchShift, setPitchShift] = useState(0);

  const fetchChords = useCallback(async (file: File) => {
    setIsProcessingChords(true);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);

      console.log("Fetching chords for", file.name);
      const res = await fetch("http://127.0.0.1:8000/api/process/chords", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to process chords");

      const data = await res.json();
      console.log("Received chord data:", data);
      if (Array.isArray(data)) {
        setChordMap(data);
      } else {
        console.error("Backend returned an error or invalid data format:", data);
      }
    } catch (error) {
      console.error("Error processing chords:", error);
    } finally {
      setIsProcessingChords(false);
    }
  }, []);

  const setSourceFile = useCallback((file: File) => {
    sourceFileRef.current = file;
    setChordMap([]); // Clear old chords
    fetchChords(file);   // Fetch new chords
  }, [fetchChords]);

  const [trackVolumes, setTrackVolumes] = useState({
    harmonic: 1.0,
    percussive: 1.0,
  });

  const [stems, setStems] = useState<{ harmonic: string | null; percussive: string | null }>({
    harmonic: null,
    percussive: null,
  });
  const [isProcessingStems, setIsProcessingStems] = useState(false);
  const [trackMutes, setTrackMutes] = useState({
    harmonic: false,
    percussive: false,
  });

  const [chordMap, setChordMap] = useState<{ time: number; chord: string }[]>([]);
  const [isProcessingChords, setIsProcessingChords] = useState(false);

  // Web Audio / Tone.js Refs
  const toneInitialized = useRef(false);
  const pitchShiftNodeRef = useRef<any>(null);
  const sourceNodeRef = useRef<any>(null);

  const stemAudioRefs = useRef<{
    harmonic: HTMLAudioElement;
    percussive: HTMLAudioElement;
  } | null>(null);
  const stemSourceNodesRef = useRef<any>({});

  if (!stemAudioRefs.current && typeof window !== "undefined") {
    stemAudioRefs.current = {
      harmonic: new Audio(),
      percussive: new Audio(),
    };
    Object.values(stemAudioRefs.current).forEach((a) => {
      a.crossOrigin = "anonymous";
      a.preload = "auto";
    });
  }

  // Stable Audio Graph Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainsRef = useRef<{
    harmonic: GainNode | null;
    percussive: GainNode | null;
  }>({
    harmonic: null,
    percussive: null,
  });
  const isGraphSetup = useRef<boolean>(false);

  const cleanupAudioNodes = (complete: boolean) => {
    if (complete) {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
        sourceNodeRef.current = null;
      }
      Object.values(stemSourceNodesRef.current).forEach((node: any) => {
        try { node.disconnect(); } catch (e) {}
      });
      stemSourceNodesRef.current = {};

      if (pitchShiftNodeRef.current) {
        try { pitchShiftNodeRef.current.dispose(); } catch (e) {}
        pitchShiftNodeRef.current = null;
      }
      audioCtxRef.current = null;
      isGraphSetup.current = false;
      
      // Stop stem audios
      if (stemAudioRefs.current) {
        Object.values(stemAudioRefs.current).forEach(a => {
           a.pause();
           a.src = "";
        });
      }
      setStems({ harmonic: null, percussive: null });
    } else {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch (e) {}
      }
      Object.values(stemSourceNodesRef.current).forEach((node: any) => {
        try { node.disconnect(); } catch (e) {}
      });
    }

    gainsRef.current = { harmonic: null, percussive: null };
    toneInitialized.current = false;
  };

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => setCurrentTime(media.currentTime);
    const updateDuration = () => setDuration(media.duration);
    const onPlay = async () => {
      setIsPlaying(true);
      await initTone();
      if (stemAudioRefs.current && stems.harmonic) {
        Object.values(stemAudioRefs.current).forEach((a) => {
          if (a.src) a.play().catch(() => {});
        });
      }
    };
    const onPause = () => {
      setIsPlaying(false);
      if (stemAudioRefs.current && stems.harmonic) {
        Object.values(stemAudioRefs.current).forEach((a) => a.pause());
      }
    };
    const onTrackChange = () => {
      cleanupAudioNodes(true); // reset stems when changing main track
    };

    media.addEventListener("timeupdate", updateTime);
    media.addEventListener("loadedmetadata", updateDuration);
    media.addEventListener("play", onPlay);
    media.addEventListener("pause", onPause);
    media.addEventListener("loadstart", onTrackChange);

    return () => {
      media.removeEventListener("timeupdate", updateTime);
      media.removeEventListener("loadedmetadata", updateDuration);
      media.removeEventListener("play", onPlay);
      media.removeEventListener("pause", onPause);
      media.removeEventListener("loadstart", onTrackChange);
      // We only want to cleanup nodes when the component completely unmounts
    };
  }, [mediaRef.current, stems.harmonic]);

  useEffect(() => {
    return () => {
      cleanupAudioNodes(true);
    };
  }, []);

  useEffect(() => {
    const media = mediaRef.current;
    if (media) {
      media.playbackRate = playbackRate;
      media.volume = volume;
    }
  }, [playbackRate, volume]);

  const initTone = async () => {
    if (!mediaRef.current || !stemAudioRefs.current) return;
    try {
      const Tone = await import("tone");
      await Tone.start();

      const ctx = Tone.getContext().rawContext as AudioContext;
      audioCtxRef.current = ctx;

      // Only create the sources once for these media elements
      if (!isGraphSetup.current) {
        sourceNodeRef.current = Tone.getContext().createMediaElementSource(mediaRef.current);
        stemSourceNodesRef.current.harmonic = Tone.getContext().createMediaElementSource(stemAudioRefs.current.harmonic);
        stemSourceNodesRef.current.percussive = Tone.getContext().createMediaElementSource(stemAudioRefs.current.percussive);
        isGraphSetup.current = true;
      }

      if (!pitchShiftNodeRef.current) {
        pitchShiftNodeRef.current = new Tone.PitchShift({
          pitch: pitchShift,
          windowSize: 0.1,
          delayTime: 0,
          feedback: 0
        }).toDestination();
      }

      if (!toneInitialized.current) {
        ["harmonic", "percussive"].forEach((track) => {
          const k = track as "harmonic" | "percussive";
          const gain = ctx.createGain();
          gain.gain.value = trackMutes[k] ? 0 : trackVolumes[k];
          gainsRef.current[k] = gain;

          stemSourceNodesRef.current[k].connect(gain);
          Tone.connect(gain, pitchShiftNodeRef.current);
        });

        if (!stems.harmonic) {
          Tone.connect(sourceNodeRef.current, pitchShiftNodeRef.current);
        }

        toneInitialized.current = true;
      }
    } catch (e) {
      console.error("Tone.js initialization error:", e);
    }
  };

  const processAudioWithAI = async () => {
    if (!mediaRef.current || !stemAudioRefs.current) return;
    
    // Use the stored File object directly — fetching a blob: URL fails cross-origin
    const file = sourceFileRef.current;
    if (!file) {
      console.error("No source file available for HPSS processing.");
      return;
    }

    setIsProcessingStems(true);

    try {
      // 1. Create FormData payload with the original File
      const formData = new FormData();
      formData.append("file", file, file.name);

      // 2. Send to FastAPI backend
      const apiRes = await fetch("http://127.0.0.1:8000/api/process/hpss", {
        method: "POST",
        body: formData,
      });

      if (!apiRes.ok) {
        throw new Error("Failed to process HPSS separation");
      }

      const data = await apiRes.json();
      
      // Assume the backend returns URLs to the processed files, e.g. { harmonic: 'url', percussive: 'url' }
      // If it only returns filenames, we'd need to prepend the backend host URL.
      // We will parse the URLs ensuring they point to the backend if they are relative.
      const getFullUrl = (url: string) => url.startsWith("http") ? url : `http://127.0.0.1:8000${url.startsWith('/') ? '' : '/'}${url}`;

      const newStems = { 
        harmonic: getFullUrl(data.harmonic), 
        percussive: getFullUrl(data.percussive) 
      };

      // Mute the master track since we will play the stems
      mediaRef.current.volume = 0;
      setVolume(0);

      setStems(newStems);

      Object.entries(stemAudioRefs.current).forEach(([key, audio]) => {
        audio.src = newStems[key as keyof typeof newStems];
        audio.currentTime = mediaRef.current!.currentTime;
        audio.playbackRate = playbackRate;
        if (isPlaying || !mediaRef.current!.paused) {
          audio.play().catch((e) => console.log(e));
        }
      });

      if (audioCtxRef.current && isGraphSetup.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (e) {}
      }
    } catch (error) {
      console.error("Error during HPSS separation:", error);
    } finally {
      setIsProcessingStems(false);
    }
  };

  // fetchChords has been moved up

  const togglePlay = async () => {
    if (mediaRef.current) {
      if (!mediaRef.current.paused) {
        mediaRef.current.pause();
        setIsPlaying(false);
        if (stemAudioRefs.current && stems.harmonic) {
          Object.values(stemAudioRefs.current).forEach((a) => a.pause());
        }
      } else {
        await initTone();
        mediaRef.current.play().catch(console.error);
        setIsPlaying(true);
        if (stemAudioRefs.current && stems.harmonic) {
          Object.values(stemAudioRefs.current).forEach((a) => {
            if (a.src) a.play().catch(() => {});
          });
        }
      }
    }
  };

  const seek = (time: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
      if (stemAudioRefs.current && stems.harmonic) {
        Object.values(stemAudioRefs.current).forEach((audio) => {
          if (audio.src) audio.currentTime = time;
        });
      }
    }
  };

  const changeVolume = (vol: number) => {
    if (mediaRef.current && !stems.harmonic) {
      mediaRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const setSpeed = (rate: number) => {
    const newRate = Math.max(0.5, Math.min(2.0, rate));
    if (mediaRef.current) {
      mediaRef.current.playbackRate = newRate;
    }
    if (stemAudioRefs.current && stems.harmonic) {
      Object.values(stemAudioRefs.current).forEach((audio) => {
        audio.playbackRate = newRate;
      });
    }
    setPlaybackRate(newRate);
  };

  const setPitch = (semitones: number) => {
    const newPitch = Math.max(-12, Math.min(12, semitones));
    if (pitchShiftNodeRef.current) {
      pitchShiftNodeRef.current.pitch = newPitch;
    }
    setPitchShift(newPitch);
  };

  const handleVolumeChange = (track: "harmonic" | "percussive", vol: number) => {
    const clampedVol = Math.max(0.0, Math.min(2.0, vol));
    setTrackVolumes((prev) => ({ ...prev, [track]: clampedVol }));

    if (!trackMutes[track]) {
      const node = gainsRef.current[track];
      if (node && audioCtxRef.current) {
        node.gain.setTargetAtTime(clampedVol, audioCtxRef.current.currentTime, 0.01);
      }
    }
  };

  const toggleTrackMute = (track: "harmonic" | "percussive") => {
    setTrackMutes((prev) => {
      const newMutes = { ...prev, [track]: !prev[track] };
      const node = gainsRef.current[track];
      if (node && audioCtxRef.current) {
        const targetGain = newMutes[track] ? 0 : trackVolumes[track];
        node.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.01);
      }
      return newMutes;
    });
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
        trackVolumes,
        handleVolumeChange,
        stems,
        isProcessingStems,
        trackMutes,
        processAudioWithAI,
        toggleTrackMute,
        setSourceFile,
        chordMap,
        isProcessingChords,
        fetchChords,
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
