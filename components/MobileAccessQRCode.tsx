"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface MobileAccessQRCodeProps {
  productionUrl?: string;
}

export function MobileAccessQRCode({
  productionUrl = "https://alones-buddy.vercel.app",
}: MobileAccessQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    let target = productionUrl;
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      if (!origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        target = origin;
      }
    }

    QRCode.toDataURL(target, {
      width: 320,
      margin: 2,
      color: {
        dark: "#0b0c10",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url: string) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err: unknown) => console.error("Error generating QR code:", err));

    return () => {
      active = false;
    };
  }, [productionUrl]);

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(productionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 my-8 z-20">
      {/* Atmospheric Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#143dfa]/10 to-purple-900/10 rounded-3xl blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative glass-card rounded-3xl border border-white/10 p-6 sm:p-10 text-center flex flex-col items-center justify-center gap-6 overflow-hidden shadow-2xl">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none" />

        {/* Header Content */}
        <div className="space-y-2 max-w-xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#143dfa]/15 border border-[#143dfa]/30 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            MOBILE ACCESS
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            TAKE ALONES BUDDY WITH YOU
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-mono">
            Scan to open Alones Buddy on your phone.
          </p>
        </div>

        {/* QR Code Container Frame */}
        <div className="relative group z-10">
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#143dfa] to-cyan-400 rounded-3xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500" />

          <div className="relative bg-white p-4 rounded-2xl shadow-2xl border-4 border-neutral-900 flex items-center justify-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="Scan to open Alones Buddy on mobile"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-neutral-900 font-mono text-xs animate-pulse">
                Generating QR...
              </div>
            )}
          </div>
        </div>

        {/* Footer Sub-badges */}
        <div className="space-y-3 relative z-10">
          <div className="text-xs sm:text-sm font-mono font-extrabold tracking-widest text-[#143dfa] uppercase">
            SCAN • OPEN • NAVIGATE
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-neutral-400">
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              📱 Mobile Web App
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              🛰️ Real Browser GPS
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              🗺️ OpenStreetMap
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-mono text-neutral-300 transition-colors cursor-pointer"
            >
              {copied ? "✓ Copied!" : "📋 Copy URL"}
            </button>
            <a
              href={productionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#143dfa]/20 hover:bg-[#143dfa]/30 border border-[#143dfa]/40 text-xs font-mono text-blue-300 transition-colors cursor-pointer"
            >
              ↗ Open in New Tab
            </a>
          </div>

          <div className="text-[10px] font-mono text-neutral-500 pt-1">
            Destination: <span className="text-neutral-400">{productionUrl}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
