# Outbreak Radar — Build Plan (v3)

**For the agent implementing this.** Read all of §0 before writing code. Everything below is
specified to be executed in order; each phase has acceptance criteria you can actually check.

---

## 0. Where things stand

### What already works — do not rebuild it

| Area | State |
|---|---|
| `lib/domain/campus.ts` | Real MUJ layout: B1–B12 (boys), G1–G7 (girls), 4 floors each, one overhead tank per block, central RO plant, 2 messes. |
| `lib/domain/risk.ts` | Risk classification → `normal / watch / elevated / critical`, confidence, likely source, plain-English summary. **Exposes no statistics.** |
| `lib/domain/surveillance.ts` | Reads DB → `SituationReport` for the UI. Hotspots, suspect meals, failing water tests. |
| `lib/db/` | Postgres-shaped data layer + seeded mock. ~4,868 students, 248 meals, 59,659 attendance rows, 30 days of history. |
| `db/schema.sql` | 12 tables. Real schema, ready for Postgres. |
| `components/neu/` | Neumorphic design system: `Surface`, `Stat`, `RiskBadge`, `ConfidencePill`, `NeuButton`, `EmptyState`. |
| Pages | `/` landing · `/radar` dashboard · `/radar/[blockId]` block detail · `/doctor` console · `/report` self-report |
| APIs | `/api/situation` `/api/reports` `/api/consultations` `/api/students` `/api/alerts` `/api/water-tests` |
| Deploy | Live at **https://outbreak-radar-iota.vercel.app** |

### 0.1 Verified problems this plan fixes

1. **Nobody can identify themselves.** Registration numbers are `24FE10001`-style. A judge opening
   `/report` sees a search box, types anything realistic, gets nothing, and the Continue button stays
   greyed out. **Root cause: no login, and an unguessable ID format.**
2. **Dashboard build takes 397ms.** `rankMeals()` is called once per block (19 blocks), and each call
   loops all 248 recent meals calling `getMealAttendees()`, which linearly filters all 59,659
   attendance rows. **Performance bug, not a logic one.**
3. **The map is a diagram, not a map.** `components/radar/campus-heatmap.tsx` places blocks on a
   synthetic isometric grid via `gridPosition()`. Real coordinates exist in `campus.ts` but are
   approximations and are not used for rendering.
4. **Students see everything.** `/radar` shows exact case counts, doctor-confirmed splits, and block
   names to anyone who opens it.
5. **QR code is broken.** `<img>` pointing at `api.qrserver.com` — external dependency, hardcoded
   Vercel domain. Fix: inline SVG encoding with `window.location.origin`.
6. **Push notifications silently degrade.** Without VAPID keys in Vercel env, push falls back to
   in-app only. Phone demo requires HTTPS (deployed URL, not localhost).

### 0.2 Decisions that are settled — do not revisit

- **No filter-level water tracking.** Block → floor → room, one tank per block.
- **No statistics in the UI.** No p-values, attack rates, or likelihood ratios on screen.
- **A human sends every advisory.** Nothing in the detection path notifies a student automatically.
- **Warm colour means risk only.** All chrome stays neutral so danger reads at a glance.
- **No real auth.** Demo credentials, signed cookie, no password hashing theatre.
- **OCR is not included.** In-browser OCR (Tesseract) fails on handwriting; not worth the dependency.

---

## Phase 1 — Registration numbers `250205xxxx`

Replace the `24FE1xxxx` format everywhere.

```
2 5 0 2 0 5 X X X X
│ │ │ │ │ │ └─┴─┴─┴─ 4-digit serial, 0001–9999
│ │ │ │ └─┴───────── programme code (05 = B.Tech CSE)
│ │ └─┴───────────── school code (02 = School of Computing)
└─┴───────────────── admission year (25 = 2025)
```

Canonical prefix `250205`. With 4,868 students the serial runs `0001`–`4868`.
Add realism: ~20% alternate programme codes — `250206` (IT), `250210` (Mechanical), `250215`
(Electronics) — but keep `250205` dominant.

