# Outbreak Radar

**Early warning for food and water-borne illness in college hostels.**
Manipal University Jaipur · Healthcare — Hostel Micro-Outbreak Early Warning System

🔗 **Live:** https://outbreak-radar-iota.vercel.app

---

## The problem

Hostel stomach bugs get noticed on day three, once fifteen or twenty students are ill and somebody
finally connects them.

The information existed on day one. It was just spread across a warden's register, the campus
clinic, the mess complaint book and a floor WhatsApp group — four places, none of which talk to each
other. Four people each see two cases. Nobody sees eight.

## What this does

Puts every symptom report in one place, tagged with where the student lives and what they have
eaten, and watches for illness clustering somewhere it normally would not.

When it finds something, it does not print a statistic. It says:

> **16 reports, where we'd normally expect about 1.**
> 16 students across 4 floors of the same block have reported symptoms. Cases have been trickling in
> over several days, which fits this block's own water supply.
> **Do first:** test the overhead tank for this block and check when it was last cleaned.

A warden can act on that at 11pm without a statistics degree.

---

## How it works

Three inputs, none of which ask anyone to do new work:

| Source | What it gives us |
|---|---|
| **Campus doctor** | Symptoms, onset, diagnosis, prescription — recorded once during the visit. Block, floor and room come from the roster, so nothing is asked twice. |
| **Student self-report** | Thirty seconds on a phone. Catches the people who feel rough but would never walk to the health centre — which is where the day-one head start comes from. |
| **Mess card scans** | Every plate collected is already a scan. Tells us who ate what and when, with nobody typing anything. |

Then we look for things sitting together — same block, same floor, same meal, same few hours — and
compare against what that place normally sees.

### The reasoning that matters

**Illness spread evenly across every floor of one block** points at that block's own overhead tank.
No two blocks share a tank.

**Illness across several blocks at once** cannot be any single tank, so the shared kitchen becomes
the likely explanation.

**Day scholars falling ill too** effectively rules water out — they eat at the mess and drink no
hostel water at all. They are a free control group.

**A meal is only suspicious if the ill ate it more than everyone else did.** "32 of the 46 ill
students ate lunch" sounds damning until you notice three quarters of the hostel eats lunch every
day. We compare against normal turnout, which is what stops a warden being sent to inspect a
perfectly clean kitchen.

---

## Guarantees

These are structural, not aspirational:

- **No automated alerts.** Every advisory is sent by a person. An automated warning fired off
  unverified reports is how you panic a campus at 2am.
- **A warning cannot create its own evidence.** Reports filed by students who were *already*
  warned are flagged and excluded from the assessment. They still count for care and still appear in
  the case list — they just cannot vote on whether an outbreak exists. Otherwise you warn a block,
  the block starts reporting things it would have shrugged off, the cluster appears to grow, and you
  warn harder. A rumour amplifier with a number attached.
- **Students never see the case book.** A student sees a general risk view and — after reporting —
  the spread of their own kind of illness. Never counts, never rooms, never other students.
- **Identities stay with the health centre.** Wardens see totals by block and floor. Never who.
- **A doctor's assessment outweighs a phone form.** A clinician examined the patient. That weighting
  is what stops a handful of self-reports triggering a campus-wide alarm.

---

## Stack

**Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript 5** · **Tailwind v4** ·
**shadcn/ui** · **Recharts** · **PostgreSQL**

Detection logic is plain TypeScript over plain data — no framework, no database handle — which is why
it can be exercised from a terminal before any screen exists.

### Why no machine learning

Deliberate, and worth stating.

A model learns from labelled examples of past outbreaks. A single campus produces a handful a year,
and the ones that matter are exactly the ones nobody labelled. With that little data a model would be
a black box that cannot justify itself, and no warden should shut off a water tank because software
"felt strongly".

So the reasoning is statistical and explainable end to end — every alert can be explained to a doctor
in one sentence. Where ML earns its place is v2: every resolved case logs what maintenance actually
found (`interventions.cause_code`), which is how you build the labelled dataset that does not exist
today.

---

## Running it

```bash
npm install
```

```bash
npm run dev
```

No environment variables and no database required. Without `DATABASE_URL` the app falls back to a
seeded in-process store — roughly 4,900 students, a month of mess menus, card-scan attendance, water
test history, and one situation actually developing right now.

```bash
npm run situation
```

Prints the current campus picture to the terminal — useful for checking detection without a browser.

Other scripts:

```bash
npm run typecheck
```

```bash
npm run build
```

### Connecting a real database

1. Create a Postgres database (Vercel Postgres, Neon and Supabase all work).
2. Run `db/schema.sql` against it once.
3. Set `DATABASE_URL`.
4. Rewrite the function bodies in `lib/db/index.ts` to run SQL instead of reading the mock.

Nothing else changes. No page, component or API route touches storage directly — they all go through
`lib/db`, which is the whole reason it was built that way.

---

## Layout

```
app/
  page.tsx              landing
  radar/                warden dashboard + per-block detail
  doctor/               health centre console
  report/               student self-report
  api/                  situation · reports · consultations · students · alerts · water-tests
lib/
  domain/
    campus.ts           MUJ layout — blocks, floors, tanks, messes
    risk.ts             risk classification, plain language only
    surveillance.ts     reads the DB, returns something a human can act on
  db/                   data access + seeded mock (swap this for Postgres)
components/
  neu/                  neumorphic design system
  radar/                campus heatmap
db/schema.sql           12 tables
docs/BUILD-PLAN.md      what is being built next
```

---

## Status

Working today: warden dashboard, campus heatmap, per-block drill-down, doctor console, student
self-report, advisory sending, and the prompted-report exclusion.

In progress — see [`docs/BUILD-PLAN.md`](docs/BUILD-PLAN.md): student/doctor login, a restricted
student app, sickness pools, push notifications on a real phone, and satellite map imagery with
accurate block placement.

## Scoping assumptions

Stated out loud, because undeclared assumptions are what reviewers punish:

- One uniform batch per meal — no per-vessel granularity.
- Flat baseline rate, no day-of-week seasonality.
- No real authentication. Demo accounts and a role switcher.
- Advisories are database rows plus web push. No SMS gateway.
- Thresholds are a reasonable statistical starting point, not clinically validated. Real deployment
  would want sign-off from a public-health advisor — and the intervention log is designed to produce
  exactly the evidence that validation would need.
