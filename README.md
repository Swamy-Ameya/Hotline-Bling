# Outbreak Radar 🚨
### Healthcare — Hostel Micro-Outbreak Early Warning System

> **Problem Statement**: In Indian college hostels and student PGs, food-poisoning and water-borne illness outbreaks usually aren't recognized until 15–20 students have already fallen sick across 2–3 days, because complaints scatter across wardens, campus clinics, and informal WhatsApp groups without correlation.

**Outbreak Radar** is an early-warning outbreak radar for campus health centers and hostel administration that clusters symptom reports by location and correlates them with mess menus and meal-timing databases to stop outbreaks before day three.

---

## 🎯 Key Differentiators & Highlights

1. **Live Outbreak Radar Dashboard**: Real-time visual radar mapping suspected geographic clusters across hostel blocks and cross-referencing mess meals to arbitrate between food-poisoning batches vs. localized water contamination.
2. **Automated Targeted Push Advisories**: Sends scoped, actionable push alerts to unaffected students sharing the same hostel block or dining cohort before illness spreads further.
3. **Challenge Question Answered (Coincidence Trap Defence)**: Uses **Monte Carlo Permutation Testing (999 spatial shuffles)** to distinguish genuine micro-outbreaks ($p < 0.01$) from random clusters of stomach upsets that occur purely by chance ($p \approx 0.34$), eliminating false panic alarms.
4. **Unified Health Databases**:
   - **Student Database**: Room allocations, hostel blocks, and residency status (hostellers vs. day scholar control group).
   - **Mess Management Database**: Daily mess menu items and meal-timing windows (Breakfast, Lunch, Dinner).
   - **Campus Clinic Doctor Intake**: Doctor clinical diagnoses (weighted $1.0\times$) combined with student self-reports ($0.6\times$).
   - **Targeted Advisory Queue**: Scoped notifications to unaffected roommates and blockmates.
   - **DPDP Act 2023 Compliant**: Sub-threshold counts below 3 are strictly masked as `<3` to prevent student deanonymisation.

---

## 🏗️ Architecture & Stack

- **Framework**: Next.js 16 App Router (Turbopack, React 19.2)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Detection Engine**: Spatial Kulldorff scan statistics, 999 Monte Carlo permutation replicates, $2\times 2$ cohort relative risk analysis, Benjamini–Hochberg False Discovery Rate (FDR at $q = 0.10$).
- **Database**: PostgreSQL / in-memory resilient fallback store.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run automated engine verification tests (47 tests across all 4 scenarios)
npm run detect:test

# TypeScript check
npm run typecheck

# Production build
npm run build
```

---

## 🧪 Four Canonical Scenarios Tested

| Scenario | What Happened | Naive Threshold System | Outbreak Radar Decision | Statistical Evidence |
|---|---|---|---|---|
| **Quiet Baseline** | 5 scattered baseline stomach upsets | Stays silent | **Stays Silent (All Clear)** | $p > 0.50$, 0 clusters detected |
| **Water Fault** | 9 cases under one block wing | Alerts on entire block | **Localises to Block B Wing 3A** | $p = 0.001$, targeted maintenance dispatch |
| **Mess Food Batch** | 19 cases across 3 blocks + day scholars | Blames residential block | **Identifies Friday Lunch (Mess)** | Relative Risk $RR = 21.1$, $p = 0.0002$ |
| **Coincidence Trap** | 7 cases in Block C purely by chance | **False Alarm (Mass Panic)** | **Holds at WATCH (No Public Alert)** | $p = 0.336$, zero false alarms |

---

## 👥 Contributors & Ownership
Built for Manipal University Jaipur 12-hour hackathon. See [AGENTS.md](./AGENTS.md) for architectural contracts and directory ownership.
