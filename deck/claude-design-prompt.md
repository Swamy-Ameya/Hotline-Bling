# Claude Design brief — Outbreak Radar submission deck

Paste the block below into Claude Design. It is written cold: it assumes the reader knows nothing
about the project, so every number and claim it needs is already in the text.

**Build it in two passes.** Ask for slides 1–11 first, review, then ask for 12–21 on the same canvas.
Twenty-one artboards in one shot produces rushed layouts.

---

## PASTE FROM HERE

Build me a 21-slide pitch deck as a canvas of 16:9 artboards. This is a submission deck for a
national student hackathon — judges read it alone, on a screen, with nobody presenting. Every slide
must stand on its own.

### What the project is

**Outbreak Radar** — an early-warning system for food and water-borne illness outbreaks in Indian
college hostels, built for Manipal University Jaipur.

The problem: outbreaks go unnoticed until 15–20 students are sick over 2–3 days, because complaints
scatter across a warden's register, a campus clinic, a mess complaint book and a floor WhatsApp
group, and nobody joins them up.

Our approach: model the hostel's water and food supply as a graph, attach every symptom report to
it, and find where illness concentrates using a spatial scan statistic borrowed from real
public-health practice.

**The single idea the whole deck must land:** the hackathon asks *"how would your system tell a
genuine outbreak from a handful of unrelated stomach upsets that cluster by coincidence?"* Our answer
is a **permutation test** — we hold the case count fixed, shuffle the cases randomly across rooms 999
times, and measure how often chance alone produces a cluster that tight. Everything else supports
that one idea.

**This is not a concept. A working prototype exists**, with a live detection engine, four demo
scenarios and 47 automated tests passing. Say so wherever it is relevant — most competing
submissions will be slideware.

### Design direction

- Clean, confident, data-forward. Think a public-health agency dashboard, not a startup pitch.
- **Warm colours mean risk and nothing else.** Amber and red appear only where people are sick. All
  chrome, headers, navigation and structural elements are cool neutrals — slate, zinc, deep navy.
  This rule is doing real work: it should be instantly readable which parts of any diagram mean
  danger.
- Dark background with light type, or light with dark — pick one and hold it across all 21.
- Numbers are the hero. Big, tabular, confident. Every statistic on these slides is real output from
  the running system, so let them carry weight.
- Every slide title is a **claim, not a label**. "Water Distribution Model" is wasted; "One tank per
  block means a block-confined cluster can only be that block's water" is a slide a judge can score
  from the title alone.
- Diagrams annotate themselves with inline callouts. Never a legend the reader has to cross-reference.
- Generous whitespace. Body text sparse — assertion, diagram, then two to four supporting lines.

### The six required sections

The judging rubric has six fixed headings. Include a slim section-divider slide before each so the
scorer can find them instantly. The headings are: **1. Problem Definition · 2. Proposed Solution ·
3. Technical Solution · 4. Feasibility & Viability · 5. Impact & Benefits · 6. Research & Validation.**

---

## SECTION 1 — PROBLEM DEFINITION

**Slide 1 — Title**
"Outbreak Radar — we find the contaminated filter before the twentieth student gets sick."
Subtitle: Early warning for food and water-borne illness in college hostels.
Include placeholders: Team name · Problem Statement ID · Theme: Healthcare · Manipal University Jaipur.
A restrained hero visual — a hostel elevation grid with one cell glowing red.

**Slide 2 — "By the time anyone notices, twenty students are already sick"**
A horizontal timeline, Day 0 → Day 3:
- Day 0: first two students fall ill. Neither goes to the clinic.
- Day 1: four more. Two mention it to a warden, one posts in a floor WhatsApp group.
- Day 2: the clinic sees its third case and starts to wonder.
- Day 3: 15–20 sick. Someone finally connects them.
Mark clearly where our system fires: **Day 0–1**. Annotate the gap between the two as
"the blind window — 48 to 72 hours."

