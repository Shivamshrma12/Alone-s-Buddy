/**
 * Alones Buddy — Real Location Provider
 * 
 * Uses standard browser Geolocation API (navigator.geolocation).
 * Captures genuine latitude, longitude, accuracy, and timestamp.
 * Strictly avoids IP-based fallbacks or hardcoded coordinates.
 */

export interface RealBrowserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export type GeolocationErrorCode = "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "NOT_SUPPORTED";

export class GeolocationError extends Error {
  code: GeolocationErrorCode;
  constructor(code: GeolocationErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "GeolocationError";
  }
}

/**
 * Check if the browser supports Geolocation
 */
export function isGeolocationSupported(): boolean {
  return typeof window !== "undefined" && Boolean(navigator && navigator.geolocation);
}

/**
 * Obtain current real browser location with high accuracy.
 * Never fabricates or hardcodes coordinates.
 */
export function getCurrentBrowserLocation(): Promise<RealBrowserLocation> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new GeolocationError("NOT_SUPPORTED", "Browser does not support geolocation."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        let code: GeolocationErrorCode = "POSITION_UNAVAILABLE";
        if (err.code === err.PERMISSION_DENIED) {
          code = "PERMISSION_DENIED";
        } else if (err.code === err.TIMEOUT) {
          code = "TIMEOUT";
        }
        reject(new GeolocationError(code, err.message || "Unable to acquire GPS location."));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000,
      }
    );
  });
}

/**
 * Watch real browser location updates.
 * Returns an unwatch cleanup function.
 */
export function watchBrowserLocation(
  onUpdate: (location: RealBrowserLocation) => void,
  onError: (error: GeolocationError) => void
): () => void {
  if (!isGeolocationSupported()) {
    onError(new GeolocationError("NOT_SUPPORTED", "Browser does not support geolocation."));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onUpdate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      });
    },
    (err) => {
      let code: GeolocationErrorCode = "POSITION_UNAVAILABLE";
      if (err.code === err.PERMISSION_DENIED) {
        code = "PERMISSION_DENIED";
      } else if (err.code === err.TIMEOUT) {
        code = "TIMEOUT";
      }
      onError(new GeolocationError(code, err.message || "Failed to update GPS location."));
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}
