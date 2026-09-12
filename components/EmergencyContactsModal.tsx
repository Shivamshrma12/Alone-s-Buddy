"use client";

import { useState } from "react";
import { EmergencyContact } from "@/types";

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: EmergencyContact[];
  onSaveContacts: (contacts: EmergencyContact[]) => void;
}

export function EmergencyContactsModal({
  isOpen,
  onClose,
  contacts,
  onSaveContacts,
}: EmergencyContactsModalProps) {
  const p1Default = contacts.find((c) => c.priority === 1);
  const p2Default = contacts.find((c) => c.priority === 2);

  const [p1Name, setP1Name] = useState(p1Default?.name || "");
  const [p1Phone, setP1Phone] = useState(p1Default?.phone || "");
  const [p2Name, setP2Name] = useState(p2Default?.name || "");
  const [p2Phone, setP2Phone] = useState(p2Default?.phone || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: EmergencyContact[] = [
      {
        id: "p1",
        name: p1Name.trim() || "Priority Contact 1",
        phone: p1Phone.trim() || "+1 (555) 019-2834",
        priority: 1,
      },
      {
        id: "p2",
        name: p2Name.trim() || "Priority Contact 2",
        phone: p2Phone.trim() || "+1 (555) 019-5821",
        priority: 2,
      },
    ];

    onSaveContacts(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-rose-950/20 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 tracking-tight">
                EMERGENCY CONTACTS
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Two-tier escalation for SOS & voice trigger
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Priority 1 */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                Priority 1 (Primary Distress Call)
              </span>
              <span className="text-[10px] font-mono text-neutral-500">Tier 1</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  placeholder="e.g. Mom / Guardian"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Phone number
                </label>
                <input
                  type="tel"
                  required
                  value={p1Phone}
                  onChange={(e) => setP1Phone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm font-mono focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Priority 2 */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Priority 2 (Escalation Contact)
              </span>
              <span className="text-[10px] font-mono text-neutral-500">Tier 2</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  placeholder="e.g. Brother / Emergency Line"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Phone number
                </label>
                <input
                  type="tel"
                  required
                  value={p2Phone}
                  onChange={(e) => setP2Phone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-5821"
                  className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-mono animate-in fade-in">
              ✓ Contacts saved to active session
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/60 transition-all text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-neutral-950 shadow-lg shadow-rose-950/30 transition-all text-sm cursor-pointer"
            >
              Save Contacts
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
