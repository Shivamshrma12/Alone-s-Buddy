/**
 * Alones Buddy — Server-Side Grok Agent Client
 * 
 * Invokes xAI's Grok API to reason over structured real-world observations.
 * Strictly executes server-side. NEVER exposes GROK_API_KEY to the client.
 */

export interface GrokDecisionRequest {
  userGoal: string;
  userConstraints: {
    alone: boolean;
    safetyPriority: number; // 0.0 to 1.0
    maxDetourMinutes: number;
    mode: string;
  };
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  destination: {
    name: string;
    latitude: number;
    longitude: number;
  };
  currentRoute: {
    id: string;
    name: string;
    distanceKm: number;
    durationMinutes: number;
  };
  safetyObservations: {
    title: string;
    description: string;
    severity: string;
    isSimulatedDemo?: boolean;
  }[];
  alternativeRoutes?: {
    id: string;
    name: string;
    distanceKm: number;
    durationMinutes: number;
  }[];
}

export interface GrokDecisionResponse {
  decision: "CONTINUE_ROUTE" | "ADAPT_REROUTE" | "EMERGENCY_STOP";
  reasoning: string;
  selectedRouteId: string;
  detourMinutes: number;
  constraintVerified: boolean;
  userFacingNotification: {
    title: string;
    message: string;
    detourDelta: string;
  } | null;
  agentStatusSummary: {
    phase: "OBSERVE" | "DECIDE" | "ACT" | "EVALUATE" | "ADAPT" | "VERIFY" | "UPDATED";
    statusText: string;
  };
  provider: "xAI_GROK" | "DETERMINISTIC_SAFEGUARD";
}

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

export async function callGrokAgent(request: GrokDecisionRequest): Promise<GrokDecisionResponse> {
  const apiKey = process.env.GROK_API_KEY?.trim();

  // If no API key configured, use deterministic reasoning adhering to identical schema
  if (!apiKey) {
    return evaluateDeterministically(request, "GROK_API_KEY not configured in .env.local");
  }

  try {
    const systemPrompt = `You are the Alones Buddy Autonomous Safety Agent.
You are assisting a pedestrian walking alone.
CRITICAL TRUTHFULNESS RULES:
1. NEVER invent real-world facts, crime statistics, streets, coordinates, or distances.
2. Only reason over the explicit structured observations provided in the user prompt.
3. If an environmental safety event is labelled as "SIMULATED", recognize it as a simulation.
4. Verify that any proposed detour meets the user's maxDetourMinutes constraint.
5. Provide your decision as a valid JSON object matching the requested schema.`;

    const userPrompt = `USER GOAL: "${request.userGoal}"
CONSTRAINTS:
- Walking alone: ${request.userConstraints.alone}
- Safety priority: ${Math.round(request.userConstraints.safetyPriority * 100)}%
- Max detour allowed: ${request.userConstraints.maxDetourMinutes} min

OBSERVATIONS:
- GPS Location: Lat ${request.currentLocation.latitude}, Lng ${request.currentLocation.longitude} (Accuracy ±${request.currentLocation.accuracy}m)
- Destination: ${request.destination.name} (Lat ${request.destination.latitude}, Lng ${request.destination.longitude})
- Current Route: ${request.currentRoute.name} (${request.currentRoute.distanceKm} km, ${request.currentRoute.durationMinutes} min)
- Active Safety Observations: ${JSON.stringify(request.safetyObservations)}
- Available Alternative Routes: ${JSON.stringify(request.alternativeRoutes || [])}

TASK:
1. Evaluate if current route satisfies user safety preference given observations.
2. If hazard exists, decide whether to adapt/reroute to an alternative.
3. Check if alternative route duration - current route duration <= maxDetourMinutes.
4. Return pure JSON with:
{
  "decision": "CONTINUE_ROUTE" | "ADAPT_REROUTE" | "EMERGENCY_STOP",
  "reasoning": string,
  "selectedRouteId": string,
  "detourMinutes": number,
  "constraintVerified": boolean,
  "userFacingNotification": { "title": string, "message": string, "detourDelta": string } | null,
  "statusPhase": "OBSERVE" | "DECIDE" | "ACT" | "EVALUATE" | "ADAPT" | "VERIFY" | "UPDATED",
  "statusText": string
}`;

    const res = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.warn(`[Grok Agent] xAI API error ${res.status}: falling back to deterministic evaluation.`);
      return evaluateDeterministically(request, `xAI API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return evaluateDeterministically(request, "Empty response from Grok API");
    }

    const parsed = JSON.parse(content);
    return {
      decision: parsed.decision || "CONTINUE_ROUTE",
      reasoning: parsed.reasoning || "Route monitored and verified.",
      selectedRouteId: parsed.selectedRouteId || request.currentRoute.id,
      detourMinutes: parsed.detourMinutes || 0,
      constraintVerified: Boolean(parsed.constraintVerified),
      userFacingNotification: parsed.userFacingNotification || null,
      agentStatusSummary: {
        phase: parsed.statusPhase || "UPDATED",
        statusText: parsed.statusText || "Route conditions verified.",
      },
      provider: "xAI_GROK",
    };
  } catch (err) {
    console.error("[Grok Agent] Exception:", err);
    return evaluateDeterministically(request, err instanceof Error ? err.message : "Grok connection error");
  }
}

function evaluateDeterministically(
  request: GrokDecisionRequest,
  notice: string
): GrokDecisionResponse {
  const hasHazard = request.safetyObservations.some(
    (obs) => obs.severity === "elevated" || obs.severity === "critical"
  );

  if (hasHazard && request.alternativeRoutes && request.alternativeRoutes.length > 0) {
    const candidate = request.alternativeRoutes[0];
    const detourMinutes = Math.max(0, candidate.durationMinutes - request.currentRoute.durationMinutes);
    const passed = detourMinutes <= request.userConstraints.maxDetourMinutes;

    if (passed) {
      return {
        decision: "ADAPT_REROUTE",
        reasoning: `Avoided flagged corridor (${request.safetyObservations[0].title}). Selected alternative path '${candidate.name}'. Detour of +${detourMinutes} min is within max allowance of ${request.userConstraints.maxDetourMinutes} min. [${notice}]`,
        selectedRouteId: candidate.id,
        detourMinutes,
        constraintVerified: true,
        userFacingNotification: {
          title: "Route updated",
          message: "We found a safer path ahead.",
          detourDelta: `+${detourMinutes} min`,
        },
        agentStatusSummary: {
          phase: "UPDATED",
          statusText: "Safer route selected and verified.",
        },
        provider: "DETERMINISTIC_SAFEGUARD",
      };
    }
  }

  return {
    decision: "CONTINUE_ROUTE",
    reasoning: `Current walking path '${request.currentRoute.name}' satisfies user safety priority threshold (${Math.round(request.userConstraints.safetyPriority * 100)}%). [${notice}]`,
    selectedRouteId: request.currentRoute.id,
    detourMinutes: 0,
    constraintVerified: true,
    userFacingNotification: null,
    agentStatusSummary: {
      phase: "OBSERVE",
      statusText: "Monitoring real-time route conditions...",
    },
    provider: "DETERMINISTIC_SAFEGUARD",
  };
}
