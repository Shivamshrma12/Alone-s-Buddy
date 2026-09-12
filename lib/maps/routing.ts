/**
 * Alones Buddy — Real Multimodal Route Provider
 * 
 * Supports Walking, Cycling, and Driving using free, zero-billing open routing.
 * Returns real street geometry, distance, duration, and turn steps.
 * Never invents or hardcodes fake routes.
 */

export type TransportMode = "walking" | "cycling" | "driving";

export interface RealRoutePoint {
  latitude: number;
  longitude: number;
}

export interface RealRouteStep {
  instruction: string;
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  location: [number, number]; // [lat, lng]
}

export interface RealWalkingRoute {
  id: string;
  name: string;
  coordinates: [number, number][]; // Array of [lat, lng] for Leaflet
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  summary: string;
  steps: RealRouteStep[];
  isAlternative?: boolean;
  mode?: TransportMode;
}

export interface CalculateRouteResponse {
  primaryRoute: RealWalkingRoute;
  alternativeRoutes: RealWalkingRoute[];
  provider: "OSRM_FOOT" | "OSRM_BIKE" | "OSRM_DRIVE";
}

const OSRM_ENDPOINTS: Record<TransportMode, string[]> = {
  walking: [
    "https://router.project-osrm.org/route/v1/foot",
    "https://routing.openstreetmap.de/routed-foot/route/v1/foot",
  ],
  cycling: [
    "https://routing.openstreetmap.de/routed-bike/route/v1/bicycle",
    "https://router.project-osrm.org/route/v1/cycling",
  ],
  driving: [
    "https://router.project-osrm.org/route/v1/driving",
    "https://routing.openstreetmap.de/routed-car/route/v1/driving",
  ],
};

interface OSRMStepRaw {
  maneuver?: {
    type?: string;
    modifier?: string;
    location?: [number, number]; // [lng, lat]
  };
  name?: string;
  distance?: number;
  duration?: number;
}

interface OSRMLegRaw {
  summary?: string;
  distance?: number;
  duration?: number;
  steps?: OSRMStepRaw[];
}

interface OSRMRouteRaw {
  geometry: {
    coordinates: [number, number][]; // [lng, lat] GeoJSON
    type: string;
  };
  distance: number; // meters
  duration: number; // seconds
  legs: OSRMLegRaw[];
}

interface OSRMResponseRaw {
  code: string;
  routes?: OSRMRouteRaw[];
  message?: string;
}

/**
 * Calculate real route from user location to destination for specified transport mode.
 */
export async function calculateWalkingRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  mode: TransportMode = "walking"
): Promise<CalculateRouteResponse> {
  const startLng = origin.longitude;
  const startLat = origin.latitude;
  const destLng = destination.longitude;
  const destLat = destination.latitude;

  const endpoints = OSRM_ENDPOINTS[mode] || OSRM_ENDPOINTS.walking;
  let lastError: Error | null = null;
  let data: OSRMResponseRaw | null = null;

  for (const base of endpoints) {
    try {
      const url = `${base}/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const json: OSRMResponseRaw = await res.json();
        if (json.code === "Ok" && json.routes && json.routes.length > 0) {
          data = json;
          break;
        }
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (!data || !data.routes || data.routes.length === 0) {
    throw new Error(
      lastError?.message || `No ${mode} route found between locations (${data?.code || "NETWORK_ERROR"})`
    );
  }

  const parseRoute = (r: OSRMRouteRaw, index: number): RealWalkingRoute => {
    // GeoJSON is [lng, lat] -> convert to Leaflet [lat, lng]
    const leafletCoords: [number, number][] = r.geometry.coordinates.map((c) => [c[1], c[0]]);

    const distanceKm = Number((r.distance / 1000).toFixed(2));
    const durationMinutes = Math.max(1, Math.round(r.duration / 60));

    const leg = r.legs && r.legs[0];
    const modeLabel = mode === "cycling" ? "Cycling Corridor" : mode === "driving" ? "Road Network" : "Walking Path";
    const summary = leg?.summary || (index === 0 ? `Direct ${modeLabel}` : `Alternative ${modeLabel} ${index}`);

    const steps: RealRouteStep[] = (leg?.steps || []).map((s) => ({
      instruction: `${s.maneuver?.type || "proceed"} ${s.maneuver?.modifier ? "towards " + s.maneuver.modifier : ""}`.trim(),
      name: s.name || (mode === "cycling" ? "Cycleway" : mode === "driving" ? "Roadway" : "Footpath"),
      distanceMeters: Math.round(s.distance || 0),
      durationSeconds: Math.round(s.duration || 0),
      location: s.maneuver?.location ? [s.maneuver.location[1], s.maneuver.location[0]] : [leafletCoords[0][0], leafletCoords[0][1]],
    }));

    return {
      id: `route-${mode}-${index}`,
      name: summary,
      coordinates: leafletCoords,
      distanceMeters: Math.round(r.distance),
      distanceKm,
      durationSeconds: Math.round(r.duration),
      durationMinutes,
      summary,
      steps,
      isAlternative: index > 0,
      mode,
    };
  };

  const primaryRoute = parseRoute(data.routes[0], 0);
  const alternativeRoutes = data.routes.slice(1).map((r, i) => parseRoute(r, i + 1));

  const providerType = mode === "cycling" ? "OSRM_BIKE" : mode === "driving" ? "OSRM_DRIVE" : "OSRM_FOOT";

  return {
    primaryRoute,
    alternativeRoutes,
    provider: providerType,
  };
}