**Files:**
- `lib/db/mock.ts` — both `registration:` assignments
- `lib/domain/registration.ts` — new: `makeRegistration()`, `parseRegistration()`, `isValidRegistration()`

**Done:** `2502050001` resolves to a real student via `/api/students?exact=2502050001`.

---

## Phase 2 — Authentication

No real auth. A signed cookie carrying `{ role, userId }`, set by a login form.

**Routes:**
```
/login              role picker → student or doctor form
/api/auth/login     POST { role, identifier, pin } → sets cookie
/api/auth/logout    POST → clears cookie
/api/auth/me        GET  → current session or 401
```

**Credentials (printed on login screen):**

| Role | Identifier | PIN |
|---|---|---|
| Student | any registration, e.g. `2502050001` | `1234` |
| Doctor | `health.centre@muj.ac.in` | `4321` |
| Warden | `warden.b4@muj.ac.in` | `4321` |

**Files:**
- `lib/auth/session.ts` — `getSession()`, `requireRole()`
- `app/login/page.tsx` — role picker + demo buttons
- `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts`
- Guard server components with `await requireRole(...)` (Next 16 async `cookies()`)

**Done:** visiting `/doctor` logged out redirects to `/login`. Student login redirects to `/app`.

---

## Phase 3 — Sickness pools + report weighting

**Pools** — classify every symptom report into a pool:

```
gastro      — vomiting, loose_motions, stomach_pain, nausea, dehydration
respiratory — cough, sore_throat, runny_nose, breathlessness
fever       — fever, body_ache, headache, weakness
skin        — rash, itching
other       — anything unmatched
```

**Files:**
- `lib/domain/pools.ts` — `PoolId`, `POOLS`, `poolFor()`
- `lib/db/types.ts` — extend symptoms: `cough · sore_throat · body_ache · rash · itching · breathlessness · runny_nose`
- `db/schema.sql` — add `pool` column to `consultations` and `self_reports`
- `lib/db/mock.ts` — compute pool on write

**Weighting:**
```ts
// lib/domain/weighting.ts
export const WEIGHT = { doctor: 1.0, self: 0.4 } as const;
```

Add `rawCases` alongside `weightedCases` in `Hotspot`; render `rawCases` (whole people, never decimals).

**Files:**
- `lib/domain/weighting.ts` — new
- `lib/types.ts` — add `rawCases` to `Hotspot` (optional field, frozen contract)

**Done:** ten self-reports in one block produce a lower risk level than four doctor consultations.

---

## Phase 4 — Student app `/app`

A student must never see campus case counts.

```
/app            home — my status, general heat view, report button
/app/report     symptom self-report (2-step for logged-in, identity from session)
/app/pool       heatmap for MY pool — only after I have reported
/app/alerts     notification feed
```

**Files:**
- `lib/domain/student-view.ts` — `buildStudentView()`, `StudentView` interface
- `app/app/page.tsx` + `app/app/app-client.tsx`
- `app/app/report/page.tsx` + `app/app/report/report-client.tsx`
- `app/app/pool/page.tsx`
- `app/app/alerts/page.tsx`

**Done:** network tab on `/app` contains no `caseCount`, `doctorConfirmed`, or `totalCases`.

---

## Phase 5 — In-app notifications

**Schema:**
```sql
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references students(id) on delete cascade,
  alert_id    uuid references alerts(id) on delete cascade,
  title       text not null,
  body        text not null,
  severity    risk_level not null default 'watch',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on notifications(student_id, created_at desc);
```

Fan out one row per student in the cohort when warden sends advisory (`POST /api/alerts`).

**Files:**
- `db/schema.sql` — add table
- `lib/db/index.ts` — `createNotification()`, `getNotifications()`, `markRead()`
- `app/api/alerts/route.ts` — fan-out on POST
- `components/neu/notification-bell.tsx` — header bell with unread count

**Done:** warden sends advisory → student app shows notification in the feed immediately.

---

## Phase 6 — PWA setup