**Slide 3 — "Four people each see two cases. Nobody sees eight."**
Four disconnected boxes, no lines between them: Warden's register · Campus clinic notes · Mess
complaint book · Floor WhatsApp group. Each holds a small "2 cases" tag. Beneath, one line:
*The data already exists on Day 0. It has never been in the same place.*
The point of the slide is the absence of connections — make that visually obvious.

---

## SECTION 2 — PROPOSED SOLUTION

**Slide 4 — "We turn the hostel's plumbing into a diagnostic tree"**
The core idea, stated plainly. Every symptom report attaches to a room; every room rolls up through a
filter, a floor, a tank. Find the node where illness concentrates while its siblings stay normal, and
you have named the thing to go fix.

**Slide 5 — "One tank per block, two filters per floor — the plumbing is the diagnostic tree"**
The hero diagram of the deck. Draw the real hierarchy:

```
Main source
├── Mess  (one kitchen — shared by EVERY block and by day scholars)
│   ├── Filter M1
│   └── Filter M2
├── Tank — Block A   (one tank feeding all five floors)
│   ├── Floor 1 → Filter 1A | Filter 1B     (each serves a different room range)
│   ├── Floor 2 → Filter 2A | Filter 2B
│   └── Floors 3–5 …
├── Tank — Block B
├── Tank — Block C
└── Tank — Block D
```

Draw the mess as a wide bar spanning underneath all four blocks — it is shared by everyone, and
drawing it that way is the entire point. Callouts:
- "No two blocks share a tank → a block-confined cluster can only be that block's water."
- "Everyone shares the mess → a cluster spread across blocks points here instead."
- "Two filters per floor is the finest resolution we can localise to — it is what lets us tell a
  warden which cartridge to replace."

**Slide 6 — "Every report carries two lineages: where they drink, and what they ate"**
One symptom report in the centre. Two paths out of it:
- Water lineage: Room 314 → Filter 3A → Floor 3 → Tank B → Main source
- Food lineage: mess ticket → Friday lunch → the batch everyone was served
Caption: *We never let geography pick the answer. Both hypotheses are scored on every cluster.*

**Slide 7 — ★ "How we know it isn't coincidence: we shuffle the cases a thousand times"**
**This is the most important slide in the deck. Give it the most design effort.**

Left: the observed board — nine cases piled under one filter.
Middle: the same nine cases scattered at random across the campus, three or four small ghosted
boards suggesting 999 repetitions.
Right: a histogram of "best cluster found by chance" across those 999 shuffles, with the observed
cluster marked far out in the right tail.

The caption, verbatim:
*We hold the number of cases fixed, scatter them at random across rooms in proportion to how many
people live there, and re-run the whole search. 999 times. Then we ask where the real cluster falls.*
*Filter 3A: 1 shuffle in 999 beat it. p = 0.001.*
*Block C, seven cases: 336 shuffles in 999 beat it. p = 0.336 — we stay quiet.*

Footnote: this is a simplified **Kulldorff spatial scan statistic**, the method behind SaTScan, used
by real public-health departments.

**Slide 8 — "A threshold system raises three false alarms a day before anyone is sick"**
The argument that separates us from every other submission. Show the arithmetic as a visual:
**61 nodes tested every cycle × 5% false-positive rate ≈ 3 false alarms per run.**
Then: we correct for it with a **Benjamini–Hochberg false discovery rate** procedure at q = 0.10.
Caption: *A count threshold has no concept of coincidence. That is not a tuning problem — it is the
wrong tool.*

**Slide 9 — "Four scenarios, four correct answers"**
A four-column comparison table. Real output from the running system:

| | Quiet baseline | Filter fault | Food batch | Coincidence trap |
|---|---|---|---|---|
| What happened | 5 scattered upsets | 9 cases under one filter | 19 cases, one meal | 7 cases, one block, by chance |
| Naive threshold | quiet | alerts | alerts — blames Block C | **alerts** |
| Outbreak Radar | **silent** | **Filter 3A, Block B** | **Friday lunch** | **holds at watch** |
| Evidence | — | p = 0.001 | RR 21.1, p = 0.0002 | p = 0.336 |

