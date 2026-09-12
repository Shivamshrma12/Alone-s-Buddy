"use client";

import React from "react";
import dynamic from "next/dynamic";
import { RealWalkingRoute } from "@/lib/maps/routing";
import type { RealLeafletMapProps } from "@/components/RealLeafletMap";

// Dynamic import with SSR false for Leaflet
const RealLeafletMap = dynamic<RealLeafletMapProps>(
  () => import("@/components/RealLeafletMap").then((mod) => mod.RealLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[480px] bg-neutral-950 flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-neutral-400">Initializing OpenStreetMap Engine...</span>
      </div>
    ),
  }
);

interface PhoneNavigationFrameProps {
  userLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  locationPermissionDenied: boolean;
  onRequestLocation: () => void;
  destination: {
    name: string;
    latitude: number;
    longitude: number;
  } | null;
  activeRoute: RealWalkingRoute | null;
  alternativeRoute: RealWalkingRoute | null;
  isRerouted: boolean;
  simulatedHazard: {
    title: string;
    description: string;
    latitude: number;
    longitude: number;
  } | null;
  heading: number;
  orientationMode: "north-up" | "heading-up";
  onToggleOrientation: () => void;
  is3D: boolean;
  onToggle3D: () => void;
}

export function PhoneNavigationFrame({
  userLocation,
  locationPermissionDenied,
  onRequestLocation,
  destination,
  activeRoute,
  alternativeRoute,
  isRerouted,
  simulatedHazard,
  heading,
  orientationMode,
  onToggleOrientation,
  is3D,
  onToggle3D,
}: PhoneNavigationFrameProps) {
  return (
    <div className="w-full flex justify-center items-center h-full">
      {/* Phone Chassis Container */}
      <div className="relative w-full max-w-[460px] lg:max-w-[430px] h-[640px] sm:h-[680px] lg:h-[720px] rounded-[38px] sm:rounded-[44px] p-2.5 sm:p-3 bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950 border-2 border-neutral-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col">
        {/* Subtle metallic bezel rim */}
        <div className="absolute inset-0 rounded-[38px] sm:rounded-[44px] border border-white/10 pointer-events-none" />

        {/* Screen Inner Bezel */}
        <div className="relative w-full h-full rounded-[30px] sm:rounded-[34px] overflow-hidden bg-neutral-950 border border-neutral-800/80 flex flex-col">
          {/* Dynamic Island / Status Bar Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center justify-between px-3 w-[170px] h-6 rounded-full bg-black/90 border border-neutral-800/90 shadow-md pointer-events-none">
            {/* Camera sensor dot */}
            <div className="h-2 w-2 rounded-full bg-neutral-900 border border-neutral-700" />
            {/* Live Navigation Pill */}
            <div className="flex items-center gap-1.5 font-mono text-[9px]">
              <span className={`h-1.5 w-1.5 rounded-full ${userLocation ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-neutral-300 font-semibold tracking-wider uppercase">
                {isRerouted ? "ADAPTED" : "ALONES LIVE"}
              </span>
            </div>
            {/* Speaker mesh */}
            <div className="w-6 h-1 rounded-full bg-neutral-800" />
          </div>

          {/* Embedded Real OpenStreetMap Component */}
          <div className="w-full h-full">
            <RealLeafletMap
              userLocation={userLocation}
              locationPermissionDenied={locationPermissionDenied}
              onRequestLocation={onRequestLocation}
              destination={destination}
              activeRoute={activeRoute}
              alternativeRoute={alternativeRoute}
              isRerouted={isRerouted}
              simulatedHazard={simulatedHazard}
              heading={heading}
              orientationMode={orientationMode}
              onToggleOrientation={onToggleOrientation}
              is3D={is3D}
              onToggle3D={onToggle3D}
            />
          </div>

          {/* Bottom Gesture Bar */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 w-28 h-1 rounded-full bg-neutral-500/50 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
