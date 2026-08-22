/**
 * ============================================================================
 *  CAMPUS VIEW — the campus, shaped for the map
 * ============================================================================
 *  The map needs three things the domain model does not hand out together:
 *  where each block stands, how many students live on each of its floors, and
 *  how many of them are currently ill.
 *
 *  Assembling that in the page was duplicated in three places and drifted the
 *  moment one of them changed, so it lives here instead. Both the landing hero
 *  and the dashboard render the same campus because they call the same
 *  function.
 * ============================================================================
 */

import { BLOCKS, blockCapacity } from '@/lib/domain/campus';
import { getBlockRollups, getCases } from '@/lib/db';
import type { MapBlock } from '@/components/radar/campus-map';

/**
 * Abstract isometric position, used when the map is running without imagery.
 *
 * Two clusters — boys' blocks south, girls' north — rather than exact GPS.
 * Real coordinates put the buildings almost on top of each other at this zoom,
 * and a diagram that is honest about being a diagram beats a map you cannot
 * read. The satellite ground is where true positions matter, and it has them.
 */
function gridPosition(index: number, gender: 'boys' | 'girls'): { gx: number; gy: number } {
  if (gender === 'boys') {
    return { gx: index % 4, gy: 4 + Math.floor(index / 4) };
  }
  return { gx: 5 + (index % 4), gy: Math.floor(index / 4) };
}

export function buildMapBlocks(windowHours = 72): MapBlock[] {
  const rollups = getBlockRollups(windowHours);
  const cases = getCases(windowHours);

  // Per-block, per-floor counts. Keyed by the block NAME because that is what
  // a case carries — a case knows it came from "B4 floor 2", not from an id.
  const byFloor = new Map<string, number[]>();
  for (const c of cases) {
    if (!c.blockName || !c.floor) continue;
    const arr = byFloor.get(c.blockName) ?? [];
    arr[c.floor - 1] = (arr[c.floor - 1] ?? 0) + 1;
    byFloor.set(c.blockName, arr);
  }

  let boys = 0;
  let girls = 0;

  return BLOCKS.map((b) => {
    const pos = b.gender === 'boys' ? gridPosition(boys++, 'boys') : gridPosition(girls++, 'girls');
    const roll = rollups.find((r) => r.blockId === b.id);
    const floors = byFloor.get(b.name) ?? [];

    return {
      id: b.id,
      name: b.name,
      gender: b.gender,
      floors: b.floors,
      capacity: blockCapacity(b),
      cases: roll?.cases ?? 0,
      floorCases: Array.from({ length: b.floors }, (_, i) => floors[i] ?? 0),
      lat: b.lat,
      lng: b.lng,
      ...pos,
    };
  });
}
