"use client";

import React from "react";
import { RealWalkingRoute } from "@/lib/maps/routing";

interface WhatsAheadCardProps {
  activeRoute: RealWalkingRoute | null;
  simulatedHazard: {
    title: string;
    description: string;
    isSimulatedDemo: boolean;
  } | null;
  isRerouted: boolean;
}

export function WhatsAheadCard({
  activeRoute,
  simulatedHazard,
  isRerouted,
}: WhatsAheadCardProps) {
  // Extract upcoming turn instruction from the first step in active route
  const nextStep = activeRoute?.steps && activeRoute.steps.length > 0 ? activeRoute.steps[0] : null;

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-4 sm:p-5 backdrop-blur-2xl shadow-xl flex flex-col gap-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#143dfa] animate-pulse" />
          <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-white">
            WHAT&apos;S AHEAD
          </h3>
          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800">
            NEXT 700 M
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#143dfa]/15 text-blue-300 border border-blue-500/30 font-semibold">
          LIVE RADAR
        </span>
      </div>

      {/* Corridor Context Cards */}
      <div className="flex flex-col gap-2 text-xs font-mono">
        {/* Active Hazard Alert if simulated event active */}
        {simulatedHazard && !isRerouted && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-2.5 flex items-start gap-2.5">
            <span className="text-amber-400 text-sm mt-0.5">⚠</span>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300">Simulated Hazard Area</span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  DEMO EVENT
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
                {simulatedHazard.title}
              </p>
            </div>
          </div>
        )}

        {/* Adapted Safe Corridor notice if rerouted */}
        {isRerouted && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-2.5 flex items-start gap-2.5">
            <span className="text-emerald-400 text-sm mt-0.5">✓</span>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-300">Illuminated Detour Active</span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  VERIFIED SAFE
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed font-sans">
                Corridor rerouted via well-lit transit boulevard (+4m). Flagged hazard bypassed.
              </p>
            </div>
          </div>
        )}

        {/* Immediate Next Turn Guidance */}
        <div className="bg-neutral-950/70 border border-neutral-800/70 rounded-2xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-[#143dfa]/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              ↳
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400">NEXT TURN</span>
              <span className="font-semibold text-neutral-100">
                {nextStep
                  ? `${nextStep.instruction} (after ${nextStep.distanceMeters}m)`
                  : activeRoute
                  ? `Follow ${activeRoute.summary}`
                  : "Search destination to begin guidance"}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-blue-400 font-bold">
            {nextStep ? `~${Math.round(nextStep.durationSeconds / 60)} min` : "--"}
          </span>
        </div>

        {/* Verified POIs along corridor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <div className="bg-neutral-950/50 border border-neutral-800/60 rounded-xl p-2 flex items-center gap-2">
            <span className="text-[#143dfa] text-xs">↳ 🏛️</span>
            <div className="flex flex-col truncate">
              <span className="text-[9px] text-neutral-500">LANDMARK</span>
              <span className="text-[10px] font-medium text-neutral-300 truncate">Public Library</span>
            </div>
          </div>

          <div className="bg-neutral-950/50 border border-neutral-800/60 rounded-xl p-2 flex items-center gap-2">
            <span className="text-emerald-400 text-xs">↳ 🚇</span>
            <div className="flex flex-col truncate">
              <span className="text-[9px] text-neutral-500">TRANSIT</span>
              <span className="text-[10px] font-medium text-neutral-300 truncate">Metro Station</span>
            </div>
          </div>

          <div className="bg-neutral-950/50 border border-neutral-800/60 rounded-xl p-2 flex items-center gap-2">
            <span className="text-cyan-400 text-xs">↳ 🏥</span>
            <div className="flex flex-col truncate">
              <span className="text-[9px] text-neutral-500">HAVEN</span>
              <span className="text-[10px] font-medium text-neutral-300 truncate">Safe Public Facility</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
