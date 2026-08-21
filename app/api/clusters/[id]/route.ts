import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { detect, mealAssociations, toCaseRow } from '@/lib/detect/engine';
import { getCampus } from '@/lib/seed/campus';
import { seedScenario } from '@/lib/seed/scenarios';
import { addIntervention, getStore, setClusterStatus } from '@/lib/store';
import type { ClusterDetail, Intervention } from '@/lib/types';

export const dynamic = 'force-dynamic';

function currentResult() {
  const store = getStore();
  if (store.reports.length === 0) seedScenario(store.scenario, new Date());
  const fresh = getStore();
  return {
    store: fresh,
    result: detect(fresh.reports, fresh.scenario, new Date(), fresh.confirmedClusters),
  };
}

/** GET /api/clusters/[id] — everything the drill-down screen needs. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Next 16: params is a Promise
  const { store, result } = currentResult();

  const cluster = result.clusters.find((c) => c.id === id) ?? result.topCluster;
  if (!cluster || !result.permutation) {
    return NextResponse.json({ ok: false, error: 'no such cluster' }, { status: 404 });
  }

  const now = new Date();
  const campus = getCampus(now);
  const cutoff = now.getTime() - cluster.windowHours * 3600_000;
  const windowReports = store.reports.filter(
    (r) => r.onsetTime.getTime() >= cutoff && r.onsetTime.getTime() <= now.getTime(),
  );

  // A food cluster's cases are defined by who ate the meal, not by geography,
  // so the case list is scoped differently for the two hypotheses.
  const inCluster = new Set(cluster.caseIds);
  const relevant =
    cluster.hypothesis === 'food'
      ? windowReports.filter((r) => !cluster.mealId || r.mealsEaten.includes(cluster.mealId))
      : windowReports.filter((r) => inCluster.has(r.id));

  /**
   * Identities are revealed to doctors and to nobody else. Wardens see
   * pseudonyms and aggregates. Under the DPDP Act 2023 health data is sensitive
   * personal data, and a warden who can read "Room 214" already knows the name.
   * Redaction happens here, once, on the server — never in the UI.
   */
  const role = (await cookies()).get('role')?.value ?? 'warden';
  const revealIdentity = role === 'doctor';

  const detail: ClusterDetail = {
    cluster,
    cases: relevant.map((r) => toCaseRow(campus, r, revealIdentity)),
    epiCurve: result.epiCurve,
    permutation: result.permutation,
    interventions: store.interventions
      .filter((i) => i.clusterId === cluster.id)
      .map(
        (i): Intervention => ({
          id: i.id,
          clusterId: i.clusterId,
          kind: i.kind,
          tds: i.tds,
          residualChlorine: i.residualChlorine,
          turbidity: i.turbidity,
          coliformPositive: i.coliformPositive,
          outcome: i.outcome,
          causeCode: i.causeCode,
          performedBy: i.performedBy,
          performedAt: i.performedAt.toISOString(),
        }),
      ),
    mealTable: mealAssociations(campus, windowReports, now).slice(0, 6),
  };

  return NextResponse.json(detail);
}

const ACTIONS = { confirm: 'confirmed', dismiss: 'dismissed', resolve: 'resolved' } as const;

/** POST /api/clusters/[id] — confirm, dismiss, or log an intervention.
 *
 *  Confirmation is a human act on purpose. Nothing reaches a student until a
 *  warden or doctor says so; automated public-health alerts fired off
 *  unverified reports are how you panic a campus. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body?.action as string | undefined;

  if (action && action in ACTIONS) {
    const status = ACTIONS[action as keyof typeof ACTIONS];
    setClusterStatus(id, status);
    return NextResponse.json({ ok: true, status });
  }

  if (action === 'intervention') {
    // Closing the loop. The cause code is the ground-truth label that lets us
    // measure our own precision later instead of guessing at it.
    addIntervention({
      id: `int-${Date.now()}`,
      clusterId: id,
      kind: body.kind ?? 'water_test',
      tds: body.tds ?? null,
      residualChlorine: body.residualChlorine ?? null,
      turbidity: body.turbidity ?? null,
      coliformPositive: body.coliformPositive ?? null,
      outcome: body.outcome ?? null,
      causeCode: body.causeCode ?? null,
      performedBy: body.performedBy ?? 'Warden',
      performedAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 });
}
