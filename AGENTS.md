# AGENTS.md — Instructions for AI Coding Agents

Welcome to the **Alones Buddy** repository. When contributing to or generating code in this repository, you **must** strictly adhere to the rules and conventions established in this document and [ALONES_BUDDY_SPEC.md](file:///c:/Users/shiva/Alone's%20Buddy/ALONES_BUDDY_SPEC.md).

---

## 1. Non-Negotiable Architectural Principles

- **Single Codebase Only**: Never create separate mobile or desktop projects, wrappers, or sub-repos.
- **No Flutter or Native Wrappers**: This is a pure responsive Next.js web application.
- **The Map Is the Primary Product**:
  - Desktop view must render as a premium futuristic navigation command center built around the live map. Do NOT turn the desktop view into an excessive telemetry or NASA-style dashboard.
  - Mobile view must render as a streamlined, map-first pedestrian navigation interface.
  - Both views share identical state, components, backend routes, and domain models.
- **Single Journey State**: Journey state lives in one canonical representation. Never create divergent state models for different views.
- **Genuine Integrations Only**:
  - Do NOT invent fake APIs, synthetic endpoints, or mock services pretending to be real integrations.
  - Integrate with verified SDKs (Grok API, Supabase, Maps) only when explicitly instructed.
- **No Unnecessary Packages or Complexity**:
  - Do NOT install libraries unless explicitly required.
  - Do NOT introduce multi-agent architectures, unnecessary microservices, message queues, or vector databases unless a concrete feature requires one.
  - Initial architecture must remain: ONE WEB APP, ONE CODEBASE, ONE BACKEND, ONE JOURNEY STATE, ONE ALONES AGENT.

---

## 2. Fact Truthfulness & Data Guardrails

- **No Fact Invention**: The AI agent must NEVER invent:
  - Safety scores or ratings
  - Crime statistics or incident histories
  - Incidents, hazards, or road conditions
  - Locations, addresses, or street layouts
  - Landmarks or points of interest
  - Facility availability or operating hours
  - Environmental observations (lighting, foot traffic, weather)
  - Emergency-service integrations
- **Missing Data Handling**: If reliable data is unavailable, the system must clearly state that the information is unavailable rather than fabricate it.
- **Real Data vs. Assumptions**: Do NOT assume guaranteed access to real-time light levels, foot traffic/density, environmental telemetry, crime statistics, or road conditions in the current MVP.
- **No Physical Safety Beacon**: Alones Buddy is a pure software application. There is no physical safety beacon hardware in this project. Never reference deploying physical beacons.

---

## 3. Separation of Data, Deterministic Logic, and AI Reasoning

Every workflow must adhere to this clear pipeline:

```
DATA SOURCES / TOOLS
        ↓
STRUCTURED OBSERVATIONS
        ↓
DETERMINISTIC EVALUATION
        ↓
ALONES AGENT
        ↓
DECISION / TOOL ACTION
        ↓
VERIFICATION
        ↓
JOURNEY STATE UPDATE
```

- The AI agent reasons over verified, structured information.
- The agent should NOT be responsible for inventing or arbitrarily calculating factual real-world information.
- Deterministic evaluation and verification validate that all proposed route modifications satisfy the user's explicit goals and constraints.

---

## 4. User Experience vs. Internal Agent Activity

- **Keep Complexity in the Background**: Normal pedestrians need calm, clear, and actionable navigation.
- **Normal User Feedback**:
  - Users should see simple notifications like:
    - *"Route updated"*
    - *"We found a safer path ahead."*
    - *"+4 min"*
  - If the user asks why the route changed, provide a short, plain-language explanation.
- **What Normal Users Must NOT See**:
  - Raw tool calls or function names (e.g. `get_recent_reports()`)
  - Internal state transitions or mathematical safety-score calculations
  - Raw chain-of-thought or model reasoning traces
  - Technical agent logs (e.g. *"Agent decided..."*)
  - Technical workflow lifecycle diagrams (e.g. *"OBSERVE → DECIDE → ACT..."*)
- **No Chain-of-Thought UI**:
  - Never expose private chain-of-thought in the UI.
  - Instead, display **structured agent activity/status** (e.g. *"Checking route conditions..."*, *"Evaluating alternatives..."*, *"Route updated."*).

---

## 5. Journey Goals & Constraints

The agent must always evaluate candidate actions against explicit user goals and constraints:
- Example parameters: `mode: "walking"`, `alone: true`, `safetyPriority: 0.8`, `maxDetourMinutes: 10`.
- All rerouting proposals must be deterministically verified against constraints (e.g. detour time limit) before updating the journey state.

---

## 6. Initial Conceptual Tool Contracts

The following represents the conceptual tool set for the architecture:
- `get_routes()`
- `get_safety_data()`
- `get_recent_reports()`
- `get_safe_places()`
- `get_landmarks()`
- `evaluate_route()`
- `find_alternative_routes()`
- `update_journey_state()`
- `report_incident()`

*Note: These are architectural tool contracts only. Do NOT implement them or create fake mocks ahead of time.*

---

## 7. Agentic Demonstration vs. Real Data

- The system genuinely executes the agentic loop:
  $$\text{Observe} \longrightarrow \text{Decide} \longrightarrow \text{Tool Action} \longrightarrow \text{Evaluate} \longrightarrow \text{Adapt/Replan}$$
- **Demonstration / Hackathon Mode**: A clearly labelled simulated event/data source may be used to demonstrate dynamic replanning (e.g. simulated hazard report triggering an alternative route evaluation).
- **Rule**: Simulated/demo data must ALWAYS be identified internally as simulated/demo data and must NEVER be presented to normal users as real-world information.

---

## 8. Technology & Directory Conventions

### Next.js & React
- Use the **Next.js App Router** (`/app`).
- Use client components (`"use client"`) only when browser APIs or interactivity are required.
- Maintain React 19 / Next.js 16 best practices.

### TypeScript
- Maintain strict typing at all times. Avoid `any`.
- Place domain models in [`/types`](file:///c:/Users/shiva/Alone's%20Buddy/types).

### Styling & Animation
- Use **Tailwind CSS** for responsive layout and styling.
- Use **Framer Motion** for micro-interactions and view transitions.
- Maintain clean, high-contrast, map-centric night-mode aesthetics.

### Directory Mapping
- `/app`: Next.js routes, layouts, and route handlers.
- `/components`: Reusable UI components (Command Center & Mobile Map-First views).
- `/lib`: Helper functions, utilities, math/geo formulas, and constants.
- `/agents`: Autonomous safety agent logic and Grok API orchestration.
- `/tools`: Executable tools callable by the agent during the journey loop.
- `/supabase`: Database migrations, schemas, and Supabase client configurations.
- `/types`: TypeScript interfaces, domain types, and schema contracts.

---

## 9. Verification Checklist Before Committing Changes
Before finalizing any task, future agents must ensure:
1. `npm run build` passes with zero errors.
2. `npm run lint` passes with zero errors.
3. No invented APIs, unauthorized packages, or fake mocks were introduced.
4. Changes preserve responsive parity between desktop command center and mobile views.
5. No chain-of-thought or raw internal agent logs are exposed to the user experience.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
