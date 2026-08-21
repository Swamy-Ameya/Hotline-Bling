import { NextResponse } from 'next/server';
import { detect } from '@/lib/detect/engine';
import { seedScenario } from '@/lib/seed/scenarios';
import { getStore } from '@/lib/store';

/** Never cache this. Next 16 leaves route handlers uncached by default, but
 *  being explicit costs nothing and this is the one endpoint where a stale
 *  response would be actively misleading. */
export const dynamic = 'force-dynamic';

function run() {
  const store = getStore();
  // A cold start has an empty store. Seed it rather than rendering an empty
  // dashboard just because nobody has hit /api/seed yet.
  if (store.reports.length === 0) seedScenario(store.scenario, new Date());
  const fresh = getStore();
  return detect(fresh.reports, fresh.scenario, new Date(), fresh.confirmedClusters);
}

/** POST /api/detect — run the detection pipeline now. */
export async function POST() {
  return NextResponse.json(run());
}

/** GET /api/detect — same result, convenient for server components. */
export async function GET() {
  return NextResponse.json(run());
}
