# Outbreak Radar — design contract

**Read this before you style anything.** It sits alongside `CLAUDE.md` (product ground truth) and
`docs/BUILD-PLAN.md` (what to build next). Where this file and your instincts disagree, this file
wins. Where this file and `CLAUDE.md` §11 disagree, **`CLAUDE.md` wins** — this document extends
that section, it does not replace it.

Two agents and three people build screens here. Without a single written look they produce three
apps wearing the same logo.

---

## 1. The one idea

> **A cold campus is neutral and quiet. Heat exists only where students are ill.**

That is the entire visual system. Everything below is consequence.

It is also a functional claim, not a taste claim. A warden glances at this screen for four seconds
between other work. If chrome, navigation, buttons, charts and branding are all permitted to be
warm, then the four-second glance carries no information and the product has failed at the only
thing it does.

**Test for any new component:** desaturate the screen to greyscale. If you can no longer tell where
the outbreak is, the design is wrong. If you can *still* tell — because of position, height, ring,
or label — the design is right, and colour is doing its proper job of making an already-legible
thing faster to read.

---

## 2. The ramp

Defined once, in `app/globals.css`, as eight stops with three faces each. Read them through
`components/thermal/`, never by hand.

| Stop | Reads as | Meaning | Anchor |
|---|---|---|---|
| `t0` | pale slate | **Absence of signal.** Chromatically dead on purpose | `normal` |
| `t1` | teal-green | Below baseline. Only the engine may assert this | — |
| `t2` | chartreuse | First measurable lift | — |
| `t3` | amber | Something is happening | **`watch`** |
| `t4` | orange | Concentrating | — |
| `t5` | red-orange | Clearly abnormal | **`elevated`** |
| `t6` | deep red | Bad | — |
| `t7` | ember, near-black magenta | Worst on campus | **`critical`** |

Two properties of this ramp are non-obvious and both are load-bearing:

**`t0` has no tint.** The instant "normal" acquires a colour, every healthy block on campus starts
to look mildly sick, and the eye loses its reference point for cold. Resist every urge to make
normal "a nice cool blue".

**`t7` is the darkest stop, not the brightest.** Real thermal renders drive their hottest values to
black-magenta, and a burnt core reads as *worse* than another red at a glance, where a brighter red
just reads as *more red*. This is why the peak of the reference art is almost black.

`t1` is unreachable from `thermalStopFor()`. Teal is a claim — "fewer cases than we expect here" —
and you cannot infer a claim from a share of the maximum. Only `lib/domain/risk.ts` may hand it out.

### Two ramps, deliberately

| Ramp | Use for | Where |
|---|---|---|
| Eight-stop oklch faces | Extruded geometry, where you need lit/shadow face separation | the map |
| Five-bucket Tailwind (`CLAUDE.md` §11, verbatim) | Flat fills — table cells, floor matrices, list rows | everywhere else |

`heatClass()` in `components/thermal/` is the second ramp, unchanged from the agreed contract.
Do not add a third.

---

## 3. Two substrates

The neumorphic system in `app/globals.css` stays. It is the **physical** layer — how surfaces sit
in space. Thermal is the **informational** layer — what is wrong and where. They stack; they never
substitute for each other.

| Layer | Owns | Classes |
|---|---|---|
| Neumorphic | elevation, press physics, page ground | `neu-raised` `neu-inset` `neu-press` `neu-page` |
| Thermal | risk, heat, focal depth | `thermal-glow-*` `thermal-rim` `thermal-dof*` `thermal-breathe` |

A hot card is `neu-raised thermal-glow-critical` — it keeps its shadow **and** gains heat. It does
not trade one for the other. `thermal-glow-*` is authored to include the neumorphic shadow so this
composes correctly; that is why those rules look redundant and why they are not.

