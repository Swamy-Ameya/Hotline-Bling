# Claude Design brief — Outbreak Radar submission deck (v2)

**Changed since v1**, per team review of the first draft:
- Slide 6 (operational workflow) highlights the three live input streams: campus doctor clinical intake, student mobile self-reporting, and the mess meal ticketing/swipe system.
- Slide 5 (campus infrastructure) balances hostel residential blocks with the central mess kitchen, avoiding overly dense plumbing jargon while preserving the clean dual-lineage tree.
- Slide 7 (permutation test) explains the Monte Carlo random shuffling clearly as the definitive answer to the hackathon's core challenge question.
- Slide 8 (false-alarm control) clearly demonstrates why simple headcounts fail and how false discovery rate (FDR) control prevents campus panic.
- Slide 9 (four canonical scenarios) compares the live engine outputs across Quiet baseline, Water contamination, Mess food batch, and the Coincidence trap.
- Screenshots attached — nine real images from the running system live in `deck/assets/screenshots/`.
- General tone: Clean, confident public health surveillance language that is accessible to general judges while maintaining complete architectural depth in the technical slides.

Paste the block below into Claude Design. It is written cold: it assumes the reader knows nothing
about the project, so every number and claim it needs is already in the text.

**Build it in two passes.** Ask for slides 1–11 first, review, then ask for 12–21 on the same canvas.
Twenty-one artboards in one shot produces rushed layouts.

**Attach these nine images** from `deck/assets/screenshots/` when you paste the prompt:
`radar-filter-fault.png` · `radar-coincidence.png` · `radar-food.png` · `radar-quiet.png` ·
`drilldown-permutation.png` · `drilldown-verdict.png` · `epi-curve-food.png` · `epi-curve-water.png` ·
`report-form-mobile.png`

---

## PASTE FROM HERE

Build me a 21-slide pitch deck as a canvas of 16:9 artboards. This is a submission deck for a
national student hackathon — judges read it alone, on a screen, with nobody presenting. Every slide
must stand on its own, and every slide must be readable and persuasive to a non-technical judge while
satisfying technical evaluators.

### Problem Statement & Theme
**Theme:** Healthcare  
**Problem Statement:** Hostel Micro-Outbreak Early Warning System  
**Context:** Indian college hostels and student PGs, where food-poisoning and water-borne illness outbreaks
usually aren't recognized until 15–20 students have already fallen sick across 2–3 days, as isolated
complaints to wardens, campus clinics, or mess committees are never correlated in real time.

### What the project is

**Outbreak Radar** — an early-warning outbreak radar for campus health centers and hostel administration
that clusters symptom reports by residential location and correlates them with mess menu items and
meal-timing databases to stop outbreaks before day three.

**Key Differentiator:** A live outbreak radar dashboard displaying suspected geographic clusters and
likely sources (food contamination vs. hostel block water), paired with automated targeted advisory push
notifications sent to unaffected students sharing the same block or dining cohort before illness spreads.

**Challenge Question Answer:** *"How would your system tell a genuine outbreak apart from a handful of
unrelated stomach upsets that happen to cluster by coincidence?"* Our answer is a rigorous **Monte Carlo
permutation test** — holding total case count fixed, shuffling cases randomly across rooms 999 times,
and measuring how often chance alone produces a cluster that tight ($p$-value).

**This is not a concept. A working prototype exists**, with a live detection engine, student self-reporting
intake, doctor clinical logging, mess menu correlation, targeted advisory queues, four canonical test
scenarios, and 47 automated verification tests passing.

---

### Design direction

- Clean, confident, public-health agency design language (reminiscent of WHO/CDC surveillance dashboards).
- **Warm colours mean risk and nothing else.** Amber and red appear only where students are sick. All
  chrome, headers, navigation and structural elements are cool neutrals — slate, zinc, deep navy.
- Dark background with crisp light typography throughout.
- Numbers are the hero, but kept in plain, persuasive language on overview slides and exact in technical sections.
- Every slide title is a **claim, not a label** (e.g. *"Correlating student mealtimes and hostel blocks stops outbreaks 48 hours earlier"*).
- Generous whitespace, clean diagrams with inline callouts, zero confusing chart junk.
- Where a real screenshot is supplied, use it directly in the artboard with a crisp frame and no browser chrome.

