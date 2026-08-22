import { buildSituationReport } from '@/lib/domain/surveillance';
import { BLOCKS, blockCapacity } from '@/lib/domain/campus';
import { getBlockRollups } from '@/lib/db';
import { AppShell } from '@/components/neu/shell';
import { RadarClient } from './radar-client';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import type { HeatBlock } from '@/components/radar/campus-heatmap';

export const dynamic = 'force-dynamic';

/**
 * Laid out as two clusters on an isometric grid — boys' blocks to the south,
 * girls' to the north — rather than by exact GPS. Real coordinates put the
 * buildings almost on top of each other at this zoom, and a map you cannot read
 * is worse than a diagram that is honest about being a diagram.
 */
function gridPosition(index: number, gender: 'boys' | 'girls'): { gx: number; gy: number } {
  if (gender === 'boys') {
    return { gx: index % 4, gy: 4 + Math.floor(index / 4) };
  }
  return { gx: 5 + (index % 4), gy: Math.floor(index / 4) };
}

export default async function RadarPage() {
  const session = await getSession();
  if (session?.role === 'student') {
    redirect('/app');
  }

  const report = buildSituationReport();
  const rollups = getBlockRollups(72);

  let boys = 0;
  let girls = 0;

  const heatBlocks: HeatBlock[] = BLOCKS.map((b) => {
    const pos = b.gender === 'boys' ? gridPosition(boys++, 'boys') : gridPosition(girls++, 'girls');
    const roll = rollups.find((r) => r.blockId === b.id);
    return {
      id: b.id,
      name: b.name,
      gender: b.gender,
      cases: roll?.cases ?? 0,
      capacity: blockCapacity(b),
      floors: b.floors,
      ...pos,
    };
  });

  return (
    <AppShell>
      <RadarClient report={report} heatBlocks={heatBlocks} />
    </AppShell>
  );
}