**The incandescent rim** (`--thermal-rim`) is the white-hot boundary in the reference art. It is a
1px stroke on the lit face of any block above `watch`, and it is **never a fill**. Filled, it
becomes the brightest thing on the page and steals the glance from `t7`, which is the exact
inversion of what you want.

---

## 4. Where heat is permitted

**Allowed:** the campus map · risk badges and pills · the epi curve's case bars · block cards above
`normal` · the landing hero · notification severity dots · empty-state illustration when the campus
is *not* quiet.

**Forbidden, without exception:** primary and secondary buttons · navigation and tab bars · links ·
focus rings · form fields, labels and validation states · loading spinners and skeletons · the
logo · card borders on non-hot cards · any chart axis, gridline or label · the student bottom tab
bar, including its active state.

A destructive action is a **grey** button with a red *label*, not a red button. There is exactly one
red-filled control class in this product and it is not a button: it is a block in trouble.

**Success is not green.** Green is unclaimed here — `t1` owns the cool end of the ramp, and a green
"Advisory sent" toast sitting next to a teal "below baseline" block teaches the user that the two
mean related things. Confirmations are neutral with a check glyph.

---

## 5. Numbers and words

- `tabular-nums` on every figure, everywhere. Non-negotiable — numbers that reflow while data
  refreshes are unreadable.
- **The UI states sentences, not statistics.** `BUILD-PLAN.md` §0.2: no p-values, attack rates or
  likelihood ratios on any screen. *"16 reports, where we'd normally expect about 1."*
- Headline figure: `text-4xl font-semibold tracking-tight tabular-nums`. One per card, maximum.
- The unit is always adjacent and always smaller — `16` large, `students` small. Never `16 students`
  at one size.
- **Suppression is a glyph, not a number.** Below 3 cases render `<3`, styled identically to a real
  figure so it does not read as missing data. `CLAUDE.md` §7 and India's DPDP Act 2023.
- Sentence case for everything. No ALL-CAPS labels — this is a health surveillance tool, not a
  dashboard template.

---

## 6. Motion

Three behaviours. Adding a fourth needs a conversation.

| Name | What | Means |
|---|---|---|
| `neu-press` | surface sinks under the finger | this is physical |
| `animate-pulse-ring` | discrete ring expanding out | **alarm** — reserve for `critical` |
| `thermal-breathe` | slow 3.4s opacity and scale swell | ambient sustained heat |

`thermal-breathe` is intentionally slower than a heartbeat. Anything faster reads as urgency, and
sustained elevated risk is not urgency — it is a condition. Confusing the two is how a dashboard
trains people to ignore it.

Every rule degrades under `prefers-reduced-motion`, already handled in `globals.css`. Verify it;
do not assume it.

---

## 7. The map

`components/radar/campus-heatmap.tsx` today is a correct isometric SVG with hardcoded hex faces.
It becomes token-driven; it does not get rewritten. `BUILD-PLAN.md` §8 may later replace the
projection with Leaflet satellite tiles — **the thermal language survives that change unaltered**,
because it lives in the fill and the rim, not the projection.

- **Height is occupancy. Colour is illness.** Two channels, never crossed. A tall cold tower is a
  large healthy hostel; a short ember one is a small block in trouble; you can tell them apart
  without consulting the legend. Say this once on screen — `ThermalKeyNote` exists for it.
- **Tilt-shift.** The reference art gets its depth from a shallow focal plane: near and far edges
  fall out of focus and the eye is forced to the middle. `thermal-dof` masks the container edges;
  `thermal-dof-far` / `-near` blur the outer block rows. Never apply either to text.
- **Ground stays neutral.** `--thermal-ground`, `--thermal-grid`. The field the voxels sit on is
  cold by law, which is what makes a single hot block visible from across a room.
- Hover raises the block and reveals the card. It does not change its colour — colour is data.
- The legend is mandatory. An unlabelled heat ramp is decoration, and a warden acting on decoration
  is precisely the failure this product exists to prevent.

---

## 8. Per surface