---

### The six required sections (Hackathon Rubric)

Divided by slim section-divider slides:
1. **Problem Definition**
2. **Proposed Solution**
3. **Technical Solution & Databases**
4. **Feasibility & Viability**
5. **Impact & Benefits**
6. **Research & Validation**

---

## SECTION 1 — PROBLEM DEFINITION

**Slide 1 — Title**
- Title: *"Outbreak Radar — Early warning for hostel food poisoning and water-borne illness"*
- Subtitle: *"Correlating student symptom reports, mess mealtimes, and hostel locations to stop campus micro-outbreaks before day three."*
- Metadata: Problem Statement: Healthcare — Hostel Micro-Outbreak Early Warning System · Manipal University Jaipur · Team Submission.
- Hero Visual: Campus radar graphic linking hostel residential blocks, campus clinic intake, and the central mess.

**Slide 2 — "By the time anyone notices, 20 students are already sick"**
- Horizontal timeline illustrating the 48–72 hour blind window in Indian college hostels:
  - **Day 0**: First 2 students experience nausea/vomiting after dinner. Neither visits the clinic.
  - **Day 1**: 4 more fall sick. Two mention it to the hostel warden, one posts in a wing WhatsApp group.
  - **Day 2**: 8 students sick. Campus clinic sees 3 cases independently without knowing room allocations.
  - **Day 3**: 15–20 sick across multiple blocks. Mass panic, student protests, exam disruption.
- Highlight: **Outbreak Radar triggers on Day 0–1**, eliminating the 48-hour blind window.

**Slide 3 — "Four people each see two cases. Nobody sees eight."**
- Visual of four siloed, disconnected data sources with no communication between them:
  1. *Hostel Warden's register* (2 sick leaves logged)
  2. *Campus Doctor Clinic intake* (2 OPD prescriptions)
  3. *Mess complaint / rebate book* (2 missed meals noted)
  4. *Student floor WhatsApp group* (2 informal complaints)
- Caption: *The data exists on Day 0. But because complaints are scattered across four different touchpoints, correlation only happens after hospitalisations occur.*

---

## SECTION 2 — PROPOSED SOLUTION

**Slide 4 — "One shared health intelligence graph, instead of four scattered records"**
- Core premise: Unify campus health data into a dual-lineage diagnostic tree.
- Every student symptom report is linked to two essential databases:
  1. **Where they reside** (Hostel Block → Floor → Room wing → Water supply branch)
  2. **What they ate** (Mess Menu database → Meal timings: Breakfast, Lunch, Dinner)
- The engine computes spatial scan statistics and meal relative risk simultaneously to pinpoint whether illness originates from a specific mess meal or a localized hostel block.

**Slide 5 — "Hostel Blocks + Central Mess: The Dual-Lineage Campus Model"**
- Structural diagram showing how campus food and water distribute:
  - **Central Mess Kitchen**: Shared by all hostel blocks + day scholars. A food poisoning batch spreads across multiple blocks and affects day scholars.
  - **Hostel Block Tanks (Blocks A, B, C, D)**: Independent water tanks per block. Water contamination stays confined to a single block or wing.
  - **Day Scholars as Control Group**: Day scholars eat at the mess but drink no hostel tank water. If day scholars fall ill, hostel water is immediately ruled out campus-wide.
- Three clear callouts:
  - *"Confined to one block → Localised water issue."*
  - *"Spread across blocks & day scholars → Central mess food issue."*
  - *"Two filters per floor localises down to the exact wing cartridge to inspect."*

**Slide 6 — "How it actually works, day to day: Three live data inputs"**
- A three-lane operational workflow diagram showing real campus usage:
  - **Lane 1 — Campus Doctor Clinic**: Doctor logs clinical intake in 30 seconds. Student block/room is pulled automatically. Weighted $1.0\times$.
  - **Lane 2 — Student Mobile Self-Reports**: Students submit a fast 45-second symptom log on their phones before symptoms escalate. Catches sub-clinical mild cases early. Weighted $0.6\times$.
  - **Lane 3 — Mess Meal Timings & Swipes**: Correlates meal swipe logs with the daily mess menu database to identify exact meal cohorts.
