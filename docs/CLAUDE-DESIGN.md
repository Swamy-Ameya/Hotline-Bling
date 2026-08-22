# Outbreak Radar — design contract

**Read this before you style anything.** It sits alongside `CLAUDE.md` (product ground truth) and
`docs/BUILD-PLAN.md` (what to build next). Where this file and your instincts disagree, this file
wins.

Two agents and three people build screens here. Without a single written look they produce three
apps wearing the same logo.

> **Revision — thermal editorial.** The neumorphic layer this document used to describe is gone.
> Soft shadows, 16px radii and raised surfaces have been replaced by paper, hairlines and square
> corners. `CLAUDE.md` §11 has been updated to match; where you find an older copy of either
> document, this one is current.

---

## 1. The one idea

> **The interface is paper. Heat exists only where students are ill.**

That is the entire visual system. Everything below is consequence.

It is also a functional claim, not a taste claim. A warden glances at this screen for four seconds
between other work. If chrome, navigation, buttons, charts and branding are all permitted to be
warm, then the four-second glance carries no information and the product has failed at the only
thing it does.

**Test for any new component:** desaturate the screen to greyscale. If you can no longer tell where
the outbreak is, the design is wrong. If you can *still* tell — because of position, height, rim or
label — the design is right, and colour is doing its proper job of making an already-legible thing
faster to read.

**Corollary, and the harder half:** *the default component must be boring.* An empty panel is
off-white, a 1px rule and black type. If a blank panel already looks exciting, a hot one has
nowhere left to go.

---

## 2. Foundation

Neutrals first. The interface lives almost entirely inside these.

```css
--paper: #F3F2EF;   --paper-bright: #F8F7F4;  --paper-sunk: #EAE9E4;
--ink:   #171717;   --ink-soft:     #383838;  --muted:      #777777;
--line:  #A9A9A4;   --line-light:   #D6D5D0;
```

Available as Tailwind utilities: `bg-paper`, `text-ink`, `text-muted-ink`, `border-line-light`.

**Radii are zero.** `--radius: 0px`, and the `radius-*` scale is pinned at 0–2px. Cards are printed
technical panels, not app tiles. The moment one component has a 12px corner it stops belonging here.

**Shadows do not exist.** Depth comes from the map's geometry, not from the chrome. A panel that
needs separating from the page gets a border, or a different ground.

---

## 3. The ramp

Defined once, in `app/globals.css`, as eight stops with three faces each (`top` lit, `right` turned
away, `left` in shadow). Read them through `components/thermal/`, never by hand.

| Stop | Reads as | Meaning | Anchor |
|---|---|---|---|
| `t0` | warm grey | **Absence of signal.** Chromatically dead on purpose | `normal` |
| `t1` | brighter grey | Below baseline. Only the engine may assert this | — |
| `t2` | yellow | First measurable lift | — |
| `t3` | amber | Something is happening | **`watch`** |
| `t4` | orange | Concentrating | — |
| `t5` | red | Clearly abnormal | **`elevated`** |
| `t6` | deep red | Bad | — |
| `t7` | crimson | Worst on campus | **`critical`** |

Three properties are non-obvious and all three are load-bearing:

**`t0` has no tint.** The instant "normal" acquires a colour, every healthy block on campus starts
to look mildly sick and the eye loses its reference for cold. Resist every urge to make normal "a
nice cool blue" — cool would also fight the warm paper.

**`t7` is dense, not bright.** The eye reads a dark saturated mass with an incandescent rim as
hotter than any further red, which is how thermal imagery actually behaves. A brighter red just
reads as *more red*.

**`t1` is unreachable from `thermalStopFor()`.** "Fewer cases than we expect here" is a claim, and
you cannot infer a claim from a share of the maximum. Only `lib/domain/risk.ts` may hand it out.

**The incandescent rim** (`--thermal-rim`, `#FFF1A8`) is the white-hot boundary in the reference
art. It is a 1px stroke, or a 5px core marker, on anything above `watch` — and it is **never a
fill**. Filled, it becomes the brightest thing on the page and steals the glance from `t7`, which is
the exact inversion of what you want.

