'use client';

/**
 * ============================================================================
 *  CAMPUS THERMAL MAP
 * ============================================================================
 *  One map, three grounds.
 *
 *  Earlier there were two maps — an abstract isometric diagram and a separate
 *  Leaflet satellite view — and a toggle between them. That was the wrong
 *  split: the diagram knew the shape of the buildings and nothing about where
 *  they are, and the satellite view knew where they are and nothing about how
 *  many students live on which floor. A warden had to hold both in their head.
 *
 *  So the geometry moved onto the map. Blocks are extruded where they actually
 *  stand, floor by floor, over real imagery — a physical model of the campus
 *  being scanned by a thermal sensor. The ground can be satellite, a light
 *  plan, or nothing at all when there is no network; the model on top is
 *  identical in all three, so nobody has to re-learn the picture.
 *
 *  Three layers, always in this order:
 *      1. heat field   — diffuse, irregular, breathing, under everything
 *      2. geometry     — extruded floor slabs, coloured per floor
 *      3. core signal  — incandescent rim and marker on what is actually hot
 * ============================================================================
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Hotspot } from '@/lib/domain/surveillance';
import type { RiskLevel } from '@/lib/domain/risk';
import { MESSES, RO_PLANT } from '@/lib/domain/campus';
import {
  ThermalDefs,
  ThermalLegend,
  fieldGradientId,
  fieldRadius,
  isHot,
  thermalFaces,
  thermalStopFor,
  RISK_STOP,
  type ThermalStop,
} from '@/components/thermal';

/* ------------------------------------------------------------------ data -- */

export interface MapBlock {
  id: string;
  name: string;
  gender: 'boys' | 'girls';
  floors: number;
  capacity: number;
  /** Cases in the window, whole block. */
  cases: number;
  /** Cases per floor, index 0 = floor 1. Drives per-floor slab colour. */
  floorCases: number[];
  lat: number;
  lng: number;
  /** Abstract isometric position, used when there is no basemap. */
  gx: number;
  gy: number;
}

export type Ground = 'satellite' | 'plan' | 'model';

interface Point {
  x: number;
  y: number;
}

/* ------------------------------------------------------------- projection -- */

const ISO_X = 0.86;
const ISO_Y = 0.5;

/** Abstract isometric projection, for the no-basemap ground. */
function isoProject(gx: number, gy: number, unit: number): Point {
  return { x: (gx - gy) * ISO_X * unit, y: (gx + gy) * ISO_Y * unit };
}

/**
 * Deterministic per-block jitter.
 *
 * Perfectly circular heat fields read as UI gradients. Real thermal terrain
 * has irregular contours, so every field gets a stable rotation and a stable
 * eccentricity derived from its own id — stable being the important word,
 * because a field that reshuffles on every render reads as noise.
 */
function hash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/* ------------------------------------------------------------------ heat -- */

interface DrawBlock extends MapBlock {
  level: RiskLevel;
  stop: ThermalStop;
  floorStops: ThermalStop[];
  intensity: number;
  hotspot?: Hotspot;
  p: Point;
}

function levelFor(id: string, hotspots: Hotspot[]): RiskLevel {
  return hotspots.find((h) => h.blockId === id)?.level ?? 'normal';
}

/* ============================================================== component == */

