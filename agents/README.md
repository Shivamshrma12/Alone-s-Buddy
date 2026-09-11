# Agents (`/agents`)

This directory contains the autonomous safety agent implementation and orchestration logic.

## Responsibilities
- **Agentic Workflow**: Implements the continuous loop:
  1. **Observe**: Ingest pedestrian position, lighting, weather, crowd density, and route hazards.
  2. **Decide**: Evaluate risk score and determine optimal navigation adjustments.
  3. **Tool Action**: Invoke tools (route rerouting, safe haven beacons, lighting optimization, alerts).
  4. **Evaluate**: Assess intermediate safety outcomes.
  5. **Adapt & Replan**: Autonomously modify navigation decisions in real time.
- **Agent Provider**: Grok API integration for production cognitive reasoning.
- **Guardrails**: Strict safety policies, non-hallucinatory routing enforcement, and latency failover.
