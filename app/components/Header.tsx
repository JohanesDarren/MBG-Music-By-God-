export default function Header() {
  return (
    <header className="w-full flex flex-col items-center justify-center py-8 z-10 relative">
      <h1 className="text-5xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-brand-indigo to-brand-purple drop-shadow-lg">
        MBG
      </h1>
      <p className="mt-2 text-sm font-medium tracking-[0.3em] text-slate-400 uppercase">
        Music By God
      </p>
    </header>
  );
}
