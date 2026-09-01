# ND96 Frontend Contract

**Saudi National Day 96 · SATORP · Wednesday 23 September 2026**

Everything the frontend owns, and the exact boundary where the Laravel backend takes over.
Written so both developers can build in parallel from day one without blocking each other.

| | |
|---|---|
| Build window | 6 – 17 September · deploy 20 – 22 September |
| Stack | Next.js static export · Laravel · Figma |
| Frontend | Atheer Alotaibi |
| Backend & integration | second developer |
| Contract | PR Services Contract 3100001111, Schedule B, PR-0011 |

---

> **Scope.** This document covers the **accepted base proposal of 25 August**: Message to the
> Nation and the Kings & Energy Journey. The **National Day Feature** booth — photograph, composed
> bilingual page, print-ready PDF — is a separate add-on that SATORP has not accepted, and is
> excluded throughout. If it is accepted later it is additive: one route, one endpoint, one
> broadcast channel, and acceptance criteria 13–16.

## 1. The split

Six browser surfaces, one build. Each kiosk opens its own route.

| Surface | Route | Device | Frontend owns | Backend owns |
|---|---|---|---|---|
| Message booth | `/booth/message` | iPad, Guided Access | Bilingual form, signature canvas, submit + retry states | Persist, word filter, publish event |
| Message wall | `/wall` | 75″ screen, 1920×1080 | Feature stage, cycling grid, text fit, reconnect recovery | Published stream, ordering |
| Kings & Energy Journey | `/timeline` | Touch screen | Navigation, language switch, idle reset, asset preload | Serve content JSON, versioning |
| Participation view | `/participation` | Secondary screen | Counters, top departments, count-up | Aggregate stats push |
| Operations console | `/console` | Laptop or tablet | Moderation UI, screen commands, timeline editor | Auth, authorisation, command dispatch |
| Highlights page | `/highlights` | Web, post-event | Read-only view of the wall and the timeline | Static export, access control |

**Rule.** The frontend holds no business rules. It never decides whether a word is banned, whether
a message is publishable, or who may operate the console. It renders state and reports intent.
Every rule lives behind the Laravel API so the two developers can never disagree at runtime.

---

## 2. Stack and repo

Team decision: **Figma for design, Next.js for frontend, Laravel for backend.** Next runs in
**static export** mode — the frontend ships as plain files and holds no server. That keeps the
boundary above intact and keeps a Node process off the venue's media players.

| Layer | Choice | Note |
|---|---|---|
| Frontend build | `Next.js` with `output: 'export'` | Static HTML/JS/CSS. No Node at runtime, nothing to crash mid-event. |
| UI | `React 18` + `TypeScript` strict | Strict mode catches the null-shape bugs that otherwise appear on the event floor |
| Styling | `Tailwind`, logical utilities only | `ms-/me-/ps-/pe-` flip for RTL; `ml-/mr-` do not |
| State | `Zustand` | One store per surface, no provider tree |
| Realtime | `transport` module — polling baseline, `laravel-echo` + Reverb as upgrade | See §4. Biggest change from a Node backend. |
| Auth (console) | `Laravel Sanctum`, same-origin cookies | No token juggling if the build is served from Laravel |
| Signature | `signature_pad 5` | Only library with reliable pointer handling and an SVG export path |
| Mocks | `MSW 2` + fake event emitter | Build all seven surfaces before Laravel exists — §10 |
| Tests | `Vitest` + `Playwright` | Playwright drives the 12-hour endurance run unattended |
| Backend | `Laravel` | API, queue, broadcasting, PDF composition |

### Four hard rules for the Next build

Next in export mode is a different discipline from Next on Vercel.

```js
// next.config.js
module.exports = {
  output: 'export',              // 1. static only
  images: { unoptimized: true }, // 2. next/image needs a server; don't
  trailingSlash: true,           //    plays nicer behind nginx / Laravel public/
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },
};
```

1. **No `app/api/`, no server actions, no `'use server'`.** Every route is a client component.
   If a database call lands in this repo, you have taken on integration you priced someone else to do.
