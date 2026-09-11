/**
 * Alones Buddy — Core Domain Type Definitions
 * 
 * Shared across the single codebase for journey state, agent workflow, and navigation telemetry.
 */

export type SafetyRiskLevel = "low" | "moderate" | "elevated" | "critical";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface Waypoint {
  id: string;
  coordinates: Coordinates;
  name?: string;
  safetyScore?: number; // 0 (dangerous) to 100 (safest)
  isWellLit?: boolean;
  populatedArea?: boolean;
}

export interface EnvironmentalHazard {
  id: string;
  type: "poor_lighting" | "isolated_area" | "reported_incident" | "construction" | "weather_hazard";
  coordinates: Coordinates;
  severity: SafetyRiskLevel;
  description: string;
  detectedAt: string;
}

export type JourneyStatus = "idle" | "planning" | "in_transit" | "rerouting" | "paused" | "completed" | "emergency";

export interface JourneyState {
  id: string;
  userId: string;
  status: JourneyStatus;
  origin: Coordinates;
  destination: Coordinates;
  currentPosition?: Coordinates;
  activeRouteWaypoints: Waypoint[];
  currentRiskLevel: SafetyRiskLevel;
  activeHazards: EnvironmentalHazard[];
  lastEvaluatedAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AgentDecision {
  decisionId: string;
  timestamp: string;
  riskAssessment: SafetyRiskLevel;
  reasoning: string;
  suggestedAction: "continue_route" | "reroute" | "safe_haven_stop" | "emergency_escalation";
  toolInvocations?: {
    toolName: string;
    params: Record<string, unknown>;
  }[];
}
