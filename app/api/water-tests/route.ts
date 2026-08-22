import { NextResponse } from 'next/server';
import { getWaterTests, recordWaterTest } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** GET /api/water-tests?source=tank-B4 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') ?? undefined;
  return NextResponse.json({ ok: true, tests: getWaterTests(source) });
}

/**
 * POST /api/water-tests — log what maintenance actually found.
 *
 * This is the step most systems skip. Without it the software makes a claim
 * and never learns whether it was right; with it, every flagged block ends in a
 * recorded result, which is the only honest way to find out how good the
 * warnings actually are.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.sourceId) {
    return NextResponse.json({ ok: false, error: 'sourceId required' }, { status: 400 });
  }

  const passed =
    body.passed ??
    (!body.coliform && Number(body.chlorine ?? 0) >= 0.2 && Number(body.turbidity ?? 0) < 5);

  const row = recordWaterTest({
    sourceId: body.sourceId,
    testedAt: new Date().toISOString(),
    testedBy: body.testedBy ?? null,
    tds: body.tds ?? null,
    ph: body.ph ?? null,
    chlorine: body.chlorine ?? null,
    turbidity: body.turbidity ?? null,
    coliform: body.coliform ?? null,
    passed: Boolean(passed),
    notes: body.notes ?? null,
  });

  return NextResponse.json({ ok: true, test: row });
}