- All three lanes converge into **one shared real-time case record** read by the detection engine.

**Slide 7 — ★ "The Challenge Question: Shuffling 999 times to defeat coincidence"**
- **The pivotal slide addressing the hackathon's core challenge question.**
- Question: *"How do you tell a genuine outbreak apart from 5–7 unrelated stomach bugs clustering in one block by pure chance?"*
- Three-panel visual:
  - **Left (Observed Data)**: 7 cases land in Block A over 48 hours.
  - **Middle (Monte Carlo Shuffling)**: Hold total cases fixed (7), redistribute them at random across 750 student rooms proportional to occupancy, 999 times.
  - **Right (Null Distribution Histogram)**: Plot how often chance alone clusters 7 cases this tightly.
- Concrete System Output:
  - Genuine Block/Water Fault: 0 of 999 random shuffles matched this concentration ($p = 0.001$) $\rightarrow$ **ALERT**.
  - Coincidence Trap: 336 of 999 random shuffles produced an equal cluster by pure chance ($p = 0.336$) $\rightarrow$ **HOLD AT WATCH, NO ADVISORY SENT**.

**Slide 8 — "Why naive threshold counts fail: 3 false alarms every single day"**
- Mathematical comparison:
  - A dumb count-threshold system (>5 cases = alarm) testing 61 campus nodes with a 5% error rate triggers $\approx 3$ false alarms every cycle.
  - Result: Wardens ignore alarms, students panic, and water tanks get shut down unnecessarily.
- Outbreak Radar combines **Kulldorff spatial scan permutation testing** with **Benjamini–Hochberg False Discovery Rate (FDR at $q = 0.10$)** to guarantee statistical significance before alerting.

**Slide 9 — "Four Canonical Scenarios, Four Precise Decisions"**
- Comparison table showing live engine output across tested scenarios:

| Scenario | What Happened | Naive Count System | Outbreak Radar Decision | Evidence & Action |
|---|---|---|---|---|
| **Quiet Baseline** | 5 scattered unrelated upsets | Stays silent | **Stays Silent (Baseline Normal)** | $p > 0.50$, zero clusters, calm status |
| **Water Fault** | 9 cases under one block wing | Alerts on whole block | **Localises to Block B Wing 3A** | $p = 0.001$, targeted maintenance dispatch |
| **Mess Food Batch** | 19 cases across 3 blocks + day scholars | Blames residential block | **Identifies Friday Lunch (Mess)** | Relative Risk $RR = 21.1$, $p = 0.0002$, kitchen inspection |
| **Coincidence Trap** | 7 cases in Block C by pure chance | **False Alarm (Panic Alert)** | **Holds at WATCH (No Alert)** | $p = 0.336$, avoids false panic |

---

## SECTION 3 — TECHNICAL SOLUTION & DATABASES

**Slide 10 — "Full System Architecture: Student Intake, Doctor Portal, Mess DB, and Advisory Engine"**
- Complete architecture diagram:
  - **Inputs**:
    1. *Student Mobile Self-Report*: Fast 45-second symptom log, onset time, mealtimes attended.
    2. *Campus Clinic Doctor Portal*: Clinical OPD intake, diagnosis severity, weighted $1.0\times$ vs self-report $0.6\times$.
    3. *Mess Management Database*: Daily mess menu items, meal timing windows (Breakfast, Lunch, Dinner), student attendance / swipes.
    4. *Hostel Allocation Database*: Student room mapping, floor, block, and water tank hierarchy.
  - **Core Application**: Next.js 16 App Router, React 19, TypeScript, Role-based views (Student, Doctor, Warden).
  - **Detection & Permutation Engine**: Real-time spatial scan + 2×2 meal cohort relative risk analyzer.
  - **Outputs**: Live Outbreak Radar Dashboard · Permutation Histograms · Targeted Student Push Advisories · Maintenance Action Logs.