2. **`unoptimized: true` for images**, and preload the 21 timeline assets yourself.
3. **Serve the build from Laravel's `public/app/`.** Same origin means no CORS configuration, and
   Sanctum's cookie auth for the console works with no extra work. Worth doing purely to delete two
   categories of bug.
4. **Route per surface** under the App Router, each with `'use client'` at its root.

```
app/
  booth/message/  wall/          timeline/
  participation/  console/       highlights/
src/shared/
  api/            # typed client + zod schemas, single source of truth
  transport/      # polling <-> Echo behind one interface (§4)
  i18n/           # ar.json, en.json, dir helpers
  stage/          # fixed 1920x1080 scaler for screen surfaces
  ui/             # buttons, fields, dialog (no window.confirm anywhere)
src/mocks/        # MSW handlers + event simulator + seed data
```

---

## 3. Shared foundations

Get these four right on day one. Each is expensive to retrofit and each has burned an event
installation before.

### Fixed design space — screen surfaces only

Wall, timeline and participation view are designed once at **1920×1080** in absolute pixels, then
scaled to whatever the venue's screen actually is. No media queries, no reflow surprises on site.

```ts
const s = Math.min(innerWidth / 1920, innerHeight / 1080);
stage.style.transform = `scale(${s})`;
stage.style.transformOrigin = 'top left';
// centre the letterboxed stage; recompute on resize, debounced 150ms
```

The booth is the opposite: iPads vary in aspect ratio and safe area, so those two surfaces use flex
layout, `100dvh` (never `100vh` — iOS toolbars break it), and `env(safe-area-inset-*)` padding.
Touch targets no smaller than 44px, and 64px for anything a nervous first-time user has to hit.

### Bilingual and RTL

| Concern | Requirement |
|---|---|
| Direction | `dir` and `lang` on `<html>`, switched together. Never per-component. |
| Spacing | Logical properties only. A single `margin-left` breaks the Arabic layout silently. |
| User text | `unicode-bidi: plaintext; text-align: start;` on every container rendering a submitted name or message. Without it, a message mixing Arabic and Latin renders in the wrong order. |
| Fonts | Self-hosted WOFF2, subset. **Assume the event network has no internet.** A CDN font that fails leaves the wall in a fallback face in front of leadership. |
| Arabic type | No `letter-spacing` — breaks glyph joining. No `text-align: justify` — gaping word spaces without kashida support. |
| Numerals | Western digits in both languages for counters and dates. Confirm with SATORP; it is a brand decision, not a technical one. |
| Switching | Language switch preserves state: timeline position, form contents, scroll. Store language in the store, not the URL alone. |

### Signature capture

```ts
const pad = new SignaturePad(canvas, { minWidth: 1.2, maxWidth: 3.2, throttle: 8 });

// must scale for retina or the stroke is soft and offset
canvas.width  = canvas.offsetWidth  * devicePixelRatio;
canvas.height = canvas.offsetHeight * devicePixelRatio;
canvas.getContext('2d').scale(devicePixelRatio, devicePixelRatio);

// CSS: touch-action: none  — without it iOS scrolls the page instead of drawing
// on resize / rotate, re-size then pad.fromData(saved) or the signature vanishes

const svg = pad.toSVG();                 // → wall, vector, scales to 75"
const png = pad.toDataURL('image/png');  // → archive
```

Reject on `pad.isEmpty()` or fewer than 20 recorded points — otherwise a stray tap counts as a
signature.

### Kiosk hardening

- iPads in Guided Access, one app, no home gesture, auto-lock off, sleep disabled.
- Screen players in Chrome kiosk mode:
  `--kiosk --incognito --noerrdialogs --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required`
- Suppress context menu, text selection, pinch zoom and pull-to-refresh on every surface.
- Strip `console.*` in the production build. Twelve hours of logging on a kiosk is a memory leak.
- Global error boundary that reloads the surface after 5s rather than showing a stack trace on a 75″ screen.

---

## 4. API contract

This is the handoff artifact. Agree it in writing before either developer writes a line, then treat
changes as breaking.

### REST

#### `GET /api/config` — boot payload, every surface

