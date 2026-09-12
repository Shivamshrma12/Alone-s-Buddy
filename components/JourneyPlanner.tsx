"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { JourneyRecord, TravelMode } from "@/types";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

export function JourneyPlanner() {
  const [destination, setDestination] = useState("");
  const [mode] = useState<TravelMode>("walking");
  const [alone, setAlone] = useState(true);
  const [safetyPriority, setSafetyPriority] = useState(80);
  const [maxDetourMinutes, setMaxDetourMinutes] = useState(10);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form & Submission State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [createdJourney, setCreatedJourney] = useState<JourneyRecord | null>(null);

  // Initialize and verify anonymous authentication
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function initAuth() {
      try {
        setIsAuthenticating(true);

        // 1. Check if a session already exists
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[Auth] Session retrieval failed:", sessionError.message);
        }

        if (sessionData?.session?.user) {
          const user = sessionData.session.user;
          console.log("[Auth] Existing session verified:", {
            sessionExists: true,
            userExists: true,
            userUuid: user.id,
          });

          if (isMounted) {
            setCurrentUser(user);
            setIsAuthenticating(false);
          }
          return;
        }

        // 2. No existing session found -> call signInAnonymously()
        console.log("[Auth] No session found. Invoking signInAnonymously()...");
        const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();

        if (signInError) {
          console.error("[Auth] signInAnonymously failed:", signInError.message);
          if (isMounted) {
            setAuthError(signInError.message);
            setIsAuthenticating(false);
          }
          return;
        }

        // 3. Retrieve and verify the resulting session and user
        const { data: verifiedSessionData } = await supabase.auth.getSession();
        const activeUser = authData?.user || verifiedSessionData?.session?.user || null;
        const activeSession = authData?.session || verifiedSessionData?.session || null;

        console.log("[Auth] Anonymous sign-in verified:", {
          sessionExists: Boolean(activeSession),
          userExists: Boolean(activeUser),
          userUuid: activeUser?.id || null,
        });

        if (isMounted) {
          setCurrentUser(activeUser);
          setIsAuthenticating(false);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unexpected authentication failure";
        console.error("[Auth] Unexpected error during anonymous sign-in:", errorMsg);
        if (isMounted) {
          setAuthError(errorMsg);
          setIsAuthenticating(false);
        }
      }
    }

    initAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user && isMounted) {
          setCurrentUser(session.user);
          setIsAuthenticating(false);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleReset = () => {
    setDestination("");
    setAlone(true);
    setSafetyPriority(80);
    setMaxDetourMinutes(10);
    setValidationError(null);
    setSubmissionError(null);
    setCreatedJourney(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSubmissionError(null);

    const trimmedDestination = destination.trim();
    if (!trimmedDestination) {
      setValidationError("Destination is required. Please specify where you are heading.");
      return;
    }

    if (maxDetourMinutes < 0 || isNaN(maxDetourMinutes)) {
      setValidationError("Maximum extra travel time must be a non-negative number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Ensure authenticated user UUID is available
      let activeUser: User | null = currentUser;
      if (!activeUser) {
        console.log("[Auth] User not in state. Checking active session...");
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          activeUser = sessionData.session.user;
          setCurrentUser(activeUser);
        } else {
          console.log("[Auth] No session found. Attempting signInAnonymously before insert...");
          const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError || !authData?.user) {
            const err = signInError?.message || "Failed to establish anonymous session.";
            console.error("[Auth] signInAnonymously failed during insert:", err);
            setSubmissionError(`Authentication failed: ${err}`);
            setIsSubmitting(false);
            return;
          }
          activeUser = authData.user;
          setCurrentUser(activeUser);
          console.log("[Auth] Established anonymous user before insert:", {
            sessionExists: Boolean(authData.session),
            userExists: Boolean(authData.user),
            userUuid: authData.user.id,
          });
        }
      }

      if (!activeUser) {
        setSubmissionError("Authentication session could not be verified. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const validUser: User = activeUser;

      // Payload storing journey parameters with authenticated user UUID
      // Note: safety_priority is numeric(3,2) in the database (0.00 to 1.00)
      // origin_lat/lng and destination_lat/lng satisfy not-null constraints until real geocoding phase
      const payload = {
        user_id: validUser.id,
        destination_name: trimmedDestination,
        mode,
        alone,
        safety_priority: Number((safetyPriority / 100).toFixed(2)),
        max_detour_minutes: Math.max(0, Math.floor(maxDetourMinutes)),
        status: "planned",
        origin_lat: 0,
        origin_lng: 0,
        destination_lat: 0,
        destination_lng: 0,
      };

      console.log("[Journey Planner] Inserting journey record for user:", validUser.id);

      const { data, error } = await supabase
        .from("journeys")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("[Journey Planner] Supabase insert failed:", {
          code: error.code,
          message: error.message,
        });

        setSubmissionError(error.message || "Failed to create journey in Supabase.");
        return;
      }

      if (data) {
        console.log("[Journey Planner] Journey record successfully created with ID:", data.id);
        setCreatedJourney(data as JourneyRecord);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred while creating the journey.";
      console.error("[Journey Planner] Unexpected error during submission:", errorMsg);
      setSubmissionError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success State View
  if (createdJourney) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-emerald-950/20 space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-5">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Journey Planned</h2>
            <p className="text-xs text-neutral-400 font-mono">
              Record stored in Supabase journeys table
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-1">
              <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold font-mono">
                Journey ID
              </span>
              <div className="font-mono text-xs text-cyan-300 break-all select-all">
                {createdJourney.id}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-1">
              <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold font-mono">
                Authenticated User UUID
              </span>
              <div className="font-mono text-xs text-emerald-300 break-all select-all">
                {createdJourney.user_id || currentUser?.id || "Anonymous"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-xs text-neutral-500 block mb-1">Destination</span>
              <span className="text-base font-semibold text-neutral-100">
                {createdJourney.destination_name}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-xs text-neutral-500 block mb-1">Travel Mode</span>
              <span className="text-base font-semibold text-neutral-100 capitalize">
                {createdJourney.mode}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-xs text-neutral-500 block mb-1">Walking Alone</span>
              <span className="text-base font-semibold text-neutral-100">
                {createdJourney.alone ? "Yes (Vigilance Enabled)" : "No (With Companions)"}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-xs text-neutral-500 block mb-1">Safety Priority</span>
              <span className="text-base font-semibold text-emerald-400">
                {Math.round(createdJourney.safety_priority * 100)}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-xs text-neutral-500 block mb-1">Max Detour Time</span>
              <span className="text-base font-semibold text-neutral-100">
                +{createdJourney.max_detour_minutes} minutes
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
              <span className="text-xs text-neutral-500 block mb-1">Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                {createdJourney.status}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-3.5 px-6 rounded-2xl font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700/60 transition-all duration-200 cursor-pointer text-center text-sm"
          >
            Plan Another Journey
          </button>
        </div>
      </div>
    );
  }

  // Active Form View
  return (
    <div className="w-full max-w-2xl mx-auto bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-cyan-950/10 space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`h-2.5 w-2.5 rounded-full ${currentUser ? "bg-emerald-400" : isAuthenticating ? "bg-cyan-400 animate-ping" : "bg-rose-400"}`} />
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              Phase 1 • Journey Setup
            </span>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            {currentUser ? (
              <span className="text-emerald-400/90 font-medium">Session Active</span>
            ) : isAuthenticating ? (
              "Authenticating..."
            ) : (
              "Anonymous"
            )}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
          Plan Your Safe Journey
        </h1>
        <p className="text-sm text-neutral-400">
          Define your destination and safety constraints. Our agent will plan your corridor according to these parameters.
        </p>
      </div>

      {/* Auth Error Banner (if any) */}
      {authError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <svg
            className="w-5 h-5 shrink-0 mt-0.5 text-rose-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="space-y-1">
            <span className="font-semibold block text-rose-200">Authentication Warning</span>
            <span className="leading-relaxed text-xs block opacity-90">{authError}</span>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3">
          <svg
            className="w-5 h-5 shrink-0 mt-0.5 text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="leading-relaxed">{validationError}</span>
        </div>
      )}

      {/* Supabase Submission Error Banner */}
      {submissionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <svg
            className="w-5 h-5 shrink-0 mt-0.5 text-rose-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="space-y-1">
            <span className="font-semibold block text-rose-200">Database Notice</span>
            <span className="leading-relaxed text-xs block opacity-90">{submissionError}</span>
          </div>
        </div>
      )}

      {/* Planning Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Destination Input */}
        <div className="space-y-2">
          <label
            htmlFor="destination-input"
            className="block text-sm font-semibold text-neutral-200"
          >
            Destination <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <input
              id="destination-input"
              type="text"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Central Station, 4th Avenue, Home"
              className="w-full pl-11 pr-4 py-3 bg-neutral-950/70 border border-neutral-800 rounded-2xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>
          <span className="text-xs text-neutral-500 block">
            Where you want Alones Buddy to safely navigate you.
          </span>
        </div>

        {/* 2. Travel Mode Selector */}
        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-neutral-200">
            Travel Mode
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Walking - Active */}
            <button
              type="button"
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/60 text-cyan-200 cursor-default transition-all"
            >
              <svg className="w-6 h-6 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7a2 2 0 100-4 2 2 0 000 4zm-2 4a2 2 0 100-4 2 2 0 000 4zm-1 8l2-5 3 2v5m-4-7l2-3 2 1"
                />
              </svg>
              <span className="text-xs font-semibold">Walking</span>
              <span className="text-[10px] text-cyan-400/80 font-mono mt-0.5">Active Mode</span>
            </button>

            {/* Cycling - Disabled / Future */}
            <button
              type="button"
              disabled
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-950/40 border border-neutral-800/60 text-neutral-500 opacity-50 cursor-not-allowed"
            >
              <svg className="w-6 h-6 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="5.5" cy="17.5" r="3.5" strokeWidth="2" />
                <circle cx="18.5" cy="17.5" r="3.5" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 6h-3l-3 6.5h6l3-6.5zm-3 6.5l-3.5 5m3.5-5l3.5 5" />
              </svg>
              <span className="text-xs font-medium">Cycling</span>
              <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-600 mt-0.5">
                Future
              </span>
            </button>

            {/* Driving - Disabled / Future */}
            <button
              type="button"
              disabled
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-neutral-950/40 border border-neutral-800/60 text-neutral-500 opacity-50 cursor-not-allowed"
            >
              <svg className="w-6 h-6 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h2"
                />
              </svg>
              <span className="text-xs font-medium">Driving</span>
              <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-600 mt-0.5">
                Future
              </span>
            </button>
          </div>
        </div>

        {/* 3. Walking Alone Toggle */}
        <div className="p-4 rounded-2xl bg-neutral-950/50 border border-neutral-800/80 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label
              htmlFor="walking-alone-toggle"
              className="text-sm font-semibold text-neutral-200 cursor-pointer block"
            >
              Walking Alone
            </label>
            <p className="text-xs text-neutral-400">
              Increases safety vigilance, favoring well-lit, populated, and monitored walkways.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            id="walking-alone-toggle"
            aria-checked={alone}
            onClick={() => setAlone(!alone)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              alone ? "bg-cyan-500" : "bg-neutral-800"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-neutral-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                alone ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* 4. Safety Priority Slider */}
        <div className="space-y-3 p-4 rounded-2xl bg-neutral-950/50 border border-neutral-800/80">
          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="safety-priority-slider"
                className="text-sm font-semibold text-neutral-200 block"
              >
                Safety Priority
              </label>
              <span className="text-xs text-neutral-400">
                Determines how aggressively the route prioritizes well-lit corridors over speed.
              </span>
            </div>
            <div className="flex items-baseline gap-1 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-xl">
              <span className="text-base font-bold font-mono text-cyan-400">
                {safetyPriority}
              </span>
              <span className="text-xs font-mono text-neutral-500">%</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <input
              id="safety-priority-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={safetyPriority}
              onChange={(e) => setSafetyPriority(Number(e.target.value))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] font-mono text-neutral-500 px-0.5">
              <span>0% (Fastest)</span>
              <span className="text-cyan-400 font-semibold">
                {safetyPriority >= 75
                  ? "High Vigilance"
                  : safetyPriority >= 40
                  ? "Balanced"
                  : "Speed Priority"}
              </span>
              <span>100% (Safest)</span>
            </div>
          </div>
        </div>

        {/* 5. Maximum Extra Travel Time */}
        <div className="space-y-2 p-4 rounded-2xl bg-neutral-950/50 border border-neutral-800/80">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label
                htmlFor="max-detour-input"
                className="text-sm font-semibold text-neutral-200 block"
              >
                Maximum Extra Travel Time
              </label>
              <span className="text-xs text-neutral-400">
                Upper limit on detour time allowed for safety rerouting.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="max-detour-input"
                type="number"
                min="0"
                max="120"
                value={maxDetourMinutes}
                onChange={(e) => setMaxDetourMinutes(Number(e.target.value))}
                className="w-20 py-2 px-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 font-mono text-center text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs font-mono text-neutral-400">min</span>
            </div>
          </div>
        </div>

        {/* 6. Plan Journey Button */}
        <button
          type="submit"
          id="plan-journey-btn"
          disabled={isSubmitting || isAuthenticating}
          className="w-full py-4 px-6 rounded-2xl font-semibold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:via-teal-400 hover:to-emerald-400 text-neutral-950 shadow-xl shadow-cyan-950/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-neutral-950"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Planning Journey...</span>
            </>
          ) : isAuthenticating ? (
            <span>Securing Session...</span>
          ) : (
            <>
              <span>Plan Journey</span>
              <svg
                className="w-5 h-5 text-neutral-950"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
