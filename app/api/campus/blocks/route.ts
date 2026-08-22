import { NextResponse } from 'next/server';
import { BLOCKS } from '@/lib/domain/campus';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, blocks: BLOCKS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { updates } = body as { updates: { id: string; lat: number; lng: number }[] };

    if (!Array.isArray(updates)) {
      return NextResponse.json({ ok: false, error: 'updates must be an array' }, { status: 400 });
    }

    for (const u of updates) {
      const block = BLOCKS.find((b) => b.id === u.id);
      if (block) {
        block.lat = u.lat;
        block.lng = u.lng;
      }
    }

    return NextResponse.json({ ok: true, blocks: BLOCKS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update block coordinates';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