Highlight the last column hard. Add a callout on the food column: *the naive system blames a
residential block. The actual cause is the shared mess.*

Note for the designer: in the coincidence scenario **nothing is injected** — it is pure background
noise where one block happened to collect unrelated cases. That honesty is worth a small callout.

---

## SECTION 3 — TECHNICAL SOLUTION

**Slide 10 — "One web app, three roles, one database"**
System architecture diagram, left to right:
- **Inputs**: student self-report (phone) · doctor intake at the campus clinic · mess ticket system ·
  hostel infrastructure config
- **Application**: Next.js 16 App Router, React 19, three role-scoped views (student / doctor / warden)
- **API**: `/api/reports` · `/api/detect` · `/api/clusters/[id]` · `/api/seed`
- **Detection engine**: pure TypeScript, no framework dependency, terminal-testable
- **Store**: PostgreSQL — 8 tables, one self-referencing tree for the resource graph
- **Outputs**: the radar dashboard · cluster drill-down · scoped advisories · intervention log

Callout: *the engine is pure functions over plain arrays — no database handle, no React. That is why
we can prove the whole pipeline from a terminal before any screen exists.*

**Slide 11 — "The detection pipeline, seven steps"**
A vertical process flow. Do not simplify these — the specificity is the credibility:
1. **Assemble** unprompted cases in the window. Weight a doctor's diagnosis 1.0, a self-report 0.6.
2. **Baseline** per node, from history strictly outside the window, so an active outbreak cannot
   inflate its own baseline.
3. **Spatial scan** — Kulldorff log-likelihood ratio across all 61 nodes × two time windows.
4. **Permutation test** — 999 replicates → a p-value.
5. **Cohort scan** — a 2×2 contingency table per meal → relative risk, Fisher's exact test.
6. **Arbitrate** water against food. Report the stronger, keep the weaker visible.
7. **FDR correction** → the watch / alert / confirmed ladder.

Annotate step 4 as *the answer to the Challenge Question* and step 7 as *a human confirms before
anything reaches a student.*

**Slide 12 — "Students who share a filter also share a mealtime"**
The most technically impressive slide after the permutation one. Real behaviour from the system:

When a genuine water cluster is found, an unrelated breakfast also shows a relative risk of 6.1 —
because the same nine students share both a filter and a mealtime. A naive system would send
maintenance to inspect a kitchen.

Our engine re-runs the meal analysis **with the cluster's own cases removed** (a stratified
analysis). The association collapses to RR 4.8 at p = 0.16. The system then says so in plain
language rather than pretending the food signal was weak.

Show it as a before/after pair of 2×2 tables with an arrow between them.

**Slide 13 — "Why there is no neural network here, and where one would go"**
Judges will look for AI. Answer it head-on and confidently:

*Supervised learning needs labelled outbreaks. A campus produces a handful per year, and the ones
that matter are the ones nobody labelled. With fifteen cases and no training set, a deep model would
be a black box that cannot justify itself — and no warden should shut off a water tank because a
neural network felt strongly.*

*We use unsupervised statistical learning instead: spatial scan statistics, Poisson likelihood ratio
tests, Monte Carlo inference, and false-discovery-rate control. Every alert is fully auditable, and
every number can be explained to a doctor.*

*Where ML earns its place is v2: our intervention log records what maintenance actually found, which
is how you generate the labelled dataset that does not exist today. Once there are a few hundred
resolved clusters with confirmed causes, a supervised model becomes both possible and defensible.*

Technologies list: TypeScript · Next.js 16 · React 19 · PostgreSQL · Tailwind · Recharts · Kulldorff
spatial scan statistic · Monte Carlo permutation inference · Benjamini–Hochberg FDR · Fisher's exact
test · Haldane–Anscombe correction.

