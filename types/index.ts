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

export type TravelMode = "walking" | "cycling" | "driving";

export interface JourneyRecord {
  id: string;
  user_id?: string | null;
  destination_name: string;
  mode: string;
  alone: boolean;
  safety_priority: number;
  max_detour_minutes: number;
  status: string;
  origin_lat?: number | null;
  origin_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface PlanJourneyFormData {
  destinationName: string;
  mode: TravelMode;
  alone: boolean;
  safetyPriority: number;
  maxDetourMinutes: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  priority: 1 | 2;
}

export interface MapPoint {
  x: number;
  y: number;
  label?: string;
}

export interface NavigationRoute {
  id: string;
  name: string;
  distanceKm: number;
  etaMinutes: number;
  safetyScore: number;
  isAlternative?: boolean;
  waypoints: MapPoint[];
  color: string;
  lightingRating: "Well-Lit" | "Moderate" | "Poor";
  corridorType: string;
}

export interface SimulatedHazardEvent {
  id: string;
  title: string;
  description: string;
  locationName: string;
  mapCoords: MapPoint;
  severity: SafetyRiskLevel;
  timestamp: string;
  isSimulatedDemo: true;
}

export interface AgentActivityItem {
  id: string;
  timestamp: string;
  status: string;
  details?: string;
  type: "survey" | "hazard" | "evaluation" | "reroute" | "verified";
}

export interface AgentTelemetry {
  objective: string;
  monitoringStatus: string;
  currentDecision: string;
  safetyScore: number;
  etaMinutes: number;
  distanceKm: number;
  reason: string;
  adaptationStatus: string;
  constraintPassed: boolean;
  activeNotification: {
    title: string;
    message: string;
    detourDelta: string;
  } | null;
  activityHistory: AgentActivityItem[];
}

export interface EmergencyWorkflowState {
  isActive: boolean;
  stage: "idle" | "triggered" | "contact_1_called" | "escalated_contact_2" | "resolved";
  triggeredBy: "voice" | "manual_sos" | "stay_with_me";
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    mapsUrl: string;
  };
  contact1CalledAt?: string;
  contact2CalledAt?: string;
  timestamp: string;
}

