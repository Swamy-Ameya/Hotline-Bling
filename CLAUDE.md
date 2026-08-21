# Outbreak Radar — shared ground truth

**Read this before writing any code.** Three people and three different AI agents work in this repo
at the same time. Everything below is already agreed. Do not re-derive it, do not "improve" it, and
do not invent a second version of anything described here.

12-hour hackathon POC. Manipal University Jaipur. Problem statement: *Healthcare — Hostel
Micro-Outbreak Early Warning System*.

---

## 1. What it does, in three sentences

Hostel food and water-borne outbreaks go unnoticed until 15–20 students are sick over 2–3 days,
because complaints scatter across a warden, a clinic and a WhatsApp group and nobody joins them up.
We model the hostel's water and food supply as a graph, attach every symptom report to it, and find
where illness concentrates on it using a spatial scan statistic.

The one thing that makes this different from every other submission: **we answer "is this a real
outbreak or just coincidence?" with a permutation test.** Hold the case count fixed, shuffle the
cases randomly across rooms 999 times, and measure how often chance alone produces a cluster this
tight. Everything else in the repo exists to support that.

---

## 2. Who owns what — DO NOT EDIT OUTSIDE YOUR LANE

| Path | Owner |
|---|---|
| `lib/types.ts` | **FROZEN — nobody edits.** See §4. |
| `lib/detect/`, `lib/seed/`, `db/`, `app/api/` | Aditya (Claude Code) |
| `app/radar/page.tsx` + its components | Sahil |
| `app/radar/[id]/`, `app/report/`, `app/page.tsx` | Aadi |
| `components/ui/` (shadcn primitives) | shared — add freely, never rewrite an existing one |
| `deck/` | Aditya |

Need something outside your lane? Ask in the group chat. Do not edit it yourself.

**Do not run `create-next-app`.** The app is already scaffolded. A second scaffold silently
overwrites the contract files and costs somebody their afternoon.

---

## 3. This is Next.js 16 — your training data is probably Next 14/15

Real breaking changes that will bite you if you write from memory:

**Request APIs are async now.** `params`, `searchParams`, `cookies()` and `headers()` all return
Promises and must be awaited.

```tsx
// app/radar/[id]/page.tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;      // <-- await. Not params.id
}
```

```ts
import { cookies } from 'next/headers';
const cookieStore = await cookies();          // <-- await
const role = cookieStore.get('role')?.value;
```

