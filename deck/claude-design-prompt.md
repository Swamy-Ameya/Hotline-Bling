# Claude Design brief — Outbreak Radar submission deck (v2)

**Changed since v1**, per team review of the first draft:
- Slide 6 (dual lineage) was flagged as dead weight — replaced with an operational "how it actually
  works day-to-day" slide showing the doctor, the student, and the mess ticket system, since the
  first draft leaned too hard on statistics and not enough on the real workflow.
- Slide 5 (infrastructure tree) was too deep into water-management terminology — cut back to three
  plain sentences.
- Slide 7 (permutation test) had too many concrete worked examples — simplified to one generic
  illustration so it doesn't cause cognitive overload.
- Slide 8 (false-alarm arithmetic) was called out as the right tone — generalised, one clear point,
  no clutter. **It is the template for how every other conceptual slide should read.**
- Slide 9 (four scenarios) was too technical — rewritten around a plain-language probability analogy,
  with the required scenario comparison kept but described in words, not decimals.
- Slide 11 (detection pipeline) had too many abbreviations and decimal figures — reworded in plain
  English throughout.
- General rule added: **no decimals, no statistical abbreviations, anywhere outside slides 10 and 14**
  (Technical Solution). Everywhere else, round to a sentence a stranger can read once and understand.
- Screenshots are ready — nine real images from the running system now live in
  `deck/assets/screenshots/`. Every slide that wanted a placeholder box now gets a real image.

Paste the block below into Claude Design. It is written cold: it assumes the reader knows nothing
about the project, so every number and claim it needs is already in the text.

**Build it in two passes.** Ask for slides 1–11 first, review, then ask for 12–21 on the same canvas.
Twenty-one artboards in one shot produces rushed layouts.

**Attach these nine images** from `deck/assets/screenshots/` when you paste the prompt — Claude Design
can place real screenshots directly into the artboards instead of drawing mockups:
`radar-filter-fault.png` · `radar-coincidence.png` · `radar-food.png` · `radar-quiet.png` ·
`drilldown-permutation.png` · `drilldown-verdict.png` · `epi-curve-food.png` · `epi-curve-water.png` ·
`report-form-mobile.png`

---

## PASTE FROM HERE

Build me a 21-slide pitch deck as a canvas of 16:9 artboards. This is a submission deck for a
national student hackathon — judges read it alone, on a screen, with nobody presenting. Every slide
must stand on its own, and **every slide must be readable by someone with zero background in
statistics or software.**

### What the project is

**Outbreak Radar** — an early-warning system for food and water-borne illness outbreaks in Indian
college hostels, built for Manipal University Jaipur, where — like most Indian colleges and hostels —
every hostel block already has a campus doctor and a shared mess.

The problem: outbreaks go unnoticed until 15–20 students are sick over 2–3 days, because complaints
scatter across a warden's register, the campus clinic, a mess complaint book and a floor WhatsApp
group, and nobody joins them up.

Our approach: every hostel's water supply is already a tree — one tank per block, one filter per
floor, and a separate mess shared by everyone. We attach every symptom report to that tree and find
where illness is concentrated, using the same style of reasoning real public-health teams use to
trace an outbreak back to its source.

**The single idea the whole deck must land:** the hackathon asks *"how would your system tell a
genuine outbreak from a handful of unrelated stomach upsets that cluster by coincidence?"* Our answer:
we literally calculate the odds that what we're seeing is just bad luck, before we ever say the word
"outbreak." Everything else in the deck supports that one idea.

**This is not a concept. A working prototype exists**, with a live detection engine, four demo
scenarios, real screenshots of the running system, and 47 automated tests passing. Say so wherever it
is relevant — most competing submissions will be slideware.

### Design direction

- Clean, confident, data-forward. Think a public-health agency dashboard, not a startup pitch.
- **Warm colours mean risk and nothing else.** Amber and red appear only where people are sick. All
  chrome, headers, navigation and structural elements are cool neutrals — slate, zinc, deep navy.
