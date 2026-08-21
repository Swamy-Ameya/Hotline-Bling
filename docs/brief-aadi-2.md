# Brief 2 — Aadi: go live, and build the loop that proves the system is trustworthy

The drill-down is genuinely strong — the permutation panel is the right instinct. Everything below
makes it real and then adds the one flow that no competing submission will have.

`git pull --rebase` first. The API is live and tested.

---

## 1. Swap `/radar/[id]` off the fixture (highest priority — ~20 minutes)

`app/radar/[id]/page.tsx` still calls `fixtureFor()`. `GET /api/clusters/[id]` returns the identical
`ClusterDetail` type.

```ts
// Next 16: params is a Promise
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/clusters/${id}`, {
    cache: 'no-store',
  });
  const detail: ClusterDetail = await res.json();
}
```

Cluster ids are `cluster-<scenario>` — `cluster-filter_fault`, `cluster-food`, `cluster-coincidence`.
The route falls back to the current top cluster if the id does not match, so links cannot dead-end.

**Keep the fixture import** as a try/catch fallback. Do not delete it. If the server dies mid
screenshot-capture, that fallback is the difference between an image and an empty page.

**Note:** `quiet` has no cluster at all — `GET` returns 404. Your `quiet-view.tsx` should handle that
as the correct all-clear state, not as an error.

## 2. Wire the buttons that already exist (~30 minutes)

`verdict-card.tsx` and `interventions-panel.tsx` have confirm / dismiss / log-test controls that do
not call anything yet. They now have a real endpoint:

```ts
// confirm — this is the only thing in the system that sends an advisory
await fetch(`/api/clusters/${id}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'confirm' }),   // or 'dismiss' | 'resolve'
});
// -> { ok, status, advisory: { message, cohortNodeId, sentAt }, notified: 14, scopedTo: "301-315" }

// log a water test — this is what closes the loop
await fetch(`/api/clusters/${id}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'intervention',
    kind: 'water_test',
    tds: 412, residualChlorine: 0.05, turbidity: 6.4, coliformPositive: true,
    outcome: 'Filter cartridge past service life.',
    causeCode: 'filter_media_exhausted',
  }),
});
```

On confirm, show what actually happened: **"Advisory sent to 14 students in rooms 301–315"** plus the
message text. The scoping is the point — we notify one filter's rooms, not the whole block, and that
precision is only possible because we localised properly.

## 3. The advisory loop — the best thing you could build today (~45 minutes)

This is the flow that answers *"how do we know your system can be trusted?"*, and I have not seen a
hackathon project do it. The API already supports the whole thing.

The demo, end to end:

1. Warden confirms the Filter 3A cluster → advisory goes to those 14 rooms.
2. A student in **those rooms** now files a report. (Use `/report`, pick a student whose
   `roomFilterId` is `filter-B3A`.)
3. That report comes back with **`prompted: true`**.
4. It appears in the case list, because the student still needs care.
5. It is **excluded from the detection statistic**, so the cluster's p-value does not move.

Surface step 5 explicitly in `case-list.tsx`. A distinct row treatment, and a line of copy that says
why — something like:

> *Filed after this student received our advisory. Counted for care, excluded from detection: an
> alert must not be able to manufacture the evidence for the next alert.*

Add a small counter near the case list: **"12 counted · 3 excluded as prompted"**.

Why this is worth the time: every symptom-reporting system has this failure mode — you warn a block,
the block starts reporting things it would otherwise ignore, the cluster appears to grow, and you
alert harder. It is a rumour amplifier with a p-value attached. We are the only ones who will have
noticed, and showing it working beats describing it on a slide.

## 4. Screenshots (~15 minutes)

Save to `deck/assets/screenshots/`, PNG, **1600×900, dark mode, no browser chrome**:

- `drilldown-permutation.png` — the permutation histogram with the observed cluster marked in the
  tail. Crop tight. **This is the single most important image in the whole submission** — it is our
  answer to the judged Challenge Question.
- `drilldown-verdict.png` — the verdict card on `filter_fault`, showing the stratified meal
  explanation underneath
- `epi-curve-food.png` — `food` scenario, the sharp onset spike with meal markers
- `epi-curve-water.png` — `filter_fault`, the smeared curve. **Capture both at the same scale** —
  side by side they show that curve shape alone separates food from water.
- `report-form-mobile.png` — at 375px width

## 5. `/report` at 375px (~10 minutes)

It has to be completable one-handed in under sixty seconds. That is a real design constraint, not a
nicety: if reporting is slower than telling a warden, nobody uses it and the system has no input.
Time yourself on an actual phone.

---

**Do not:** add a charting library, edit anything in `lib/`, `app/api/`, or `app/radar/page.tsx`.
Ping the group chat if you need something changed in those.
