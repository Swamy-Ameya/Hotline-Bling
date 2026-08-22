# Claude Design brief — Outbreak Radar product screens

Companion to `deck/claude-design-prompt.md` (which is the *pitch deck*). This one is the **product**:
the warden dashboard and the student app, in the thermal art style.

The look it produces is specified in `docs/CLAUDE-DESIGN.md` and already implemented as tokens in
`app/globals.css` (`--t0..--t7`) and primitives in `components/thermal/`. **The mockups and the code
must not drift** — if Claude Design returns something better than the spec, update the spec and the
tokens, do not fork the palette.

**Attach the two thermal reference images** (the voxel heat-terrain renders) plus these existing
screenshots from `deck/assets/screenshots/`: `radar-filter-fault.png` · `radar-quiet.png` ·
`drilldown-verdict.png` · `report-form-mobile.png`.

**Two passes.** Ask for the warden dashboard artboards first, review, then the student app on the
same canvas. Do not request all fourteen at once.

---

## PASTE FROM HERE

Design the product screens for **Outbreak Radar**, a hostel micro-outbreak early-warning system for
an Indian university campus (Manipal University Jaipur, ~4,900 students, 19 hostel blocks, two
messes). Assume I know nothing has been designed yet; everything you need is in this brief.

### What the product does

Food and water-borne outbreaks in Indian hostels go unnoticed until 15–20 students are sick over two
or three days, because complaints scatter across a warden, a campus clinic and a WhatsApp group and
nobody joins them up. This system collects symptom reports from two streams — a doctor logging
consultations at the health centre, and students self-reporting on their phones — attaches them to
the hostel's water and mess supply structure, and finds where illness concentrates. A warden sees
where it is concentrating and what to check first. A human, never the system, presses the button
that sends an advisory to students.

### The one visual idea — this governs everything

**A cold campus is neutral and quiet. Heat exists only where students are ill.**

Warm colour is reserved, absolutely, for sickness. All chrome, navigation, buttons, links, form
fields, focus rings, tabs, spinners, chart axes and gridlines are cool neutrals — slate, zinc, warm
grey. There are no red buttons anywhere in this product. A destructive action is a grey button with
a red *label*.

Test every screen you produce: desaturate it to greyscale. If you can no longer tell where the
outbreak is, it is wrong.

### The heat ramp — use these exact values

Eight stops, cold to incandescent, in oklch:

```
t0  oklch(0.940 0.012 200)   pale slate — ABSENCE of signal, must stay chromatically dead
t1  oklch(0.900 0.090 168)   teal-green — below baseline
t2  oklch(0.920 0.140 108)   chartreuse — first measurable lift
t3  oklch(0.870 0.160 82)    amber      — WATCH
t4  oklch(0.790 0.185 55)    orange
t5  oklch(0.680 0.205 33)    red-orange — ELEVATED
t6  oklch(0.550 0.195 15)    deep red
t7  oklch(0.420 0.155 358)   ember, near-black magenta — CRITICAL
```

Plus an incandescent rim `oklch(0.985 0.055 88)`, used only as a 1px stroke on the lit face of hot
blocks — never as a fill.

Two things about this ramp are deliberate and I do not want them "improved":

- **t0 has no tint.** The moment normal acquires a colour, every healthy block starts to look mildly
  sick. Do not make it a nice cool blue.
- **t7 is the darkest stop, not the brightest.** Thermal renders drive their hottest values to
  black-magenta, and a burnt core reads as worse than another red. This is why the peak of the
  attached reference art is almost black.

### The art style

Match the attached reference renders: an **isometric voxel heat-terrain**. Extruded cubes on a
neutral ground plane, lit from the upper left so each block shows three faces — a bright top, a
mid-tone right face, a shadowed left face. Tilt-shift depth of field: the near and far edges of the
field fall softly out of focus so the eye is pushed to the middle. A thin white-hot rim marks the
boundary between hot and cold ground.

Semi-realistic, not cartoon. It should look like a rendered thermal scan of a real place, not an
illustration of one.

**Height means occupancy. Colour means illness.** Two independent channels, never crossed. A tall
cold tower is a large healthy hostel; a short ember one is a small block in trouble.

### The substrate

Everything sits on a **light neumorphic ground** — a very slightly cool off-white (`#eef1f6`), with
raised cards carrying soft dual shadows (light from upper-left, shadow to lower-right) and inset
wells for inputs. Radius is generous, around 12–16px. This is the physical layer: it says how
surfaces sit in space. The thermal layer sits on top of it and says what is wrong. A hot card keeps
its soft shadow *and* gains a heat glow — it does not swap one for the other.

