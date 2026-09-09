# ND96 Frontend

Frontend for **Saudi National Day 96 · SATORP · Wednesday 23 September 2026**.

Six browser surfaces, one static Next.js build, served from the Laravel backend's `public/app/`:

| Surface | Route | Device |
|---|---|---|
| ApiMessage booth | `/booth/message` | iPad, Guided Access |
| ApiMessage wall | `/wall` | 75″ screen, 1920×1080 |
| Kings & Energy Journey | `/timeline` | Touch screen |
| Participation view | `/participation` | Secondary screen |
| Operations console | `/console` | Laptop or tablet |
| Highlights page | `/highlights` | Web, post-event |

## Stack

- **Next.js** with `output: 'export'` — static HTML/JS/CSS, no Node at runtime
- **React 18 + TypeScript** (strict) · **Tailwind** (logical utilities only, RTL-safe) · **Zustand**
- **Transport abstraction** — polling baseline, Laravel Echo + Reverb as an opt-in upgrade (`NEXT_PUBLIC_TRANSPORT=poll|echo`)
- **MSW 2** mock layer — the frontend never waits for the backend (`NEXT_PUBLIC_API_MODE=mock|live`)
- **Vitest + Playwright** — including the 12-hour endurance run

## Contract of record

The full frontend/backend contract — API shapes, realtime channels, surface requirements,
acceptance ownership, and the backend dependency schedule — lives in
[docs/FRONTEND-SPEC.md](docs/FRONTEND-SPEC.md). Treat changes to §4 (API contract) and
§5 (data types) as breaking.

## Timeline

| | |
|---|---|
| Build window | 6 – 17 September 2026 |
| Deploy | 20 – 22 September 2026 |
| Event | 23 September 2026 |

Frontend: Atheer Alotaibi · Backend & integration: second developer
