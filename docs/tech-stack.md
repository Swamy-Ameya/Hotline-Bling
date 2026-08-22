# Tech stack — Outbreak Radar

Pulled directly from `package.json` and the codebase, not from memory. Ready to paste into a
submission form's "Technologies used" field or onto a slide.

## Frontend

- **Next.js 16** (App Router, Turbopack) — React framework, routing, API layer
- **React 19**
- **TypeScript 5**
- **Tailwind CSS v4**
- **shadcn/ui** + **base-ui** — component primitives
- **Recharts** — the epidemic-curve and permutation-histogram charts
- **Lucide** — icon set
- Fonts: **Plus Jakarta Sans**, **Instrument Serif**, **Geist Mono** (via `next/font/google`)

## Backend

- **Next.js Route Handlers** — `/api/seed`, `/api/detect`, `/api/reports`, `/api/clusters/[id]`
- **PostgreSQL** (Supabase-compatible) via `db/schema.sql` — 8 tables, one self-referencing tree for
  the water/mess resource graph
- In-process deterministic store as a zero-setup fallback when `DATABASE_URL` isn't set, so the app
  runs with no database provisioning

## Detection engine

Plain TypeScript, no framework or database dependency — runs and is testable from a terminal
(`npm run detect:test`).

- **Kulldorff spatial scan statistic** — the same technique behind SaTScan, used by real
  public-health departments, for localising where illness concentrates on the resource graph
- **Monte Carlo permutation testing** (999 replicates) — the answer to the hackathon's Challenge
  Question: how often chance alone produces a cluster this tight
- **Benjamini–Hochberg false discovery rate control** — corrects for testing ~60 nodes every cycle,
  so the system doesn't cry wolf by construction
- **Fisher's exact test** — relative-risk significance on the small-sample 2×2 meal cohort tables
- **Haldane–Anscombe correction** — handles the zero-cell case, which occurs exactly when the
  evidence is strongest (everyone exposed got sick, nobody unexposed did)
- **Stratified re-analysis** — re-runs the meal association with a spatial cluster's own cases
  removed, to catch confounding between shared filters and shared mealtimes

## Tooling

- `tsx` — running TypeScript scripts directly (the engine test harness)
- `ESLint 9`
- Deployment target: **Vercel** (zero-config for this stack; no database required to deploy)

## Runtime

- Node.js 20

## Why no ML / neural network

Stated deliberately, not an omission — see slide 13 of the deck. A single campus produces a handful
of labelled outbreaks a year, which isn't enough to train or validate a model responsibly. The
statistical methods above are fully auditable instead: every alert can be explained to a doctor in
one sentence. The intervention log (`interventions.cause_code`) is what would eventually produce a
real labelled dataset for a v2 model.
