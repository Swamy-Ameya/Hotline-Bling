'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Hotspot } from '@/lib/domain/surveillance';
import type { RiskLevel } from '@/lib/domain/risk';
import { facesForRisk, isHot, ThermalLegend, ThermalKeyNote } from '@/components/thermal';

/**
 * Isometric campus heatmap.
 *
 * Drawn as SVG rather than a 3D scene on purpose: it gives real depth, reads
 * instantly, stays sharp at any zoom, works on a cheap phone, and does not pull
 * a rendering engine into the bundle for what is essentially twenty buildings.
 *
 * Height encodes how many students live in a block. Heat encodes how many are
 * ill. A tall cold tower is a big healthy block; a glowing one needs a visit.
 */

const ISO_X = 0.86;
const ISO_Y = 0.5;

function project(gx: number, gy: number, gz = 0): [number, number] {
  return [(gx - gy) * ISO_X * 46, (gx + gy) * ISO_Y * 46 - gz];
}

export interface HeatBlock {
  id: string;
  name: string;
  gender: 'boys' | 'girls';
  cases: number;
  capacity: number;
  floors: number;
  gx: number;
  gy: number;
}

function levelFor(cases: number, hotspots: Hotspot[], id: string): RiskLevel {
  const h = hotspots.find((x) => x.blockId === id);
  if (h) return h.level;
  return 'normal';
}