```json
{ "eventName": "Saudi National Day 96",
  "languages": ["ar","en"], "defaultLanguage": "ar",
  "limits": { "nameMax": 40, "bodyMax": 180, "photoMaxBytes": 8388608 },
  "features": { "departments": true },
  "departments": ["Operations","Maintenance","HSE","..."],
  "wall": { "featureSeconds": 8, "slots": 14 } }
```

Every tunable the frontend needs comes from here. Nothing hardcoded — on the event day you will want
to change `featureSeconds` without a rebuild.

#### `POST /api/messages` — booth submit

```json
// request
{ "clientRef": "9f1c…",          // crypto.randomUUID(), backend MUST dedupe on it
  "name": "عبدالله المطيري",
  "department": "Operations",     // optional
  "body": "…",
  "language": "ar",
  "signatureSvg": "<svg …>",
  "signaturePng": "data:image/png;base64,…" }

// 201
{ "id": "msg_01H…", "status": "published", "createdAt": "2026-09-23T07:14:22Z" }
```

```json
// 422 — Laravel's native validation envelope, do not invent one
{ "message": "The given data was invalid.",
  "errors": { "body": ["The body must not be greater than 180 characters."] } }

// 422 — content rejected by the word filter. Same shape, plus a code and both languages.
{ "message": "Content rejected.",
  "code": "CONTENT_REJECTED",
  "errors": { "body": ["This message can't be published. Please reword it."] },
  "localized": { "ar": "لا يمكن نشر هذه الرسالة. يرجى إعادة صياغتها.",
                 "en": "This message can't be published. Please reword it." } }
```

Keeping Laravel's default `{ message, errors }` shape means the backend fights the framework nowhere
and the frontend needs exactly one error parser. The word list stays in Laravel; the frontend renders
`localized[lang]` and never holds a rule.

> **Non-negotiable.** `clientRef` exists because the booth iPad will drop Wi-Fi mid-submit and the
> user will tap Submit again. Without server-side deduplication on this key, the wall shows the same
> message twice — in front of leadership, with a name on it.

#### `GET /api/messages` — wall cold start, resync, poll transport

```
?status=published&since=<iso>&limit=200&cursor=…

{ "items": [ /* Message[] newest first */ ],
  "nextCursor": null, "total": 327 }
```

The wall calls this on mount and again after every reconnect or poll gap. It is what makes
acceptance criterion 7 — restart restores all messages with no manual intervention — pass.

#### `PATCH /api/messages/:id` — console moderation

```json
{ "body": "corrected text", "status": "hidden" }   // either field, both optional
// status: "published" | "hidden"
```

Hidden, never deleted — a removed message must be restorable if an operator taps the wrong row.

#### `GET /api/timeline` · `PUT /api/timeline`

```json
{ "version": 7,
  "reigns": [ { "id": "r1", "hijriFrom": 1351, "hijriTo": 1373,
      "nameAr": "…", "nameEn": "…", "portrait": "/assets/r1.webp",
      "milestones": [ { "id": "m1", "year": 1357,
          "titleAr": "…", "titleEn": "…",
          "bodyAr": "…",  "bodyEn": "…",
          "image": "/assets/m1.webp" } ] } ] }
```

`PUT` replaces the whole document and must carry the `version` it was read at. A stale version
returns **409** and the console reloads rather than overwriting someone else's edit.

Seven reigns, three milestones each — 21 nodes. **Confirm this count in writing with SATORP; the
25 August proposal contradicted itself on it.**

#### `POST /api/screen/commands` · `GET /api/stats`

```json
// POST /api/screen/commands
{ "command": "clear" | "holding" | "resume" | "resetEvent" | "feature",
  "payload": { "messageId": "msg_…" } }

// GET /api/stats
{ "messages": 327, "timelineTaps": 881,
  "topDepartments": [ { "name": "Operations", "count": 74 } ] }
```

### Realtime — the biggest change under Laravel

Socket.IO is a Node library and does not belong in front of Laravel. Laravel broadcasts through
**Reverb** (its own WebSocket server) and the browser listens with **Laravel Echo** over the Pusher
protocol. Two consequences for the frontend:

- Event names use Laravel's dot convention via `broadcastAs()`, and Echo needs a **leading dot** to
  bypass namespacing: `.message.published`.