**Files:**
- `app/manifest.ts` — typed manifest route: `display: 'standalone'`, icons at 192/512 (maskable)
- `public/sw.js` — service worker: cache shell, network-first for `/api/*`
- `app/layout.tsx` — iOS meta tags: `apple-mobile-web-app-capable`, `apple-touch-icon`
- `components/pwa/install-prompt.tsx` — captures `beforeinstallprompt` (Android), manual Share instruction (iOS)

**Done:** Android Chrome shows install prompt. iOS shows clear manual instruction.

---

## Phase 7 — Web Push notifications

**VAPID keys — must be in Vercel dashboard, not just local .env:**
```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```
Generate: `npx web-push generate-vapid-keys`. Without them push silently degrades to in-app only.

**HTTPS requirement:** Phone demo must use deployed URL (`https://outbreak-radar-iota.vercel.app`), not localhost.

**iOS limitation:** Web Push requires home screen install first (iOS 16.4+). Build Phase 6 install prompt before wiring push.

**Files:**
- `lib/push/vapid.ts` — key loading with soft-fail guard
- `lib/push/subscribe.ts` — store `PushSubscription` against student
- `app/api/push/subscribe/route.ts` — POST endpoint
- `lib/push/send.ts` — `web-push` fan-out on advisory
- `public/sw.js` — add `push` and `notificationclick` handlers
- `app/api/alerts/test/route.ts` — `POST { studentId }` for demo rehearsal

**Done:** phone with PWA installed receives a banner within seconds of warden pressing Send advisory (via deployed URL).

---

## Phase 8 — Real map imagery

**Library:** `react-leaflet` + `leaflet` (no API key needed).