**Slide 11 — "The Seven-Step Detection & Correlation Pipeline"**
- Process flow diagram:
  1. **Assemble Cases**: Ingest trailing 48h/72h symptom reports, applying doctor ($1.0$) and self-report ($0.6$) weights. Exclude prompted reports.
  2. **Baseline Calibration**: Compute rolling 14-day background illness rate per residential wing.
  3. **Spatial Permutation Scan**: Run Kulldorff log-likelihood ratio scan across all infrastructure nodes with 999 Monte Carlo shuffles $\rightarrow$ $p_{\text{spatial}}$.
  4. **Mess Cohort Correlation**: Construct $2\times 2$ contingency tables for every meal in the last 72 hours $\rightarrow$ Relative Risk ($RR$) and Fisher's exact $p$-value.
  5. **Temporal Epi Curve Analysis**: Evaluate incubation curve width (Sharp $<12\text{h} \rightarrow$ point-source food; Smeared $>24\text{h} \rightarrow$ sustained water).
  6. **Arbitration Engine**: Formally arbitrate between food poisoning and water contamination.
  7. **FDR & Human Confirmation**: Apply Benjamini–Hochberg ($q = 0.10$) into Watch $\rightarrow$ Alert $\rightarrow$ Warden Confirmation $\rightarrow$ Targeted Push Advisory.

**Slide 12 — "Confounding Control: Disentangling Mealtimes from Living Quarters"**
- Technical highlight:
  - Students living on the same hostel floor often eat meals together at the same time.
  - When a genuine water cluster occurs, an innocent breakfast might show an artificial relative risk ($RR = 6.1$).
  - Our engine performs **stratified re-analysis**: removing the suspected cluster's cases and re-evaluating the meal correlation across the rest of the campus.
  - If the meal signal collapses ($p = 0.16$), the system correctly confirms water and avoids wrongly shutting down the kitchen.

**Slide 13 — "Explainable Statistical Learning vs. Black-Box Neural Networks"**
- Clear rationale for healthcare and campus administration:
  - *Why not a deep neural network?* Campus outbreaks occur only a few times a year; there is no massive labeled training dataset. A deep model with 15 cases would overfit, hallucinate, and act as an unexplainable black box that no doctor or warden can trust to shut off food or water supplies.
  - *Our Statistical Approach*: Poisson likelihood ratios, Monte Carlo permutation tests, Fisher's exact test, and FDR control. Every number is 100% auditable, transparent, and clinically explainable.
  - *Future ML Integration (v2)*: The logged intervention outcomes generate the ground-truth labeled training dataset needed for supervised machine learning at scale.

**Slide 14 — "The Core Relational Database Schema"**
- Entity-Relationship Diagram highlighting the core operational tables:
  1. `users`: Student profile, hostel block, floor, room number, residency (hosteller vs. day scholar).
  2. `symptom_reports`: Reporter (doctor vs student), symptoms list, severity (1–5), onset timestamp, meals eaten in last 72h, prompted flag.
  3. `mess_menu`: Date, meal type (breakfast, lunch, dinner), menu items served, service timing window.
  4. `mess_tickets`: Student meal attendance / swipe logs.
  5. `infra_nodes`: Hierarchical hostel infrastructure graph (Campus $\rightarrow$ Mess / Block Tanks $\rightarrow$ Floors $\rightarrow$ Room Wings) with exposed population denominators.
  6. `clusters`: Detected clusters, hypothesis (food vs water), observed/expected cases, permutation $p$-value, relative risk, arbitration verdict.
  7. `advisories`: Targeted notification records, target audience (specific block/wing/meal cohort), notification status.
  8. `interventions`: Maintenance and kitchen inspection logs, ground truth findings (`cause_code`).

**Slide 15 — "Working Prototype Live"**
- Prototype evidence:
  - Attach real screenshots: `radar-filter-fault.png`, `drilldown-permutation.png`, `epi-curve-food.png` & `epi-curve-water.png`, and `report-form-mobile.png`.
  - Terminal output verifying **47 automated tests passing** across all 4 scenarios.
  - Live deployment URL and QR code for judges to test directly on their phones.

