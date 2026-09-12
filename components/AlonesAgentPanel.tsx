"use client";

import React from "react";
import { AgentTelemetry } from "@/types";

interface AlonesAgentPanelProps {
  telemetry: AgentTelemetry;
  isRerouted: boolean;
  maxDetourMinutes: number;
  onTriggerSafetyReport?: () => void;
  onResetSimulation?: () => void;
}

export function AlonesAgentPanel({
  telemetry,
  isRerouted,
  maxDetourMinutes,
  onTriggerSafetyReport,
  onResetSimulation,
}: AlonesAgentPanelProps) {
  return (
    <div className="w-full flex flex-col gap-3.5 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
      {/* Subtle Electric Accent Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#143dfa]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header: ALONES AI ● MONITORING */}
      <div className="border-b border-neutral-800/80 pb-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full bg-[#143dfa] flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
          </div>
          <span className="text-sm font-bold tracking-wider text-white font-mono">
            ALONES AI
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MONITORING
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-400 font-semibold">
          {isRerouted ? "Corridor Adapted" : "Live Surveillance"}
        </span>
      </div>

      {/* Compact Activity Stream / Reasoning Loop */}
      <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-3.5 space-y-2 relative z-10 font-mono">
        <div className="flex items-center justify-between text-[11px] border-b border-neutral-800/60 pb-2">
          <span className="text-neutral-400 uppercase tracking-wider font-semibold">
            Agent Reasoning Stream
          </span>
          <span className="text-[#143dfa] text-[10px] font-bold">
            {isRerouted ? "EVENT DETECTED" : "CYCLE SYNCHRONIZED"}
          </span>
        </div>

        {isRerouted ? (
          /* Hazard Detour Dynamic State */
          <div className="space-y-2 py-1 text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <span className="text-sm">⚠</span>
              <div className="flex flex-col">
                <span className="font-bold text-[11px]">HAZARD DETECTED</span>
                <span className="text-[10px] text-amber-300/80">SIMULATED DEMO EVENT</span>
              </div>
            </div>
            <div className="flex justify-center text-neutral-500 text-xs">↓</div>
            <div className="flex items-center justify-between px-2 text-[11px] text-neutral-300">
              <span className="text-neutral-400">RE-EVALUATING ROUTE</span>
              <span className="text-cyan-400 font-bold">In Progress...</span>
            </div>
            <div className="flex justify-center text-neutral-500 text-xs">↓</div>
            <div className="flex items-center justify-between px-2 text-[11px] text-neutral-300">
              <span className="text-neutral-400">ALTERNATIVE FOUND</span>
              <span className="text-emerald-400 font-bold">Illuminated Path</span>
            </div>
            <div className="flex justify-center text-neutral-500 text-xs">↓</div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <span className="font-bold text-[11px]">ROUTE UPDATED</span>
              <span className="font-extrabold text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600">
                +4 MIN
              </span>
            </div>
          </div>
        ) : (
          /* Baseline Monitoring Cycle */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-1 text-[11px]">
            <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex items-start gap-2">
              <span className="text-[#143dfa] font-bold">GOAL</span>
              <span className="text-neutral-300">Journey initialized</span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex items-start gap-2">
              <span className="text-cyan-400 font-bold">OBSERVE</span>
              <span className="text-neutral-300">Route & safety analyzed</span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex items-start gap-2">
              <span className="text-emerald-400 font-bold">DECIDE</span>
              <span className="text-neutral-300">Current route acceptable</span>
            </div>
            <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex items-start gap-2">
              <span className="text-purple-400 font-bold">ACT</span>
              <span className="text-neutral-300">Monitoring continues</span>
            </div>
            <div className="sm:col-span-2 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">VERIFY</span>
                <span className="text-neutral-300">Journey state synchronized</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                PASS
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Safety Score & Telemetry Mini HUD */}
      <div className="grid grid-cols-2 gap-2 relative z-10">
        {/* Safety Score Gauge */}
        <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
              Safety Score
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-2xl font-black font-mono ${isRerouted ? "text-emerald-400" : "text-[#143dfa]"}`}>
                {telemetry.safetyScore}
              </span>
              <span className="text-xs font-mono text-neutral-500">/ 100</span>
            </div>
          </div>
          {/* Circular Trend Indicator */}
          <div className="h-10 w-10 rounded-full border-2 border-dashed border-[#143dfa]/40 flex items-center justify-center">
            <span className="text-xs">{isRerouted ? "🛡️" : "✨"}</span>
          </div>
        </div>

        {/* ETA & Distance */}
        <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
            ETA & Corridor
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black font-mono text-neutral-100">
              {telemetry.etaMinutes}
            </span>
            <span className="text-xs font-mono text-neutral-500">min</span>
            {isRerouted && (
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                (+4m)
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-neutral-400 block mt-0.5 truncate">
            Max Detour Limit: +{maxDetourMinutes}m
          </span>
        </div>
      </div>

      {/* Simulated Safety Demo Controls */}
      <div className="pt-2 border-t border-neutral-800 flex items-center gap-2 relative z-10">
        <button
          type="button"
          onClick={onTriggerSafetyReport}
          className="flex-1 py-2.5 px-3 rounded-xl text-xs font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20"
        >
          <span>⚡</span>
          <span>Simulate Hazard (Demo Reroute)</span>
        </button>

        {isRerouted && (
          <button
            type="button"
            onClick={onResetSimulation}
            className="py-2.5 px-3 rounded-xl text-xs font-mono font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-all cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
