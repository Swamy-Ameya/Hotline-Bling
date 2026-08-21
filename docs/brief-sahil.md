# Brief — Sahil: the radar dashboard

Paste everything below the line into Antigravity as your opening prompt.

---

**Project:** Outbreak Radar — an early-warning system for hostel food and water-borne illness.
12-hour hackathon POC at MUJ.

**Read first:** `AGENTS.md` at the repo root. It has the domain model, the frozen data contract, the
visual tokens, and the Next.js 16 breaking changes. Do not skip it — this is Next 16, where `params`,
`searchParams` and `cookies()` are all async, and writing Next 14/15 patterns from memory will not work.

**You own:** `app/radar/page.tsx` and any components it needs.
**Do not touch:** `lib/detect/`, `lib/seed/`, `db/`, `lib/types.ts`, `app/api/`, `deck/`, or
`app/radar/[id]/` — other people are working in those right now.

**Build against the fixture. Never wait for the engine.**
```ts
import { fixtureFor } from '@/lib/detect/fixture';
import { SCENARIOS, type ScenarioId } from '@/lib/types';
const result = fixtureFor('filter_fault');   // full DetectionResult, real shape
```
At hour 7 this becomes `await fetch('/api/detect')` returning the identical type — a one-line change.

**Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui, Recharts — all installed.
shadcn card, badge, select, table, tabs, separator, input, label, checkbox, textarea and skeleton are
already added. **Do not add another UI or charting library.**

## Build `/radar`

**1. The campus elevation — this is the hero visual of the whole product.**
Blocks as columns, floors as stacked rows within each block, each floor split into its two filter
halves. Read it from `result.elevation`. Floors already arrive highest-first so they render like a
building; do not re-sort them.

- **Colour by `attackRate`, never by `caseCount`.** Five cases on a filter serving forty rooms is
  calmer than three on one serving twelve. Normalise against `elevation.maxAttackRate` and use the
  ramp in AGENTS.md §11.
- The mess renders as **one wide bar spanning underneath all four blocks** — it is shared by every
  student, and drawing it that way is the point.
- Day scholars get their own small tile next to the mess. They drink no hostel tank water, so if they
  are sick the water hypothesis is dead campus-wide.
- Pure CSS grid. No charting library, no 3D, no map.

**2. Flagged nodes.** Any cell with `isFlagged` gets `ring-2 ring-red-500 animate-pulse`.

**3. Cluster cards** from `result.clusters`: name, observed vs expected, p-value, and a status badge
(watch / alert / confirmed). Each links to `/radar/[id]`. An empty array is a valid and correct
result — design a real empty state, do not treat it as an error.

**4. Scenario switcher** across the four entries in `SCENARIOS`. For now just swap the fixture; later
it POSTs to `/api/seed`.

**5. "Run detection" button** with a loading state. For now re-read the fixture; later it POSTs to
`/api/detect`.

**6. The contrast panel — do not skip this, it is the most persuasive thing on the page.**
When `naiveThresholdWouldAlert` is true but the top cluster is only `watch`, show both side by side:
what a naive count-threshold system would have done, versus what we did and why. Render
`result.headline` and `cluster.verdict` verbatim; they are already written for a human.

**7. Privacy rule, non-negotiable.** When a cell has `suppressed: true`, render `<3` — never the
number. A warden who sees "1 case on Floor 2 Filter A" knows exactly who that is.

## Done when

- All four scenarios render visibly differently.
- `filter_fault` lights up Filter 3A in Block B while its sibling 3B stays cold.
- `coincidence` shows a **watch** badge and **not** an alert, with the contrast panel explaining why.
- `quiet` shows a calm, deliberate empty state.
- Holds up at 1280px and never scrolls horizontally on mobile.
- `npm run typecheck` passes.
