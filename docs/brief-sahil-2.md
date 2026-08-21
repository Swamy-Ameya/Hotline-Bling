# Brief 2 — Sahil: go live, deploy, and capture the screenshots

The dashboard looks good. Everything below is about making it real rather than making it prettier.
Do them in this order — 1 and 2 are on the critical path for the deck, the rest are polish.

`git pull --rebase` first. The API is live and tested.

---

## 1. Swap `/radar` off the fixture (highest priority — ~20 minutes)

`app/radar/page.tsx` still calls `fixtureFor()`. The API returns the identical `DetectionResult`
type, so this is a swap, not a rewrite.

```ts
// scenario switch
await fetch('/api/seed', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario }),
});
const result: DetectionResult = await (await fetch('/api/detect', { method: 'POST' })).json();

// "Run detection" button
const result: DetectionResult = await (await fetch('/api/detect', { method: 'POST' })).json();
```

**Keep the fixture import.** Do not delete it — wrap the fetch in try/catch and fall back to
`fixtureFor(scenario)` on failure. If the dev server dies at hour ten while we are capturing
screenshots, that fallback is the difference between a screenshot and an empty page.

The numbers will shift slightly from the fixture values — that is expected. The fixture was a
hand-built stand-in; the engine computes real statistics. Live output right now:

| scenario | what the engine returns |
|---|---|
| `quiet` | no cluster at all, `naiveThresholdWouldAlert: false` |
| `filter_fault` | Filter 3A — Block B, p = 0.001, status `alert` |
| `food` | Fri lunch, RR 21.1, spatial p = 0.88, day scholars affected |
| `coincidence` | Tank C, p = 0.336, status `watch`, naive **would** alert on the same node |

**Done when:** all four scenarios load from the API, the permutation p-values change when you hit
"Run detection", and killing the server falls back to the fixture instead of crashing.

## 2. Deploy to Vercel (~15 minutes, do it today not at hour eleven)

A live, clickable URL on the submission deck is worth more than any single slide. `npm run build`
already passes, and the app needs no database — the store is in-process, so it deploys as-is.

Push, import the repo on Vercel, deploy, and put the URL in the group chat.

**Caveat worth knowing:** serverless functions do not share memory, so a submitted report may not
persist across requests in production. That is fine — every route reseeds deterministically if the
store is empty, so the four scenarios always work. If the live URL ever looks empty, hitting
"Run detection" fixes it.

**Done when:** the URL loads on your phone, on mobile data, with the browser cache cleared.

## 3. Capture the deck screenshots (~20 minutes)

These go straight into the submission, so treat them as a deliverable, not an afterthought.
Save to `deck/assets/screenshots/`, PNG, **1600×900, dark mode, no browser chrome**:

- `radar-filter-fault.png` — Filter 3A flagged and pulsing, sibling 3B visibly cold
- `radar-coincidence.png` — the contrast panel showing a threshold system alerting while we hold at
  watch. **This is the single most important image in the deck.**
- `radar-food.png` — the mess bar lit, cases spread across blocks, day scholars affected
- `radar-quiet.png` — the calm state

Before capturing, check the elevation view actually reads at a glance: can a stranger tell which
filter is hot in under two seconds? If not, that is a colour-ramp problem worth fixing first.

## 4. The quiet state has to look deliberate (~15 minutes)

`quiet` returns `clusters: []` and `topCluster: null`. Right now that risks looking like a page that
failed to load. It is the opposite — it is the system working correctly.

Make it read as a confident all-clear: something like *"No cluster above baseline. 5 scattered
reports across 4 blocks, consistent with ordinary background illness."* plus the elevation view sitting
calm. Render `result.headline` verbatim; it is already written for this.

A judge who sees a broken-looking page on one of four scenarios discounts the other three.

## 5. Mobile pass (~10 minutes)

`/radar` at 375px must not scroll horizontally. The elevation grid can scroll inside its own
container, but the page body must not. Nobody will present on a phone, but a judge may well open the
link on one.

---

**Do not:** add a charting library, add a theme switcher, edit anything in `lib/`, `app/api/`, or
`app/radar/[id]/`. Ping the group chat if you need something changed in those.
