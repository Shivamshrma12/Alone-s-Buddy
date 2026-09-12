"use client";

import { useState, useEffect, useRef } from "react";
import { TravelMode, EmergencyContact, JourneyRecord } from "@/types";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { GeocodedPlace, searchDestination } from "@/lib/maps/geocoding";

interface JourneyControlPanelProps {
  destination: string;
  setDestination: (dest: string) => void;
  selectedDestination: GeocodedPlace | null;
  onSelectDestination: (place: GeocodedPlace) => void;
  userLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null;
  alone: boolean;
  setAlone: (alone: boolean) => void;
  safetyPriority: number;
  setSafetyPriority: (p: number) => void;
  maxDetourMinutes: number;
  setMaxDetourMinutes: (m: number) => void;
  currentUser: User | null;
  isAuthenticating: boolean;
  onJourneySaved: (record: JourneyRecord) => void;
  emergencyContacts: EmergencyContact[];
  onOpenEmergencyContacts: () => void;
  onTriggerSafetyReport: () => void;
  onResetSimulation: () => void;
  isRerouted: boolean;
  voiceDistressActive: boolean;
  isVoiceListening: boolean;
  isVoiceSupported: boolean;
  voiceErrorMessage: string | null;
  voiceTranscript?: string;
  onStartVoiceListening: () => void;
  onStopVoiceListening: () => void;
  transportMode?: "walking" | "cycling" | "driving";
  onSelectTransportMode?: (mode: "walking" | "cycling" | "driving") => void;
  routePreference?: "safe" | "balanced" | "quiet";
  onSelectRoutePreference?: (pref: "safe" | "balanced" | "quiet") => void;
  is3D?: boolean;
  onToggle3D?: () => void;
}

const QUICK_SEARCH_EXAMPLES = ["India Gate", "New Delhi Railway Station", "VIPS Pitampura"];

