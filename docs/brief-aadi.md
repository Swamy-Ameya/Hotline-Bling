# Brief — Aadi: drill-down, report form, role switcher

Paste everything below the line into Antigravity as your opening prompt.

---

**Project:** Outbreak Radar — an early-warning system for hostel food and water-borne illness.
12-hour hackathon POC at MUJ.

**Read first:** `AGENTS.md` at the repo root. It has the domain model, the frozen data contract, the
visual tokens, and the Next.js 16 breaking changes. Do not skip it — this is Next 16, where `params`,
`searchParams` and `cookies()` are all async. Your dynamic route and your role switcher both depend
on getting that right:

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;      // await it. Not params.id
}
```

**You own:** `app/radar/[id]/`, `app/report/`, `app/page.tsx`.
**Do not touch:** `lib/detect/`, `lib/seed/`, `db/`, `lib/types.ts`, `app/api/`, `deck/`, or
`app/radar/page.tsx` — other people are working in those right now.

**Build against the fixture. Never wait for the engine.**
```ts
import { clusterDetailFixture } from '@/lib/detect/fixture';
const detail = clusterDetailFixture('filter_fault');   // full ClusterDetail, real shape
```

**Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui, Recharts — all installed.
shadcn card, badge, select, table, tabs, separator, input, label, checkbox, textarea and skeleton are
already added. **Do not add another UI or charting library.**

## 1. `/radar/[id]` — cluster drill-down

**The epidemic curve.** Recharts stacked bar chart from `detail.epiCurve`. Buckets are 6 hours wide;
stack the series in `epiCurve.blocks`; draw a `ReferenceLine` at each `mealMarkers[].at`.

This chart is doing real analytical work, not decoration — **a sharp spike means a food point-source,
a smeared multi-day curve means water.** Make the shape legible. Label the axis in local time.

**The 2×2 table** from `detail.mealTable`: ate/didn't × sick/well, with `relativeRisk` shown per meal.
Highlight any row with RR above 4. Caption it so a reviewer understands why the "well" column exists —
you cannot investigate an outbreak using only the people who got sick.

**The verdict block.** Render `cluster.verdict` verbatim as the headline finding, then
`cluster.alternative` beneath it in a quieter style. Never hide the weaker hypothesis.

**The permutation panel — the single most important thing on this screen.** From `detail.permutation`,
draw a histogram of `nullLlrs` and mark `observedLlr` on it. Caption it plainly, e.g.
*"We shuffled these cases at random 999 times. Only 2 shuffles produced a cluster this tight."*
This is our answer to the judged Challenge Question; give it room.

**The case list** from `detail.cases`. Use `studentLabel` as-is — the API has already redacted it for
the viewer's role. Never redact in the UI. Mark any case with `prompted: true` distinctly and note
that prompted reports are excluded from detection.

**The intervention log** from `detail.interventions`, plus a "Log water test" form (TDS, residual
chlorine, turbidity, coliform yes/no, outcome notes). Confirm / dismiss buttons on the cluster itself.

## 2. `/report` — symptom report

Mobile-first. **Must be completable in under 60 seconds** — that is a hard design constraint, not a
nice-to-have. If it is slower than telling a warden, nobody uses it and the whole system has no input.

- Structured symptom multi-select from `SYMPTOM_LABELS` in `lib/types.ts`. Not free text.
- Onset date + time, severity 1–5.
- A checkbox grid of meals eaten in the last 72 hours — this is what makes the 2×2 table possible.
- A role toggle reveals doctor-only fields (diagnosis notes). **Same route** — do not build a separate
  doctor page.
- Submits `CreateReportRequest` to `POST /api/reports` (stub it until the endpoint lands).

## 3. `/` — role switcher

Pick student / doctor / warden from seeded demo accounts, set a cookie, route accordingly. No real
auth — that is deliberately out of scope and declared as such in the deck. Keep it to one clean screen.

## Done when

- The drill-down renders correctly for all four scenarios, including `quiet` where there is no cluster
  at all — handle that empty case deliberately.
- The permutation histogram is legible enough that a stranger understands it without narration.
- The report form is genuinely usable one-handed at 375px.
- `npm run typecheck` passes.
