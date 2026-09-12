"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type OrientationMode = "north-up" | "heading-up";

export interface DeviceOrientationState {
  heading: number; // 0 to 360 degrees, 0 = North
  smoothedHeading: number;
  isSupported: boolean;
  permissionGranted: boolean;
  mode: OrientationMode;
  setMode: (mode: OrientationMode) => void;
  toggleMode: () => void;
  requestPermission: () => Promise<boolean>;
}

// Low-pass filter weight for smoothing sensor jitter
const SMOOTHING_FACTOR = 0.15;

export function useDeviceOrientation(): DeviceOrientationState {
  const [heading, setHeading] = useState<number>(0);
  const [smoothedHeading, setSmoothedHeading] = useState<number>(0);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.DeviceOrientationEvent);
  });
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [mode, setMode] = useState<OrientationMode>("north-up");

  const smoothedRef = useRef<number>(0);

  // Request iOS permission if required
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    // Check iOS 13+ DeviceOrientationEvent permission API
    const DeviceOrientationEventAny = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };

    if (typeof DeviceOrientationEventAny?.requestPermission === "function") {
      try {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === "granted") {
          setPermissionGranted(true);
          return true;
        }
        return false;
      } catch (err) {
        console.warn("[Orientation] Permission request notice:", err);
        return false;
      }
    }

    // Standard browsers grant by default on mobile
    setPermissionGranted(true);
    return true;
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "north-up" ? "heading-up" : "north-up"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.DeviceOrientationEvent) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let rawHeading: number | null = null;

      // iOS Safari provides webkitCompassHeading directly (0 = North, clockwise)
      const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof webkitHeading === "number" && !isNaN(webkitHeading)) {
        rawHeading = webkitHeading;
      } else if (typeof e.alpha === "number" && !isNaN(e.alpha)) {
        // Android / W3C standard: alpha is rotation around z axis
        // Convert to compass bearing (0 = North, clockwise)
        rawHeading = (360 - e.alpha) % 360;
      }

      if (rawHeading !== null) {
        const normalized = (rawHeading + 360) % 360;
        setHeading(Math.round(normalized));

        // Angular smoothing with wrap-around at 0/360 degrees
        let diff = normalized - smoothedRef.current;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        // Apply low pass filter
        smoothedRef.current = (smoothedRef.current + diff * SMOOTHING_FACTOR + 360) % 360;
        setSmoothedHeading(Math.round(smoothedRef.current));
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  return {
    heading,
    smoothedHeading,
    isSupported,
    permissionGranted,
    mode,
    setMode,
    toggleMode,
    requestPermission,
  };
}
