/**
 * ============================================================================
 *  STATS — the small amount of real maths this project rests on
 * ============================================================================
 */

/* ------------------------------------------------------- Kulldorff LLR --- */

/**
 * Poisson log-likelihood ratio for one candidate zone, conditioned on the
 * total case count. This is the statistic behind SaTScan, which public-health
 * departments actually use.
 *
 * Reads as: how much better does "this zone has a raised rate" explain the data
 * than "the whole campus shares one rate"?
 *
 * Zero when the zone is at or below expectation — we only ever hunt for
 * excesses, never deficits.
 */
export function kulldorffLLR(observed: number, expected: number, total: number): number {
  if (observed <= expected || observed <= 0) return 0;
  if (expected <= 0 || total <= observed) return 0;
  const outsideObs = total - observed;
  const outsideExp = total - expected;
  if (outsideExp <= 0) return 0;
  let llr = observed * Math.log(observed / expected);
  if (outsideObs > 0) llr += outsideObs * Math.log(outsideObs / outsideExp);
  return llr;
}

/* ------------------------------------------ Benjamini-Hochberg FDR ------- */

/**
 * We test ~60 nodes every cycle. At alpha = 0.05 that is roughly three false
 * alarms per run BEFORE anyone is actually sick — which is exactly the
 * cry-wolf failure the brief is asking about. Controlling the false discovery
 * rate is what makes the alerts mean anything.
 *
 * Returns a q-value per input p-value, order preserved.
 */
export function benjaminiHochberg(pValues: number[], q = 0.1): { qValues: number[]; significant: boolean[] } {
  const m = pValues.length;
  if (m === 0) return { qValues: [], significant: [] };

  const idx = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const qValues = new Array<number>(m).fill(1);

  // step-up: enforce monotonicity from the largest p down
  let prev = 1;
  for (let rank = m; rank >= 1; rank--) {
    const { p, i } = idx[rank - 1];
    const adjusted = Math.min(prev, (p * m) / rank);
    qValues[i] = adjusted;
    prev = adjusted;
  }

  return { qValues, significant: qValues.map((v) => v <= q) };
}

/* ------------------------------------------------- Fisher's exact test --- */

function logGamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function logChoose(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

/**
 * One-tailed Fisher's exact test on the 2x2:
 *
 *              sick   well
 *   ate         a      b
 *   didn't      c      d
 *
 * Exact rather than chi-square because our counts are small — often single
 * digits — and chi-square is unreliable down there.
 */
export function fisherExact(a: number, b: number, c: number, d: number): number {
  const n = a + b + c + d;
  if (n === 0) return 1;
  const row1 = a + b;
  const row2 = c + d;
  const col1 = a + c;
  const logDenom = logChoose(n, col1);
  let p = 0;
  const maxA = Math.min(row1, col1);
  for (let x = a; x <= maxA; x++) {
    const y = col1 - x;
    if (y < 0 || y > row2) continue;
    p += Math.exp(logChoose(row1, x) + logChoose(row2, y) - logDenom);
  }
  return Math.min(1, Math.max(0, p));
}

/* ------------------------------------------------------------ helpers --- */

export function relativeRisk(a: number, b: number, c: number, d: number): number {
  const exposed = a + b;
  const unexposed = c + d;
  if (exposed === 0 || unexposed === 0) return 0;
  const arExp = a / exposed;
  const arUn = c / unexposed;
  if (arUn === 0) return arExp > 0 ? Infinity : 0;
  return arExp / arUn;
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Width of the middle 80% of onsets. A sharp point-source exposure gives a
 *  narrow value; a water problem smears out over days. */
export function spread80(xs: number[]): number {
  if (xs.length < 2) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const lo = s[Math.floor(s.length * 0.1)];
  const hi = s[Math.min(s.length - 1, Math.floor(s.length * 0.9))];
  return hi - lo;
}
