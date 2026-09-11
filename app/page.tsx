export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="w-full max-w-2xl bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">
              System Initialized
            </span>
          </div>
          <span className="text-xs font-mono text-neutral-500">v0.1.0 • Foundation</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
            Alones Buddy
          </h1>
          <p className="text-base text-neutral-400 font-medium">
            Agentic Adaptive Safety Navigation
          </p>
        </div>

        <p className="text-sm text-neutral-400 leading-relaxed">
          Autonomous pedestrian safety navigation powered by an adaptive AI agent. Responsive architecture featuring a desktop command center and a mobile map-first interface built on a unified journey state.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
          {[
            { label: "Next.js", status: "Active" },
            { label: "TypeScript", status: "Strict" },
            { label: "Tailwind CSS", status: "Configured" },
            { label: "Framer Motion", status: "Installed" },
            { label: "Grok Agent", status: "Standby" },
            { label: "Supabase", status: "Standby" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80"
            >
              <span className="text-xs text-neutral-500">{item.label}</span>
              <span className="text-sm font-semibold text-neutral-200">{item.status}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-neutral-800 text-xs font-mono text-neutral-500 flex items-center justify-between">
          <span>Single Codebase • Single Journey State</span>
          <span>Ready for Phase 2</span>
        </div>
      </div>
    </main>
  );
}
