import { NextResponse } from 'next/server';
import { buildSituationReport } from '@/lib/domain/surveillance';

export const dynamic = 'force-dynamic';

/** GET /api/situation — the current campus picture. */
export async function GET() {
  return NextResponse.json(buildSituationReport());
}
