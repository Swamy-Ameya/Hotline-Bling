# Outbreak Radar — Build Plan (v2)

**For the agent implementing this.** Read all of §0 before writing code. Everything below is
specified to be executed in order; each phase has acceptance criteria you can actually check.

---

## 0. Where things stand

### What already works — do not rebuild it

| Area | State |
|---|---|
| `lib/domain/campus.ts` | Real MUJ layout: B1–B12 (boys), G1–G7 (girls), 4 floors each, one overhead tank per block, central RO plant, 2 messes. **No filter-level modelling** — that was removed deliberately, see §0.2. |
| `lib/domain/risk.ts` | Risk classification → `normal / watch / elevated / critical`, confidence, likely source, plain-English summary. **Exposes no statistics.** |
| `lib/domain/surveillance.ts` | Reads DB → `SituationReport` for the UI. Hotspots, suspect meals, failing water tests. |
| `lib/db/` | Postgres-shaped data layer + seeded mock. ~4,868 students, 248 meals, 59,659 attendance rows, 30 days of history. |
| `db/schema.sql` | 12 tables. Real schema, ready for Postgres. |
| `components/neu/` | Neumorphic design system: `Surface`, `Stat`, `RiskBadge`, `ConfidencePill`, `NeuButton`, `EmptyState`. |
| Pages | `/` landing · `/radar` dashboard · `/radar/[blockId]` block detail · `/doctor` console · `/report` self-report |
| APIs | `/api/situation` `/api/reports` `/api/consultations` `/api/students` `/api/alerts` `/api/water-tests` |
| Deploy | Live at **https://outbreak-radar-iota.vercel.app** |

### 0.1 Verified problems this plan fixes

These were measured, not guessed:

1. **Nobody can identify themselves.** Registration numbers are `24FE10001`-style. A judge opening
   `/report` sees a search box, types anything realistic, gets nothing, and the Continue button stays
   greyed out. That is the "self-reporting is crossed out" symptom — the button is `disabled`, not
   struck through. **Root cause: no login, and an unguessable ID format.**
2. **Dashboard build takes 397ms.** `rankMeals()` is called once per block (19 blocks), and each call
   loops all 248 recent meals calling `getMealAttendees()`, which linearly filters all 59,659
   attendance rows. That is the "ticket system is broken" symptom — it is a performance bug, not a
   logic one. Meal linkage itself works correctly.
3. **The map is a diagram, not a map.** `components/radar/campus-heatmap.tsx` places blocks on a
   synthetic isometric grid via `gridPosition()`. Real coordinates exist in `campus.ts` but are
   approximations and are not used for rendering.
4. **Students see everything.** `/radar` shows exact case counts, doctor-confirmed splits, and block
   names to anyone who opens it.

### 0.2 Decisions that are settled — do not revisit

- **No filter-level water tracking.** Block → floor → room, one tank per block. No hostel in India
  tracks water to a cartridge, and a warden cannot act on it. This was removed on purpose.
- **No statistics in the UI.** No p-values, attack rates, or likelihood ratios on screen. The UI gets
  sentences: *"16 reports, where we'd normally expect about 1."* Reasoning can be statistical; output
  must be actionable.
- **A human sends every advisory.** Nothing in the detection path notifies a student automatically.
- **Warm colour means risk only.** All chrome stays neutral so danger reads at a glance.
- **No real auth.** Declared scope. Demo credentials, signed cookie, no password hashing theatre.

---

## 1. Registration numbers — `250205xxxx`

Replace the `24FE1xxxx` format everywhere.

```
2 5 0 2 0 5 X X X X
│ │ │ │ │ │ └─┴─┴─┴─ 4-digit serial, 0001–9999
│ │ │ │ └─┴───────── programme code (05 = B.Tech CSE)
│ │ └─┴───────────── school code (02 = School of Computing)
└─┴───────────────── admission year (25 = 2025)
```

**Canonical prefix `250205`.** With 4,868 students the serial runs `0001`–`4868`, so
`2502050001` … `2502054868`.

Add a small amount of realism by giving ~20% of students alternate programme codes — `250206` (IT),
`250210` (Mechanical), `250215` (Electronics) — but keep `250205` dominant so a judge typing the
pattern they were shown always finds someone.

**Files:** `lib/db/mock.ts` (both `registration:` assignments), and add a
`lib/domain/registration.ts` with:

```ts
export function makeRegistration(serial: number, programme = '0205'): string;
export function parseRegistration(reg: string): { year: number; school: string; programme: string; serial: number } | null;
export function isValidRegistration(reg: string): boolean;   // 10 digits, starts with 25
```

**Acceptance:** `2502050001` resolves to a real student via `/api/students?exact=2502050001`.

---

## 2. Authentication — student and doctor login

No real auth. A signed cookie carrying `{ role, userId }`, set by a login form.