export function CampusThermalMap({
  blocks,
  hotspots,
  selectedId,
  onSelect,
  ground: groundProp,
  onGroundChange,
  className,
  compact = false,
  showChrome = true,
}: {
  blocks: MapBlock[];
  hotspots: Hotspot[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  ground?: Ground;
  onGroundChange?: (g: Ground) => void;
  className?: string;
  /** Drops labels, legend and tags — for the small preview on the landing page. */
  compact?: boolean;
  showChrome?: boolean;
}) {
  const [internalGround, setInternalGround] = useState<Ground>(groundProp ?? 'satellite');
  const ground = groundProp ?? internalGround;
  const setGround = onGroundChange ?? setInternalGround;

  const [hovered, setHovered] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 900, h: 460 });
  const [projected, setProjected] = useState<Record<string, Point>>({});
  const [zoom, setZoom] = useState(17);
  const [tilesReady, setTilesReady] = useState(false);

  const hostRef = useRef<HTMLDivElement>(null);
  const leafletHostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileRef = useRef<any>(null);
  const blocksRef = useRef(blocks);

  // The projection callback is handed to Leaflet once and then called on every
  // pan; it reads the latest blocks through this ref rather than being torn
  // down and re-registered each time the data changes.
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const usesTiles = ground !== 'model';

  /* ---------------------------------------------------------- container -- */

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  /* ------------------------------------------------------------ leaflet -- */

  const reproject = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const out: Record<string, Point> = {};
    for (const b of blocksRef.current) {
      const p = map.latLngToContainerPoint([b.lat, b.lng]);
      out[b.id] = { x: p.x, y: p.y };
    }
    for (const m of MESSES) {
      const p = map.latLngToContainerPoint([m.lat, m.lng]);
      out[m.id] = { x: p.x, y: p.y };
    }
    const ro = map.latLngToContainerPoint([RO_PLANT.lat ?? 26.8434, RO_PLANT.lng ?? 75.5652]);
    out[RO_PLANT.id] = { x: ro.x, y: ro.y };
    setProjected(out);
    setZoom(map.getZoom());
  }, []);

  useEffect(() => {
    if (!usesTiles || !leafletHostRef.current) return;
    let alive = true;

    import('leaflet')
      .then((L) => {
        if (!alive || !leafletHostRef.current) return;

        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!mapRef.current) {
          mapRef.current = L.map(leafletHostRef.current, {
            center: [26.8434, 75.5649],
            zoom: 17,
            minZoom: 15,
            maxZoom: 19,
            zoomControl: false,
            // The extruded model is re-projected on every move. Leaflet's zoom
            // animation interpolates tiles but not our overlay, so the geometry
            // would swim away from the buildings for 250ms on every scroll.
            zoomAnimation: false,
            attributionControl: true,
          });
          mapRef.current.on('move zoom resize viewreset', reproject);
        }

        const map = mapRef.current;

        if (tileRef.current) map.removeLayer(tileRef.current);
        tileRef.current =
          ground === 'satellite'
            ? L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                { attribution: 'Esri · Maxar · Earthstar Geographics', maxZoom: 19 },
              )
            : L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: 'CARTO · OpenStreetMap',
                maxZoom: 19,
              });
        tileRef.current.addTo(map);
        tileRef.current.once('load', () => alive && setTilesReady(true));

        map.invalidateSize();
        reproject();
      })
      .catch(() => {
        // No network, no Leaflet, no problem — the model ground needs neither.
        if (alive) setGround('model');
      });

    return () => {
      alive = false;
    };
  }, [ground, usesTiles, reproject, setGround]);

  useEffect(() => {
    if (mapRef.current && usesTiles) {
      mapRef.current.invalidateSize();
      reproject();
    }
  }, [size, usesTiles, reproject]);

  /* -------------------------------------------------------------- layout -- */

  const scale = usesTiles ? Math.min(3, Math.max(0.55, Math.pow(2, zoom - 17))) : 1;
  const unit = compact ? 34 : 46;

  const drawn: DrawBlock[] = useMemo(() => {
    const maxRate = Math.max(
      0.0001,
      ...blocks.map((b) => (b.capacity > 0 ? b.cases / b.capacity : 0)),
    );

    // Abstract ground: centre the isometric plan inside the viewport.
    const isoPoints = blocks.map((b) => isoProject(b.gx, b.gy, unit));
    const minX = Math.min(...isoPoints.map((p) => p.x), 0);
    const maxX = Math.max(...isoPoints.map((p) => p.x), 0);
    const minY = Math.min(...isoPoints.map((p) => p.y), 0);
    const maxY = Math.max(...isoPoints.map((p) => p.y), 0);
    const offX = size.w / 2 - (minX + maxX) / 2;
    const offY = size.h / 2 - (minY + maxY) / 2 + (compact ? 10 : 26);

    return blocks
      .map((b, i) => {
        const hotspot = hotspots.find((h) => h.blockId === b.id);
        const level = levelFor(b.id, hotspots);
        const rate = b.capacity > 0 ? b.cases / b.capacity : 0;
        const share = rate / maxRate;

        // A known risk level wins over a raw share: the level is a considered
        // judgement, the share is only a measurement.
        const stop = level === 'normal' ? thermalStopFor(share) : RISK_STOP[level];

        const floorCap = Math.max(1, b.capacity / Math.max(1, b.floors));
        const floorStops = Array.from({ length: b.floors }, (_, f) => {
          const c = b.floorCases[f] ?? 0;
          if (c === 0) return 0 as ThermalStop;
          const fShare = c / floorCap / Math.max(maxRate, 0.0001);
          // A floor can never read hotter than its own block's verdict — the
          // block is what a human was asked to judge.
          return Math.min(thermalStopFor(fShare), Math.max(stop, 2)) as ThermalStop;
        });

        const p = usesTiles
          ? (projected[b.id] ?? { x: -9999, y: -9999 })
          : (() => {
              const q = isoPoints[i];
              return { x: q.x + offX, y: q.y + offY };
            })();

        return {
          ...b,
          level,
          stop,
          floorStops,
          intensity: hotspot?.intensity ?? Math.min(1, share),
          hotspot,
          p,
        };
      })
      // Painter's algorithm — whatever is further from the viewer goes down first.
      .sort((a, b) => a.p.y - b.p.y);
  }, [blocks, hotspots, projected, usesTiles, size, unit, compact]);

  const active = drawn.find((b) => b.id === (hovered ?? selectedId));
  const anyHot = drawn.some((b) => isHot(b.level));

  /* Supply anchors. On the abstract ground they sit at fixed spots on the
     plan; on a real map they sit where the kitchen and the plant actually are. */
  const supplyPoints = useMemo(() => {
    if (usesTiles) {
      return {
        plant: projected[RO_PLANT.id],
        messes: MESSES.map((m) => ({ ...m, p: projected[m.id] })).filter((m) => m.p),
      };
    }
    return {
      plant: { x: size.w * 0.5, y: size.h * 0.12 },
      messes: MESSES.map((m, i) => ({
        ...m,
        p: { x: size.w * (i === 0 ? 0.2 : 0.8), y: size.h * 0.2 },
      })),
    };
  }, [usesTiles, projected, size]);

  const w = (compact ? 12 : 17) * scale;
  const floorH = (compact ? 5 : 7.5) * scale;

  return (
    <div
      ref={hostRef}
      className={cn('relative w-full overflow-hidden bg-paper-sunk', className)}
    >
      {/* ── ground ─────────────────────────────────────────────────────── */}
      {usesTiles ? (
        <div
          ref={leafletHostRef}
          className="absolute inset-0"
          style={{
            // The ground is deliberately drained of colour. Everything warm on
            // this screen should be a measurement, and a satellite tile is full
            // of greens and browns that compete with the signal for attention.
            filter:
              ground === 'satellite'
                ? 'saturate(0.18) contrast(0.92) brightness(0.94)'
                : 'saturate(0) contrast(1.04) brightness(1.03)',
          }}
        />
      ) : (
        <ModelGround width={size.w} height={size.h} unit={unit} />
      )}

      {/* ── model + heat ───────────────────────────────────────────────── */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ zIndex: 400 }}
        role="img"
        aria-label="Campus thermal map"
      >
        <ThermalDefs blur={compact ? 8 : 14} />

        {/* Layer 1 — the heat field. Under the geometry, always. */}
        <g className="animate-heat">
          {drawn
            .filter((b) => b.stop > 0)
            .map((b) => {
              const h = hash(b.id);
              const r = fieldRadius(b.intensity, (compact ? 58 : 92) * scale);
              const ecc = 0.42 + h * 0.22;
              const rot = h * 180;
              const dim = selectedId && selectedId !== b.id ? 0.42 : 1;
              return (
                <g key={`field-${b.id}`} opacity={dim}>
                  <ellipse
                    cx={b.p.x}
                    cy={b.p.y}
                    rx={r * 1.5}
                    ry={r * ecc * 1.5}
                    transform={`rotate(${rot} ${b.p.x} ${b.p.y})`}
                    fill={`url(#${fieldGradientId(Math.max(2, b.stop) as ThermalStop)})`}
                    opacity={0.3}
                    filter="url(#thermal-bloom)"
                  />
                  <ellipse
                    cx={b.p.x}
                    cy={b.p.y}
                    rx={r}
                    ry={r * ecc}
                    transform={`rotate(${rot} ${b.p.x} ${b.p.y})`}
                    fill={`url(#${fieldGradientId(Math.max(2, b.stop) as ThermalStop)})`}
                    className={isHot(b.level) ? 'thermal-breathe' : undefined}
                    opacity={isHot(b.level) ? undefined : 0.55}
                  />
                </g>
              );
            })}
        </g>

        {/* Supply lines. Drawn only for the block under inspection, because
            nineteen tanks and two kitchens wired to everything is a diagram
            nobody can read. The line that lights up is the hypothesis. */}
        {active?.hotspot && !compact && (
          <SupplyLinks block={active} supply={supplyPoints} />
        )}

        {/* Layer 2 — geometry, floor by floor. */}
        {drawn.map((b) => {
          if (b.p.x < -1000) return null;
          const dim = selectedId && selectedId !== b.id ? 0.5 : 1;
          const focused = hovered === b.id || selectedId === b.id;
          return (
            <BlockModel
              key={b.id}
              b={b}
              w={w}
              floorH={floorH}
              dim={dim}
              focused={focused}
              compact={compact}
              onEnter={() => setHovered(b.id)}
              onLeave={() => setHovered(null)}
              onClick={() => onSelect?.(b.id)}
            />
          );
        })}

        {/* A scan passes over the field every thirteen seconds. Barely visible,
            and only ever a hint that something is still watching. */}
        {!compact && (
          <rect
            className="thermal-scan"
            x="0"
            y="0"
            width={size.w}
            height="72"
            fill="url(#scan-band)"
            opacity="0.5"
          />
        )}
        <defs>
          <linearGradient id="scan-band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--thermal-hot)" stopOpacity="0" />
            <stop offset="55%" stopColor="var(--thermal-hot)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--thermal-hot)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── supply tags ────────────────────────────────────────────────── */}
      {!compact && (
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 500 }}>
          {supplyPoints.plant && (
            <SupplyTag
              p={supplyPoints.plant}
              kind="water"
              label={RO_PLANT.name}
              sub="Feeds every block tank"
            />
          )}
          {supplyPoints.messes.map((m) => (
            <SupplyTag
              key={m.id}
              p={m.p as Point}
              kind="food"
              label={m.name}
              sub={`${m.servesBlockIds.length} blocks eat here`}
            />
          ))}
        </div>
      )}

      {/* ── inspector ──────────────────────────────────────────────────── */}
      {!compact && active && (
        <div className="pointer-events-none absolute left-4 top-4 z-[600] w-[248px] animate-rise">
          <BlockReadout b={active} />
        </div>
      )}

      {/* ── chrome ─────────────────────────────────────────────────────── */}
      {showChrome && !compact && (
        <>
          <div className="absolute right-4 top-4 z-[600] flex items-center gap-px bg-line-light p-px">
            {(
              [
                ['satellite', 'Satellite'],
                ['plan', 'Plan'],
                ['model', 'Model'],
              ] as [Ground, string][]
            ).map(([g, label]) => (
              <button
                key={g}
                type="button"
                onClick={() => setGround(g)}
                className={cn(
                  'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors',
                  ground === g
                    ? 'bg-ink text-paper-bright'
                    : 'bg-paper-bright text-muted-ink hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {usesTiles && (
            <div className="pointer-events-none absolute bottom-3 right-3 z-[600] flex flex-col items-end gap-1">
              <ZoomControl map={mapRef} />
            </div>
          )}

          <div className="absolute bottom-3 left-4 z-[600] flex items-center gap-4 bg-paper-bright/90 px-3 py-2 backdrop-blur-sm">
            <ThermalLegend />
          </div>

          {usesTiles && !tilesReady && (
            <div className="absolute inset-0 z-[550] grid place-items-center bg-paper-sunk/70">
              <span className="meta">Resolving campus imagery…</span>
            </div>
          )}
        </>
      )}

      {/* No heat anywhere is itself a reading, and it deserves to be stated
          rather than left as an empty map. */}
      {!anyHot && !compact && (
        <div className="pointer-events-none absolute right-4 bottom-14 z-[600] bg-paper-bright/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-ink backdrop-blur-sm">
          No elevated activity on campus
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- geometry -- */

function BlockModel({
  b,
  w,
  floorH,
  dim,
  focused,
  compact,
  onEnter,
  onLeave,
  onClick,
}: {
  b: DrawBlock;
  w: number;
  floorH: number;
  dim: number;
  focused: boolean;
  compact: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const h = w / 2;
  const { x, y } = b.p;
  const total = b.floors * floorH;
  const hot = isHot(b.level);

  // Each floor is its own slab so per-floor illness has somewhere to live.
  // This is the whole reason the model beats a dot: "B4, second floor" is an
  // address maintenance can walk to, and here you can see it.
  const slabs = Array.from({ length: b.floors }, (_, i) => {
    const stop = b.floorStops[i] ?? 0;
    const faces = thermalFaces(stop === 0 ? (b.stop === 0 ? 0 : 1) : stop);
    const yTop = y - (i + 1) * floorH;
    return { i, faces, yTop, stop };
  });

  const topY = y - total;
  const topFaces = thermalFaces(b.stop);

  return (
    <g
      className="pointer-events-auto cursor-pointer"
      style={{ opacity: dim, transition: 'opacity 240ms ease' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* footprint shadow, so the model sits on the ground rather than over it */}
      <ellipse cx={x} cy={y + h * 0.4} rx={w * 1.15} ry={h * 0.9} fill="#000" opacity={0.16} />

      {slabs.map((s) => (
        <g key={s.i}>
          <polygon
            points={`${x - w},${s.yTop + h} ${x},${s.yTop + 2 * h} ${x},${s.yTop + 2 * h + floorH} ${x - w},${s.yTop + h + floorH}`}
            fill={s.faces.left}
          />
          <polygon
            points={`${x},${s.yTop + 2 * h} ${x + w},${s.yTop + h} ${x + w},${s.yTop + h + floorH} ${x},${s.yTop + 2 * h + floorH}`}
            fill={s.faces.right}
          />
          {/* the seam between floors — thin, and the thing that makes the
              extrusion read as a building instead of a coloured block */}
          <line
            x1={x - w}
            y1={s.yTop + h + floorH}
            x2={x}
            y2={s.yTop + 2 * h + floorH}
            stroke="var(--paper-bright)"
            strokeWidth={0.6}
            opacity={0.5}
          />
          <line
            x1={x}
            y1={s.yTop + 2 * h + floorH}
            x2={x + w}
            y2={s.yTop + h + floorH}
            stroke="var(--paper-bright)"
            strokeWidth={0.6}
            opacity={0.5}
          />
          {/* a floor carrying its own signal gets an incandescent seam */}
          {s.stop >= 3 && (
            <polygon
              points={`${x - w},${s.yTop + h} ${x},${s.yTop + 2 * h} ${x + w},${s.yTop + h} ${x},${s.yTop + 2 * h + floorH} ${x - w},${s.yTop + h + floorH}`}
              fill="none"
              stroke="var(--thermal-rim)"
              strokeWidth={0.8}
              opacity={0.7}
            />
          )}
        </g>
      ))}

      {/* roof */}
      <polygon
        points={`${x},${topY} ${x + w},${topY + h} ${x},${topY + 2 * h} ${x - w},${topY + h}`}
        fill={topFaces.top}
        stroke={hot ? 'var(--thermal-rim)' : focused ? 'var(--ink)' : 'var(--paper-bright)'}
        strokeWidth={hot ? 1.4 : focused ? 1.2 : 0.7}
        opacity={hot ? 1 : 0.96}
      />

      {/* Layer 3 — the core signal. Small, bright, and only on real heat. */}
      {hot && (
        <g>
          <circle
            cx={x}
            cy={topY - 8}
            r={5.5}
            fill={topFaces.top}
            opacity={0.35}
            className="animate-pulse-ring"
          />
          <rect
            x={x - 2.5}
            y={topY - 10.5}
            width={5}
            height={5}
            fill="var(--thermal-rim)"
            stroke={b.level === 'critical' ? 'var(--thermal-crimson)' : 'var(--thermal-orange)'}
            strokeWidth={1}
          />
        </g>
      )}

      {!compact && (
        <text
          x={x}
          y={y + h + 12}
          textAnchor="middle"
          className="pointer-events-none select-none"
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            fill: hot ? 'var(--thermal-crimson)' : 'var(--ink-soft)',
            paintOrder: 'stroke',
            stroke: 'var(--paper)',
            strokeWidth: 3,
            strokeLinejoin: 'round',
          }}
        >
          {b.name}
        </text>
      )}
    </g>
  );
}

/**
 * The abstract ground: a plain grid on paper. No imagery, no network, no
 * pretence that this is a photograph — a diagram that is honest about being a
 * diagram beats a map you cannot read.
 */
function ModelGround({
  width,
  height,
  unit,
}: {
  width: number;
  height: number;
  unit: number;
}) {
  const lines: React.ReactElement[] = [];
  const span = 16;
  const offX = width / 2;
  const offY = height / 2 + 26;

  for (let i = -span; i <= span; i++) {
    const a = isoProject(i, -span, unit);
    const b = isoProject(i, span, unit);
    lines.push(
      <line
        key={`a${i}`}
        x1={a.x + offX}
        y1={a.y + offY}
        x2={b.x + offX}
        y2={b.y + offY}
        stroke="var(--thermal-grid)"
        strokeWidth="0.75"
      />,
    );
    const c = isoProject(-span, i, unit);
    const d = isoProject(span, i, unit);
    lines.push(
      <line
        key={`b${i}`}
        x1={c.x + offX}
        y1={c.y + offY}
        x2={d.x + offX}
        y2={d.y + offY}
        stroke="var(--thermal-grid)"
        strokeWidth="0.75"
      />,
    );
  }

  return (
    <svg className="absolute inset-0 h-full w-full" style={{ background: 'var(--thermal-ground)' }}>
      <g opacity="0.55">{lines}</g>
    </svg>
  );
}

/* ---------------------------------------------------------------- supply -- */

/**
 * Water from the plant, food from the kitchen. The line that matters is the
 * one the assessment currently blames, and it is the only one drawn in colour.
 */
function SupplyLinks({
  block,
  supply,
}: {
  block: DrawBlock;
  supply: { plant?: Point; messes: { id: string; p?: Point; servesBlockIds: string[] }[] };
}) {
  const source = block.hotspot?.source;
  const waterBlamed = source === 'block_water' || source === 'campus_water';
  const foodBlamed = source === 'mess_food';
  const mess = supply.messes.find((m) => m.servesBlockIds.includes(block.id));

  const line = (from: Point, to: Point, blamed: boolean, key: string) => (
    <g key={key}>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={blamed ? 'var(--thermal-red)' : 'var(--line)'}
        strokeWidth={blamed ? 1.6 : 0.9}
        strokeDasharray={blamed ? '0' : '3 4'}
        opacity={blamed ? 0.9 : 0.45}
      />
      {blamed && (
        <circle r="2.5" fill="var(--thermal-rim)">
          <animateMotion
            dur="2.8s"
            repeatCount="indefinite"
            path={`M${from.x},${from.y} L${to.x},${to.y}`}
          />
        </circle>
      )}
    </g>
  );

  return (
    <g>
      {supply.plant && line(supply.plant, block.p, waterBlamed, 'water')}
      {mess?.p && line(mess.p, block.p, foodBlamed, 'food')}
    </g>
  );
}

function SupplyTag({
  p,
  kind,
  label,
  sub,
}: {
  p: Point;
  kind: 'water' | 'food';
  label: string;
  sub: string;
}) {
  if (!p || p.x < -1000) return null;
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full"
      style={{ left: p.x, top: p.y - 6 }}
    >
      <div className="flex items-center gap-1.5 border border-ink bg-ink px-2 py-1 text-paper-bright">
        <span
          className={cn('inline-block size-[6px]', kind === 'water' ? 'rounded-full' : '')}
          style={{ background: kind === 'water' ? '#8FC7DE' : 'var(--thermal-yellow)' }}
        />
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em]">
          {kind === 'water' ? 'Water' : 'Food'}
        </span>
      </div>
      <div className="mt-px border border-line-light bg-paper-bright px-2 py-1">
        <div className="text-[10px] font-semibold leading-tight text-ink">{label}</div>
        <div className="text-[9px] leading-tight text-muted-ink">{sub}</div>
      </div>
      <div className="mx-auto h-2.5 w-px bg-ink" />
    </div>
  );
}

/* ------------------------------------------------------------- inspector -- */

function BlockReadout({ b }: { b: DrawBlock }) {
  const hot = isHot(b.level);
  return (
    <div className="border border-line bg-paper-bright/95 backdrop-blur-sm">
      <div
        className={cn(
          'flex items-center justify-between px-3 py-1.5',
          hot ? 'text-paper-bright' : 'bg-paper-sunk text-ink',
        )}
        style={hot ? { background: `var(--t${b.stop}-right)` } : undefined}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Block {b.name}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] opacity-80">
          {b.gender === 'boys' ? "Boys'" : "Girls'"}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-line-light border-b border-line-light">
        <div className="px-3 py-2">
          <div className="numeral text-2xl">{b.cases}</div>
          <div className="meta mt-1">Reports</div>
        </div>
        <div className="px-3 py-2">
          <div className="numeral text-2xl">{b.capacity}</div>
          <div className="meta mt-1">Residents</div>
        </div>
      </div>

      {/* Per-floor strip. Reading down this column is how you tell a bad tank
          (every floor warm) from a bad floor (one warm, the rest cold). */}
      <div className="px-3 py-2.5">
        <div className="meta mb-1.5">Floors</div>
        <div className="flex flex-col-reverse gap-px">
          {Array.from({ length: b.floors }, (_, i) => {
            const stop = b.floorStops[i] ?? 0;
            const cases = b.floorCases[i] ?? 0;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 text-[9px] tabular-nums text-muted-ink">{i + 1}</span>
                <span
                  className="h-2.5 flex-1"
                  style={{ background: `var(--t${stop}-top)` }}
                  title={`Floor ${i + 1}: ${cases} reports`}
                />
                <span className="w-8 text-right text-[9px] tabular-nums text-muted-ink">
                  {/* Below three, a floor is a person, not a statistic. */}
                  {cases === 0 ? '—' : cases < 3 ? '<3' : cases}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {b.hotspot && (
        <p className="border-t border-line-light px-3 py-2 text-[11px] leading-snug text-ink">
          {b.hotspot.comparison}
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- zoom -- */

function ZoomControl({
  map,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: React.MutableRefObject<any>;
}) {
  return (
    <div className="pointer-events-auto flex flex-col bg-line-light p-px">
      {[
        ['+', 1],
        ['−', -1],
      ].map(([sign, delta]) => (
        <button
          key={sign as string}
          type="button"
          onClick={() => map.current?.setZoom(map.current.getZoom() + (delta as number))}
          className="size-7 bg-paper-bright text-[13px] font-semibold text-ink transition-colors hover:bg-paper-sunk"
        >
          {sign}
        </button>
      ))}
    </div>
  );
}
