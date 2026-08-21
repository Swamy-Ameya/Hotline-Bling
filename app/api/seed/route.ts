import { NextResponse } from 'next/server';
import { seedScenario } from '@/lib/seed/scenarios';
import type { ScenarioId, SeedResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

const VALID: ScenarioId[] = ['quiet', 'filter_fault', 'food', 'coincidence'];

/** POST /api/seed  { scenario } — wipe and regenerate the demo dataset. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const scenario = body?.scenario as ScenarioId | undefined;

  if (!scenario || !VALID.includes(scenario)) {
    return NextResponse.json(
      { ok: false, error: `scenario must be one of: ${VALID.join(', ')}` },
      { status: 400 },
    );
  }

  const result = seedScenario(scenario, new Date());
  const payload: SeedResponse & { note: string } = {
    ok: true,
    scenario,
    students: result.students,
    reports: result.reports.length,
    days: result.days,
    note: result.note,
  };
  return NextResponse.json(payload);
}