There is one ramp. `heatStyle(share)` gives you a flat fill for table cells and floor bars from the
same tokens the map uses. Do not add a second.

---

## 4. Where heat is permitted

**Allowed:** the campus map and its heat fields · risk badges · the epi curve's bars · attack-rate
bars · a panel *border* above `normal` · the landing status band · advisory severity marks · the
dispatch console's route strip.

**Forbidden, without exception:** navigation and tab bars, including active states · links · focus
rings · form fields, labels and validation states · loading spinners and skeletons · the wordmark ·
borders on non-hot panels · any chart axis, gridline or tick label · section headings.

**Exactly one red control exists.** `NeuButton variant="critical"` is used for **Send advisory** and
nothing else. That button is the act of declaring an outbreak to human beings, which is the single
most consequential thing anyone can do in this product, and it should look like it. Every other
destructive or primary action is `variant="primary"` — solid ink. If you find yourself reaching for
`critical` a second time, you are wrong.

**Success is not green.** Green is unclaimed here. Confirmations are neutral: a small square mark
and a sentence.

---

## 5. Type

One grotesk (Inter) and one mono (Geist Mono). The mono is for metadata where fixed width does real
work — timestamps, coordinates, registration numbers — and nowhere else.

| Class | Use | Spec |
|---|---|---|
| `.display` | headlines | 800, uppercase, `-0.042em`, `line-height: 0.92` |
| `.eyebrow` | section labels | 11px, 600, uppercase, `0.18em` |
| `.meta` | instrument metadata | mono, 10px, uppercase, `0.12em` |
| `.numeral` | figures | 800, tabular, `-0.05em` |

**Uppercase labels are part of this system.** An earlier revision banned them; that was a rule for a
softer product than this one turned out to be. Uppercase is confined to `.eyebrow`, `.meta`,
buttons and status marks — never to body copy, never to a headline that is a sentence, and never to
anything a student reads under stress.

- `tabular-nums` on every figure, everywhere. Non-negotiable.
- **The number is the graphic.** `184` enormous, `REPORTS` small underneath. Never `184 reports` at
  one size — see the `Stat` primitive, which enforces the order.
- **The UI states sentences, not statistics.** No p-values, likelihood ratios or attack rates in
  running copy. *"14 reports, where we'd normally expect about 1."* Attack rate appears exactly
  once, in the evidence section, labelled and explained.
- **Suppression is a glyph, not a number.** Below 3 cases render `<3`, styled identically to a real
  figure so it does not read as missing data. `CLAUDE.md` §7 and India's DPDP Act 2023.

---

## 6. Motion

Animation communicates physical state. Nothing bounces, nothing flies in from the left.

| Name | What | Means |
|---|---|---|
| `thermal-breathe` | 5.5s opacity + scale swell | ambient sustained heat |
| `animate-pulse-ring` | 3.4s ring expanding out | **alarm** — reserve for hot blocks |
| `thermal-scan` | 13s band crossing the map | the system is still watching |
| `live-pulse` | 2.5s dot fade | the tiny LIVE indicator, and only that |
| `animate-rise` | 0.6s 10px settle | content resolving on load |

`thermal-breathe` is deliberately slower than a heartbeat. Anything faster reads as urgency, and
sustained elevated risk is not urgency — it is a condition. Confusing the two is how a dashboard
trains people to ignore it.

Page load resolves in strata: layout, then map geometry, then heat, then metadata. Everything fading
in at once tells the reader nothing about what matters.

Every rule degrades under `prefers-reduced-motion`, already handled in `globals.css`. Verify it;
do not assume it.

---

## 7. The map

`components/radar/campus-map.tsx`. One component, three grounds — `satellite`, `plan`, `model` —
and identical geometry on all three, so nobody has to re-learn the picture when they switch.

There used to be two maps and a toggle. That was the wrong split: the diagram knew the shape of the
buildings and nothing about where they are; the Leaflet view knew where they are and nothing about
how many students live on which floor. The geometry now sits **on** the map, anchored to real
coordinates and re-projected on every pan.

Three layers, always in this order:

1. **Heat field** — large, diffuse, irregular, breathing. Rotation and eccentricity are hashed from
   the block id so contours are organic but stable; a field that reshuffles on render reads as noise.