- Dark background with light type, or light with dark — pick one and hold it across all 21.
- Numbers are the hero, but **keep them in plain language everywhere except slides 10 and 14.**
  "About 1 time in 1,000" beats "p = 0.001" on every slide except the two dedicated technical ones,
  where a judge with a stats background expects to see the real figures. Round percentages to whole
  numbers. No unexplained abbreviations — spell out the first use of anything (relative risk, false
  discovery rate) in one plain clause before ever using the short form.
- Every slide title is a **claim, not a label**. "Water Distribution Model" is wasted; "Every block
  drinks from its own tank" is a slide a judge can score from the title alone.
- Diagrams annotate themselves with inline callouts. Never a legend the reader has to cross-reference.
- **Slide 8 is the tone template.** Generalised, one clear point, minimal clutter, no dense worked
  examples. Every conceptual slide (everything outside Technical Solution) should read like slide 8.
- Generous whitespace. Body text sparse — assertion, diagram, then two to four supporting lines.
- Where a real screenshot is supplied, use it directly in the artboard rather than redrawing a
  mockup. Crop tight, add a thin frame, no browser chrome.

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
"the blind window — 2 to 3 days."

**Slide 3 — "Four people each see two cases. Nobody sees eight."**
Four disconnected boxes, no lines between them: Warden's register · Campus clinic notes · Mess
complaint book · Floor WhatsApp group. Each holds a small "2 cases" tag. Beneath, one line:
*The information already exists on Day 0. It has never been in the same place.*
The point of the slide is the absence of connections — make that visually obvious.

---

## SECTION 2 — PROPOSED SOLUTION

**Slide 4 — "One shared record, instead of four scattered ones"**
The core idea, stated plainly, no jargon: every symptom report — whether it comes from a doctor or a
student — lands in one place, tagged with where that student lives and what they've eaten recently.
Once enough reports land in the same place, a pattern that was invisible to any one person becomes
obvious to the system.

**Slide 5 — "Every block drinks from its own tank. Every floor has its own filter."**
A simple, uncluttered tree diagram — keep this one light, not a technical schematic:

```
Main water source
├── Mess   (shared by every block, and by day scholars too)
├── Block A's tank → Floor 1's filter, Floor 2's filter, Floor 3's filter …
├── Block B's tank → its own floors and filters
├── Block C's tank → its own floors and filters
└── Block D's tank → its own floors and filters
```

Draw the mess as one wide bar underneath all four blocks, since it is shared by everyone. Three short
callouts, no more:
- "No two blocks share a tank — so if only one block is affected, it has to be that block's own water."
- "Everyone eats at the mess — so if several blocks are affected at once, the mess is the more likely
  cause."
- "Each floor has its own filter, so we can usually point to the exact one to replace."

Keep this slide light. Save the deeper technical detail for Section 3.

**Slide 6 — "How it actually works, day to day"**
A three-lane workflow diagram. This slide is about people using the system, not statistics — it is
the most important slide for showing this is a real, usable tool and not just an algorithm.

**Lane 1 — At the campus clinic.** A student visits the doctor. In the same visit, the doctor fills
one simple form: what the student is feeling, how they seem, and when it started. If the student
lives in a hostel, their block, floor and room are already on file — the doctor doesn't have to ask,
and the system already knows which water filter serves that room.

**Lane 2 — On a student's phone.** A student who feels unwell but hasn't been to the clinic yet can
self-report in under a minute: what they're feeling, when it started, and — optionally — what they've
eaten recently. This is what catches an outbreak a day or two before anyone would otherwise notice,
because most people don't go to a doctor for a mild stomach ache.

**Lane 3 — From the mess.** The mess already issues a ticket every time a student collects a meal.
That tells us who ate what, and when, automatically — nobody has to enter this by hand.

All three lanes converge into **one shared case record**, which is what the detection engine reads.

Add one callout at the bottom: *"A doctor's assessment counts for more than a student's own report,
but both feed the same picture — and a handful of stomach upsets a week is completely normal on a
campus of 750 students. The system already knows what normal looks like, and only reacts when
something clearly goes beyond it."*

---

## SECTION 3 — TECHNICAL SOLUTION

