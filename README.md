# Alones Buddy

> AI-powered personal safety navigation that continuously evaluates your surroundings, corridor conditions, and hazards to keep you safe when traveling alone.

---

## Overview

Traditional navigation applications optimize strictly for the shortest distance or fastest ETA, frequently steering lone pedestrians through dark, deserted alleyways, unlit corridors, or isolated industrial zones.

**Alones Buddy** is built differently: it is a **safety-first personal navigation companion**. It combines real-world street maps, browser GPS geolocation, and an autonomous AI agent layer to monitor route conditions in real time, deterministically evaluate detour limits, and guide users along verified, well-lit, and high-visibility transit paths.

---

## Key Features

- **AI-Powered Safety-First Navigation**: Evaluates corridors against user safety priorities and maximum detour thresholds.
- **Real-Time Browser GPS**: Live coordinate tracking with circular accuracy visualization and smooth marker updates.
- **Real-World Map & Free Multimodal Routing**: Built on 100% official OpenStreetMap raster tiles with zero paid map billing; supports **Walk**, **Cycle**, and **Drive** modes.
- **2D / 3D Navigation Camera**: Seamless toggle between top-down 2D overview and tilted 3D perspective camera with atmospheric horizon depth.
- **Live Compass Orientation**: Supports **North-Up** and device-sensor **Heading-Up** navigation rotation.
- **Dynamic Agentic Rerouting**: Autonomous replanning that detects flagged hazards and reroutes to safer alternative corridors within user-defined detour constraints.
- **What's Ahead Contextual Radar**: Displays upcoming turn maneuvers, public transit stations, libraries, and safe havens.
- **Emergency SOS & Stay With Me**: Two-stage tiered emergency contact alert escalation and active voice distress monitoring ("help", "bachao").
- **Responsive Parity**: Premium futuristic desktop command center and streamlined, map-first mobile web experience sharing unified journey state.
- **Mobile Access QR Code**: Integrated QR code at the bottom of the page allowing any user to immediately open and navigate on their mobile browser.

---

## How It Works

```
USER GOAL & CONSTRAINTS
          ↓
       OBSERVE
(Real GPS, OSM Route Geometry, Nominatim Geocoding)
          ↓
       EVALUATE
(Corridor Safety, Lighting, Max Detour Limits)
          ↓
        DECIDE
(Maintain Path vs. Safe Detour Proposal)
          ↓
         ACT
(Calculate Alternative Route via OSRM)
          ↓
        VERIFY
(Deterministic Validation: Detour ≤ Max Detour Limit)
          ↓
        REPLAN
(Update Leaflet Map Layers & Journey State)
```

Alones Buddy strictly separates real-world ground truth data from AI reasoning. Geographic routes and places are sourced from genuine OpenStreetMap and Nominatim APIs; the AI agent evaluates structured facts and validates proposals deterministically rather than inventing fictional crime statistics or fabricated maps.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS 4, Vanilla CSS
- **Interactive Mapping**: Leaflet & OpenStreetMap (Zero-Billing Stack)
- **Geocoding & Routing**: Nominatim API & OSRM Open Routing (Foot, Bike, Drive)
- **Agent Intelligence**: Grok API orchestration with deterministic safety fallback
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Anonymous Auth)
- **Deployment**: Vercel

---

## Agentic Workflow

Alones Buddy operates as a genuine autonomous agent:
1. **Observes**: Ingests live telemetry, browser coordinates, travel mode, and destination.
2. **Evaluates**: Computes safety corridor scores against user constraints (e.g. `alone: true`, `safetyPriority: 0.9`, `maxDetourMinutes: 10`).
3. **Decides**: Determines whether active conditions satisfy thresholds.
4. **Acts**: Invokes routing tools to compute alternative corridors upon encountering hazards.
5. **Verifies**: Validates proposed detours against strict deterministic limits before committing.
6. **Updates State**: Synchronizes journey records in Supabase and updates the live map HUD.

---

## Demo

During live demonstration:
1. Enter or select a destination (e.g., *India Gate*).
2. Choose transport mode (`WALK`, `CYCLE`, or `DRIVE`) and select route preference (`Safe`, `Balanced`, `Quiet`).
3. Click **START JOURNEY** to observe real route geometry rendered on the dark map.
4. Click **Simulate Hazard (Demo Reroute)**:
   - A simulated safety event (unlit corridor) is flagged on the current route.
   - The Alones AI reasoning stream visibly executes: *Hazard Detected → Re-evaluating Route → Alternative Found → Route Updated (+4 min)*.
   - The map dynamically transitions to the verified illuminated alternative corridor (green polyline).
   - *Note: Hackathon demo events are clearly identified internally as simulated and never fabricated as actual real-world crime data.*

---

## Setup

### Prerequisites
- Node.js 20+
- npm 10+

### Environment Variables
Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: Grok Agent API Key (deterministic fallback active if omitted)
GROK_API_KEY=your-grok-api-key

# Optional: Custom Production URL for QR code
NEXT_PUBLIC_APP_URL=https://alones-buddy.vercel.app
```

### Installation & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build

# Run linter
npm run lint
```

---

## Project Structure

```
/
├── app/                  # Next.js App Router, layout, API routes (/api/agent)
├── components/           # UI components (Command Center, RealLeafletMap, PhoneFrame, QR)
├── lib/                  # Shared utilities
│   ├── agent/            # Grok API agent orchestration & deterministic fallback
│   ├── maps/             # OSM routing, geocoding, GPS location, device compass
│   ├── supabase/         # Supabase client & server configurations
│   └── useVoiceDistress  # Web Speech API distress word listener
├── types/                # Strict TypeScript domain interfaces
├── supabase/             # Database migrations & RLS policies
├── ALONES_BUDDY_SPEC.md  # Architectural specification
├── AGENTS.md             # Coding agent instructions
└── README.md             # Project documentation
```

---

## Hackathon / Team

- **Project**: Alones Buddy
- **Repository**: [https://github.com/Shivamshrma12/Alone-s-Buddy](https://github.com/Shivamshrma12/Alone-s-Buddy)
- **Hackathon Track**: AI Safety & Autonomous Agents
- **Author / Developer**: Shivam Sharma ([@Shivamshrma12](https://github.com/Shivamshrma12))