**Slide 14 — "Eight tables carry the entire model"**
A clean entity-relationship diagram: `infra_nodes` (self-referencing tree) · `users` ·
`symptom_reports` · `mess_menu` · `mess_tickets` · `clusters` · `advisories` · `interventions`.

Highlight three columns and say why each exists:
- `infra_nodes.exposed_population` — *the denominator. Five cases across forty rooms is calmer than
  three across twelve.*
- `symptom_reports.prompted_by_advisory_id` — *reports from students we already alerted are excluded
  from detection, so an advisory cannot manufacture its own evidence.*
- `interventions.cause_code` — *ground truth. This is how the system learns whether it was right.*

**Slide 15 — "Already built and running"**
Implementation status, with screenshot placeholders (four boxes, clearly marked for images):
the radar dashboard · the cluster drill-down with the permutation histogram · the epidemic curve ·
the mobile report form.
Beneath: **47 automated tests passing · 4 demo scenarios · full detection engine live.**
Include a placeholder for a live URL and a QR code.

---

## SECTION 4 — FEASIBILITY & VIABILITY

**Slide 16 — "Every input we need already exists on campus"**
Four feasibility panels:

**Technical** — Built. The engine runs, the tests pass, the UI is live. No exotic dependencies, no
GPU, no model training. Detection over a 750-student campus completes in under a second.

**Operational** — The doctor already keeps a paper register; we replace it with a 30-second form. The
mess already issues tickets. Maintenance already tests water. Onboarding is a one-time configuration
of which filter serves which rooms — the kind of thing facilities staff already know.

**Financial** — A web app on managed Postgres. No per-user licence, no hardware, no field devices.
Running cost for one campus is in the order of a few thousand rupees a month. Set against the cost of
a single unmanaged outbreak — twenty-plus clinic visits, possible hospitalisation, disrupted exams,
and the reputational damage of a story that reaches parents.
*(TEAM: put a verified figure here before submitting.)*

**Market** — India has thousands of universities and tens of thousands of colleges, and a large share
of their students live in hostels or PGs. Any institution with a mess, a clinic and a student roster
can deploy this unchanged.
*(TEAM: cite AISHE for the exact institution and enrolment figures — do not guess.)*

**Slide 17 — "What could go wrong, and what we did about it"**
A risks-and-mitigations table. Do not soften these; a judge trusts a team that names its own weak
points:

| Risk | Mitigation |
|---|---|
| Students file false reports | Identity-linked accounts, one report per day, a doctor's case outweighs a self-report, and corroboration is required before any escalation. Gaming produces *diffuse* reports, which the spatial scan actively down-weights. |
| An advisory causes a reporting spike that looks like a worsening outbreak | Reports from already-notified students are flagged and excluded from the statistic. Built in from day one. |
| Health data is sensitive under the DPDP Act 2023 | Doctors see identities. Wardens see aggregates only. Any cell with fewer than three cases is suppressed, because a warden reading "1 case, Floor 2, Filter A" already knows the name. |
| A false alarm shuts off a water tank needlessly | No alert reaches a student without a human confirming it. `watch` never notifies anyone. |
| Our thresholds have not been clinically validated | True, and we say so. Real deployment needs an epidemiology advisor. The intervention log is designed to produce the ground-truth data that would validate them. |
| Private PGs have no roster, clinic or mess data | V1 targets institutions that already have all three. PGs come later, in a self-report-only mode with weaker guarantees. |

---

## SECTION 5 — IMPACT & BENEFITS

**Slide 18 — "From three days to the same afternoon"**
The efficiency case as a single strong before/after visual.
Before: 2–3 days, 15–20 students affected, cause usually never identified.
After: flagged within hours of the third case, localised to a specific filter or a specific meal,
with an advisory scoped to the affected rooms rather than a panicked all-campus notice.
Add: *the clinic only sees people on day two, once they have decided they are properly sick. The
self-report channel exists to catch the sub-clinical tail — the students who feel rough and never
visit. That tail is where the head start comes from.*

