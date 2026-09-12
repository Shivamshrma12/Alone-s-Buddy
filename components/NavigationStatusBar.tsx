"use client";

import { JourneyStatus } from "@/types";

interface NavigationStatusBarProps {
  etaMinutes: number;
  safetyScore: number;
  distanceKm: number;
  status: JourneyStatus;
  isRerouted: boolean;
  onOpenStayWithMe: () => void;
  onTriggerEmergency: () => void;
}

export function NavigationStatusBar({
  etaMinutes,
  safetyScore,
  distanceKm,
  status,
  isRerouted,
  onOpenStayWithMe,
  onTriggerEmergency,
}: NavigationStatusBarProps) {
  return (
    <footer className="w-full bg-[#0f1117]/85 border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 backdrop-blur-2xl shadow-2xl relative z-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Telemetry metrics */}
        <div className="flex items-center justify-around sm:justify-start gap-3 sm:gap-6 w-full sm:w-auto text-xs font-mono">
          {/* ETA */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-neutral-500 text-[10px] uppercase font-bold">ETA:</span>
            <span className="text-white font-extrabold text-sm">
              {etaMinutes} min
            </span>
            {isRerouted && (
              <span className="text-[10px] font-bold text-emerald-400">
                (+4m)
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Safety Score */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-neutral-500 text-[10px] uppercase font-bold">SAFETY:</span>
            <span className={`font-black text-sm ${isRerouted ? "text-emerald-400" : "text-[#143dfa]"}`}>
              {safetyScore}%
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Distance */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-neutral-500 text-[10px] uppercase font-bold">DIST:</span>
            <span className="text-neutral-200 font-bold">
              {distanceKm} km
            </span>
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          {/* Journey Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px]">
            <span className={`h-2 w-2 rounded-full ${isRerouted ? "bg-emerald-400 animate-pulse" : "bg-[#143dfa] animate-pulse"}`} />
            <span className="text-neutral-300 font-bold uppercase tracking-wider">
              {isRerouted ? "Corridor Adapted" : status === "in_transit" ? "In Transit" : "Live Monitored"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Stay With Me Button */}
          <button
            type="button"
            onClick={onOpenStayWithMe}
            className="flex-1 sm:flex-none py-2 px-4 rounded-xl font-mono text-xs font-bold bg-[#143dfa]/15 hover:bg-[#143dfa]/25 border border-[#143dfa]/40 text-blue-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <div className="h-2 w-2 rounded-full bg-[#143dfa] animate-ping" />
            <span>Stay With Me</span>
          </button>

          {/* Emergency SOS Button */}
          <button
            type="button"
            onClick={onTriggerEmergency}
            className="flex-1 sm:flex-none py-2 px-5 rounded-xl font-mono text-xs font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse border border-red-500/40"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01" />
            </svg>
            <span>EMERGENCY SOS</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
