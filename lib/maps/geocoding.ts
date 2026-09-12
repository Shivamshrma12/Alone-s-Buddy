/**
 * Alones Buddy — Real Geocoding Provider
 * 
 * Uses OpenStreetMap Nominatim for free, zero-billing real geocoding.
 * Adheres to Nominatim usage policy (identifying User-Agent, respectful queries).
 */

export interface GeocodedPlace {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type?: string;
  category?: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  importance?: number;
}

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "AlonesBuddy/1.0 (Pedestrian Safety Navigation)";

interface NominatimRawItem {
  place_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  importance?: number;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

/**
 * Search real geographic destinations using OpenStreetMap Nominatim.
 * Returns genuine latitude, longitude, and address metadata.
 */
export async function searchDestination(query: string): Promise<GeocodedPlace[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  try {
    const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&addressdetails=1&limit=5`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`[Geocoding] Nominatim request failed with status: ${res.status}`);
      return [];
    }

    const data: NominatimRawItem[] = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      const city = item.address?.city || item.address?.town || item.address?.village || "";
      const primaryName = item.name || item.display_name.split(",")[0].trim();

      return {
        id: String(item.place_id),
        name: primaryName,
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: item.type,
        category: item.class,
        importance: item.importance,
        address: {
          road: item.address?.road,
          suburb: item.address?.suburb,
          city,
          state: item.address?.state,
          country: item.address?.country,
          postcode: item.address?.postcode,
        },
      };
    });
  } catch (err) {
    console.error("[Geocoding] Search failed:", err);
    return [];
  }
}

/**
 * Reverse geocode real coordinates to get a human-readable street or area name.
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!res.ok) return "Current Location";
    const data: NominatimRawItem = await res.json();
    if (!data || !data.display_name) return "Current Location";

    // Return concise location name
    const parts = data.display_name.split(",");
    if (parts.length >= 2) {
      return `${parts[0].trim()}, ${parts[1].trim()}`;
    }
    return parts[0].trim();
  } catch {
    return "Current Location";
  }
}
