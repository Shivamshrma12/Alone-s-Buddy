"use client";

import { useEffect, useState } from "react";

interface StayWithMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerEmergency: () => void;
  voiceDistressActive: boolean;
}

export function StayWithMeModal({
  isOpen,
  onClose,
  onTriggerEmergency,
  voiceDistressActive,
}: StayWithMeModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const [checkInsCount, setCheckInsCount] = useState(1);
  const [reassuranceMessage, setReassuranceMessage] = useState(
    "Alones Agent is actively accompanying you. Walking pace steady."
  );

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setCheckInsCount((c) => c + 1);
          setReassuranceMessage("Corridor check-in verified. Continuing safety surveillance.");
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const handleImOk = () => {
    setSecondsRemaining(120);
    setCheckInsCount((c) => c + 1);
    setReassuranceMessage("Status confirmed: User safe. Reset check-in timer.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-950/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-cyan-950/30 space-y-5 text-center relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Companion Orb */}
        <div className="flex flex-col items-center justify-center pt-2 relative z-10">
          <div className="relative flex items-center justify-center h-28 w-28">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/30 to-emerald-400/30 animate-ping opacity-60" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-cyan-500/40 to-emerald-400/40 animate-pulse" />
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center shadow-xl shadow-cyan-500/40">
              <svg className="w-10 h-10 text-neutral-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
          </div>

          <span className="mt-4 text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
            Active Accompaniment Mode
          </span>
          <h2 className="text-xl font-bold text-neutral-100 mt-0.5">
            Stay With Me
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs font-mono">
            {reassuranceMessage}
          </p>
        </div>

        {/* Check-In Countdown Card */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2 relative z-10">
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
            Next Proactive Check-In In
          </span>
          <div className="text-3xl font-black font-mono tracking-wider text-cyan-300">
            {formattedTime}
          </div>
          <div className="text-[11px] font-mono text-neutral-500">
            Check-ins completed: <span className="text-emerald-400 font-semibold">{checkInsCount}</span>
          </div>
        </div>

        {/* Distress Status Badge */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-900/50 py-2 px-3 rounded-xl border border-neutral-800/60">
          <span className={`h-2 w-2 rounded-full ${voiceDistressActive ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"}`} />
          <span>
            {voiceDistressActive
              ? "Voice Distress Guard Active (Say 'Help' / 'Bachao')"
              : "Voice Distress Standby"}
          </span>
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5 relative z-10 pt-1">
          <button
            type="button"
            onClick={handleImOk}
            className="w-full py-3.5 px-5 rounded-2xl font-bold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-lg shadow-cyan-950/40 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            I&apos;m OK — Confirm Safety
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 text-xs transition-colors cursor-pointer"
            >
              Minimize Mode
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onTriggerEmergency();
              }}
              className="py-2.5 px-4 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 text-white text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" />
              </svg>
              Trigger SOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