export function CampusHeatmap({
  blocks,
  hotspots,
  onSelect,
  selectedId,
  className,
}: {
  blocks: HeatBlock[];
  hotspots: Hotspot[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  className?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const drawn = useMemo(() => {
    return blocks
      .map((b) => {
        const level = levelFor(b.cases, hotspots, b.id);
        // Height from occupancy, so the skyline is honest about who lives where.
        const h = 26 + b.floors * 13;
        const [x, y] = project(b.gx, b.gy, h);
        const [bx, by] = project(b.gx, b.gy, 0);
        return { ...b, level, h, x, y, bx, by };
      })
      // Painter's algorithm: things further back get drawn first.
      .sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  }, [blocks, hotspots]);

  const W = 46 * ISO_X;
  const H = 46 * ISO_Y;

  return (
    <div className={cn('relative w-full overflow-hidden rounded-2xl flex flex-col', className)}>
      <div className="relative flex-1 w-full overflow-hidden">
        <svg
          viewBox="-560 -300 1120 760"
          className="h-full w-full"
          role="img"
          aria-label="Campus thermal heatmap"
        >
          <defs>
            <radialGradient id="heat-watch">
              <stop offset="0%" stopColor="var(--t3-top)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="var(--t3-top)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--t3-top)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-elevated">
              <stop offset="0%" stopColor="var(--t5-top)" stopOpacity="0.5" />
              <stop offset="50%" stopColor="var(--t5-top)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--t5-top)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-critical">
              <stop offset="0%" stopColor="var(--t7-top)" stopOpacity="0.65" />
              <stop offset="45%" stopColor="var(--t6-top)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--t5-top)" stopOpacity="0" />
            </radialGradient>

            <filter id="soft-shadow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#8494ad" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* ground plane grid */}
          <g opacity="0.75">
            {Array.from({ length: 15 }, (_, i) => {
              const a = project(i - 2, -2);
              const b = project(i - 2, 12);
              return (
                <line
                  key={`gx${i}`}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke="#d2dbe7"
                  strokeWidth="1"
                />
              );
            })}
            {Array.from({ length: 15 }, (_, i) => {
              const a = project(-2, i - 2);
              const b = project(12, i - 2);
              return (
                <line
                  key={`gy${i}`}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke="#d2dbe7"
                  strokeWidth="1"
                />
              );
            })}
          </g>

          {/* heat pools, painted on the ground under hot buildings */}
          {drawn
            .filter((b) => isHot(b.level))
            .map((b) => (
              <ellipse
                key={`heat-${b.id}`}
                cx={b.bx}
                cy={b.by}
                rx={160}
                ry={95}
                fill={`url(#heat-${b.level})`}
                className="thermal-breathe"
              />
            ))}

          {/* buildings (thermal voxels) */}
          {drawn.map((b, i) => {
            const faces = facesForRisk(b.level);
            const hot = isHot(b.level);
            const active = hovered === b.id || selectedId === b.id;
            const topPts = [
              [b.x, b.y],
              [b.x + W, b.y + H],
              [b.x, b.y + 2 * H],
              [b.x - W, b.y + H],
            ]
              .map((p) => p.join(','))
              .join(' ');

            return (
              <g
                key={b.id}
                className="cursor-pointer animate-rise transition-transform"
                style={{ animationDelay: `${i * 24}ms` }}
                onMouseEnter={() => setHovered(b.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(b.id)}
                filter={active ? 'url(#soft-shadow)' : undefined}
              >
                {/* left face — in shadow */}
                <polygon
                  points={`${b.x - W},${b.y + H} ${b.x},${b.y + 2 * H} ${b.x},${b.y + 2 * H + b.h} ${b.x - W},${b.y + H + b.h}`}
                  fill={faces.left}
                />
                {/* right face — turned away */}
                <polygon
                  points={`${b.x},${b.y + 2 * H} ${b.x + W},${b.y + H} ${b.x + W},${b.y + H + b.h} ${b.x},${b.y + 2 * H + b.h}`}
                  fill={faces.right}
                />

                {/* floor division lines */}
                {Array.from({ length: b.floors - 1 }, (_, f) => {
                  const dy = ((f + 1) * b.h) / b.floors;
                  return (
                    <g key={f} opacity="0.35">
                      <line
                        x1={b.x - W}
                        y1={b.y + H + dy}
                        x2={b.x}
                        y2={b.y + 2 * H + dy}
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      <line
                        x1={b.x}
                        y1={b.y + 2 * H + dy}
                        x2={b.x + W}
                        y2={b.y + H + dy}
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}

                {/* roof (lit top face with incandescent rim on hot nodes) */}
                <polygon
                  points={topPts}
                  fill={faces.top}
                  stroke={hot ? 'var(--thermal-rim)' : active ? '#334155' : 'rgba(255,255,255,0.75)'}
                  strokeWidth={hot ? 1.5 : active ? 1.5 : 1}
                />

                {/* pulse alarm on active hotspots */}
                {hot && (
                  <g>
                    <circle
                      cx={b.x}
                      cy={b.y - 14}
                      r="8"
                      fill={faces.top}
                      opacity="0.3"
                      className="animate-pulse-ring"
                    />
                    <circle cx={b.x} cy={b.y - 14} r="4.5" fill={faces.top} stroke="#ffffff" strokeWidth="1" />
                  </g>
                )}

                {/* Block label */}
                <text
                  x={b.x}
                  y={b.y + H + 5}
                  textAnchor="middle"
                  className="pointer-events-none select-none text-[13px] font-bold"
                  fill={b.level === 'critical' ? '#ffffff' : b.level === 'normal' ? '#475569' : '#1e293b'}
                >
                  {b.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* hover tooltip card */}
        {hovered && (
          <HoverCard
            block={drawn.find((b) => b.id === hovered)!}
            hotspot={hotspots.find((h) => h.blockId === hovered)}
          />
        )}
      </div>

      {/* Heatmap Footer Legend & Keynote */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/50 bg-white/70 px-4 py-2.5 backdrop-blur-md">
        <ThermalKeyNote />
        <ThermalLegend />
      </div>
    </div>
  );
}

function HoverCard({
  block,
  hotspot,
}: {
  block: HeatBlock & { level: RiskLevel };
  hotspot?: Hotspot;
}) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-xl bg-white/95 px-4 py-3 shadow-xl border border-slate-200/80 backdrop-blur-md animate-rise z-20">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-900">Block {block.name}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {block.gender === 'boys' ? "Boys' hostel" : "Girls' hostel"}
        </span>
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {block.capacity.toLocaleString()} students · {block.floors} floors
      </div>
      {hotspot ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-800 font-medium">
          {hotspot.comparison}
        </p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {block.cases === 0
            ? 'No reports in the last three days.'
            : `${block.cases} report${block.cases === 1 ? '' : 's'} — within the normal range.`}
        </p>
      )}
    </div>
  );
}
