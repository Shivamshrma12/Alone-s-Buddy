# Alones Buddy — Agentic Adaptive Safety Navigation

> **Alones Buddy** is an autonomous safety navigation web application designed to protect pedestrians reaching their destination. Built around an agentic decision loop, the system continuously observes environmental conditions, evaluates safety risks, takes tool actions, and dynamically adapts routes in real time.

---

## Key Architecture: The Rule of ONE

- **ONE Web Application**: Responsive single application serving all form factors.
- **ONE Codebase**: Unified Next.js project with zero duplicate platforms.
- **ONE Backend**: Unified Next.js App Router and Supabase services.
- **ONE Journey State**: Single source of truth for navigation telemetry and agent decisions.
- **ONE Agent**: Autonomous AI agent coordinating observation, evaluation, and tool execution.
- **Responsive Views**:
  - **Desktop**: Futuristic navigation command center displaying safety telemetry, threat indices, real-time agent reasoning logs, and panoramic tracking.
  - **Mobile**: High-contrast, map-first pedestrian navigation interface optimized for one-handed operation.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Backend / Database**: [Supabase](https://supabase.com/)
- **Agent Intelligence**: Grok API (production agent reasoning)
- **Deployment Target**: [Vercel](https://vercel.com/)

---

## Directory Structure

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
└── README.md             # Project documentation
```

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- npm (v10+ recommended)

### Installation
```bash
npm install
```

### Running Locally
To launch the development server with Turbopack:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

---

## Non-Negotiable Rules

1. **No Separate Applications**: Single responsive codebase only (no Flutter, no separate native apps).
2. **No Invented APIs**: No fake mock integrations or synthetic endpoints. Integrations adhere to official provider contracts.
3. **Strict Agentic Workflow**: The agent strictly follows the loop: Observe $\rightarrow$ Decide $\rightarrow$ Tool Action $\rightarrow$ Evaluate $\rightarrow$ Adapt/Replan.
4. **Lean Dependencies**: Maintain a clean, performant dependency graph without bloat.

For detailed architecture and rules, see [ALONES_BUDDY_SPEC.md](file:///c:/Users/shiva/Alone's%20Buddy/ALONES_BUDDY_SPEC.md) and [AGENTS.md](file:///c:/Users/shiva/Alone's%20Buddy/AGENTS.md).
