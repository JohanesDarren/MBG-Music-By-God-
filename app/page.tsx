"use client";

import { useState } from "react";
import Header from "./components/Header";
import MediaInjector from "./components/MediaInjector";
import MediaViewer from "./components/MediaViewer";
import PlaybackConsole from "./components/PlaybackConsole";
import CompactInjector from "./components/CompactInjector";
import AnalysisDashboard from "./components/AnalysisDashboard";
import { MediaPlayerProvider } from "./contexts/MediaPlayerContext";

export default function Home() {
  const [mediaFile, setMediaFile] = useState<{
    file: File;
    url: string;
  } | null>(null);

  const handleFileSelect = (file: File, url: string) => {
    setMediaFile({ file, url });
  };

  const hasMedia = !!mediaFile;

  return (
    <MediaPlayerProvider>
      <main className="relative flex min-h-screen flex-col items-center p-8 pb-48 overflow-hidden">
        {hasMedia && <CompactInjector onFileSelect={handleFileSelect} />}

        <div className={`transition-all duration-1000 ease-in-out w-full flex flex-col items-center ${hasMedia ? "mt-4" : "mt-12"}`}>
          <Header />
        </div>
        
        {!hasMedia ? (
          <div className="flex-1 w-full flex flex-col items-center justify-center animate-fade-in">
            <MediaInjector onFileSelect={handleFileSelect} />
          </div>
        ) : (
          <div className="w-full flex flex-col items-center flex-1 animate-slide-in-up mt-6">
            <div className="flex flex-col w-full max-w-6xl mx-auto gap-8 pb-10">
              {/* TIER 1: THE MEDIA PLAYER */}
              <MediaViewer file={mediaFile.file} url={mediaFile.url} />
              
              {/* TIER 2: THE ANALYSIS DASHBOARD */}
              <AnalysisDashboard />
              
              {/* TIER 3: THE MASTER CONSOLE */}
              <PlaybackConsole />
            </div>
          </div>
        )}
      </main>
    </MediaPlayerProvider>
  );
}