**Slide 7 — "How we know it isn't just coincidence"**
**One of the two most important slides in the deck. Keep it generic — a single clean illustration,
not a worked example with specific numbers.** Overloading this with concrete figures is what made
the first draft too dense; the idea should be obvious from the picture alone.

Three simple panels, left to right:
1. **What we saw** — a small grid of rooms, with a handful of cells shaded to show reported illness,
   one cluster of cells clearly darker than the rest.
2. **What if it was random?** — the same number of cases, scattered onto the same grid completely at
   random. Show three or four faint, ghosted versions of this to suggest "we do this hundreds of
   times," without labelling each one individually.
3. **Where the real result lands** — a simple bell-shaped or right-skewed curve representing "how
   tight a cluster shows up purely by chance," with the real, observed result marked as a single
   dot. Show it landing either deep in the ordinary middle of the curve (comfortably explained by
   chance) or far out in the unlikely tail (not explained by chance) — pick ONE of these two positions
   for this slide, not both, to keep it simple.

One caption underneath, nothing more:
*We repeat the same random scattering hundreds of times and ask a simple question: how often does
pure chance produce something that looks this suspicious anyway? If the answer is "often," we stay
calm. If the answer is "almost never," we act.*

Footnote in small type only: this is a simplified version of a technique called a spatial scan
statistic, used by real public-health departments to trace outbreaks.

**Slide 8 — "A simple headcount raises false alarms on its own"**
**This slide's tone and structure worked well — keep it exactly this generalised.** One clear point,
no clutter, no worked example:

A campus this size has around sixty different water sources and rooms being watched at once. Even if
each one only has a small, ordinary chance of looking suspicious on any given day, checking sixty of
them at once means *something* will look suspicious most days — purely by accident. A system that
alerts on any single suspicious-looking spot, without accounting for how many spots it's checking,
will cry wolf constantly.

We correct for this mathematically before anything is ever shown to a warden.
Caption: *A simple headcount has no way to tell the difference between an actual problem and normal
statistical noise. That is not something you can fix by picking a better number — it needs a
different kind of check altogether, which is what slide 7 does.*

**Slide 9 — "Is it bad luck, or is it real?"**
**Rewritten to be non-technical, using a basic, relatable probability analogy — this content is
required by the brief, but the delivery should feel like an explanation you'd give a friend, not a
statistics lecture.**

Open with the analogy: *Flip a coin twenty times, and every so often you'll get a run of six or seven
heads in a row. That doesn't mean the coin is rigged — it's just what happens sometimes, purely by
chance, when you flip enough coins. A campus of 750 students works the same way: on any given week, a
few unrelated stomach bugs will sometimes land in the same block just by luck.*

Then the method, stated in one line: *So before we ever raise an alarm, we ask the same question a
careful doctor would: could ordinary bad luck explain this, or not?*

Then, in plain words rather than a statistics table, walk through what our own system found in four
real test scenarios — keep this as a simple four-row list, no decimals, no p-values:

- **A quiet week** — a few unrelated upsets scattered around campus. Our answer: *nothing unusual —
  stays silent.*
- **A bad filter** — nine cases, all under one specific filter, over two days. Our answer: *this is
  essentially never explained by chance alone — act now, and we know exactly which filter.*
- **A bad batch of food** — cases across three blocks and even among day students who don't drink
  hostel water at all. Our answer: *water can't explain this, but one specific meal can — and the
  onset timing points squarely at food.*
- **A cluster that's just bad luck** — seven cases that happened to land in one block. A simple
  headcount would sound the alarm here. Our answer: *ordinary chance explains this comfortably —
  stay calm, keep watching.*

Closing line: *Same test, four very different, correct answers — and the fourth one is the one no
other system in this space gets right.*

**Slide 10 — "One web app, three roles, one database"**
System architecture diagram, left to right. Technical language is fine here — this is the one section
where a judge expects real detail:
- **Inputs**: student self-report (phone) · doctor intake at the campus clinic · mess ticket system ·
  hostel infrastructure configuration