**Tiles:**
- Satellite: Esri World Imagery (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`)
- Light: CARTO Positron (toggle)
- MUJ centre: `26.8434, 75.5652`, zoom 17

**Heat rendering:** `CircleMarker` per block, radius by occupancy, fill by `RiskLevel`, pulse for >normal. No generic heatmap plugin.

**Files:**
- `components/radar/campus-map.tsx` — Leaflet map replacing isometric SVG
- `app/api/campus/blocks/route.ts` — GET/POST coordinates
- `lib/db/mock.ts` + `campus.ts` — read lat/lng from DB, hardcoded fallback
- `app/admin/map/page.tsx` — draggable markers, save, export to TypeScript snippet

**Done:** blocks sit on actual buildings in satellite view; dragged marker survives page reload.

---

## Phase 9 — Ticket system performance fix

**Files:**
- `lib/db/mock.ts` — build indexes once at seed time:
  ```ts
  attendanceByMeal:    Map<string, Set<string>>;   // mealId → studentIds
  attendanceByStudent: Map<string, string[]>;      // studentId → mealIds
  ```
- `getMealAttendees()` becomes Map lookup
- Hoist `rankMeals()` campus-wide portion out of per-block loop

**Done:** `buildSituationReport()` drops from ~397ms to under 50ms. Measure with:
```ts
const t = Date.now(); buildSituationReport(); console.log(Date.now() - t);
```

---

## Phase 10 — Ticket visibility in UI

**Files:**
- `app/radar/[blockId]/page.tsx` — add panel: "Mess attendance in the last 72h" (meals served, plates collected, current suspect meal)

**Done:** block detail page shows food attendance context alongside water data.

---

## Phase 11 — Widget refactor + mobile access

- **Bottom tab bar** on mobile (`Home · Report · Alerts · Me`), fixed, thumb-reachable. Replace top nav on `/app/*` at `<md`.
- **One-tap report**: persistent floating action button on `/app`.
- **Touch targets ≥ 44px** (current chips ~36px).
- **Report reduced to 2 steps** for logged-in students — identity from session eliminates step 1.

**Files:**
- `components/app/bottom-tabs.tsx` — new
- `app/app/page.tsx` — add FAB
- `components/ui/symptom-chip.tsx` — resize to 44px
- `app/app/report/report-client.tsx` — 2-step flow

**Done:** mobile user can reach every student surface with thumbs only.

---

## Phase 12 — Synthetic data labeling

Simulated clusters for demo purposes must be visually distinct from real cases. A fabricated cluster
that looks identical to a real one destroys the product's core argument: "we tell you the honest
answer, including when nothing is happening."

**Approach:** Render all synthetic data behind a `DEMONSTRATION` marker — visually obvious, not ugly.
This turns it into a talking point: "this is simulated; here's what a real cluster would look like."

**Files:**
- `lib/types.ts` — add optional `synthetic?: boolean` to case/report types (frozen contract, additive only)
- `lib/db/mock.ts` — stamp `synthetic: true` on all generated demo cases
- `components/neu/synthetic-badge.tsx` — small `DEMONSTRATION` label, rendered inline with case cards
- All case-rendering components — check `synthetic` and render badge when true

**Done:** every demo case shows a visible `DEMONSTRATION` label. Real cases (from doctor/self-report) never show it.

---

## Phase 13 — QR code fix

Current QR is an `<img>` pointing at `api.qrserver.com` — external dependency, hardcoded Vercel URL.
Fails with no network or blocked domain.

**Fix:** encode QR locally as inline SVG using `window.location.origin`. Zero external dependency.

**Files:**
- `lib/qr/encode.ts` — lightweight QR encoder (Reed-Solomon, ~200 lines, no deps)
- `components/qr/qr-svg.tsx` — renders inline SVG from `window.location.origin`
- `app/page.tsx` — replace `<img>` with `<QrSvg />`
- `app/radar/page.tsx` — same replacement

**Done:** QR renders offline, points to current origin, no external fetch.

---

## Phase 14 — Deployment + Vercel environment

**Files:**
- Vercel dashboard settings:
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (from Phase 7)
  - `DATABASE_URL` (when ready for Postgres)
- `next.config.ts` — verify no hardcoded domains
- `vercel.json` — if needed for service worker scope

**Verification checklist:**
- `npm run typecheck` passes
- `npm run build` passes
- Deployed at `https://outbreak-radar-iota.vercel.app`
- Phone demo works against deployed URL (HTTPS)
- Push notifications fire end-to-end
- QR scans to deployed URL

**Done:** clean deploy, all env vars set, full demo flow works from phone.

---

## Implementation order

| Phase | Work | Depends on |
|---|---|---|
| 1 | Registration format | — |
| 2 | Auth + login | Phase 1 |
| 3 | Pools + weighting | — |
| 4 | Student app | Phase 2, 3 |
| 5 | In-app notifications | Phase 4 |
| 6 | PWA setup | — |
| 7 | Web Push | Phase 5, 6 |
| 8 | Real map | — |
| 9 | Performance fix | — |
| 10 | Ticket visibility | Phase 9 |
| 11 | Widget refactor | Phase 4 |
| 12 | Synthetic labeling | — |
| 13 | QR fix | — |
| 14 | Deploy + env | All above |

**If time runs short, cut in this order:** Phase 8.3 polygon footprints → Phase 8 entirely (isometric view is good) → Phase 7 push (in-app feed still demos concept).

**Never cut:** auth, student/warden separation, in-app notifications, synthetic labeling, QR fix. Those are what the pitch claims.

---

## Demo script

1. Judge scans QR on dashboard, installs PWA, allows notifications.
2. Logs in as demo student (`2502050001` / one tap).
3. Sees a calm campus — coloured blocks, **no numbers**.
4. Reports symptoms: vomiting, nausea, started this morning. Two taps and a submit.
5. Placed in **stomach illness** pool, can now see that pool's spread.
6. Presenter switches to warden dashboard on laptop. B4 is critical.
7. Warden opens B4, sees floor breakdown and failed tank test, presses **Send advisory**.
8. **Judge's phone buzzes.** "Suspected outbreak near you — Block B4."
9. Judge opens it, reads advisory scoped to their block.
10. Presenter points out: if that judge now reports symptoms, the report is flagged
    `after advisory` and **excluded from the assessment**.