- The console's private channel needs Laravel's `/broadcasting/auth` endpoint. Public channels —
  `wall`, `participation` — need nothing.

| Channel | Event (`broadcastAs`) | Payload | Consumed by |
|---|---|---|---|
| `wall` *(public)* | `message.published` | `{ message: Message }` | wall, participation |
| `wall` | `message.updated` | `{ message: Message }` | wall, console |
| `wall` | `message.hidden` | `{ id }` | wall, console |
| `wall` | `screen.command` | `{ command, payload }` | wall |
| `participation` *(public)* | `stats.updated` | `{ stats: Stats }` | participation, console |
| `console` *(private)* | `timeline.updated` | `{ version }` | console, timeline |

```ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'reverb',
  key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
  wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
  wsPort: 8080, forceTLS: false,
  enabledTransports: ['ws', 'wss'],
});

echo.channel('wall').listen('.message.published', (e) => push(e.message));
//                                      ^ leading dot is required with broadcastAs()

// reconnect detection lives on the raw pusher connection
echo.connector.pusher.connection.bind('connected', resyncFromRest);
```

### Transport strategy — build this abstraction first

> **Recommendation.** Do **not** make Reverb a prerequisite. Put polling and Echo behind one
> `transport` interface, ship polling as the default, and treat WebSockets as an upgrade you switch
> on if the venue network allows it.

The reasoning is operational, not architectural:

- The acceptance criterion is **three seconds** from submit to wall. A **2-second poll** of
  `GET /api/messages?since=…` meets it with room to spare.
- Reverb is a long-running process that must be supervised for twelve unattended hours, on top of
  php-fpm and a queue worker. That is three processes that can die at 3pm with leadership in the room.
- Corporate networks frequently proxy or idle-kill WebSockets. You will not find out until you are
  on SATORP's network on 21 September — one day before the event.
- Polling at 2s with ~900 rows and a `since` cursor is trivial load for a single-venue event. This is
  not a scale problem.

```ts
interface Transport {
  subscribe(channel: string, handlers: Handlers): () => void;
  readonly mode: 'poll' | 'echo';
}
// NEXT_PUBLIC_TRANSPORT=poll | echo   — one env var, no code change
```

Build against polling, demonstrate on polling, and turn Echo on only once it has survived a full
endurance run on the real network. If it has not, you ship polling and nobody can tell the
difference on the day.

> **Reconnect policy — unchanged.** On reconnect, or on every poll gap over 30s, the frontend
> **discards** its message state and refetches `GET /api/messages` wholesale. It never asks the
> backend to replay missed events, and Laravel never needs to buffer them. This one decision removes
> an entire class of ordering bug and is why the wall survives a Wi-Fi drop.

---

## 5. Data types

Put these in `src/shared/api/types.ts` with matching `zod` schemas. Validate every response at the
boundary — a malformed payload should surface as a caught error, not a blank 75″ screen.
Laravel API Resources must serialise to exactly these shapes.

```ts
type Lang = 'ar' | 'en';

interface Message {
  id: string;
  name: string;
  department?: string;
  body: string;
  language: Lang;
  signatureSvg: string;
  status: 'published' | 'hidden';
  createdAt: string;        // ISO 8601, UTC — never a local string
}

interface Stats {
  messages: number;
  timelineTaps: number;
  topDepartments: { name: string; count: number }[];
}
```

### Validation — frontend enforces, Laravel re-enforces

| Field | Rule | Reason |
|---|---|---|
| `name` | 2–40 characters, trimmed | Longer breaks the wall card layout |
| `body` | 10–180 characters | Above 180 it is unreadable at distance on a 75″ screen |
| signature | required, ≥ 20 points | A stray tap is not a signature |
| `clientRef` | UUID v4, required on every POST | Duplicate-submit protection |

Client-side validation is for user experience only. The backend must repeat all of it — the booth is
a browser and a browser can be manipulated.

---

## 6. Surface requirements

### Message wall — the hardest surface

Runs unattended for twelve hours on a screen nobody can quietly restart. Two design decisions carry
it:

**Constant DOM.** A fixed pool of **14 card slots** with stable keys `slot-0 … slot-13`. Content
rotates through the slots; nodes are never appended. Node count stays flat whether 30 or 900
messages have been submitted, so the heap stays flat too.

