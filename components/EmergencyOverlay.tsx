"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { EmergencyContact, EmergencyWorkflowState } from "@/types";

interface EmergencyOverlayProps {
  emergencyState: EmergencyWorkflowState;
  contacts: EmergencyContact[];
  onEscalate: () => void;
  onCancelEmergency: () => void;
}

export function EmergencyOverlay({
  emergencyState,
  contacts,
  onEscalate,
  onCancelEmergency,
}: EmergencyOverlayProps) {
  const [geoCoords, setGeoCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  }>({
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 12,
  });
  const [geoStatus, setGeoStatus] = useState<"acquiring" | "locked" | "fallback">("fallback");
  const [copiedLink, setCopiedLink] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const autoCallTriggeredRef = useRef(false);

  const p1 = contacts.find((c) => c.priority === 1) || {
    id: "p1",
    name: "Priority Contact 1",
    phone: "+1 (555) 019-2834",
    priority: 1 as const,
  };

  const p2 = contacts.find((c) => c.priority === 2) || {
    id: "p2",
    name: "Priority Contact 2",
    phone: "+1 (555) 019-5821",
    priority: 2 as const,
  };

  // Web Audio synthetic distress pulse
  useEffect(() => {
    if (!emergencyState.isActive) return;

    let intervalId: NodeJS.Timeout;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
        const playChime = () => {
          if (!audioCtxRef.current) return;
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, audioCtxRef.current.currentTime + 0.25);
          gain.gain.setValueAtTime(0.12, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.26);
        };

        playChime();
        intervalId = setInterval(playChime, 3000);
      }
    } catch {
      // Audio context may require explicit gesture in some browsers
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [emergencyState.isActive]);

  // Acquire Geolocation
  useEffect(() => {
    if (!emergencyState.isActive) return;

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5)),
            accuracy: pos.coords.accuracy,
          });
          setGeoStatus("locked");
        },
        () => {
          setGeoStatus("fallback");
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, [emergencyState.isActive]);

  // Trigger call helper
  const triggerCall = useCallback((phone: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    if (typeof window !== "undefined") {
      const telLink = document.createElement("a");
      telLink.href = `tel:${cleanPhone}`;
      document.body.appendChild(telLink);
      telLink.click();
      document.body.removeChild(telLink);
    }
  }, []);

  // Auto-initiate Priority 1 call on trigger
  useEffect(() => {
    if (emergencyState.isActive && !autoCallTriggeredRef.current) {
      autoCallTriggeredRef.current = true;
      triggerCall(p1.phone);
    }
    if (!emergencyState.isActive) {
      autoCallTriggeredRef.current = false;
    }
  }, [emergencyState.isActive, p1.phone, triggerCall]);

  const mapsUrl = `https://maps.google.com/?q=${geoCoords.latitude},${geoCoords.longitude}`;

  if (!emergencyState.isActive) return null;

  const copyShareLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(
        `EMERGENCY ALERT: I am in distress and need assistance. Live location: ${mapsUrl}`
      );
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isEscalated = emergencyState.stage === "escalated_contact_2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-xl bg-neutral-950 border-2 border-rose-600/80 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-rose-950/60 space-y-6 relative overflow-hidden">
        {/* Pulsing Alert Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-rose-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Emergency Beacon Header */}
        <div className="flex items-start justify-between border-b border-rose-900/50 pb-5 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-xl shadow-rose-600/50">
                <svg className="w-7 h-7 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-mono font-bold tracking-widest text-rose-300 uppercase">
                  Distress Signal Active
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {emergencyState.triggeredBy === "voice" ? "Trigger: Voice Recognition" : "Trigger: Manual SOS"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                EMERGENCY ESCALATION
              </h1>
            </div>
          </div>
        </div>

        {/* Live Status Banner */}
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-300 font-semibold flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              {isEscalated
                ? "Priority Contact 2 — Call initiated"
                : "Priority Contact 1 — Call initiated"}
            </span>
            <span className="text-[11px] font-mono text-rose-400 bg-rose-900/60 px-2 py-0.5 rounded-md">
              {isEscalated ? "Tier 2 Escalation" : "Tier 1 Active"}
            </span>
          </div>

          <div className="text-sm text-neutral-200">
            {isEscalated ? (
              <p>
                Escalated call initiated to <strong className="text-amber-300">{p2.name}</strong> (
                <span className="font-mono text-amber-200">{p2.phone}</span>).
              </p>
            ) : (
              <p>
                Emergency call initiated to <strong className="text-rose-300">{p1.name}</strong> (
                <span className="font-mono text-rose-200">{p1.phone}</span>).
              </p>
            )}
          </div>

          <div className="pt-1 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => triggerCall(isEscalated ? p2.phone : p1.phone)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Re-Dial {isEscalated ? p2.name : p1.name}
            </button>
          </div>
        </div>

        {/* Location Broadcast Card */}
        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-mono font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              Live Emergency Location Sharing
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
              {geoStatus === "locked" ? "GPS Live Fix" : "Corridor GPS Approx"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 font-mono">
              <span className="text-neutral-500 block text-[10px]">COORDINATES</span>
              <span className="text-cyan-300">
                {geoCoords?.latitude}, {geoCoords?.longitude}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 font-mono">
              <span className="text-neutral-500 block text-[10px]">BROADCAST RECIPIENTS</span>
              <span className="text-emerald-300 font-semibold">
                Priority 1 & Priority 2
              </span>
            </div>
          </div>

          {/* Share Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Google Maps Pin
            </a>

            <button
              type="button"
              onClick={copyShareLink}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copiedLink ? "✓ Copied Distress Link" : "Copy Distress Link"}
            </button>
          </div>
        </div>

        {/* Escalation Control */}
        <div className="space-y-3 relative z-10">
          {!isEscalated ? (
            <button
              type="button"
              onClick={() => {
                onEscalate();
                triggerCall(p2.phone);
              }}
              className="w-full py-4 px-6 rounded-2xl font-bold bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white shadow-xl shadow-rose-950/40 transition-all cursor-pointer flex items-center justify-center gap-3 text-base"
            >
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              </svg>
              No response — Escalate to Contact 2 ({p2.name})
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono text-center flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              Tier 2 Escalation active. Both Priority 1 & 2 notified with live GPS coordinates.
            </div>
          )}

          {/* Browser Limitation Notice */}
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-[11px] text-neutral-400 leading-relaxed font-mono">
            <span className="text-amber-400 font-semibold block mb-0.5">
              Telecom Browser Limitation:
            </span>
            Standard web browsers cannot programmatically detect carrier call completion or pickup status. If Contact 1 does not answer, tap &apos;No response — Escalate&apos; to immediately ring Contact 2.
          </div>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={onCancelEmergency}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-all text-sm cursor-pointer"
          >
            Cancel Emergency (False Alarm / Resolved)
          </button>
        </div>
      </div>
    </div>
  );
}