Also true here: Turbopack is the default dev bundler · Route Handlers are **not** cached by default
(good — `/api/detect` must never be cached) · `middleware` is now `proxy` (we don't use either) ·
React 19.2.

Full details are in `node_modules/next/dist/docs/` if you hit something odd. Read that before
guessing — it is the actual installed version's documentation.

---

## 4. `lib/types.ts` is a frozen contract

Every shape passed between the engine and the UI lives there. It was agreed at hour 1 precisely so
the UI could be built before the engine existed.

- **Never rename or remove a field.** Somebody is rendering it.
- Need a new field? Add it **optional**, and say so in the group chat.
- The UI must never recompute something the engine already returns — render `verdict`, `headline`
  and `studentLabel` verbatim.

## 5. Build against the fixture, never wait for the engine

`lib/detect/fixture.ts` exports hardcoded `DetectionResult` and `ClusterDetail` objects for all four
scenarios, in the exact final shape.

```ts
import { fixtureFor, clusterDetailFixture } from '@/lib/detect/fixture';
const result = fixtureFor('filter_fault');
```

At hour 7 this gets swapped for a real `fetch('/api/detect')`. If the types held, that is a one-line
change per screen. **Nobody is ever blocked on the engine.**

---

## 6. The domain model

```
Main source
├── Mess                        one kitchen, shared by EVERY block + day scholars
│   ├── Filter M1
│   └── Filter M2
├── Tank — Block A              ONE tank per block, feeding all of its floors
│   ├── Floor 1 → Filter 1A | Filter 1B      two filters per floor,
│   ├── Floor 2 → Filter 2A | Filter 2B      each serving a different room range
│   └── Floor 3 → ...
└── Tank — Block B ...          one branch per block
```

Four blocks, five floors each, two filters per floor, ~600 students, plus day scholars.

**Why the shape matters.** No two blocks share a tank, but every student shares the mess. A cluster
confined to one block points at that block's own water; a cluster spread across blocks points at the
shared mess. Localisation means finding the node where the excess concentrates *while its siblings
stay normal* — Filter 2A hot, 2B cold, floors 1 and 3 cold means it is the filter, not the tank.

**Day scholars are a free control group.** They eat at the mess and drink no hostel tank water. If
day scholars are sick, the water hypothesis is near-eliminated campus-wide.

---

## 7. Three rules that are not negotiable

**Attack rate, never raw counts.** Five cases on a filter serving forty rooms is *calmer* than three
on one serving twelve. Always divide by `exposedPopulation`. Colour the elevation view by
`attackRate`.

**Suppress cells below 3 cases.** A warden who sees "1 case on Floor 2 Filter A" knows exactly who
that is. When `suppressed` is true render `<3` — never the number. India's DPDP Act 2023 makes health
data sensitive personal data, and this is the cheapest honest response to it.

**A human confirms before anything notifies a student.** `watch` never notifies. `alert` sits in a
queue waiting for a warden. Only `confirmed` sends an advisory. Automated public-health alerts off
unverified data is how you panic a campus.

---

## 8. How detection works

1. Assemble **unprompted** cases from the trailing 7 days. Weight doctor 1.0, self-report 0.6.
2. Baseline per node: rolling 14-day mean of weighted cases ÷ exposed population.
3. Spatial scan over every node × window {48h, 72h}; Kulldorff log-likelihood ratio; take the max.
4. **Permutation test** — 999 replicates redistributing cases ∝ occupancy → `pSpatial`.
5. Cohort scan — 2×2 per meal → relative risk. Onset spread → median incubation, curve width.
6. Arbitrate water vs food. Report the stronger, keep the weaker visible in `alternative`.
7. Benjamini–Hochberg at q = 0.10 → `watch` / `alert` / `confirmed`.

A sharp onset curve means food; a smeared one means water. That is a second, near-independent line of
evidence, which is why the epi curve is a first-class visual and not decoration.

`naiveThresholdWouldAlert` says what a dumb count-threshold system would have done with the same data.
In the `coincidence` scenario it is `true` while our own verdict is only `watch`. **Render that
contrast** — it is the single most persuasive thing on the dashboard.

---

## 9. The four scenarios

| id | what it is | correct behaviour |
|---|---|---|
| `quiet` | five scattered unrelated upsets | system stays silent |
| `filter_fault` | 9 cases / 48h under one floor filter, smeared onset | localises to Filter 3A, p ≈ 0.002 |
| `food` | 14 cases across 3 blocks **and day scholars**, sharp onset | localises to Tuesday dinner, RR ≈ 7 |
| `coincidence` | 7 cases landing in one block **purely by chance** | **watch, not alert**, p ≈ 0.31 |

If `quiet` or `coincidence` ever raises an alert, something is broken. Those are the two most
important assertions in the entire build.

---

## 10. Declared scoping assumptions

Stated out loud in the deck, because reviewers punish undeclared assumptions and respect declared ones.

- One uniform batch per meal — no per-vessel or per-counter granularity.
- Flat baseline rate, no day-of-week seasonality.
- No real auth. Seeded demo accounts and a role switcher.
- Advisories are database rows rendered in-app. No SMS, no push infrastructure.

---

## 11. Visual language

Two people build two screens; without this they end up looking like two different apps.

**Warm colours mean risk and nothing else.** All chrome, navigation and buttons are cool or neutral.
If something on screen is orange or red, it is because people are sick there.

Attack-rate ramp, normalised against `elevation.maxAttackRate`:

| share of max | class |
|---|---|
| 0 | `bg-zinc-100 dark:bg-zinc-800` |
| ≤ 0.25 | `bg-amber-100 dark:bg-amber-950` |
| ≤ 0.50 | `bg-amber-300 dark:bg-amber-800` |
| ≤ 0.75 | `bg-orange-400 dark:bg-orange-700` |
| > 0.75 | `bg-red-500 dark:bg-red-600` |

- Flagged node: `ring-2 ring-red-500 animate-pulse`
- Status badges — watch `bg-zinc-200 text-zinc-900` · alert `bg-amber-500 text-white` ·
  confirmed `bg-red-600 text-white` · resolved `bg-emerald-600 text-white`
- Radius `rounded-lg`; cards `border border-zinc-200 dark:border-zinc-800`
- Numbers use `tabular-nums`
- Page container `max-w-7xl mx-auto px-6 py-8`

Dark mode via Tailwind `dark:` throughout. Do not add a theme switcher.

---

## 12. Stack and commands

Next.js 16 App Router · TypeScript · Tailwind v4 · shadcn/ui · Recharts. **Do not add another UI or
charting library.**

```bash
npm run dev           # http://localhost:3000
npm run detect:test   # run the engine over all four scenarios, terminal only
npm run build         # must pass before the final deploy
```

**Database.** Supabase Postgres when `DATABASE_URL` is set in `.env.local`; otherwise the app falls
back to a deterministic in-memory store so it runs with zero setup. Schema is `db/schema.sql` — paste
it into the Supabase SQL editor once. Do not write raw SQL inside components.

---

## 13. Git

Everyone commits to `main`. **`git pull --rebase` before every push.** No PRs, no feature branches —
at this timescale the ceremony costs more than it saves, and the ownership map in §2 means you will
barely collide.

Push small and push often. The real failure mode here is not a merge conflict; it is an agent
rewriting a file you have not pushed in two hours.

Hard sync points at hours 4, 7 and 9: everyone pushes, everyone pulls, five minutes out loud on what
changed.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
