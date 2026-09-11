# AGENTS.md — Instructions for AI Coding Agents

Welcome to the **Alones Buddy** repository. When contributing to or generating code in this repository, you **must** strictly adhere to the rules and conventions established in this document and [ALONES_BUDDY_SPEC.md](file:///c:/Users/shiva/Alone's%20Buddy/ALONES_BUDDY_SPEC.md).

---

## 1. Non-Negotiable Architectural Principles

- **Single Codebase Only**: Never create separate mobile or desktop projects, wrappers, or sub-repos.
- **No Flutter or Native Wrappers**: This is a pure responsive Next.js web application.
- **Responsive Views**:
  - Desktop view must render as a premium futuristic navigation command center.
  - Mobile view must render as a map-first navigation interface.
  - Both views share identical state, components, backend routes, and domain models.
- **Single Journey State**: Journey state lives in one canonical representation. Never create divergent state models for different views.
- **Genuine Integrations Only**:
  - Do NOT invent fake APIs, synthetic endpoints, or mock services pretending to be real integrations.
  - Integrate with verified SDKs (Grok API, Supabase, Maps) only when explicitly instructed.
- **No Unnecessary Packages**:
  - Do NOT install libraries unless explicitly required.
  - Keep dependencies lean and performant.

---

## 2. Agentic Workflow Structure

The core of Alones Buddy is an autonomous adaptive AI agent. Every agentic implementation must maintain the 5-phase loop:
1. **Observe**: Ingest real-time telemetry (pedestrian coordinates, route path, light levels, density, hazard flags).
2. **Decide**: Process risk score and evaluate alternatives through the Grok API agent.
3. **Tool Action**: Execute deterministic tools (e.g. recalculate route corridor, deploy safety beacon, highlight safe haven).
4. **Evaluate**: Verify the impact of the tool action on journey safety.
5. **Adapt & Replan**: Autonomously recalculate if environmental conditions fluctuate.

---

## 3. Technology Conventions

### Next.js & React
- Use the **Next.js App Router** (`/app`).
- Place client components only when interactivity or browser APIs (like geolocation or motion) are needed; mark them with `"use client"`.
- Use React 19 / Next.js 16 best practices.

### TypeScript
- Maintain strict typing at all times.
- Avoid `any`. Explicitly type all state, agent actions, tool inputs, and component props.
- Place domain models in [`/types`](file:///c:/Users/shiva/Alone's%20Buddy/types).

### Styling & Animation
- Use **Tailwind CSS** for layout, responsive utilities, and color tokens.
- Use **Framer Motion** for micro-interactions, view transitions, radar pulses, and hazard alerts.
- Maintain high-contrast, futuristic, safety-focused UI aesthetics with clear night-mode visibility.

---

## 4. Directory Structure Conventions

Always place new code in its respective home:
- `/app`: Next.js routes, layouts, and route handlers.
- `/components`: Reusable UI components (Command Center widgets, mobile navigation components, safety status indicators).
- `/lib`: Helper functions, utilities, math/geo formulas, and constants.
- `/agents`: Autonomous safety agent definitions, prompt templates, and Grok API orchestration.
- `/tools`: Executable tools callable by the agent during the journey loop.
- `/supabase`: Database migrations, schemas, and Supabase client configurations.
- `/types`: TypeScript interfaces, types, and schema contracts.

---

## 5. Verification Checklist Before Committing Changes
Before finalizing any task, future agents must ensure:
1. `npm run build` passes with zero errors.
2. `npm run lint` passes with zero errors.
3. No invented APIs or unauthorized packages were introduced.
4. Changes preserve responsive parity between desktop command center and mobile views.
