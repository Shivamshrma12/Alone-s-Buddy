# ALONES BUDDY SPECIFICATION

## 1. Project Identity & Mission
**Alones Buddy — Agentic Adaptive Safety Navigation**

Build **one responsive web application** that helps a pedestrian reach a destination safely. The core of Alones Buddy is an autonomous adaptive AI agent that observes route and environmental information, makes decisions against user goals and constraints, takes tool actions, evaluates outcomes, and autonomously adapts or replans when conditions change.

---

## 2. Core Architectural Principles (The "Rule of ONE")

- **ONE Web Application**: Single responsive web application serving all viewports.
- **ONE Codebase**: Unified Next.js codebase with zero duplicate sub-projects or wrappers.
- **ONE Backend**: Unified Next.js App Router route handlers and Supabase services.
- **ONE Journey State**: Single canonical representation of the journey truth.
- **ONE Alones Agent**: Single autonomous safety agent coordinating reasoning and tool invocation.
- **Keep Architecture Simple**:
  - Do NOT introduce multi-agent orchestration.
  - Do NOT introduce unnecessary microservices.
  - Do NOT introduce vector databases unless a concrete feature requires one.
  - Do NOT introduce message queues or unnecessary external infrastructure.
  - Do NOT introduce unnecessary packages or synthetic APIs.

---

## 3. Visual Experience: The Map Is the Primary Product

The live map/navigation experience is the primary visual centerpiece of Alones Buddy:
- **Desktop View**: Premium, futuristic navigation command center built directly around the live map. It provides clean situational awareness without turning into an excessive, cluttered NASA-style telemetry dashboard.
- **Mobile View**: Streamlined, map-first pedestrian navigation interface optimized for one-handed outdoor usage and immediate safety accessibility.
- **Responsive Parity**: Desktop and mobile are responsive views of the exact same application, sharing identical state models, components, and backend endpoints.

---

## 4. Separation of Data, Deterministic Logic, and AI Reasoning

The system cleanly separates raw data ingestion, deterministic safety calculations, and AI cognitive reasoning:

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

- **Data Sources / Tools**: Gather verified facts from real services or user-submitted reports.
- **Structured Observations**: Format data into normalized, validated schemas.
- **Deterministic Evaluation**: Compute objective metrics (e.g. route distance, ETA, geometric detours, known hazard intersections) using reliable algorithms.
- **Alones Agent**: Evaluates options against the user's explicit safety goals and constraints using cognitive reasoning (Grok API).
- **Verification**: Deterministically checks that proposed agent actions meet user constraints (e.g. max detour limits).
- **Journey State Update**: Atomically updates the canonical journey state.

The agent reasons over structured facts. The agent must **never** be responsible for inventing or arbitrarily calculating factual real-world information.

---

## 5. Truthfulness & Fact Guardrails

### Real Data vs. Assumptions
- The current MVP does **not** have guaranteed access to real-time light levels, foot traffic/density, environmental telemetry, crime statistics, or road conditions.
- While legitimate data providers may be integrated in future phases, they must **never** be assumed to exist currently.
- The system must **never fabricate missing environmental information**. If data is unavailable, the system must clearly state that the information is unavailable.

### Strict Ban on Fabricated Facts
The AI agent must never invent:
- Safety scores or ratings
- Crime statistics or incident history
- Incidents or hazards
- Road or sidewalk conditions
- Locations, addresses, or street geometry
- Landmarks or points of interest
- Facility availability or operating hours
- Environmental observations (lighting, crowd density, weather)
- Emergency-service integrations

### No Physical Safety Beacon
- Alones Buddy is a **purely software** navigation and safety application.
- There is **no physical safety beacon hardware** in this project. References to deploying physical beacons are strictly prohibited.

---

## 6. User Experience vs. Internal Agent Activity

The technical complexity of the agentic system must remain in the background:

### Normal User Experience
Pedestrians need quick, calm, legible navigation assistance. When the agent acts (e.g. recalculating a route), the user sees concise, human-friendly guidance:
- *"Route updated"*
- *"We found a safer path ahead."*
- *"+4 min"*
If the user asks why the route changed, provide a short, plain-language explanation.