Do not make anything dark. Do not add a dark hero. The light substrate is settled.

### Typography and numbers

Plus Jakarta Sans / Inter. Sentence case everywhere — no ALL-CAPS labels. Every figure is
tabular-lining. One headline figure per card at most, large and tight-tracked, with its unit
adjacent and smaller: `16` big, `students` small, never both at one size.

**The interface states sentences, not statistics.** No p-values, attack rates or likelihood ratios
appear on any screen. The headline on a hot block is *"16 reports, where we'd normally expect about
1."* Reasoning is statistical; output is a sentence a warden can act on.

Where a cell would show fewer than 3 cases, it shows `<3` instead, styled exactly like a real number
so it does not read as missing data. This is a privacy floor — in a hostel, "1 case on floor 2"
identifies a specific person.

---

## PASS ONE — warden dashboard (8 artboards, 1440×1024 desktop)

1. **`/` landing.** Full-bleed thermal hero: the campus voxel field at rest with tilt-shift, live and
   breathing slowly. Below it, in three plain sentences, what the system does. Then an honest "what
   this does not do" section — no SMS infrastructure, no automatic alerts, no diagnosis. Show the
   hero in its *quiet* state, almost entirely t0, because that is the honest resting state.
2. **`/radar` dashboard, quiet day.** Isometric campus map with legend, ranked hotspot list below,
   water tests, mess check, live case feed. Everything cold. This must look boring.
3. **`/radar` dashboard, outbreak.** Same layout, one block at t7 with the rim and a slow pulse, two
   neighbours at t4–t5. The contrast between artboards 2 and 3 is the single most important thing in
   this whole set — make them the same composition so only the heat changes.
4. **Hotspot card, detail.** A raised card carrying a critical glow: block name, the plain-sentence
   headline, likely source (block water vs mess food), confidence as three small bars, and a "what to
   check first" line.
5. **`/radar/[blockId]` block detail.** Floor-by-floor room matrix as a *flat* grid — no voxels here,
   these are rooms and extrusion would imply a height that does not exist. Five-step flat heat ramp.
   Several cells reading `<3`. Below it, tank water test history and mess attendance for 72 hours.
6. **The epi curve.** A case-count-over-time bar chart, bars on the heat ramp, axes and gridlines
   strictly neutral. Two variants side by side: a sharp narrow spike labelled "consistent with a
   single meal", and a smeared wide one labelled "consistent with a water source".
7. **Send advisory.** The confirmation moment: which block, how many students, the exact message
   text, and a grey button reading "Send advisory" with a red label. Include the line that makes the
   ethics legible: reports filed *after* an advisory are excluded from the next assessment.
8. **`/doctor` console.** A clinical intake form — student lookup, symptom picker, diagnosis,
   prescription. Zero decoration. The only warm element on the entire screen is a small risk badge
   showing the state of that student's block.

## PASS TWO — student app (6 artboards, 390×844 mobile)

This is an installable PWA, so draw it without browser chrome, as an app on a home screen.

The governing constraint: **a student must never see campus case counts.** They see risk *levels*,
their own pool's spread, and advisories addressed to them. Never exact numbers, never other
students' rooms, never which block is worst.

9. **Login.** Role picker, then a registration number field (`2502050001`) and a 4-digit PIN, with a
   "Use demo student" one-tap button.
10. **`/app` home.** The campus map, drastically simplified for a phone, tinted by risk level with
    **no numbers at all**. Their own block called out. A floating one-tap report button. A fixed
    bottom tab bar: Home · Report · Alerts · Me — entirely neutral, including its active state.
11. **`/app/report`.** Symptom selection as chips at ≥44px touch targets. Chips are neutral when
    unselected and neutral-dark when selected — **a symptom chip never turns red**, because a student
    tapping "vomiting" has not been told they are part of an outbreak.
12. **Report submitted.** Neutral confirmation, no green. Explains they have been placed in the
    "stomach illness" group and can now see how that illness is spreading.
13. **`/app/pool`.** Heat spread for their own illness group only, levels not counts.
14. **`/app/alerts`.** A push notification arriving on the lock screen — *"Suspected outbreak near
    you — Block B4"* — and beside it the opened advisory, scoped to their block, with what to do and
    what not to worry about.

Give me each artboard clean, labelled with its route, and keep the composition consistent between
the two dashboard states so the difference reads instantly.