- **Application**: Next.js 16 App Router, React 19, three role-scoped views (student / doctor / warden)
- **API**: `/api/reports` · `/api/detect` · `/api/clusters/[id]` · `/api/seed`
- **Detection engine**: pure TypeScript, no framework dependency, testable from a plain terminal
- **Store**: PostgreSQL — 8 tables, one self-referencing tree for the water/mess hierarchy
- **Outputs**: the radar dashboard · cluster drill-down · scoped advisories · intervention log

Callout: *The engine is plain functions over plain data — no database connection required to run it.
That is why we can prove the whole detection pipeline from a terminal before a single screen exists.*

**Slide 11 — "The detection pipeline, in seven plain steps"**
**Reworded to remove abbreviations and decimals throughout — plain English only, this should read
easily on a first pass:**

1. **Gather the recent reports** — but skip any report that was filed only because a student had
   already been warned about a possible outbreak nearby, so a warning can't create the evidence for
   its own next warning.
2. **Learn what "normal" looks like** for every part of campus, based on history — before anything
   unusual happened.
3. **Check every filter, floor, tank and the mess** for a count that looks unusually high compared to
   what's normal for that spot.
4. **Test whether that high count could just be chance** — by imagining hundreds of ordinary weeks
   where nothing was wrong, and checking how often something like it shows up anyway. (This is
   slide 7.)
5. **Check whether one specific meal explains it instead** — by comparing students who ate that meal
   against students who didn't.
6. **Weigh the two explanations, water and food, against each other**, and go with whichever one
   actually fits the evidence — while still showing the other explanation, so nothing is hidden.
7. **Only raise an alert if the result survives every one of these checks** — and even then, a human
   has to confirm it before any student is notified.

Small footnote only, not the headline: technical names for steps 3–4–6 are the spatial scan
statistic, the permutation test, and false discovery rate control — full detail in the appendix
slides if a judge wants it.

**Slide 12 — "The same students share a filter and a mealtime — so we double-check ourselves"**
Real, working behaviour from the system, explained simply. When the engine finds a genuine water
cluster, it will often *also* notice that those same students share a mealtime — because people who
live on the same floor tend to eat together. A less careful system might blame the food.

Ours checks itself: it re-runs the meal comparison with that group of students set aside, and if the
food connection disappears once they're removed, it correctly concludes the food was never the real
cause — it was just the same people showing up twice.

Show it as a simple before/after pair: "with these students included, the food link looks real" →
"with these same students set aside, the food link disappears" → verdict: it's the water, not the food.

**Slide 13 — "Why there is no neural network here, and where one would go"**
Judges will look for AI. Answer it head-on and confidently, in plain language:

*Machine learning models learn from labelled examples of past outbreaks. A single campus only
produces a handful of real outbreaks a year, and the ones that matter most are exactly the ones
nobody has labelled yet. With so little data, a machine-learning model would be a black box nobody
could question — and no warden should shut off a water tank just because a model "felt" strongly
about it.*

*Instead, we use statistical reasoning that can always be explained in plain terms: comparing what we
see against what chance alone would produce, and checking our own conclusions the way we did on
slide 12. Every alert can be explained to a doctor in one sentence.*

*Machine learning does have a place — in version two. Every case we resolve gets a confirmed cause
logged (slide 15). Once there are a few hundred of those, that becomes exactly the labelled dataset a
model needs, and a genuinely defensible one becomes possible.*

Technologies list, small type: TypeScript · Next.js 16 · React 19 · PostgreSQL · Tailwind · Recharts ·
spatial scan statistic · random-shuffle (Monte Carlo) significance testing · false discovery rate
control · exact statistical testing for small sample sizes.

**Slide 14 — "Eight tables carry the entire model"**
A clean entity-relationship diagram: `infra_nodes` (the water/mess tree) · `users` ·
`symptom_reports` · `mess_menu` · `mess_tickets` · `clusters` · `advisories` · `interventions`.
Technical language is fine here.

Highlight three columns and say why each exists, in one plain sentence each:
- `infra_nodes.exposed_population` — how many students that spot actually serves, so we compare fair
  rates rather than raw headcounts.
- `symptom_reports.prompted_by_advisory_id` — marks a report filed after we already warned that
  student, so a warning can never manufacture the evidence for its own next warning.