### What Normal Users Must NOT See
- Raw tool calls or function names (e.g. `get_recent_reports()`, `find_alternative_routes()`)
- Internal state machine transitions
- Raw mathematical safety-score formulas
- Chain-of-thought or model reasoning traces
- Technical logs (e.g. *"Agent decided..."*)
- Technical lifecycle diagrams (e.g. *"OBSERVE → DECIDE → ACT..."*)

### No Chain-of-Thought UI
- Never expose private chain-of-thought or internal reasoning dumps in the UI.
- Replace technical reasoning logs with **structured agent activity/status**:
  - *"Checking route conditions..."*
  - *"Evaluating alternatives..."*
  - *"Route updated."*

---

## 7. Journey Goals and Constraints

The agent operates strictly according to explicit user goals and constraints rather than arbitrary decisions.

### Example Scenario
- **User Goal**: *"I'm walking alone. Get me home safely. Don't add more than 10 minutes."*
- **Structured Journey Parameters**:
  ```typescript
  {
    mode: "walking",
    alone: true,
    safetyPriority: 0.8,
    maxDetourMinutes: 10
  }
  ```
All proposed route adjustments and safety decisions are verified against these explicit constraints before being applied.

---

## 8. Initial Conceptual Tool Contracts

The initial conceptual tool set for the Alones Buddy architecture includes:
- `get_routes(origin, destination, mode)`: Retrieve candidate paths from the routing engine.
- `get_safety_data(corridor)`: Fetch known safety metadata for a given route segment.
- `get_recent_reports(area)`: Query verified community or incident reports in proximity.
- `get_safe_places(location, radius)`: Locate open public spaces, commercial hubs, or staffed facilities.
- `get_landmarks(location, radius)`: Retrieve recognizable navigation landmarks.
- `evaluate_route(route, safetyData)`: Deterministically score candidate routes based on verified data.
- `find_alternative_routes(currentRoute, constraints)`: Query alternative route corridors.
- `update_journey_state(updates)`: Apply verified changes to the canonical journey state.
- `report_incident(reportData)`: Submit a user hazard or safety report.

*Note: These are architectural conceptual contracts for design clarity. Do NOT implement mock versions or fake integrations ahead of schedule.*

---

## 9. Agentic Demonstration vs. Real Data

The production agent strictly executes the 5-phase loop:
$$\text{Observe} \longrightarrow \text{Decide} \longrightarrow \text{Tool Action} \longrightarrow \text{Evaluate} \longrightarrow \text{Adapt/Replan}$$

### Hackathon / Demo Mode
For testing and demonstration when real-world incidents are not active:
- A clearly labelled simulated event source may be triggered to demonstrate dynamic replanning.
- **Example Demo Flow**:
  1. Initial route: Safety Score 91, ETA 24 min.
  2. Simulated hazard report detected ahead on the active path.
  3. Agent observes the changed condition and evaluates alternatives.
  4. Agent selects an alternative route: Safety Score 87, ETA 28 min (Detour +4 min).
  5. System verifies that the detour satisfies the user's constraint ($\le 10$ min) and updates the journey state.
- **Critical Requirement**: Simulated/demo data must **ALWAYS** be tagged internally as simulated/demo data and must **never** be presented to normal users as real-world information.

---

## 10. Technology Stack & Boundaries

- **Framework**: Next.js (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend / Database**: Supabase (Auth, PostgreSQL, Realtime subscriptions, RLS)
- **Production Agent**: Grok API
- **Maps / Geolocation**: Real map provider SDK (to be integrated when scheduled)
- **Deployment**: Vercel

### Future Extensions (Not MVP Requirements)
The following are future possibilities only and must not be treated as current requirements:
- Driving or cycling navigation modes
- Live weather feeds
- Advanced environmental sensor processing
- Specialized third-party municipal crime APIs

---

## 11. Directory Structure

```
/
├── app/                  # Next.js App Router (pages, layouts, globals.css)
├── components/           # UI components (Command Center & Mobile Map-First views)
├── lib/                  # Shared utilities, math, and helpers
├── agents/               # Autonomous safety agent orchestration (Grok API)
├── tools/                # Agent-callable tool definitions
├── supabase/             # Database migrations, schemas, client, and RLS
├── types/                # Strict TypeScript domain interfaces
├── public/               # Static assets
├── ALONES_BUDDY_SPEC.md  # Architectural specification & product rules
├── AGENTS.md             # Coding instructions & constraints for AI agents
└── README.md             # Project documentation & setup instructions
```
