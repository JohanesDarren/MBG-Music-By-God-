export default function AnalysisDashboard() {
  const mockChords = ["C Maj", "G Min", "F Maj", "A Min", "D Min", "G Maj", "C Maj", "F Maj"];

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
          <div className="absolute left-[20%] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-brand-purple to-transparent z-20 shadow-[0_0_10px_rgba(139,92,246,0.8)]"></div>
          
          <div className="flex flex-row gap-3 overflow-x-auto items-center h-full w-full no-scrollbar pb-2">
            {mockChords.map((chord, index) => (
              <div 
                key={index} 
                className={`flex-shrink-0 flex items-center justify-center px-6 py-4 rounded-lg border transition-all duration-500 ${
                  index === 1 
                    ? "border-brand-purple bg-brand-purple/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.15)] scale-105" 
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                <span className="font-mono text-sm tracking-wider font-medium">{chord}</span>
              </div>
            ))}
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
            G Min
          </div>
        </div>
      </div>
    </div>
  );
}
