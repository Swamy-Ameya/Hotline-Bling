'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Hotspot } from '@/lib/domain/surveillance';
import type { RiskLevel } from '@/lib/domain/risk';

/**
 * Isometric campus heatmap.
 *
 * Drawn as SVG rather than a 3D scene on purpose: it gives real depth, reads
 * instantly, stays sharp at any zoom, works on a cheap phone, and does not pull
 * a rendering engine into the bundle for what is essentially twenty buildings.
 *
 * Height encodes how many students live in a block. Heat encodes how many are
 * ill. A tall dark building is a big healthy block; a glowing one needs a visit.
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

const RISK_FILL: Record<RiskLevel, { top: string; left: string; right: string; glow: string }> = {
  normal: { top: '#dfe5ee', left: '#c3ccdb', right: '#d2dae6', glow: 'transparent' },
  watch: { top: '#fde9b8', left: '#e6c98a', right: '#f2daa2', glow: '#f59e0b' },
  elevated: { top: '#fdc79a', left: '#e09a63', right: '#f0b07e', glow: '#f97316' },
  critical: { top: '#fca5a5', left: '#dc6a6a', right: '#ee8888', glow: '#ef4444' },
};

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
    <div className={cn('relative w-full overflow-hidden rounded-2xl', className)}>
      <svg viewBox="-560 -300 1120 760" className="h-full w-full" role="img" aria-label="Campus heatmap">
        <defs>
          {(['watch', 'elevated', 'critical'] as RiskLevel[]).map((lv) => (
            <radialGradient key={lv} id={`heat-${lv}`}>
              <stop offset="0%" stopColor={RISK_FILL[lv].glow} stopOpacity="0.55" />
              <stop offset="45%" stopColor={RISK_FILL[lv].glow} stopOpacity="0.22" />
              <stop offset="100%" stopColor={RISK_FILL[lv].glow} stopOpacity="0" />
            </radialGradient>
          ))}
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8edf5" />
            <stop offset="100%" stopColor="#dbe2ec" />
          </linearGradient>
          <filter id="soft-shadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="7" stdDeviation="9" floodColor="#8494ad" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* ground plane */}
        <g opacity="0.85">
          {Array.from({ length: 15 }, (_, i) => {
            const a = project(i - 2, -2);
            const b = project(i - 2, 12);
            return <line key={`gx${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#cdd6e3" strokeWidth="1" />;
          })}
          {Array.from({ length: 15 }, (_, i) => {
            const a = project(-2, i - 2);
            const b = project(12, i - 2);
            return <line key={`gy${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#cdd6e3" strokeWidth="1" />;
          })}
        </g>

        {/* heat pools, painted on the ground under the buildings */}
        {drawn
          .filter((b) => b.level !== 'normal')
          .map((b) => (
            <ellipse
              key={`heat-${b.id}`}
              cx={b.bx}
              cy={b.by}
              rx={150}
              ry={90}
              fill={`url(#heat-${b.level})`}
              className="animate-breathe"
            />
          ))}

        {/* buildings */}
        {drawn.map((b, i) => {
          const c = RISK_FILL[b.level];
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
              className="cursor-pointer animate-rise"
              style={{ animationDelay: `${i * 26}ms` }}
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect?.(b.id)}
              filter={active ? 'url(#soft-shadow)' : undefined}
            >
              {/* left face */}
              <polygon
                points={`${b.x - W},${b.y + H} ${b.x},${b.y + 2 * H} ${b.x},${b.y + 2 * H + b.h} ${b.x - W},${b.y + H + b.h}`}
                fill={c.left}
              />
              {/* right face */}
              <polygon
                points={`${b.x},${b.y + 2 * H} ${b.x + W},${b.y + H} ${b.x + W},${b.y + H + b.h} ${b.x},${b.y + 2 * H + b.h}`}
                fill={c.right}
              />
              {/* floor lines, so the height reads as storeys not a slab */}
              {Array.from({ length: b.floors - 1 }, (_, f) => {
                const dy = ((f + 1) * b.h) / b.floors;
                return (
                  <g key={f} opacity="0.28">
                    <line x1={b.x - W} y1={b.y + H + dy} x2={b.x} y2={b.y + 2 * H + dy} stroke="#ffffff" strokeWidth="1" />
                    <line x1={b.x} y1={b.y + 2 * H + dy} x2={b.x + W} y2={b.y + H + dy} stroke="#ffffff" strokeWidth="1" />
                  </g>
                );
              })}
              {/* roof */}
              <polygon
                points={topPts}
                fill={c.top}
                stroke={active ? '#475569' : 'rgba(255,255,255,0.75)'}
                strokeWidth={active ? 1.6 : 1}
              />

              {/* pulse marker on anything that needs attention */}
              {b.level !== 'normal' && (
                <g>
                  <circle cx={b.x} cy={b.y - 14} r="7" fill={c.glow} opacity="0.28" className="animate-pulse-ring" />
                  <circle cx={b.x} cy={b.y - 14} r="4.5" fill={c.glow} />
                </g>
              )}

              <text
                x={b.x}
                y={b.y + H + 5}
                textAnchor="middle"
                className="pointer-events-none select-none"
                fontSize="14"
                fontWeight="700"
                fill={b.level === 'normal' ? '#64748b' : '#7f1d1d'}
              >
                {b.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* hover card */}
      {hovered && (
        <HoverCard block={drawn.find((b) => b.id === hovered)!} hotspot={hotspots.find((h) => h.blockId === hovered)} />
      )}

      <Legend />
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
    <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-xl bg-white/92 px-4 py-3 shadow-lg backdrop-blur-sm animate-rise">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-800">Block {block.name}</span>
        <span className="text-[11px] uppercase tracking-wide text-slate-400">
          {block.gender === 'boys' ? "Boys' hostel" : "Girls' hostel"}
        </span>
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {block.capacity.toLocaleString()} students · {block.floors} floors
      </div>
      {hotspot ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-700">{hotspot.comparison}</p>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {block.cases === 0
            ? 'No reports in the last three days.'
            : `${block.cases} report${block.cases === 1 ? '' : 's'} — within the usual range.`}
        </p>
      )}
    </div>
  );
}

function Legend() {
  const items: { level: RiskLevel; label: string }[] = [
    { level: 'normal', label: 'Normal' },
    { level: 'watch', label: 'Watch' },
    { level: 'elevated', label: 'Elevated' },
    { level: 'critical', label: 'Critical' },
  ];
  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-3 rounded-xl bg-white/85 px-3.5 py-2 text-[11px] font-medium text-slate-500 shadow-sm backdrop-blur-sm">
      {items.map((i) => (
        <span key={i.level} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-[3px]"
            style={{ background: RISK_FILL[i.level].top, outline: '1px solid rgba(0,0,0,0.06)' }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