- `interventions.cause_code` — what maintenance actually found when they checked. This is how the
  system learns, over time, whether it was right.

**Slide 15 — "Already built and running"**
Implementation status, using the real screenshots supplied — drop them in directly, do not redraw:
`radar-filter-fault.png` (the dashboard correctly naming a bad filter) ·
`drilldown-permutation.png` (the chance-versus-real comparison from slide 7, live) ·
`epi-curve-food.png` and `epi-curve-water.png` side by side (a sharp spike versus a smeared curve —
this pairing alone shows food and water look visibly different) ·
`report-form-mobile.png` (the phone-based self-report).

Beneath: **47 automated tests passing · 4 demo scenarios · full detection engine live.**
Include a placeholder for a live URL and a QR code — team, insert the real deployed link.

---

## SECTION 4 — FEASIBILITY & VIABILITY

**Slide 16 — "Every input we need already exists on campus"**
Four feasibility panels, plain language throughout:

**Technical** — Built and running today. The engine works, the tests pass, the interface is live. No
special hardware, no GPU, nothing exotic — checking the whole campus takes under a second.

**Operational** — The doctor already keeps a paper register; we replace it with a thirty-second form.
The mess already issues tickets. Maintenance already tests water. Setting it up for a new campus is a
one-time step: telling the system which filter serves which rooms, which facilities staff already
know.

**Financial** — A web app on a standard managed database. No per-student licence fee, no special
hardware, no field devices to install. Running cost for one campus is modest — set against the cost
of a single unmanaged outbreak: twenty-plus clinic visits, possible hospitalisation, disrupted exams,
and a story that reaches worried parents.
*(TEAM: insert a verified running-cost figure here before submitting — do not estimate on stage.)*

**Market** — India has thousands of universities and tens of thousands of colleges, and a large share
of their students live in hostels or paying-guest accommodation. Any institution with a mess, a
clinic and a student roster — which describes almost every organised hostel in the country — can use
this without modification.
*(TEAM: cite the official AISHE figures for institution and enrolment counts — do not estimate.)*

**Slide 17 — "What could go wrong, and what we did about it"**
A risks-and-mitigations table, plain language, no jargon:

| Risk | What we did about it |
|---|---|
| A student files a false report | Every account is tied to a real student ID, limited to one report a day, and a doctor's assessment always counts for more than a self-report. A student making things up produces scattered, disconnected reports — and a scattered pattern is exactly what our chance-check filters out on its own. |
| A warning itself causes a spike in reports that looks like the outbreak is getting worse | We flag and exclude any report filed by a student who was already warned, so a warning can never manufacture its own evidence. Built in from day one. |
| Health information is sensitive | A doctor sees names. A warden sees only aggregated numbers by location — never fewer than three cases shown together, since a warden reading "1 case, Room 214" already knows exactly who that is. |
| A false alarm shuts down a water source needlessly | No warning ever reaches a student without a human — a warden or doctor — confirming it first. |
| Our thresholds haven't been medically validated yet | True, and we say so plainly. Real-world deployment would want a public-health advisor's sign-off. Every resolved case logs what was actually found, which is exactly the evidence that validation would need. |
| Private PGs don't have a roster, clinic, or mess system to plug into | Version one targets institutions that already have all three — which covers most colleges and organised hostels. PGs come later, in a lighter self-report-only mode. |

---

## SECTION 5 — IMPACT & BENEFITS

**Slide 18 — "From three days to the same afternoon"**
A single strong before/after visual.
Before: 2–3 days to notice, 15–20 students affected, and the actual cause is usually never found.
After: flagged within hours of the third case, pointed at a specific filter or a specific meal, with
a warning sent only to the rooms actually affected — not a campus-wide panic notice.
Add: *A doctor usually only sees someone once they've decided they're properly sick, which is often a
full day or two after symptoms start. The phone-based self-report is what catches the people who feel
rough but never go to the clinic — and that is where the extra head start comes from.*

**Slide 19 — "Four ways the system checks itself, so it doesn't fool anyone — including us"**
A clean 2×2 grid, plain language:
- **A warning shouldn't cause its own evidence.** → Reports filed after a warning are set aside from
  the count that decides the next warning.
