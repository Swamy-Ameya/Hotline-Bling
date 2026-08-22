'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Hotspot } from '@/lib/domain/surveillance';
import { BLOCKS, MESSES, RO_PLANT } from '@/lib/domain/campus';
import { RISK_META } from '@/lib/domain/risk';

const RISK_COLORS = {
  critical: '#ef4444',
  elevated: '#f97316',
  watch: '#f59e0b',
  normal: '#10b981',
};

interface CampusSatelliteMapProps {
  hotspots: Hotspot[];
  selectedId: string | null;
  onSelect: (blockId: string) => void;
  className?: string;
}

export function CampusSatelliteMap({
  hotspots,
  selectedId,
  onSelect,
  className = 'h-[440px]',
}: CampusSatelliteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  const [tileMode, setTileMode] = useState<'satellite' | 'light'>('satellite');

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    let isMounted = true;

    // Load Leaflet dynamically
    import('leaflet').then((L) => {
      if (!isMounted || !containerRef.current) return;

      // Inject Leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapRef.current) {
        const map = L.map(containerRef.current, {
          center: [26.8434, 75.5652],
          zoom: 17,
          minZoom: 15,
          maxZoom: 19,
          attributionControl: true,
        });
        mapRef.current = map;
      }

      const map = mapRef.current;

      // Tile layers
      map.eachLayer((layer: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((layer as any)._url) {
          map.removeLayer(layer);
        }
      });

      if (tileMode === 'satellite') {
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Esri, Maxar, Earthstar Geographics',
            maxZoom: 19,
          },
        ).addTo(map);
      } else {
        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          {
            attribution: 'CARTO Positron',
            maxZoom: 19,
          },
        ).addTo(map);
      }

      // Clear existing markers
      markersRef.current.forEach((marker) => map.removeLayer(marker));
      markersRef.current.clear();

      // Add Block markers
      for (const b of BLOCKS) {
        const hot = hotspots.find((h) => h.blockId === b.id);
        const level = hot?.level ?? 'normal';
        const color = RISK_COLORS[level];
        const isSelected = b.id === selectedId;

        const circle = L.circleMarker([b.lat, b.lng], {
          radius: isSelected ? 16 : 12,
          fillColor: color,
          color: isSelected ? '#ffffff' : '#1e293b',
          weight: isSelected ? 3 : 1.5,
          opacity: 0.9,
          fillOpacity: level === 'normal' ? 0.75 : 0.95,
        }).addTo(map);

        circle.bindTooltip(
          `<strong>Block ${b.name}</strong><br/>Status: ${RISK_META[level].label}${
            hot ? `<br/>${hot.comparison}` : ''
          }`,
          { direction: 'top', className: 'neu-tooltip' },
        );

        circle.on('click', () => {
          onSelect(b.id);
        });

        markersRef.current.set(b.id, circle);
      }

      // Add Mess markers
      for (const m of MESSES) {
        const messMarker = L.circleMarker([m.lat, m.lng], {
          radius: 9,
          fillColor: '#6366f1',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.85,
        }).addTo(map);

        messMarker.bindTooltip(`<strong>${m.name}</strong><br/>Central Dining`, {
          direction: 'top',
        });
        markersRef.current.set(m.id, messMarker);
      }

      // Add RO plant
      const roMarker = L.circleMarker([RO_PLANT.lat || 26.8434, RO_PLANT.lng || 75.5652], {
        radius: 8,
        fillColor: '#0ea5e9',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.9,
      }).addTo(map);
      roMarker.bindTooltip(`<strong>${RO_PLANT.name}</strong><br/>Central Water Supply`, {
        direction: 'top',
      });
      markersRef.current.set(RO_PLANT.id, roMarker);
    });

    return () => {
      isMounted = false;
    };
  }, [hotspots, selectedId, tileMode, onSelect]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden ${className}`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Layer Toggle Switch */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-1 rounded-xl bg-slate-900/80 p-1 backdrop-blur-md shadow-md text-xs font-semibold text-white">
        <button
          type="button"
          onClick={() => setTileMode('satellite')}
          className={`rounded-lg px-2.5 py-1 transition-all ${
            tileMode === 'satellite' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'
          }`}
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={() => setTileMode('light')}
          className={`rounded-lg px-2.5 py-1 transition-all ${
            tileMode === 'light' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'
          }`}
        >
          Light Map
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl bg-slate-900/85 px-3 py-2 text-[11px] font-medium text-white backdrop-blur-md shadow flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-emerald-500 inline-block" /> Normal
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-amber-500 inline-block" /> Watch
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-orange-500 inline-block" /> Elevated
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-red-500 inline-block" /> Attention
        </span>
      </div>
    </div>
  );
}
