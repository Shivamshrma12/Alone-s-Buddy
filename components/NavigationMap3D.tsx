"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPoint, NavigationRoute, SimulatedHazardEvent } from "@/types";

interface NavigationMap3DProps {
  destinationName: string;
  activeRoute: NavigationRoute;
  alternativeRoute: NavigationRoute;
  isRerouted: boolean;
  hazardEvent: SimulatedHazardEvent | null;
  onSelectAlternative?: () => void;
}

interface Building {
  x: number;
  y: number;
  w: number;
  h: number;
  height: number;
  roofColor: string;
  windowColor: string;
  windows: { col: number; row: number }[];
  isLandmark?: boolean;
  label?: string;
}

interface SafePOI {
  x: number;
  y: number;
  type: "safe_place" | "cctv" | "landmark" | "light";
  label: string;
  color: string;
}

export function NavigationMap3D({
  destinationName,
  activeRoute,
  alternativeRoute,
  isRerouted,
  hazardEvent,
}: NavigationMap3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport & Camera State
  const [zoom, setZoom] = useState(1.05);
  const [is3D, setIs3D] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Animation pulse phase
  const pulsePhaseRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // User position along path (slow cinematic walk)
  const userProgressRef = useRef(0.18);

  // Pre-generate city buildings
  const buildingsRef = useRef<Building[]>([
    // Row 1
    { x: 70, y: 60, w: 90, h: 70, height: 80, roofColor: "#161e2e", windowColor: "#38bdf8", windows: [{ col: 3, row: 4 }] },
    { x: 190, y: 50, w: 100, h: 80, height: 130, roofColor: "#1e293b", windowColor: "#34d399", windows: [{ col: 4, row: 6 }], isLandmark: true, label: "Civic Tower" },
    { x: 320, y: 60, w: 80, h: 70, height: 60, roofColor: "#161e2e", windowColor: "#fbbf24", windows: [{ col: 3, row: 3 }] },
    { x: 430, y: 50, w: 110, h: 80, height: 95, roofColor: "#1a2234", windowColor: "#38bdf8", windows: [{ col: 4, row: 5 }] },
    { x: 570, y: 60, w: 85, h: 70, height: 75, roofColor: "#161e2e", windowColor: "#c084fc", windows: [{ col: 3, row: 4 }] },
    
    // Row 2
    { x: 60, y: 200, w: 100, h: 90, height: 110, roofColor: "#1a2234", windowColor: "#38bdf8", windows: [{ col: 4, row: 5 }] },
    { x: 330, y: 210, w: 75, h: 80, height: 50, roofColor: "#161e2e", windowColor: "#34d399", windows: [{ col: 3, row: 3 }] },
    { x: 560, y: 200, w: 100, h: 90, height: 85, roofColor: "#1a2234", windowColor: "#fbbf24", windows: [{ col: 4, row: 4 }] },
    
    // Row 3
    { x: 70, y: 360, w: 85, h: 75, height: 70, roofColor: "#161e2e", windowColor: "#38bdf8", windows: [{ col: 3, row: 4 }] },
    { x: 185, y: 350, w: 110, h: 90, height: 120, roofColor: "#1e293b", windowColor: "#c084fc", windows: [{ col: 4, row: 6 }], isLandmark: true, label: "Metro Plaza" },
    { x: 325, y: 360, w: 85, h: 75, height: 65, roofColor: "#161e2e", windowColor: "#34d399", windows: [{ col: 3, row: 3 }] },
    { x: 440, y: 350, w: 100, h: 90, height: 90, roofColor: "#1a2234", windowColor: "#38bdf8", windows: [{ col: 4, row: 5 }] },
    { x: 570, y: 360, w: 90, h: 75, height: 75, roofColor: "#161e2e", windowColor: "#fbbf24", windows: [{ col: 3, row: 4 }] },

    // Row 4
    { x: 60, y: 490, w: 100, h: 80, height: 80, roofColor: "#161e2e", windowColor: "#38bdf8", windows: [{ col: 4, row: 4 }] },
    { x: 195, y: 490, w: 90, h: 80, height: 55, roofColor: "#161e2e", windowColor: "#34d399", windows: [{ col: 3, row: 3 }] },
    { x: 320, y: 490, w: 90, h: 80, height: 70, roofColor: "#1a2234", windowColor: "#c084fc", windows: [{ col: 3, row: 4 }] },
    { x: 440, y: 490, w: 100, h: 80, height: 100, roofColor: "#1e293b", windowColor: "#38bdf8", windows: [{ col: 4, row: 5 }] },
    { x: 570, y: 490, w: 90, h: 80, height: 60, roofColor: "#161e2e", windowColor: "#fbbf24", windows: [{ col: 3, row: 3 }] },
  ]);

  // Safe POIs on map
  const poisRef = useRef<SafePOI[]>([
    { x: 175, y: 170, type: "safe_place", label: "24/7 Supermarket", color: "#10b981" },
    { x: 420, y: 170, type: "safe_place", label: "Metro Hub (Staffed)", color: "#06b6d4" },
    { x: 420, y: 320, type: "cctv", label: "Corridor CCTV Lock", color: "#38bdf8" },
    { x: 175, y: 320, type: "light", label: "High-Lux Lamp Post", color: "#f59e0b" },
    { x: 550, y: 170, type: "cctv", label: "Emergency Help Point", color: "#ec4899" },
  ]);

  // Transform 2D world coords to Screen coords (isometric / tilted perspective)
  const project = useCallback(
    (wx: number, wy: number, wz = 0, width: number, height: number): [number, number] => {
      const cx = width / 2 + pan.x;
      const cy = height / 2 + pan.y;

      const relX = (wx - 350) * zoom;
      const relY = (wy - 300) * zoom;

      if (!is3D) {
        // 2D flat top-down mode
        return [cx + relX, cy + relY - wz * zoom];
      }

      // 3D Isometric projection angle
      const tiltCos = 0.86;
      const tiltSin = 0.52;

      const isoX = relX * tiltCos - relY * tiltSin;
      const isoY = (relX * tiltSin + relY * tiltCos) * 0.62 - wz * zoom * 0.85;

      return [cx + isoX, cy + isoY];
    },
    [zoom, is3D, pan]
  );

  // Main Render Loop
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Update pulse phase
      pulsePhaseRef.current = (pulsePhaseRef.current + 0.02) % (Math.PI * 2);

      // Background - Dark cyber night
      ctx.fillStyle = "#070a12";
      ctx.fillRect(0, 0, width, height);

      // Subtle atmospheric background gradient
      const bgGlow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.7);
      bgGlow.addColorStop(0, "rgba(8, 28, 48, 0.45)");
      bgGlow.addColorStop(0.6, "rgba(5, 14, 26, 0.2)");
      bgGlow.addColorStop(1, "rgba(3, 7, 13, 0)");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Grid Roads
      const horizontalStreets = [
        { y: 170, w: 34, name: "OAK AVENUE" },
        { y: 320, w: 34, name: "METRO WAY" },
        { y: 460, w: 26, name: "4TH STREET" },
      ];
      const verticalStreets = [
        { x: 175, w: 30, name: "1ST AVE" },
        { x: 305, w: 30, name: "CENTER BLVD" },
        { x: 420, w: 34, name: "ILLUMINATED CORRIDOR" },
        { x: 550, w: 28, name: "PARKWAY" },
      ];

      // Draw horizontal streets
      horizontalStreets.forEach((st) => {
        const p1 = project(30, st.y, 0, width, height);
        const p2 = project(670, st.y, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = "#0e1524";
        ctx.lineWidth = st.w * zoom;
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        // Center lane dashes
        ctx.beginPath();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
        ctx.setLineDash([8 * zoom, 12 * zoom]);
        ctx.lineWidth = 1.5;
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw vertical streets
      verticalStreets.forEach((st) => {
        const p1 = project(st.x, 30, 0, width, height);
        const p2 = project(st.x, 570, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = "#0e1524";
        ctx.lineWidth = st.w * zoom;
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
        ctx.setLineDash([8 * zoom, 12 * zoom]);
        ctx.lineWidth = 1.5;
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 2. Draw 3D Buildings
      // Sort buildings back-to-front for proper isometric occlusion
      const sortedBuildings = [...buildingsRef.current].sort((a, b) => a.y + a.x - (b.y + b.x));

      sortedBuildings.forEach((b) => {
        const h = is3D ? b.height : 0;
        // Ground polygon
        const g0 = project(b.x, b.y, 0, width, height);
        const g2 = project(b.x + b.w, b.y + b.h, 0, width, height);
        const g3 = project(b.x, b.y + b.h, 0, width, height);

        // Roof polygon
        const r0 = project(b.x, b.y, h, width, height);
        const r1 = project(b.x + b.w, b.y, h, width, height);
        const r2 = project(b.x + b.w, b.y + b.h, h, width, height);
        const r3 = project(b.x, b.y + b.h, h, width, height);

        if (is3D && h > 0) {
          // Left Wall
          ctx.beginPath();
          ctx.moveTo(g3[0], g3[1]);
          ctx.lineTo(r3[0], r3[1]);
          ctx.lineTo(r0[0], r0[1]);
          ctx.lineTo(g0[0], g0[1]);
          ctx.closePath();
          ctx.fillStyle = "#0c111c";
          ctx.fill();
          ctx.strokeStyle = "rgba(30, 41, 59, 0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Right Wall
          ctx.beginPath();
          ctx.moveTo(g3[0], g3[1]);
          ctx.lineTo(r3[0], r3[1]);
          ctx.lineTo(r2[0], r2[1]);
          ctx.lineTo(g2[0], g2[1]);
          ctx.closePath();
          ctx.fillStyle = "#111827";
          ctx.fill();
          ctx.strokeStyle = "rgba(30, 41, 59, 0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Illuminated Windows on Right Wall
          const windowRows = Math.min(6, Math.floor(h / 18));
          for (let row = 1; row <= windowRows; row++) {
            for (let col = 1; col <= 3; col++) {
              if ((b.x + row + col) % 3 !== 0) {
                const wx = b.x + (b.w * col) / 4;
                const wy = b.y + b.h;
                const wz = (h * row) / (windowRows + 1);
                const wp = project(wx, wy, wz, width, height);

                ctx.fillStyle = b.windowColor;
                ctx.globalAlpha = 0.55 + Math.sin(pulsePhaseRef.current + row) * 0.15;
                ctx.fillRect(wp[0] - 2 * zoom, wp[1] - 2 * zoom, 3 * zoom, 3 * zoom);
                ctx.globalAlpha = 1.0;
              }
            }
          }
        }

        // Roof Face
        ctx.beginPath();
        ctx.moveTo(r0[0], r0[1]);
        ctx.lineTo(r1[0], r1[1]);
        ctx.lineTo(r2[0], r2[1]);
        ctx.lineTo(r3[0], r3[1]);
        ctx.closePath();
        ctx.fillStyle = b.roofColor;
        ctx.fill();
        ctx.strokeStyle = b.isLandmark ? "rgba(56, 189, 248, 0.6)" : "rgba(30, 41, 59, 0.8)";
        ctx.lineWidth = b.isLandmark ? 1.5 : 1;
        ctx.stroke();

        // Landmark Rooftop Beacon
        if (b.isLandmark && is3D) {
          const roofCenter = project(b.x + b.w / 2, b.y + b.h / 2, h, width, height);
          ctx.beginPath();
          ctx.arc(roofCenter[0], roofCenter[1], 3.5 * zoom, 0, Math.PI * 2);
          ctx.fillStyle = "#38bdf8";
          ctx.fill();

          // Pulsing halo
          ctx.beginPath();
          const haloSize = (4 + Math.sin(pulsePhaseRef.current * 2) * 2) * zoom;
          ctx.arc(roofCenter[0], roofCenter[1], haloSize, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // 3. Draw Alternative Route (Well-lit Detour)
      if (alternativeRoute && alternativeRoute.waypoints.length > 1) {
        ctx.save();
        const altPoints = alternativeRoute.waypoints.map((p) =>
          project(p.x, p.y, 4, width, height)
        );

        if (isRerouted) {
          // Alternative is now ACTIVE -> Glowing Emerald
          // Outer Glow
          ctx.beginPath();
          ctx.strokeStyle = "rgba(16, 185, 129, 0.28)";
          ctx.lineWidth = 14 * zoom;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          altPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.stroke();

          // Main line
          ctx.beginPath();
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 6 * zoom;
          altPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.stroke();

          // Core white-emerald line
          ctx.beginPath();
          ctx.strokeStyle = "#a7f3d0";
          ctx.lineWidth = 2 * zoom;
          altPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.stroke();

          // Animated forward pulse dashes
          ctx.beginPath();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3.5 * zoom;
          const dashOffset = -pulsePhaseRef.current * 20;
          ctx.setLineDash([12 * zoom, 24 * zoom]);
          ctx.lineDashOffset = dashOffset;
          altPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Alternative is STANDBY -> Faint glowing dashed line
          ctx.beginPath();
          ctx.strokeStyle = "rgba(129, 140, 248, 0.45)";
          ctx.lineWidth = 3.5 * zoom;
          ctx.setLineDash([8 * zoom, 8 * zoom]);
          altPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }

      // 4. Draw Primary Route
      if (activeRoute && activeRoute.waypoints.length > 1) {
        ctx.save();
        const primaryPoints = activeRoute.waypoints.map((p) =>
          project(p.x, p.y, 4, width, height)
        );

        if (isRerouted) {
          // Blocked/Discarded primary path -> Dotted dim amber/red
          ctx.beginPath();
          ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
          ctx.lineWidth = 3 * zoom;
          ctx.setLineDash([6 * zoom, 8 * zoom]);
          primaryPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // ACTIVE PRIMARY ROUTE -> Glowing Cyber Cyan
          // Outer ambient glow
          ctx.beginPath();
          ctx.strokeStyle = "rgba(6, 182, 212, 0.28)";
          ctx.lineWidth = 15 * zoom;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          primaryPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.stroke();

          // Mid glow
          ctx.beginPath();
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 6 * zoom;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          primaryPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.stroke();

          // Core bright white-hot center
          ctx.beginPath();
          ctx.strokeStyle = "#ecfeff";
          ctx.lineWidth = 2 * zoom;
          primaryPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.stroke();

          // Animated particle pulse along route
          ctx.beginPath();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3.5 * zoom;
          const dashOffset = -pulsePhaseRef.current * 22;
          ctx.setLineDash([12 * zoom, 24 * zoom]);
          ctx.lineDashOffset = dashOffset;
          primaryPoints.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
          });
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }

      // 5. Draw Dynamic Hazard Event (if active)
      if (hazardEvent) {
        const hp = project(hazardEvent.mapCoords.x, hazardEvent.mapCoords.y, 6, width, height);

        // Pulsing hazard danger ring
        const hazardSize = (20 + Math.sin(pulsePhaseRef.current * 3) * 6) * zoom;
        ctx.beginPath();
        ctx.arc(hp[0], hp[1], hazardSize, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239, 68, 68, 0.22)";
        ctx.fill();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2 * zoom;
        ctx.stroke();

        // Warning core
        ctx.beginPath();
        ctx.arc(hp[0], hp[1], 8 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();

        // Warning Icon Symbol
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${10 * zoom}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", hp[0], hp[1]);

        // Floating hazard badge
        const badgeY = hp[1] - 22 * zoom;
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1;
        const text = "SIMULATED HAZARD: Low Visibility Ahead";
        ctx.font = `bold ${10 * zoom}px sans-serif`;
        const textWidth = ctx.measureText(text).width;
        ctx.beginPath();
        ctx.roundRect(hp[0] - textWidth / 2 - 8, badgeY - 10 * zoom, textWidth + 16, 20 * zoom, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fca5a5";
        ctx.fillText(text, hp[0], badgeY);
      }

      // 6. Draw Safe POIs & Landmarks
      poisRef.current.forEach((poi) => {
        const pt = project(poi.x, poi.y, 6, width, height);
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 5 * zoom, 0, Math.PI * 2);
        ctx.fillStyle = poi.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // POI label
        ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
        ctx.font = `${9 * zoom}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(poi.label, pt[0], pt[1] + 14 * zoom);
      });

      // 7. Destination Hologram Beacon
      const destCoords: MapPoint = { x: 550, y: 170 }; // Destination point
      const dp = project(destCoords.x, destCoords.y, 0, width, height);
      const dpTop = project(destCoords.x, destCoords.y, is3D ? 160 : 0, width, height);

      if (is3D) {
        // Vertical Holographic Light Beam
        const beamGrad = ctx.createLinearGradient(dp[0], dp[1], dpTop[0], dpTop[1]);
        beamGrad.addColorStop(0, "rgba(56, 189, 248, 0.6)");
        beamGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.2)");
        beamGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

        ctx.beginPath();
        ctx.moveTo(dp[0] - 12 * zoom, dp[1]);
        ctx.lineTo(dpTop[0] - 3 * zoom, dpTop[1]);
        ctx.lineTo(dpTop[0] + 3 * zoom, dpTop[1]);
        ctx.lineTo(dp[0] + 12 * zoom, dp[1]);
        ctx.closePath();
        ctx.fillStyle = beamGrad;
        ctx.fill();
      }

      // Ground concentric rings at destination
      ctx.beginPath();
      const ring1 = (10 + Math.sin(pulsePhaseRef.current * 2) * 3) * zoom;
      ctx.arc(dp[0], dp[1], ring1, 0, Math.PI * 2);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.8 * zoom;
      ctx.stroke();

      // Destination Pin Top
      ctx.beginPath();
      ctx.arc(dp[0], dp[1] - 8 * zoom, 6 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Destination Floating Card
      ctx.save();
      const destText = destinationName || "Central Station";
      ctx.font = `bold ${11 * zoom}px sans-serif`;
      const destWidth = ctx.measureText(destText).width;
      const cardY = dp[1] - 28 * zoom;

      ctx.fillStyle = "rgba(10, 15, 29, 0.92)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(dp[0] - destWidth / 2 - 12, cardY - 11 * zoom, destWidth + 24, 22 * zoom, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`📍 ${destText}`, dp[0], cardY);
      ctx.restore();

      // 8. User Position & Moving Radar Marker
      // Calculate position along active path
      const currentPoints = isRerouted ? alternativeRoute.waypoints : activeRoute.waypoints;
      const numSegments = currentPoints.length - 1;
      const progress = userProgressRef.current;
      const segmentIndex = Math.min(Math.floor(progress * numSegments), numSegments - 1);
      const segmentFrac = (progress * numSegments) - segmentIndex;

      const pStart = currentPoints[segmentIndex];
      const pEnd = currentPoints[segmentIndex + 1] || pStart;

      const userWx = pStart.x + (pEnd.x - pStart.x) * segmentFrac;
      const userWy = pStart.y + (pEnd.y - pStart.y) * segmentFrac;

      const up = project(userWx, userWy, 8, width, height);

      // Expanding Sonar Wave 1
      const wave1 = (14 + ((pulsePhaseRef.current * 12) % 24)) * zoom;
      const waveAlpha1 = Math.max(0, 1 - wave1 / (36 * zoom));
      ctx.beginPath();
      ctx.arc(up[0], up[1], wave1, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6, 182, 212, ${waveAlpha1 * 0.8})`;
      ctx.lineWidth = 2 * zoom;
      ctx.stroke();

      // Expanding Sonar Wave 2
      const wave2 = (14 + (((pulsePhaseRef.current + Math.PI) * 12) % 24)) * zoom;
      const waveAlpha2 = Math.max(0, 1 - wave2 / (36 * zoom));
      ctx.beginPath();
      ctx.arc(up[0], up[1], wave2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(16, 185, 129, ${waveAlpha2 * 0.6})`;
      ctx.lineWidth = 1.8 * zoom;
      ctx.stroke();

      // User Pedestrian Disc
      ctx.beginPath();
      ctx.arc(up[0], up[1], 8 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = "#06b6d4";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5 * zoom;
      ctx.stroke();

      // User Core Dot
      ctx.beginPath();
      ctx.arc(up[0], up[1], 3.5 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Floating User Tag
      ctx.fillStyle = "rgba(6, 182, 212, 0.95)";
      ctx.font = `bold ${10 * zoom}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("YOU", up[0], up[1] - 14 * zoom);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [project, zoom, is3D, activeRoute, alternativeRoute, isRerouted, hazardEvent, destinationName]);

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse / Touch Drag Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-[520px] bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl select-none group">
      {/* 3D Map Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Top Navigation HUD (Next Turn Pill) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="flex items-center gap-3 bg-neutral-950/85 backdrop-blur-xl border border-neutral-800/90 px-3.5 py-2.5 rounded-2xl shadow-xl shadow-black/40">
          <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            {isRerouted ? (
              // Straight / adapted arrow
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              // Right turn arrow
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-neutral-100">
                {isRerouted ? "In 80m, Continue Straight" : "In 150m, Turn Right"}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300">
                {isRerouted ? "Metro Way" : "Oak Avenue"}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-mono block">
              {isRerouted
                ? "Corridor verified: High illumination & pedestrian density"
                : "Active path: Well-lit sidewalk zone"}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Map Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* 3D / 2D Toggle */}
        <button
          type="button"
          onClick={() => setIs3D(!is3D)}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold backdrop-blur-xl border transition-all cursor-pointer ${
            is3D
              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-950/40"
              : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {is3D ? "3D Perspective" : "2D Top-Down"}
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(1.7, z + 0.15))}
          className="h-8 w-8 rounded-xl bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 text-neutral-200 hover:bg-neutral-800 flex items-center justify-center text-sm font-mono font-bold transition-colors cursor-pointer"
        >
          +
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.65, z - 0.15))}
          className="h-8 w-8 rounded-xl bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 text-neutral-200 hover:bg-neutral-800 flex items-center justify-center text-sm font-mono font-bold transition-colors cursor-pointer"
        >
          −
        </button>

        {/* Recenter */}
        <button
          type="button"
          onClick={() => {
            setPan({ x: 0, y: 0 });
            setZoom(1.05);
          }}
          title="Recenter Camera"
          className="h-8 w-8 rounded-xl bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 text-neutral-200 hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          </svg>
        </button>
      </div>

      {/* Floating Bottom Telemetry Badge */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/80 px-3 py-1.5 rounded-full text-[11px] font-mono text-neutral-400">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>GPS RTK Locked (±1.2m)</span>
          <span className="text-neutral-600">•</span>
          <span>Heading 042° NE</span>
          {isRerouted && (
            <>
              <span className="text-neutral-600">•</span>
              <span className="text-emerald-400 font-semibold">Corridor Adapted</span>
            </>
          )}
        </div>
      </div>

      {/* Route Legend Indicator (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-3 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/80 px-3.5 py-1.5 rounded-full text-[10px] font-mono text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isRerouted ? "bg-emerald-400" : "bg-cyan-400"}`} />
          <span className="text-neutral-300 font-semibold">
            {isRerouted ? "Adapted Safe Path" : "Primary Route"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-400" />
          <span>Alternative Corridor</span>
        </div>
      </div>
    </div>
  );
}
