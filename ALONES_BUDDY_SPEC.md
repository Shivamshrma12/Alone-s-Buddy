# ALONES BUDDY SPECIFICATION

## Project
**Alones Buddy — Agentic Adaptive Safety Navigation**

## Goal
Build **one responsive web application** that helps a pedestrian reach a destination safely. The application must use an **agentic workflow** where an autonomous AI agent:
1. **Observes** route and environment data (location, lighting, foot traffic, hazards).
2. **Decides** safety risk levels and required course corrections.
3. **Takes tool actions** (e.g. recalculating safe corridors, dispatching safety pings, highlighting safe havens).
4. **Evaluates** intermediate results to verify safety improvements.
5. **Autonomously adapts and replans** whenever environmental or route conditions change.

---

## Architectural Principles (The "Rule of ONE")
- **ONE Web Application**: A single, unified web application accessible from any modern browser.
- **ONE Codebase**: Unified Next.js application powering all experiences.
- **ONE Backend**: Unified backend service layer powered by Next.js App Router API handlers and Supabase.
- **ONE Journey State**: Single canonical source of truth for the pedestrian journey state, shared consistently across devices and sessions.
- **ONE Agent**: Single autonomous safety agent engine orchestrating observation, decision-making, and tool execution.
- **Responsive Views of the Same Application**:
  - **Desktop View**: Premium futuristic navigation command center featuring multi-panel environmental telemetry, safety risk matrices, real-time agent reasoning logs, and panoramic route tracking.
  - **Mobile View**: Map-first pedestrian navigation interface optimized for mobile viewports, one-handed operation, prominent safety controls, and real-time guidance.

---

## Technology Stack
- **Framework**: Next.js (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend / Database**: Supabase (PostgreSQL, Realtime subscriptions, Auth, Row-Level Security)
- **Agent Intelligence**: Grok API for the production reasoning agent
- **Mapping & Geolocation**: Map provider to be integrated in future phases (e.g., Mapbox / Google Maps)
- **Deployment**: Vercel

---

## Non-Negotiable Rules
1. **No Separate Applications**: Under no circumstances should separate codebases or wrappers (desktop vs. mobile) be created. Everything is responsive within this single Next.js project.
2. **No Flutter**: Do not introduce Flutter or cross-platform native SDK wrappers.
3. **No Fake Integrations or Invented APIs**:
   - Do not invent artificial endpoints or mock APIs.
   - External providers (Grok API, Supabase, Map provider) must be integrated via official patterns and genuine schemas when their respective phases arrive.
4. **No Package Bloat**:
   - Do not install extraneous or redundant npm packages.
   - Maintain a lean, high-performance dependency tree.
5. **Strict Agentic Workflow**:
   - The safety system is not a static routing engine. It is an agentic loop:
     $$\text{Observe} \longrightarrow \text{Decide} \longrightarrow \text{Tool Action} \longrightarrow \text{Evaluate} \longrightarrow \text{Adapt/Replan}$$
6. **Integrity of Journey State**:
   - All client views and agent decisions must bind to the unified journey state contract.

---

## Production Folder Layout
```
/
├── app/                  # Next.js App Router (pages, layouts, globals.css)
├── components/           # UI components (Command Center & Mobile Map-First views)
├── lib/                  # Shared utilities, constants, and helpers
├── agents/               # Autonomous safety agent orchestration (Grok API integration)
├── tools/                # Agent-callable tools (routing, hazard checks, alerts)
├── supabase/             # Database migrations, schemas, client, and RLS policies
├── types/                # Strict TypeScript domain interfaces
├── public/               # Static assets
├── ALONES_BUDDY_SPEC.md  # Architectural specification & non-negotiables
├── AGENTS.md             # Guidelines and constraints for AI coding agents
└── README.md             # Project overview and local execution guide
```