**Queue, never drop.** New messages enter `featureQueue` and take the stage for `featureSeconds`
each. If the queue exceeds five, shorten to 5s rather than skipping — every contributor must see
their own words featured, which is the entire point of the installation.

- **Animation:** `transform` and `opacity` only. `will-change` on the single feature overlay, never
  on the 14 slots — that allocates 14 GPU layers and degrades over hours.
- **Text fit:** binary-search font size between 28 and 72px until `scrollHeight <= clientHeight`;
  cache the result per message id. Message lengths vary too much for a fixed size.
- **Signature:** render the SVG inline, not as an `<img>`, so it stays crisp at 75″ and can be
  stroke-revealed on the feature stage.
- **Watchdog:** no event and no successful poll for 60s → discreet corner indicator and fall back to
  15s polling. Never a modal; this is a public screen.
- **Cold start:** mount → `GET /api/messages` → full wall restored with zero operator action.

### Message booth

- Three steps on one screen — message, name, signature — not a wizard. Every extra tap loses
  participants.
- Submit disabled on first tap; optimistic "sent" state; 15s timeout with a bilingual retry.
- Auto-reset to the invitation screen 6s after success, so the next person finds a clean slate.
- Live character counter that turns amber at 20 remaining, and never silently truncates.
- Language toggle persistent in a corner, resets with the form.

### Kings & Energy Journey

- Preload all 21 images at boot behind a loading gate. Assets served locally — never a remote host.
- Cache the content JSON in `localStorage` keyed by `version`, so a network blip cannot blank the
  screen.
- Language switch preserves `{ reignIndex, milestoneIndex }` exactly — acceptance criterion 10.
- Idle reset to the attract state after 90s with no touch.
- Hit targets ≥ 80×80px in the 1920×1080 space; swipe and tap both work.

### Operations console

- Sanctum same-origin cookie session if the build is served from Laravel `public/app/`; otherwise a
  bearer token in `sessionStorage`, never `localStorage` — a shared laptop must not stay logged in.
  `401` → login route.
- Live message list, virtualised beyond 300 rows. Optimistic hide/restore/edit with rollback on
  failure.
- Destructive commands behind an **in-page** dialog. Never `window.confirm` — a native modal blocks
  the render loop and, on the wall player, freezes the screen.
- Timeline editor posts the whole document with its `version`; handle `409` by reloading and telling
  the operator plainly what happened.

---

## 7. Non-functional targets

| Target | Threshold | How it is verified |
|---|---|---|
| Submit → visible on wall | ≤ 3 s | Timed run, 20 samples, worst case recorded |
| Wall frame rate during feature transition | 60 fps | Chrome performance trace on the actual player |
| Wall heap after 12 h | ≤ 200 MB, flat | Playwright script, 900 synthetic messages, heap sampled hourly |
| Wall legible with | 300+ messages | Seeded run, read from 8 m at the venue's screen size |
| Timeline interaction response | ≤ 100 ms | Input-to-paint measurement |
| Kiosk first load | ≤ 3 s | Cold cache on the player hardware, not a laptop |
| Recovery after network loss | ≤ 10 s | Wi-Fi pulled mid-event, wall self-heals unaided |
| Recovery after player reboot | ≤ 30 s, no input | Power-cycle test |

---

## 8. Acceptance ownership

The sixteen criteria in the proposal, mapped. Know which ones fail on you before the demonstration,
not during it.

| # | Criterion | Owner |
|---|---|---|
| 1 | Full submission unaided in Arabic, then English | **FE** |
| 2 | Message appears on the wall within three seconds | SHARED |
| 3 | Featured ~8s, then joins the cycling wall | **FE** |
| 4 | Excluded term rejected with a correct bilingual prompt | BE logic · **FE** display |
| 5 | 300+ messages render legibly and stay balanced | **FE** |
| 6 | Twelve hours continuous, no degradation | **FE** |
| 7 | Restart restores all published messages unaided | **FE** |
| 8 | All seven reigns present and independently navigable | **FE** |
| 9 | Timeline content matches the approved file exactly | BE + content |
| 10 | Language switch preserves position in the timeline | **FE** |
| 11 | Arabic renders correctly throughout, nothing broken or reversed | **FE** |
| 12 | Console removes, clears to holding, resets the event | SHARED |