- **A busy spot shouldn't look scarier just because more people use it.** → We always compare a rate
  — cases against the number of people that spot actually serves — never a raw headcount.
- **Checking sixty spots at once will always turn something up by accident.** → We correct for that
  mathematically before anything is shown to a warden (slide 8).
- **The same group of people can accidentally look connected to the wrong cause.** → We double-check
  by re-running the comparison with that group set aside (slide 12).

**Slide 20 — "Scales down to one hostel, and up to a whole state"**
- **Scalability**: the underlying idea is just "a shared-resource map plus a stream of reports."
  Adding a block, a whole campus, or a whole district doesn't change the approach — and checking the
  whole system takes under a second even today.
- **Accessibility**: works on an ordinary phone, a report takes under a minute, and the symptom list
  is tap-to-select rather than free text — so it doesn't depend on a student's typing speed, spelling,
  or English fluency.
- **One line only, do not oversell**: the same underlying idea — a shared resource, plus reports, plus
  a chance-check — could just as easily catch a different kind of cluster one day, like an
  air-conditioning-related illness by wing. Food and water is simply where we started.

---

## SECTION 6 — RESEARCH & VALIDATION

**Slide 21 — "Standing on established public-health method, not invented from nothing"**
A clean reference slide, grouped, plain-language descriptions next to each citation:

**Precedent**
- John Snow, 1854 — the Broad Street cholera investigation in London. Cases were traced back through
  a shared water pump to their source. This project is the same idea, with a database behind it.

**Methods we implement**
- Kulldorff, M. (1997), *A spatial scan statistic*, Communications in Statistics — the basis of
  SaTScan software, which real public-health departments use today for outbreak cluster detection.
- Benjamini, Y. & Hochberg, Y. (1995), *Controlling the false discovery rate*, Journal of the Royal
  Statistical Society — the correction behind slide 8.
- Fisher's exact test — a statistical comparison built for the kind of small sample sizes an outbreak
  investigation actually produces.
- The Haldane–Anscombe correction — a standard fix for the exact situation where the evidence is
  strongest: when literally everyone who was exposed got sick.

**Systems we take design cues from**
- WHO EWARS — an early-warning system used in humanitarian and refugee settings.
- CDC BioSense / NSSP — the United States' national disease surveillance network, which combines
  clinical data with community-level signals, the same way our doctor and self-report channels do.
- CDC EARS — aberration detection against a rolling baseline of "normal."

**Clinical reference used for our reasoning about symptom timing**
- Published incubation-period ranges for common foodborne and waterborne illnesses — the reason a
  sharp, sudden spike in symptoms points toward food, while a slow, spread-out rise points toward
  water.

Closing line: *We build our own evidence too — every resolved case records what maintenance actually
found, which is how our thresholds get more accurate over time rather than staying a guess forever.*

## PASTE UNTIL HERE

---

# What the team still has to do

**1. Screenshots — done.** All nine images exist in `deck/assets/screenshots/` and are referenced by
name throughout the prompt above. Attach them when you paste into Claude Design.

**2. Verify two numbers before submitting.** The running-cost figure and the AISHE institution/
enrolment counts on slide 16. **Do not let anyone invent these** — a fabricated statistic is the
fastest way to lose a judge who happens to know the real one.

**3. Fill the identity placeholders.** Team name, Problem Statement ID, and the exact theme wording
from the official brief on slide 1. The live deployed URL and a QR code on slide 15.

**4. Export.** PPTX or PDF per the submission portal. Open the exported file on a different machine
before uploading — embedded fonts and images break in exactly the way you do not discover until
it is too late.

**5. The headline test.** Read only the 21 slide titles, top to bottom. If the argument does not
survive on titles alone, a title needs rewriting — that is all a skimming judge will read.

**6. The readability test — new this round.** Read slides 2, 3, 4, 5, 6, 7, 8, 9, 18, 19, 20 out loud
to someone who has never seen this project and has no statistics background. If any sentence makes
them stop and ask "wait, what does that mean," reword it. Slides 10 and 14 are exempt — those are
allowed to be technical.
