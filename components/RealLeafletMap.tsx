"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Map as LeafletMap, LayerGroup, Polyline, Marker, Circle } from "leaflet";
import { RealWalkingRoute } from "@/lib/maps/routing";

export interface RealLeafletMapProps {
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
  heading?: number;
  orientationMode?: "north-up" | "heading-up";
  onToggleOrientation?: () => void;
  is3D?: boolean;
  onToggle3D?: () => void;
  className?: string;
}

export function RealLeafletMap({
  userLocation,
  locationPermissionDenied,
  onRequestLocation,
  destination,
  activeRoute,
  alternativeRoute,
  isRerouted,
  simulatedHazard,
  heading = 0,
  orientationMode = "north-up",
  onToggleOrientation,
  is3D: propIs3D,
  onToggle3D,
  className = "",
}: RealLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<LayerGroup | null>(null);

  // Persistent layer references to prevent re-creation
  const userMarkerRef = useRef<Marker | null>(null);
  const accuracyCircleRef = useRef<Circle | null>(null);
  const destMarkerRef = useRef<Marker | null>(null);
  const primaryGlowLineRef = useRef<Polyline | null>(null);
  const primaryCoreLineRef = useRef<Polyline | null>(null);
  const altGlowLineRef = useRef<Polyline | null>(null);
  const altCoreLineRef = useRef<Polyline | null>(null);
  const hazardMarkerRef = useRef<Marker | null>(null);

  // Local state fallbacks if not controlled from parent
  const [internalIs3D, setInternalIs3D] = useState(true);
  const is3D = propIs3D !== undefined ? propIs3D : internalIs3D;

  const [tileStyle, setTileStyle] = useState<"dark" | "standard">("dark");
  const [isMapReady, setIsMapReady] = useState(false);

  // Initial user location ref to center initial map without triggering re-creation
  const initialLocRef = useRef(userLocation);

  // 1. Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapRef.current) return;

    let isCancelled = false;

    async function initMap() {
      const L = await import("leaflet");
      if (isCancelled || !mapContainerRef.current) return;

      const loc = initialLocRef.current;
      const initialCenter: [number, number] = loc
        ? [loc.latitude, loc.longitude]
        : [28.6139, 77.209]; // Fallback to Delhi center
      const initialZoom = loc ? 15 : 13;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      });

      // 100% Genuine OpenStreetMap Tile Server — Zero billing, no API key required
      const osmTileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(osmTileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Attribution
      L.control
        .attribution({
          position: "bottomright",
          prefix: '<span class="text-[9px] text-neutral-400 font-mono">&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" class="text-cyan-400 hover:underline">OpenStreetMap</a></span>',
        })
        .addTo(map);

      // Layer group for all dynamic overlays
      const overlayLayer = L.layerGroup().addTo(map);

      mapRef.current = map;
      layersRef.current = overlayLayer;
      setIsMapReady(true);
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = null;
      }
    };
  }, []); // Run ONCE on mount!

  // 2. User Location updates: Move existing marker without re-creating map or calling fitBounds
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !layersRef.current || !userLocation) return;

    import("leaflet").then((L) => {
      const userLatLng: [number, number] = [userLocation.latitude, userLocation.longitude];

      if (!userMarkerRef.current) {
        // Create user marker once
        const userIcon = L.divIcon({
          className: "custom-user-pin",
          html: `
            <div class="relative flex items-center justify-center h-8 w-8 -translate-x-1/2 -translate-y-1/2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 bg-cyan-400 border-2 border-white shadow-lg"></span>
              <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-neutral-900/95 border border-cyan-400/50 text-[9px] font-mono text-cyan-300 font-bold shadow">
                YOU
              </div>
            </div>
          `,
          iconSize: [32, 32],
        });

        const marker = L.marker(userLatLng, { icon: userIcon });
        marker.bindPopup(`
          <div class="p-1 font-mono text-xs">
            <strong class="text-cyan-400">Current GPS Position</strong><br/>
            Accuracy: ±${Math.round(userLocation.accuracy)}m
          </div>
        `);
        layersRef.current?.addLayer(marker);
        userMarkerRef.current = marker;

        // Accuracy circle
        if (userLocation.accuracy && userLocation.accuracy < 1000) {
          const circle = L.circle(userLatLng, {
            radius: userLocation.accuracy,
            color: "#06b6d4",
            fillColor: "#06b6d4",
            fillOpacity: 0.08,
            weight: 1,
          });
          layersRef.current?.addLayer(circle);
          accuracyCircleRef.current = circle;
        }
      } else {
        // Smoothly update existing marker position
        userMarkerRef.current.setLatLng(userLatLng);
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setLatLng(userLatLng);
          if (userLocation.accuracy) {
            accuracyCircleRef.current.setRadius(userLocation.accuracy);
          }
        }
      }
    });
  }, [isMapReady, userLocation]);

  // 3. Destination updates: Create or move destination marker
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !layersRef.current) return;

    import("leaflet").then((L) => {
      if (!destination) {
        if (destMarkerRef.current) {
          layersRef.current?.removeLayer(destMarkerRef.current);
          destMarkerRef.current = null;
        }
        return;
      }

      const destLatLng: [number, number] = [destination.latitude, destination.longitude];

      if (!destMarkerRef.current) {
        const destIcon = L.divIcon({
          className: "custom-dest-pin",
          html: `
            <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full">
              <span class="px-2 py-0.5 rounded-lg bg-neutral-900/95 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 shadow whitespace-nowrap mb-1">
                📍 ${destination.name}
              </span>
              <div class="h-4 w-4 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 border-2 border-white shadow-lg"></div>
            </div>
          `,
          iconSize: [32, 48],
        });

        const marker = L.marker(destLatLng, { icon: destIcon });
        marker.bindPopup(`
          <div class="p-1 font-mono text-xs">
            <strong>${destination.name}</strong><br/>
            Geocoded Destination
          </div>
        `);
        layersRef.current?.addLayer(marker);
        destMarkerRef.current = marker;
      } else {
        destMarkerRef.current.setLatLng(destLatLng);
      }
    });
  }, [isMapReady, destination]);

  // 4. Route polylines update: Update coordinates and fit view once when route changes
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !layersRef.current) return;

    import("leaflet").then((L) => {
      // Clear previous polylines
      if (primaryGlowLineRef.current) layersRef.current?.removeLayer(primaryGlowLineRef.current);
      if (primaryCoreLineRef.current) layersRef.current?.removeLayer(primaryCoreLineRef.current);
      if (altGlowLineRef.current) layersRef.current?.removeLayer(altGlowLineRef.current);
      if (altCoreLineRef.current) layersRef.current?.removeLayer(altCoreLineRef.current);

      const bounds = L.latLngBounds([]);

      if (activeRoute && activeRoute.coordinates.length > 0) {
        activeRoute.coordinates.forEach((c) => bounds.extend(c));

        if (isRerouted) {
          // Flagged/original path shown as dashed dim red
          const core = L.polyline(activeRoute.coordinates, {
            color: "#ef4444",
            weight: 3.5,
            opacity: 0.5,
            dashArray: "6, 8",
          });
          layersRef.current?.addLayer(core);
          primaryCoreLineRef.current = core;
        } else {
          // Primary Route (Glowing Cyber Cyan)
          const glow = L.polyline(activeRoute.coordinates, {
            color: "#06b6d4",
            weight: 10,
            opacity: 0.25,
            lineCap: "round",
            lineJoin: "round",
          });
          const core = L.polyline(activeRoute.coordinates, {
            color: "#22d3ee",
            weight: 5,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          });
          layersRef.current?.addLayer(glow);
          layersRef.current?.addLayer(core);
          primaryGlowLineRef.current = glow;
          primaryCoreLineRef.current = core;
        }
      }

      // Alternative Route
      if (alternativeRoute && alternativeRoute.coordinates.length > 0) {
        if (isRerouted) {
          alternativeRoute.coordinates.forEach((c) => bounds.extend(c));

          // Alternative is now ACTIVE -> Glowing Emerald Line
          const altGlow = L.polyline(alternativeRoute.coordinates, {
            color: "#10b981",
            weight: 12,
            opacity: 0.3,
            lineCap: "round",
            lineJoin: "round",
          });
          const altCore = L.polyline(alternativeRoute.coordinates, {
            color: "#34d399",
            weight: 5,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          });
          layersRef.current?.addLayer(altGlow);
          layersRef.current?.addLayer(altCore);
          altGlowLineRef.current = altGlow;
          altCoreLineRef.current = altCore;
        } else {
          // Standby alternative route (dashed indigo)
          const standby = L.polyline(alternativeRoute.coordinates, {
            color: "#818cf8",
            weight: 3.5,
            opacity: 0.6,
            dashArray: "6, 6",
          });
          layersRef.current?.addLayer(standby);
          altCoreLineRef.current = standby;
        }
      }

      // Fit bounds once for the route
      if (bounds.isValid() && mapRef.current) {
        mapRef.current.fitBounds(bounds, {
          padding: [45, 45],
          maxZoom: 16,
        });
      }
    });
  }, [isMapReady, activeRoute, alternativeRoute, isRerouted]);

  // 5. Simulated Hazard Marker updates
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !layersRef.current) return;

    import("leaflet").then((L) => {
      if (!simulatedHazard) {
        if (hazardMarkerRef.current) {
          layersRef.current?.removeLayer(hazardMarkerRef.current);
          hazardMarkerRef.current = null;
        }
        return;
      }

      const hazardLatLng: [number, number] = [simulatedHazard.latitude, simulatedHazard.longitude];

      if (!hazardMarkerRef.current) {
        const hazardIcon = L.divIcon({
          className: "custom-hazard-pin",
          html: `
            <div class="relative flex flex-col items-center -translate-x-1/2 -translate-y-full">
              <span class="px-2 py-0.5 rounded-md bg-rose-950/95 border border-rose-500 text-[10px] font-mono font-bold text-rose-300 shadow whitespace-nowrap mb-1">
                ⚠️ SIMULATED SAFETY EVENT
              </span>
              <div class="h-6 w-6 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold animate-bounce">
                !
              </div>
            </div>
          `,
          iconSize: [36, 48],
        });

        const marker = L.marker(hazardLatLng, { icon: hazardIcon });
        marker.bindPopup(`
          <div class="p-1 font-mono text-xs text-rose-300">
            <strong>${simulatedHazard.title}</strong><br/>
            ${simulatedHazard.description}<br/>
            <span class="text-[10px] text-amber-400 font-bold uppercase">Simulated Demo Hazard</span>
          </div>
        `);
        layersRef.current?.addLayer(marker);
        hazardMarkerRef.current = marker;
      } else {
        hazardMarkerRef.current.setLatLng(hazardLatLng);
      }
    });
  }, [isMapReady, simulatedHazard]);

  // Recenter to User Location
  const handleRecenter = useCallback(() => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.setView([userLocation.latitude, userLocation.longitude], 16, {
      animate: true,
    });
  }, [userLocation]);

  // Fit All Bounds
  const handleFitRoute = useCallback(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      const bounds = L.latLngBounds([]);
      if (userLocation) bounds.extend([userLocation.latitude, userLocation.longitude]);
      if (destination) bounds.extend([destination.latitude, destination.longitude]);
      if (activeRoute) activeRoute.coordinates.forEach((c) => bounds.extend(c));
      if (alternativeRoute) alternativeRoute.coordinates.forEach((c) => bounds.extend(c));

      if (bounds.isValid() && mapRef.current) {
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    });
  }, [userLocation, destination, activeRoute, alternativeRoute]);

  const toggle3DHandler = () => {
    if (onToggle3D) {
      onToggle3D();
    } else {
      setInternalIs3D((v) => !v);
    }
  };

  // Compass rotation angle: if heading-up mode, rotate map by -heading
  const mapRotationStyle =
    orientationMode === "heading-up"
      ? { transform: `rotateZ(${-heading}deg)` }
      : undefined;

  return (
    <div
      className={`relative w-full h-full bg-neutral-950 overflow-hidden select-none leaflet-perspective-container ${
        is3D ? "map-tilt-3d" : "map-tilt-2d"
      } ${tileStyle === "dark" ? "leaflet-dark-tiles" : ""} ${className}`}
    >
      {/* Leaflet DOM container */}
      <div
        ref={mapContainerRef}
        style={mapRotationStyle}
        className="w-full h-full z-0 map-heading-rotation"
      />

      {/* 3D Atmospheric Navigation Horizon & Forward Beam */}
      <div
        className={`nav-3d-horizon ${
          is3D ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`nav-forward-beam ${
          is3D ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="nav-vignette" />

      {/* Real Map Floating Controls (Top Right — positioned clearly below phone notch) */}
      <div className="absolute top-11 right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          {/* 2D / 3D Perspective Tilt Button */}
          <button
            type="button"
            onClick={toggle3DHandler}
            title={is3D ? "Switch to 2D Top-Down View" : "Switch to 3D Perspective View"}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
              is3D
                ? "bg-[#143dfa] text-white border-blue-400 shadow-[0_0_15px_rgba(20,61,250,0.5)]"
                : "bg-neutral-900/85 hover:bg-neutral-800 text-neutral-300 border-neutral-700/80"
            }`}
          >
            <span>{is3D ? "📐 3D TILT" : "🗺️ 2D FLAT"}</span>
          </button>

          {/* Compass / Orientation Mode Button */}
          {onToggleOrientation && (
            <button
              type="button"
              onClick={onToggleOrientation}
              title={`Orientation: ${orientationMode === "heading-up" ? "Heading-Up (Tap for North-Up)" : "North-Up (Tap for Heading-Up)"}`}
              className={`h-8 px-2 rounded-xl text-xs font-mono font-bold border backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
                orientationMode === "heading-up"
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-neutral-900/85 hover:bg-neutral-800 text-neutral-300 border-neutral-700/80"
              }`}
            >
              <svg
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{ transform: `rotate(${heading}deg)` }}
                viewBox="0 0 24 24"
                fill="none"
              >
                <polygon points="12,2 17,22 12,17 7,22" fill="#ef4444" />
                <polygon points="12,2 17,22 12,17" fill="#dc2626" />
                <polygon points="12,17 17,22 12,22 7,22" fill="#3b82f6" />
              </svg>
              <span className="text-[10px]">
                {orientationMode === "heading-up" ? "HEAD UP" : "NORTH"}
              </span>
            </button>
          )}

          {/* Tile theme toggle (Zero-Billing Dark filter vs Standard OSM) */}
          <button
            type="button"
            onClick={() => setTileStyle((s) => (s === "dark" ? "standard" : "dark"))}
            title="Toggle Day/Night Map View"
            className="h-8 w-8 rounded-xl bg-neutral-900/85 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 backdrop-blur-md flex items-center justify-center text-xs font-mono transition-colors cursor-pointer"
          >
            {tileStyle === "dark" ? "🌙" : "☀️"}
          </button>
        </div>

        {/* Secondary controls column: Recenter & Zoom */}
        <div className="flex items-center gap-1.5 pt-1">
          {/* Zoom In */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="h-7 w-7 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 backdrop-blur-md flex items-center justify-center text-sm font-mono font-bold transition-colors cursor-pointer"
          >
            +
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="h-7 w-7 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 backdrop-blur-md flex items-center justify-center text-sm font-mono font-bold transition-colors cursor-pointer"
          >
            −
          </button>

          {/* Recenter */}
          <button
            type="button"
            onClick={handleRecenter}
            disabled={!userLocation}
            title={userLocation ? "Recenter to GPS" : "GPS not acquired"}
            className="h-7 w-7 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-cyan-400 border border-neutral-800 backdrop-blur-md flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
          </button>

          {/* Fit Bounds */}
          <button
            type="button"
            onClick={handleFitRoute}
            title="Fit route in view"
            className="h-7 w-7 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floating HUD Pill (Next Step / Route Status) at Top Left */}
      <div className="absolute top-3 left-3 z-20 max-w-[70%] sm:max-w-xs pointer-events-auto">
        {activeRoute ? (
          <div className="flex items-center gap-2.5 bg-neutral-950/90 backdrop-blur-xl border border-neutral-800 px-3 py-2 rounded-2xl shadow-xl">
            <div
              className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                isRerouted
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                  : "bg-[#143dfa]/20 border border-blue-500/40 text-blue-400"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7a2 2 0 100-4 2 2 0 000 4zm-1 8l2-5 3 2v5m-4-7l2-3 2 1" />
              </svg>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-neutral-100 truncate">
                  {isRerouted ? "Adapted Corridor" : "Active Route"}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-300 border border-blue-800 shrink-0 font-semibold">
                  {activeRoute.distanceKm} km • {activeRoute.durationMinutes}m
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono block truncate">
                {activeRoute.summary || "OpenStreetMap Corridor"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-mono text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Search destination for real route</span>
          </div>
        )}
      </div>

      {/* Permission Denied Warning Banner */}
      {locationPermissionDenied && (
        <div className="absolute inset-x-3 top-16 z-30 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-mono backdrop-blur-md flex items-center justify-between gap-2 shadow-2xl">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400">⚠</span>
            <span>Location permission required for live navigation.</span>
          </div>
          <button
            type="button"
            onClick={onRequestLocation}
            className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
          >
            Allow
          </button>
        </div>
      )}

      {/* Bottom Telemetry HUD */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 px-2.5 py-1 rounded-full text-[10px] font-mono text-neutral-400">
          <span className={`h-1.5 w-1.5 rounded-full ${userLocation ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"}`} />
          <span>
            {userLocation
              ? `GPS ±${Math.round(userLocation.accuracy)}m (${userLocation.latitude.toFixed(3)}, ${userLocation.longitude.toFixed(3)})`
              : "Awaiting GPS"}
          </span>
        </div>
      </div>
    </div>
  );
}