2. **Geometry** — one extruded slab per floor, each coloured by its own reports. Reading down that
   column is how you tell a bad tank (every floor warm) from a bad floor (one warm, rest cold).
3. **Core signal** — the incandescent rim and a 5px marker, only on blocks that are actually hot.

Rules:

- **Height is occupancy. Colour is illness.** Two channels, never crossed. A tall cold tower is a
  large healthy hostel; a short crimson one is a small block in trouble. Say it once on screen.
- **The ground is drained of colour** — satellite tiles are filtered to `saturate(0.18)`. Every warm
  pixel on that screen has to be a measurement, and a satellite tile is full of greens and browns
  that compete with the signal.
- **A floor below 3 cases renders `<3`** in the readout, same as everywhere else.
- **Supply lines are drawn only for the block under inspection**, and the line the assessment blames
  is the only one in colour. Nineteen tanks and two kitchens wired to everything is a diagram nobody
  can read.
- **Selection dims the rest.** Focus lens, not a modal — the interface stays spatially connected.
- The legend is mandatory. An unlabelled heat ramp is decoration, and a warden acting on decoration
  is precisely the failure this product exists to prevent.

---

## 8. Per surface

Every page follows the same rhythm: **quiet → dense → quiet.** A section is a hairline rule and a
numbered eyebrow, never a box. If you are about to add a fourth bordered card to a row, stop.

### `/` landing

Editorial hero: four columns of type, eight of live map. The map carries roughly two thirds of the
visual weight and the copy is a caption for it. If campus is quiet the field is almost entirely
`t0` and **that is the point** — the honest version of this product is usually cold, and showing
that builds more credibility than a permanent fake emergency. Keep "what this does not do"; it is
the most persuasive block on the page.

### `/radar` warden dashboard

Five sections, answering in order: what is happening · where · what to do · why we believe it · what
came in. It used to be eleven equal-sized cards all shouting at the same volume.

The dashboard should look **boring on a quiet day**. If it looks exciting on a quiet day, it will
look identical on a bad one.

### `/radar/[blockId]`

The floor column is the whole point of this page. Flat bars from the shared ramp, suppressed cells
as `<3`, tank tests and mess turnout kept neutral — they are context, not risk.

### `/doctor`

Zero decoration. Four numbered steps, square inputs, and no colour at all. This screen is used under
time pressure by someone who did not choose it.

### `/app/report` and the student PWA

Touch targets **≥ 44px**. Symptom chips are neutral when unselected and solid ink when selected.
**A symptom chip never turns red.** A student picking "vomiting" has not been told they are part of
an outbreak, and colouring their own symptom as danger tells them exactly that.

`/app` is not a separate design language — it is a separate **data boundary**. Risk levels only,
never counts. The only heat a student ever sees is their own block's tint and an advisory addressed
to them.

---

## 9. Dispatch

The dispatch console is the one screen where the design has a policy job.

Before the button, in this order: the **supply line** being blamed, and the **recipient count**
against the campus population. A warden who can see "112 students on two floors, not 4,000" will
press it; one who cannot, won't — and an advisory nobody is willing to send is the same as no
system at all.

Show the spared number as loudly as the notified one. "Deliberately not notified: 4,628" is a claim
about restraint, and restraint is the product.

---

## 10. What must not be built

- No second colour ramp. One exists and it is enough.
- No charting library. The figures are hand-drawn SVG on purpose — a library's defaults (rounded
  bars, blue palette, axis chrome, drop shadows) would quietly reintroduce everything this system
  removed. Recharts remains available for anything genuinely complex.
- No theme switcher. The dark tokens exist as a thermal night mode and are wired to `.dark`.
- No 3D engine. Nineteen buildings do not justify a renderer in the bundle, and SVG stays sharp at
  any zoom on a cheap phone.
- No glassmorphism, no gradient text, no floating cards, no icon on every nav item.
- No colour as the sole carrier of meaning. Every heat state pairs with a label, a glyph or a
  position. Roughly 1 in 12 male students has a red-green deficiency, and this is a health product.
- No warm chrome. See §1.