**Slide 19 — "Four kinds of bias, four deliberate corrections"**
A strong section for us — make it a clean 2×2 grid:
- **Reporting bias** — an advisory prompts reports that inflate the cluster. → prompted reports are
  excluded from the statistic.
- **Population bias** — big filters look dangerous simply because more people use them. → attack
  rates, never raw counts.
- **Multiple-comparison bias** — testing 61 nodes guarantees false positives. → Benjamini–Hochberg
  FDR control.
- **Confounding** — shared filters mean shared mealtimes. → stratified re-analysis with the cluster's
  own cases removed.

**Slide 20 — "Scales down to one hostel and up to a state"**
- **Scalability**: the model is a tree plus a case stream. Add a block, add a campus, add a district —
  the mathematics does not change. Detection is sub-second at campus scale.
- **Accessibility**: mobile-first, works on a low-end phone, a report takes under sixty seconds, and
  the symptom picker is structured rather than free text so it does not depend on the student's
  vocabulary or English fluency.
- **Generality**: the engine is *shared-resource graph + case stream + scan statistic*. Food and
  water is the first instantiation. The same machinery would find an AC-borne respiratory cluster by
  wing or a laundry-borne skin cluster by machine. **One line only — do not oversell this.**

---

## SECTION 6 — RESEARCH & VALIDATION

**Slide 21 — "Standing on established public-health method"**
A clean reference slide, grouped. These are real; keep the wording accurate:

**Precedent**
- John Snow, 1854 — the Broad Street cholera investigation. Cases traced back through a shared
  resource to a single pump. This is the same idea with a database behind it.

**Methods we implement**
- Kulldorff, M. (1997), *A spatial scan statistic*, Communications in Statistics. The basis of
  SaTScan, used by public-health departments for cluster detection.
- Benjamini, Y. & Hochberg, Y. (1995), *Controlling the false discovery rate*, JRSS-B.
- Fisher's exact test, for the small-count 2×2 contingency tables outbreak work actually produces.
- Haldane–Anscombe correction, for zero cells — which occur precisely when the evidence is strongest.

**Systems we take design cues from**
- WHO EWARS — early warning, alert and response in humanitarian settings.
- CDC BioSense / NSSP — national syndromic surveillance, combining clinical and community signals.
- CDC EARS — aberration detection against a rolling baseline.

**Clinical reference used for incubation-period reasoning**
- CDC foodborne illness incubation tables: *S. aureus* and *B. cereus* toxin 1–6h · *Salmonella* and
  *C. perfringens* 6–72h · norovirus 12–48h · waterborne agents such as typhoid, hepatitis A and
  giardia, days to weeks.
- This is what lets onset spread discriminate cause: **a sharp curve means food, a smeared one means
  water.**

Add a closing line: *We validate against ground truth we generate ourselves — every resolved cluster
records what maintenance actually found, which is how the thresholds get honest over time.*

## PASTE UNTIL HERE

---

# What the team still has to do

**1. Screenshots — blocked on the API swap.** `/radar` and `/radar/[id]` still import `fixtureFor()`.
Once they call `POST /api/detect` instead, the four scenarios become live and the screenshots are
real system output rather than mock data. Slide 15 needs four; slides 7 and 12 are stronger with one.

**2. Verify two numbers before submitting.** The financial figure on slide 16 and the market figures
on slide 16. Cite AISHE for institution and enrolment counts. **Do not let anyone invent these** —
a fabricated statistic is the fastest way to lose a judge who happens to know the real one.

**3. Fill the identity placeholders.** Team name, Problem Statement ID, and the exact theme wording
from the official brief on slide 1.

**4. Export.** PPTX or PDF per the submission portal. Open the exported file on a different machine
before uploading — embedded fonts and images break in exactly the way you do not discover until
it is too late.

**5. The headline test.** Read only the 21 slide titles, top to bottom. If the argument does not
survive on titles alone, a title needs rewriting — that is all a skimming judge will read.
