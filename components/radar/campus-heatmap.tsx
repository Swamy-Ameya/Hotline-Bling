'use client';

/**
 * Compatibility surface for the campus map.
 *
 * There used to be two map components — an isometric diagram and a Leaflet
 * satellite view — and screens picked one. They are now a single component
 * with three grounds (see campus-map.tsx). This file keeps the old import path
 * working and gives the small previews a sensible default: the abstract model
 * ground, which needs no tiles and stays legible at 220px tall.
 */

import { CampusThermalMap, type MapBlock } from '@/components/radar/campus-map';
import type { Hotspot } from '@/lib/domain/surveillance';

export type HeatBlock = MapBlock;
export { CampusThermalMap };
export type { MapBlock };

export function CampusHeatmap({
  blocks,
  hotspots,
  onSelect,
  selectedId,
  className,
  compact = true,
}: {
  blocks: HeatBlock[];
  hotspots: Hotspot[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  className?: string;
  compact?: boolean;
}) {
  return (
    <CampusThermalMap
      blocks={blocks}
      hotspots={hotspots}
      onSelect={onSelect}
      selectedId={selectedId}
      ground="model"
      className={className}
      compact={compact}
      showChrome={false}
    />
  );
}