### Routes

```
/login              role picker → student or doctor form
/api/auth/login     POST { role, identifier, pin } → sets cookie
/api/auth/logout    POST → clears cookie
/api/auth/me        GET  → current session or 401
```

### Credentials (seeded, printed on the login screen for the demo)

| Role | Identifier | PIN |
|---|---|---|
| Student | any registration, e.g. `2502050001` | `1234` |
| Doctor | `health.centre@muj.ac.in` | `4321` |
| Warden | `warden.b4@muj.ac.in` | `4321` |

Put a **"Use demo student"** and **"Use demo doctor"** button on the login screen that fills the
form in one tap. A judge should never have to type a 10-digit number.

### Session

`lib/auth/session.ts`:

```ts
export type Session = { role: 'student' | 'doctor' | 'warden'; userId: string };
export async function getSession(): Promise<Session | null>;   // reads cookie — await cookies()
export async function requireRole(...roles: Session['role'][]): Promise<Session>;  // redirect if wrong
```

**Next 16:** `cookies()` is async. `const store = await cookies()`.

### Route protection

There is no `middleware` in this project (Next 16 renamed it to `proxy`; we use neither). Guard in
the server component at the top of each protected page:

```tsx
const session = await requireRole('doctor', 'warden');
```

**Acceptance:** visiting `/doctor` logged out redirects to `/login`. Logging in as a student and
visiting `/radar` redirects to `/app`.

---

## 3. Sickness pools

When anyone reports symptoms, classify them into a pool. This is what makes the student view safe to
show — a student sees the spread of *their own kind of illness*, never the campus case book.

`lib/domain/pools.ts`:

```ts
export type PoolId = 'gastro' | 'respiratory' | 'fever' | 'skin' | 'other';

export const POOLS: Record<PoolId, {
  label: string;         // "Stomach illness"
  blurb: string;         // "Vomiting, loose motions, stomach pain"
  symptoms: Symptom[];
  colour: string;        // token for the heat ramp
}>;

export function poolFor(symptoms: Symptom[]): PoolId;   // highest-overlap pool, 'other' on tie/none
```

### Symptom vocabulary — extend it

Current list is gastro-only. Add to `lib/db/types.ts`:

```
cough · sore_throat · body_ache · rash · itching · breathlessness · runny_nose
```

Keep existing: `vomiting · loose_motions · stomach_pain · nausea · fever · headache · weakness · dehydration`

### Pool mapping

- **gastro** — vomiting, loose_motions, stomach_pain, nausea, dehydration
- **respiratory** — cough, sore_throat, runny_nose, breathlessness
- **fever** — fever, body_ache, headache, weakness
- **skin** — rash, itching
- **other** — anything unmatched

Persist `pool` on both `consultations` and `self_reports` (add the column to `db/schema.sql` and the
row types). Compute on write, do not derive on read — a student's pool must not change if the
mapping is later tuned.

**Acceptance:** reporting `vomiting + nausea` puts the student in `gastro` and their heatmap shows
gastro spread only.

---

## 4. Report weighting — doctor over student

Already conceptually present; make it explicit and visible.

`lib/domain/weighting.ts`:

```ts
export const WEIGHT = { doctor: 1.0, self: 0.4 } as const;
```

Lower `self` from the current implicit parity to **0.4**. Rationale to put in the code comment: a
clinician examined the patient; a student tapped a form. Four self-reports should carry roughly the
weight of one examined case, which is what stops a rumour in a WhatsApp group from tripping an alarm.

`ClusterSignal.cases` becomes a **weighted** figure internally, but the UI keeps showing whole
people — *"16 students"*, never *"11.2 weighted cases"*. Add `rawCases` alongside `weightedCases` in
`Hotspot` and render `rawCases`.

**Acceptance:** ten self-reports in one block produce a lower risk level than four doctor
consultations in the same block.

---

## 5. Notifications

Two layers. Ship the first; the second is the demo showpiece.

### 5.1 In-app feed — guaranteed to work

New table `notifications`:

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

When a warden sends an advisory (`POST /api/alerts`, already exists), fan out one `notifications` row
per student in the cohort. The advisory already computes `recipients` — reuse that selection.

UI: a bell in the student app header with an unread count, and `/app/alerts` listing them.

### 5.2 Web Push — the "it's on my phone" moment