Criteria **13–16 relate to the National Day Feature and are out of scope** under the accepted
proposal. Of the twelve that remain, ten are wholly or partly frontend. Criteria 6 and 7 are the two that cannot be
demonstrated in a sprint review — **start the endurance harness in week one, not week two.**

---

## 9. Backend dependencies

What the frontend needs from the second developer, and when, against the schedule committed to
SATORP.

| By | Needed | Blocks |
|---|---|---|
| Thu 3 Sep | Agreed API contract signed off — §4 and §5 of this document | Everything. Nothing else starts cleanly until this is fixed. |
| Sun 6 Sep | Transport decision: polling for the build, Reverb yes/no. Event and channel names fixed. | The `transport` module |
| Sun 6 Sep | Local dev server reachable, even returning stubs | Nothing — MSW covers this. Confirm early anyway. |
| Tue 8 Sep | `POST /api/messages` and `message.published` live | First real end-to-end submit → wall |
| Thu 10 Sep | `GET /api/messages` with `since` and cursor paging | Cold start and reconnect recovery, criterion 7 |
| Sun 13 Sep | `GET /api/timeline` serving the approved content | Timeline build against real data, criteria 8–10 |
| Tue 15 Sep | Sanctum auth for the console, and screen commands | Criterion 12 |
| Tue 15 Sep | Next build served from Laravel `public/app/` on staging | Confirms same-origin cookies; deletes CORS from the risk list |
| Thu 17 Sep | Staging on the venue network, correct hostnames | Endurance run on real hardware |
| Thu 17 Sep | php-fpm and (if used) Reverb under `supervisor` or `systemd`, restart-on-failure proven | Twelve unattended hours, criterion 6 |

> **Ops reality under Laravel.** With the feature page out of scope there is no PDF queue job, so the
> event day depends on **php-fpm** and, only if you choose it, **Reverb**. Each needs supervision with
> automatic restart and a proven kill-and-recover test before 22 September. Shipping polling instead
> of Reverb leaves exactly one process to keep alive for twelve hours — the simplest configuration
> available to you, and worth choosing for that reason alone.

> **Also unresolved.** **Schedule D, Cybersecurity Requirements** has not been received from SATORP.
> It may mandate internal hosting, a code review, or a penetration test — any of which lands on the
> backend and the deployment, not the frontend, but all of which move the date. Do not let it stay
> open past acceptance.

---

## 10. Mock-first plan

The single most valuable decision in a ten-day parallel build: **the frontend never waits for the
backend.** Ship a mock layer in the repo on day one.

- **MSW handlers** for all six REST endpoints, returning realistic bilingual seed data — 200
  messages with genuine Arabic, real names, mixed-script bodies, varied lengths.
- **Event simulator** behind the same `transport` interface — emits `message.published` on a
  configurable interval, plus a control panel to fire `screen.command`, force a disconnect, and
  replay a reconnect. Works identically whether the real transport ends up polling or Echo.
- **Seed generator** that can produce 900 messages for the endurance run without touching Laravel.
- **Two env switches** — `NEXT_PUBLIC_API_MODE=mock|live` and `NEXT_PUBLIC_TRANSPORT=poll|echo`.
  Nothing else changes. The Laravel developer runs the real frontend against their own server with
  the same build.

Two further benefits worth naming: the mock *is* the executable form of the contract, so a
disagreement surfaces the day the real endpoint arrives rather than the week before the event. And it
lets you demonstrate all six surfaces working to SATORP before a single row exists in a database.

### Deliverables from the frontend

- One static Next export, six routes, dropped into Laravel `public/app/` or served by nginx.
- `src/shared/api` types and zod schemas, shared as the contract of record.
- Mock layer, kept working — it is the regression harness, not scaffolding.
- Playwright endurance suite covering the twelve-hour run and the reboot recovery.
- Kiosk setup notes: exact Chrome flags, iPad Guided Access steps, per-surface URLs — this becomes
  the operations handbook section SATORP staff actually use on the day.