### `/` landing — the only place that may be beautiful for its own sake

Full-bleed thermal hero: the campus voxel field at rest, `thermal-dof` on, breathing slowly, live
data. If campus is quiet the hero is almost entirely `t0` and **that is the point** — the honest
version of this product is usually cold, and showing that builds more credibility than a permanent
fake emergency. Keep the existing "what this does not do" section; it is the most persuasive block
on the page.

### `/radar` warden dashboard — dense, calm, ranked

Light neumorphic ground. Map at the top with the legend. Below it, hotspots ranked by risk, each a
`neu-raised` card carrying `thermal-glow-*` only if hot. Water tests, mess check and the live case
feed stay neutral, always. The dashboard should look **boring on a quiet day**. If it looks exciting
on a quiet day, it will look identical on a bad one.

### `/radar/[blockId]` — the floor matrix

Flat five-bucket ramp (`heatClass`), not voxels — this is a grid of rooms, and extrusion here
implies a physical height that does not exist. Suppressed cells render `<3`. `BUILD-PLAN.md` §9.1
adds a mess-attendance panel; keep it neutral, it is context and not risk.

### `/doctor` — a clinical form, not a dashboard

Zero decoration. The only heat permitted is a small risk badge on the student's block, so the
clinician knows the context of what they are looking at. Everything else is inputs at comfortable
size. This screen is used under time pressure by someone who did not choose it.

### `/report` and `/app/report` — a phone, in a corridor, one-handed

Touch targets **≥ 44px** — the current symptom chips are ~36px and that is a real defect
(`BUILD-PLAN.md` §7.1). Symptom chips are neutral when unselected and neutral-dark when selected.
**A symptom chip never turns red.** A student picking "vomiting" has not been told they are part of
an outbreak, and colouring their own symptom as danger tells them exactly that.

### `/app` student PWA — the surface that must not leak

Same light neumorphic ground as the dashboard. **Not a separate design language, a separate data
boundary.** `BUILD-PLAN.md` §7: risk levels only, never counts.

- The general campus view is tinted by `RiskLevel` alone — no numbers, no comparison sentence, no
  confidence, no block ranking.
- Pool heat appears only after the student reports, and shows only their own pool.
- Bottom tab bar (`Home · Report · Alerts · Me`), fixed, thumb-reachable, **neutral including its
  active state**.
- One-tap FAB to report. Neutral.
- The only heat a student ever sees is their own block's tint and an advisory addressed to them.

---

## 9. What must not be built

- No third colour ramp. Two exist and they are enough.
- No charting library. Recharts is here (`CLAUDE.md` §12).
- No theme switcher. Dark mode via `dark:` only.
- No 3D engine for the map. Twenty buildings do not justify a renderer in the bundle, and the SVG is
  sharp at any zoom on a cheap phone.
- No colour as the sole carrier of meaning. Every heat state pairs with a label, a glyph or a
  position. Roughly 1 in 12 male students has a red-green deficiency, and this is a health product.
- No red buttons. See §4.
- No warm chrome. See §1.

---

## 10. Build order

Tokens landed first because both surfaces consume them; retrofitting after means doing it twice.

| Step | Work | State |
|---|---|---|
| 1 | Thermal tokens in `globals.css` | **done** |
| 2 | `components/thermal/` primitives | **done** |
| 3 | Point `campus-heatmap.tsx` at the tokens; add rim + DOF | next |
| 4 | Retheme `RiskBadge` / `Surface` glows onto `thermal-glow-*` | next |
| 5 | Landing hero | after 3 |
| 6 | `/app` student surfaces, built thermal-native from the start | after `BUILD-PLAN.md` §2, §3 |
| 7 | Epi curve + floor matrix onto the flat ramp | last |

Steps 3–5 touch only files Aditya owns under `CLAUDE.md` §2. Step 6 must wait for auth and pools,
because there is no student session to design against until those exist.