export function JourneyControlPanel({
  destination,
  setDestination,
  selectedDestination,
  onSelectDestination,
  userLocation,
  alone,
  setAlone,
  safetyPriority,
  setSafetyPriority,
  maxDetourMinutes,
  setMaxDetourMinutes,
  currentUser,
  isAuthenticating,
  onJourneySaved,
  emergencyContacts,
  onOpenEmergencyContacts,
  onTriggerSafetyReport,
  onResetSimulation,
  isRerouted,
  isVoiceListening,
  voiceErrorMessage,
  voiceTranscript,
  onStartVoiceListening,
  onStopVoiceListening,
  transportMode = "walking",
  onSelectTransportMode,
  routePreference = "safe",
  onSelectRoutePreference,
  is3D = true,
  onToggle3D,
}: JourneyControlPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Geocoding Autocomplete State
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search on destination input change
  const handleDestinationChange = (val: string) => {
    setDestination(val);
    if (validationError) setValidationError(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingPlaces(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchDestination(val);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 400);
  };

  const handleSelectPlace = (place: GeocodedPlace) => {
    setDestination(place.name);
    onSelectDestination(place);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleQuickSelect = async (query: string) => {
    setDestination(query);
    setIsSearchingPlaces(true);
    try {
      const results = await searchDestination(query);
      if (results.length > 0) {
        handleSelectPlace(results[0]);
      }
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handlePlanJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSubmissionFeedback(null);

    const trimmedDest = destination.trim();
    if (!trimmedDest) {
      setValidationError("Destination is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      // If no place selected yet, geocode the typed destination now
      let targetPlace = selectedDestination;
      if (!targetPlace || targetPlace.name !== trimmedDest) {
        const geocoded = await searchDestination(trimmedDest);
        if (geocoded.length > 0) {
          targetPlace = geocoded[0];
          onSelectDestination(geocoded[0]);
        }
      }

      const supabase = createClient();
      let activeUser = currentUser;

      if (!activeUser) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          activeUser = sessionData.session.user;
        } else {
          const { data: authData } = await supabase.auth.signInAnonymously();
          activeUser = authData?.user || null;
        }
      }

      if (!activeUser) {
        setSubmissionFeedback("Operating in local offline session.");
        return;
      }

      const payload = {
        user_id: activeUser.id,
        destination_name: targetPlace ? targetPlace.displayName : trimmedDest,
        mode: "walking" as TravelMode,
        alone,
        safety_priority: Number((safetyPriority / 100).toFixed(2)),
        max_detour_minutes: Math.max(0, Math.floor(maxDetourMinutes)),
        status: "planned",
        origin_lat: userLocation ? userLocation.latitude : 0,
        origin_lng: userLocation ? userLocation.longitude : 0,
        destination_lat: targetPlace ? targetPlace.latitude : 0,
        destination_lng: targetPlace ? targetPlace.longitude : 0,
      };

      const { data, error } = await supabase
        .from("journeys")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn("[Journey Planner] Supabase insert notice:", error.message);
        setSubmissionFeedback(`DB Status: ${error.message}`);
      } else if (data) {
        onJourneySaved(data as JourneyRecord);
        setSubmissionFeedback("✓ Real Journey Saved to Supabase");
        setTimeout(() => setSubmissionFeedback(null), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving journey";
      console.warn("[Journey Planner] Error:", msg);
      setSubmissionFeedback(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 sm:p-6 backdrop-blur-2xl shadow-xl shadow-cyan-950/10">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-3.5 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#143dfa] font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#143dfa] animate-pulse" />
            JOURNEY CONTROLS
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {currentUser ? "Session Active" : isAuthenticating ? "Auth..." : "Anonymous"}
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">
          WHERE ARE YOU GOING?
        </h2>
        <span className="text-[11px] text-neutral-400 font-mono block">
          OpenStreetMap • Free Multimodal Routing
        </span>
      </div>

      {validationError && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
          {validationError}
        </div>
      )}

      {submissionFeedback && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          {submissionFeedback}
        </div>
      )}

      {/* Inputs Form */}
      <form onSubmit={handlePlanJourney} className="space-y-4">
        {/* Real Destination Search with Nominatim Autocomplete */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-neutral-300">
              Destination (Real Places)
            </label>
            {isSearchingPlaces && (
              <span className="text-[10px] font-mono text-cyan-400 animate-pulse">
                Geocoding OSM...
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              placeholder="Search real location (e.g. India Gate, VIPS Pitampura)"
              className="w-full pl-9 pr-3 py-2.5 bg-neutral-950/70 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-colors font-sans"
            />
          </div>

          {/* Real Place Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-1.5 space-y-1 font-mono text-xs animate-in fade-in duration-150">
              {suggestions.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full text-left p-2 rounded-xl hover:bg-neutral-800 text-neutral-200 transition-colors cursor-pointer flex flex-col"
                >
                  <span className="font-bold text-cyan-300 truncate">{place.name}</span>
                  <span className="text-[10px] text-neutral-400 truncate">{place.displayName}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Search Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_SEARCH_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleQuickSelect(example)}
                className="px-2 py-0.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-cyan-500 text-[10px] font-mono text-neutral-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                + {example}
              </button>
            ))}
          </div>

          {selectedDestination && (
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center justify-between">
              <span className="truncate">📍 {selectedDestination.name}</span>
              <span className="shrink-0 text-neutral-400">
                {selectedDestination.latitude.toFixed(4)}, {selectedDestination.longitude.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Travel Mode Selector (WALK, CYCLE, DRIVE) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
              Travel Mode
            </label>
            <span className="text-[10px] font-mono text-cyan-400 capitalize">
              {transportMode} Active
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Walk */}
            <button
              type="button"
              onClick={() => onSelectTransportMode && onSelectTransportMode("walking")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                transportMode === "walking"
                  ? "bg-[#143dfa] text-white border-blue-400 shadow-[0_0_15px_rgba(20,61,250,0.5)]"
                  : "bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              <span>🚶</span>
              <span>WALK</span>
            </button>

            {/* Cycle */}
            <button
              type="button"
              onClick={() => onSelectTransportMode && onSelectTransportMode("cycling")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                transportMode === "cycling"
                  ? "bg-[#143dfa] text-white border-blue-400 shadow-[0_0_15px_rgba(20,61,250,0.5)]"
                  : "bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              <span>🚴</span>
              <span>CYCLE</span>
            </button>

            {/* Drive */}
            <button
              type="button"
              onClick={() => onSelectTransportMode && onSelectTransportMode("driving")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                transportMode === "driving"
                  ? "bg-[#143dfa] text-white border-blue-400 shadow-[0_0_15px_rgba(20,61,250,0.5)]"
                  : "bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              <span>🚗</span>
              <span>DRIVE</span>
            </button>
          </div>
        </div>

        {/* Route Preference Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
            Route Preference
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-neutral-950/70 p-1 rounded-2xl border border-neutral-800/80">
            <button
              type="button"
              onClick={() => onSelectRoutePreference && onSelectRoutePreference("safe")}
              className={`py-1.5 px-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                routePreference === "safe"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              🛡️ Safe
            </button>
            <button
              type="button"
              onClick={() => onSelectRoutePreference && onSelectRoutePreference("balanced")}
              className={`py-1.5 px-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                routePreference === "balanced"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              ⚖️ Balanced
            </button>
            <button
              type="button"
              onClick={() => onSelectRoutePreference && onSelectRoutePreference("quiet")}
              className={`py-1.5 px-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                routePreference === "quiet"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              🌿 Quiet
            </button>
          </div>
        </div>

        {/* Map Camera Perspective (2D / 3D) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
              Map Camera Perspective
            </label>
            <span className="text-[10px] font-mono text-cyan-400">
              {is3D ? "📐 3D Tilt Active" : "🗺️ 2D Flat Active"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (!is3D && onToggle3D) onToggle3D();
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                is3D
                  ? "bg-[#143dfa] text-white border-blue-400 shadow-[0_0_15px_rgba(20,61,250,0.5)]"
                  : "bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              <span>📐</span>
              <span>3D PERSPECTIVE</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (is3D && onToggle3D) onToggle3D();
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
                !is3D
                  ? "bg-[#143dfa] text-white border-blue-400 shadow-[0_0_15px_rgba(20,61,250,0.5)]"
                  : "bg-neutral-950/70 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              <span>🗺️</span>
              <span>2D TOP-DOWN</span>
            </button>
          </div>
        </div>

        {/* Walking Alone Toggle */}
        <div className="p-3 rounded-2xl bg-neutral-950/50 border border-neutral-800/80 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-neutral-200 block">
              I&apos;m walking alone
            </span>
            <span className="text-[10px] text-neutral-400 block">
              Activates safety vigilance & detour comparison
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={alone}
            onClick={() => setAlone(!alone)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              alone ? "bg-cyan-500" : "bg-neutral-800"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                alone ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Safety Priority Slider */}
        <div className="space-y-2 p-3 rounded-2xl bg-neutral-950/50 border border-neutral-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-200">
              Safety Priority
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-lg">
              {safetyPriority}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={safetyPriority}
            onChange={(e) => setSafetyPriority(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-neutral-500">
            <span>Fastest</span>
            <span className="text-cyan-400">
              {safetyPriority >= 75 ? "High Vigilance" : "Balanced"}
            </span>
            <span>Safest (100%)</span>
          </div>
        </div>

        {/* Maximum Additional Time */}
        <div className="p-3 rounded-2xl bg-neutral-950/50 border border-neutral-800/80 flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-neutral-200 block">
              Max Additional Time
            </span>
            <span className="text-[10px] text-neutral-400 block">
              Detour ceiling for safety rerouting
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              max="60"
              value={maxDetourMinutes}
              onChange={(e) => setMaxDetourMinutes(Number(e.target.value))}
              className="w-16 py-1.5 px-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 font-mono text-center text-xs focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[11px] font-mono text-neutral-400">min</span>
          </div>
        </div>

        {/* Plan / Start Journey Button (DB Persist) */}
        <button
          type="submit"
          disabled={isSubmitting || isAuthenticating}
          className="w-full py-3.5 px-4 rounded-2xl font-bold bg-gradient-to-r from-[#143dfa] via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/40 transition-all cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2 border border-blue-400/30"
        >
          {isSubmitting ? (
            <span>Calculating Real Route...</span>
          ) : (
            <>
              <span className="tracking-wider uppercase">START JOURNEY</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Emergency Contacts Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onOpenEmergencyContacts}
          className="w-full py-2.5 px-3.5 rounded-2xl font-mono text-xs font-semibold bg-neutral-950/70 hover:bg-neutral-800 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" />
            </svg>
            <span>Emergency Contacts</span>
          </div>
          <span className="text-[10px] bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded-full text-rose-300">
            {emergencyContacts.length} Configured
          </span>
        </button>
      </div>

      {/* Voice Distress Guard Section */}
      <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2.5 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isVoiceListening ? "bg-emerald-400 animate-ping" : "bg-neutral-600"}`} />
            <span className="text-xs font-semibold text-neutral-200">Voice Distress Guard</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            isVoiceListening
              ? "bg-emerald-950/80 border border-emerald-700 text-emerald-300"
              : "bg-neutral-900 border border-neutral-800 text-neutral-400"
          }`}>
            {isVoiceListening ? "ACTIVE" : "STANDBY"}
          </span>
        </div>

        {/* Action Button: [🎙 Activate Voice Guard] */}
        {!isVoiceListening ? (
          <button
            type="button"
            onClick={onStartVoiceListening}
            className="w-full py-2.5 px-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-neutral-950 text-xs shadow-lg shadow-cyan-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            🎙 Activate Voice Guard
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] text-emerald-300 font-bold">
                  Listening for HELP / BACHAO
                </span>
              </div>
              <button
                type="button"
                onClick={onStopVoiceListening}
                className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700 text-[10px] transition-colors cursor-pointer"
              >
                Stop
              </button>
            </div>

            {voiceTranscript && (
              <div className="text-[10px] text-cyan-400/90 bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800 truncate">
                Heard: &quot;{voiceTranscript}&quot;
              </div>
            )}
          </div>
        )}

        {/* Status / Error Message */}
        {voiceErrorMessage ? (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] leading-tight">
            ⚠️ {voiceErrorMessage}
          </div>
        ) : (
          <span className="text-[10px] text-neutral-400 block leading-tight">
            Say <strong className="text-neutral-200">&quot;help&quot;</strong>, <strong className="text-neutral-200">&quot;bachao&quot;</strong>, or <strong className="text-neutral-200">&quot;बचाओ&quot;</strong> to trigger emergency SOS.
          </span>
        )}
      </div>

      {/* HACKATHON AGENTIC DEMO CONTROLS */}
      <div className="pt-2 border-t border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            Simulated Demo Event
          </span>
          <span className="text-[9px] font-mono text-neutral-500">
            Real GPS + OSM Map
          </span>
        </div>

        {!isRerouted ? (
          <button
            type="button"
            onClick={onTriggerSafetyReport}
            className="w-full py-3 px-3.5 rounded-2xl font-bold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-neutral-950 text-xs shadow-lg shadow-amber-950/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ⚡ Trigger: &quot;New Safety Report&quot;
          </button>
        ) : (
          <button
            type="button"
            onClick={onResetSimulation}
            className="w-full py-2.5 px-3.5 rounded-2xl font-mono text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            ↺ Reset Route Simulation
          </button>
        )}
      </div>
    </div>
  );
}