---

## SECTION 4 — FEASIBILITY & VIABILITY

**Slide 16 — "Feasibility Across Campus Operations"**
- Four feasibility pillars:
  - **Technical**: Lightweight TypeScript engine, sub-second execution across 750+ students on standard PostgreSQL/serverless, zero GPU overhead.
  - **Operational**: Replaces the campus doctor's physical register with a 30-second digital form; integrates with existing mess ticket/swipe logs.
  - **Financial**: Minimal cloud footprint ($<\$10$/month per campus) compared to the severe financial, exam disruption, and medical costs of a full 50-student outbreak.
  - **Market & Scalability**: Applicable across thousands of Indian universities, college hostels, and private student PG clusters.

**Slide 17 — "Risk Mitigation & Privacy by Design (DPDP Act 2023)"**
- Risk matrix table:

| Potential Challenge | Built-in Mitigation Strategy |
|---|---|
| **Student Privacy & Stigma** | Compliant with DPDP Act 2023: Wardens see aggregated clusters only; cells with $<3$ cases are suppressed (`<3`) to prevent room-level deanonymisation. |
| **False / Malicious Reports** | Identity-linked student accounts, 1 report/day limit, doctor reports carry $1.67\times$ the weight of self-reports, spatial scan penalises diffuse noise. |
| **Rumour Amplification** | Reports submitted after a targeted advisory is published are tagged `prompted` and excluded from detection statistics to prevent self-fulfilling loops. |
| **False Panic Alarms** | Human-in-the-loop: `watch` never alerts students; `alert` requires warden/doctor review before push notifications are dispatched. |

---

## SECTION 5 — IMPACT & BENEFITS

**Slide 18 — "From 3 Days of Blindness to Same-Day Prevention"**
- Dramatic before-and-after comparison:
  - **Traditional Response**: 15–20 students ill over 3 days $\rightarrow$ delayed investigation $\rightarrow$ hospitalisations $\rightarrow$ cause rarely identified $\rightarrow$ blanket hostel shutdown.
  - **With Outbreak Radar**: Anomaly detected at 3–4 cases $\rightarrow$ precise cause identified (specific meal vs. block water) $\rightarrow$ targeted push advisory to unaffected peers in same block $\rightarrow$ outbreak halted on Day 1.

**Slide 19 — "Four Bias Corrections Engineered into the System"**
- Clean $2\times 2$ grid:
  1. **Reporting Bias**: Prompted reports excluded from statistical denominator.
  2. **Population Bias**: Rates calculated strictly against exposed sub-populations (attack rate, never raw count).
  3. **Multiple-Comparison Bias**: 61 nodes tested per cycle controlled via Benjamini–Hochberg FDR ($q = 0.10$).
  4. **Confounding Bias**: Stratified re-analysis disentangling mealtimes from shared floor living quarters.

**Slide 20 — "Scalability & Future Roadmap"**
- **Campus Scaling**: Modular tree architecture seamlessly scales from a single 200-bed hostel to multi-campus universities (10,000+ students).
- **PG Cluster Network (v2)**: Aggregating private student PGs sharing commercial tiffin providers across student hubs (Kota, Delhi, Pune, Bengaluru).
- **Automated SMS & WhatsApp Integration**: Dispatching targeted advisories directly to student WhatsApp and SMS gateways.

---

## SECTION 6 — RESEARCH & VALIDATION

**Slide 21 — "Public Health Methodology & Precedents"**
- Epidemiological foundations:
  - **John Snow (1854 Broad Street Cholera)**: Origin of resource-graph spatial epidemiology; modernized with real-time relational databases.
  - **Kulldorff Spatial Scan Statistic (1997)**: Gold standard in spatial disease surveillance (SaTScan / CDC).
  - **CDC Foodborne Incubation Curves**: Incubation-period dispersion matching (*B. cereus/S. aureus* 1–6h, *Salmonella* 6–72h, waterborne pathogens days–weeks).
  - **Closed-Loop Ground Truth**: Every maintenance and kitchen inspection logs an outcome code, continually validating system sensitivity and precision.

## PASTE UNTIL HERE