- Generate VAPID keys, store in env (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY`).
- `public/sw.js` — service worker handling `push` and `notificationclick`.
- `POST /api/push/subscribe` — store the `PushSubscription` against the student.
- On advisory send, push to every subscription in the cohort.
- Library: `web-push`.

**Reality check to design around:** Web Push works on Android Chrome immediately. **On iOS it only
works if the site is installed to the home screen first** (Add to Home Screen), and only iOS 16.4+.
So the demo script must be: *install the PWA, then trigger the alert.* Build the install prompt in
§6 before wiring push, and put a one-line hint on the alerts screen when `Notification.permission`
is `default`.

### 5.3 Demo trigger

The judge needs to see this fire on cue. On the warden dashboard, the existing **Send advisory**
button is the trigger — no separate demo mode. But add `/api/alerts/test`:

```
POST /api/alerts/test { studentId }
```

which sends one notification to one student immediately, so the flow can be rehearsed without
touching real cluster state.

**Acceptance:** a phone with the PWA installed and notifications allowed receives a banner within a
few seconds of the warden pressing Send advisory.

---

## 6. Mobile — the app in a judge's hand

This is a **PWA**, not a native build. No app store, no review, no signing. A judge scans a QR code,
taps Add to Home Screen, and has an icon.

### 6.1 PWA setup

- `app/manifest.ts` — Next 16 supports a typed manifest route. `display: 'standalone'`,
  `theme_color`, `background_color`, icons at 192/512 (maskable variants too).
- `public/sw.js` registered client-side; cache the shell, network-first for `/api/*`.
- iOS meta tags in `app/layout.tsx`: `apple-mobile-web-app-capable`,
  `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`.
- An **Install** prompt component that captures `beforeinstallprompt` on Android and shows the manual
  Share → Add to Home Screen instruction on iOS (where the event never fires).

### 6.2 A QR code on the dashboard

Put a QR pointing at the deployed URL on `/` and on the warden dashboard. A judge scans it and is in.
Use a tiny inline SVG QR generator — do not pull a heavy dependency for one code.

**Acceptance:** on a real Android phone, the site installs to the home screen, opens without browser
chrome, and receives a push notification.

---

## 7. The student app — `/app`

**A student must never see campus case counts.** This is the whole reason for a separate surface.

```
/app            home — my status, general heat view, report button
/app/report     symptom self-report (mobile-first, the existing 3-step flow)
/app/pool       heatmap for MY pool — only after I have reported
/app/alerts     notification feed
```

### What a student sees

| Shown | Hidden |
|---|---|
| A general risk view of campus — coloured blocks, no numbers | Exact case counts anywhere |
| Their own pool's heat spread, **after** they report | Doctor-confirmed vs self-reported splits |
| Advisories addressed to them | Other students' reports, rooms, or names |
| "Your block is showing more illness than usual" | Which specific block is worst campus-wide |
| Their own report history | The suspect-meal analysis |

The general view uses **risk level only** — a block is tinted by `RiskLevel`, with no count, no
comparison sentence, no confidence. `SituationReport` must not be sent to the student client at all.
Add a separate builder:

```ts
// lib/domain/student-view.ts
export function buildStudentView(studentId: string): StudentView;

export interface StudentView {
  myBlock: { name: string; level: RiskLevel } | null;
  campus: { blockId: string; name: string; level: RiskLevel }[];   // level ONLY
  myPool: PoolId | null;
  poolHeat: { blockId: string; level: RiskLevel }[] | null;        // null until they report
  advisories: NotificationRow[];
  myReports: { id: string; reportedAt: string; pool: PoolId; symptoms: Symptom[] }[];
}
```

**Acceptance:** the network tab on `/app` contains no case counts. Search the JSON response for
`caseCount`, `doctorConfirmed`, `totalCases` — all absent.

### 7.1 Widget access — the refactor

The ask was "easier to access". Concretely:

- **Bottom tab bar** on mobile (`Home · Report · Alerts · Me`), fixed, thumb-reachable. Replace the
  top nav on `/app/*` at `<md`.
- **One-tap report**: a persistent floating action button on `/app` opening the report flow.
- **Touch targets ≥ 44px.** The current symptom chips are ~36px.
- **Reduce the report to 2 steps** for logged-in students — identity comes from the session, so
  step 1 (who are you) disappears entirely. This is the single biggest usability win in the plan.

---

## 8. Real map imagery

Replace the isometric SVG on the warden dashboard with real satellite imagery.

### 8.1 Library and tiles

- **`react-leaflet` + `leaflet`.** No API key, unlike Mapbox and Google.
- Satellite: **Esri World Imagery** —
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
  (attribution required: *Esri, Maxar, Earthstar Geographics*).
- Light basemap alternative: **CARTO Positron**. Offer a toggle.
- MUJ campus centre ≈ `26.8434, 75.5652`, sensible default zoom 17.

### 8.2 Heat rendering

Do **not** use a generic heatmap plugin — the data is per-block, not per-point. Render each block as
a `CircleMarker` (or a `Polygon` once real footprints are traced), radius scaled by occupancy,
fill by `RiskLevel`, with the same pulse treatment as today for anything above `normal`. Keep the
existing legend and hover card.

### 8.3 Block placement editor — `/admin/map`

The coordinates in `campus.ts` are approximations and will look wrong on real imagery. Build a small
editor so a human can fix them in five minutes:

- Satellite map, one draggable marker per block, labelled.
- Drag → updates lat/lng in local state.
- **Save** → `POST /api/campus/blocks` persisting coordinates.
- **Export** → dumps a TypeScript snippet to paste back into `campus.ts`, so the corrected positions
  survive a database reset.
- Optional and worth it if time allows: a polygon draw tool so blocks become real building footprints
  rather than circles.

Store coordinates in the `blocks` table (`lat`, `lng` columns already exist) and have `campus.ts`
read from the DB with the hardcoded values as fallback.

**Acceptance:** blocks sit on actual buildings in satellite view, and a dragged marker survives a page
reload.

---

## 9. Ticket system — the performance fix

The meal-attendance logic is correct; it is just O(blocks × meals × attendance).

In `lib/db/mock.ts`, build indexes once at seed time:

```ts
attendanceByMeal:    Map<string, Set<string>>;   // mealId    → studentIds
attendanceByStudent: Map<string, string[]>;      // studentId → mealIds
```

Then `getMealAttendees()` is a Map lookup instead of a 59,659-row filter, and `getMealsEatenBy()`
stops scanning. Also hoist `rankMeals()`'s campus-wide portion out of the per-block loop —
it recomputes the same meal set 19 times.

**Acceptance:** `buildSituationReport()` drops from ~397ms to under 50ms. Measure it; do not assume.
A throwaway script like the one used to find this is enough:

```ts
const t = Date.now(); buildSituationReport(); console.log(Date.now() - t);
```

### 9.1 Make tickets visible

The mess scan data is invisible in the UI even though it drives the food analysis. On the block
detail page add a small panel: *"Mess attendance in the last 72h"* — meals served, plates collected,
and the current suspect meal if any. It costs little and makes the food-vs-water reasoning legible.

---

## 10. Implementation order

Each phase should end green: `npm run typecheck && npm run build`, and the routes still 200.

| Phase | Work | Why this order |
|---|---|---|
| **1** | §1 registration format · §9 ticket perf | Pure data-layer, no UI risk, unblocks everything else. Fast win. |
| **2** | §2 auth + `/login` | Everything downstream needs a session. |
| **3** | §3 pools · §4 weighting | Schema + domain changes, still no new screens. |
| **4** | §7 student app `/app` | The biggest new surface. Depends on 2 and 3. |
| **5** | §5.1 in-app notifications | Needs the student app to display them. |
| **6** | §6 PWA + install prompt | Must precede push — iOS requires install first. |
| **7** | §5.2 Web Push | The demo showpiece. Depends on 6. |
| **8** | §8 real map + placement editor | Independent of everything else; can slip without breaking the demo. |
| **9** | §7.1 widget refactor + polish | Last, once the surfaces exist. |

**If time runs short, cut in this order:** §8.3 polygon footprints → §8 map entirely (the isometric
view is genuinely good) → §5.2 push (in-app feed still demos the concept).

**Never cut:** auth, the student/warden separation, or the in-app notification feed. Those three are
what the pitch claims.

---

## 11. Demo script this must support

Rehearse against this. If any step needs explaining, the UI is wrong.

1. Judge scans the QR on the dashboard, installs the PWA, allows notifications.
2. Logs in as the demo student (`2502050001` / one tap).
3. Sees a calm campus — coloured blocks, **no numbers**.
4. Reports symptoms: vomiting, nausea, started this morning. Two taps and a submit.
5. Is placed in the **stomach illness** pool, and can now see that pool's spread.
6. Presenter switches to the warden dashboard on the laptop. B4 is critical.
7. Warden opens B4, sees the floor breakdown and the failed tank test, presses **Send advisory**.
8. **The judge's phone buzzes.** *"Suspected outbreak near you — Block B4."*
9. Judge opens it, reads the advisory scoped to their block.
10. Presenter points out: if that judge now reports symptoms, the report is flagged
    `after advisory` and **excluded from the assessment** — a warning cannot manufacture the
    evidence for the next warning. That mechanism already exists and works.

---

## 12. Things not to do

- Do not add a charting library. Recharts is already here.
- Do not add a state manager. Server components plus `useState` cover this.
- Do not re-introduce filter-level water modelling.
- Do not surface p-values, attack rates, or likelihood ratios in any UI.
- Do not send a notification from any automated path. A human presses the button.
- Do not run `create-next-app`.
- Do not show a student another student's data, room number, or exact campus case counts.

---

## 13. Environment

Nothing new is required to run locally. For push notifications:

```
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

Generate with `npx web-push generate-vapid-keys`. Without them the app must still boot — the push
layer degrades to the in-app feed. Guard the subscribe route and fail soft.

`DATABASE_URL` remains optional; absent it, the seeded in-process store is used.
