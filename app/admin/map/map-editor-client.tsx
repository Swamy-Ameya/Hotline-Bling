'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { NeuButton } from '@/components/neu';
import { BLOCKS } from '@/lib/domain/campus';

interface BlockCoord {
  id: string;
  name: string;
  gender: 'boys' | 'girls';
  lat: number;
  lng: number;
}

export function MapEditorClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  const [coords, setCoords] = useState<BlockCoord[]>(() =>
    BLOCKS.map((b) => ({ id: b.id, name: b.name, gender: b.gender, lat: b.lat, lng: b.lng })),
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string>('block-B1');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !containerRef.current) return;

      // Inject Leaflet CSS
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
          maxZoom: 20,
        });

        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Esri, Maxar, Earthstar Geographics',
            maxZoom: 20,
          },
        ).addTo(map);

        mapRef.current = map;
      }

      const map = mapRef.current;

      // Clear existing markers
      markersRef.current.forEach((marker) => map.removeLayer(marker));
      markersRef.current.clear();

      // Create draggable markers for each block
      coords.forEach((b) => {
        const marker = L.circleMarker([b.lat, b.lng], {
          radius: 14,
          fillColor: b.gender === 'boys' ? '#3b82f6' : '#ec4899',
          color: '#ffffff',
          weight: 2.5,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindTooltip(`<strong>Block ${b.name}</strong><br/>(Drag to calibrate)`, {
          permanent: false,
          direction: 'top',
        });

        // Enable dragging simulation via Leaflet events
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        marker.on('click', () => {
          setSelectedBlockId(b.id);
        });

        markersRef.current.set(b.id, marker);
      });

      // Map click handler to relocate selected block
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        const targetId = selectedBlockId;
        const newLat = parseFloat(e.latlng.lat.toFixed(5));
        const newLng = parseFloat(e.latlng.lng.toFixed(5));

        setCoords((prev) =>
          prev.map((item) => (item.id === targetId ? { ...item, lat: newLat, lng: newLng } : item)),
        );

        const targetMarker = markersRef.current.get(targetId);
        if (targetMarker) {
          targetMarker.setLatLng([newLat, newLng]);
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, [selectedBlockId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/campus/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: coords }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const exportCode = () => {
    const boysList = coords.filter((c) => c.gender === 'boys').map((c) => `  [${c.lat}, ${c.lng}], // ${c.name}`).join('\n');
    const girlsList = coords.filter((c) => c.gender === 'girls').map((c) => `  [${c.lat}, ${c.lng}], // ${c.name}`).join('\n');

    const code = `const BOYS_COORDS: [number, number][] = [\n${boysList}\n];\n\nconst GIRLS_COORDS: [number, number][] = [\n${girlsList}\n];`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCoord = coords.find((c) => c.id === selectedBlockId);

  return (
    <div className="editorial pb-24 pt-8">
      <div className="flex items-baseline justify-between gap-4 border-b border-line-light pb-3">
        <Link href="/radar" className="meta transition-colors hover:text-ink">
          &larr; Campus radar
        </Link>
        <div className="flex items-center gap-2">
          <NeuButton onClick={exportCode}>
            {copied ? 'Copied' : 'Export coordinates'}
          </NeuButton>
          <NeuButton variant="primary" disabled={saving} onClick={handleSave}>
            {saved ? 'Saved' : 'Save placement'}
          </NeuButton>
        </div>
      </div>

      <div className="grid gap-6 pt-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span className="eyebrow">Placement</span>
          <h1 className="mt-3 display text-[clamp(1.8rem,3.6vw,2.6rem)] text-ink">
            Where the buildings actually stand
          </h1>
          <p className="mt-4 max-w-xl text-[14px] leading-[1.6] text-muted-ink">
            The map extrudes each block at its own coordinates, so those coordinates have to be
            right. Pick a block, then click its roof on the satellite image. Everything downstream
            &mdash; the heat fields, the supply lines, the floor stacks &mdash; follows from this.
          </p>
        </div>
      </div>

      {/* Block selector */}
      <div className="mt-8 flex flex-wrap gap-px bg-line-light p-px">
        {coords.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelectedBlockId(b.id)}
            className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
              selectedBlockId === b.id
                ? 'bg-ink text-paper-bright'
                : 'bg-paper-bright text-muted-ink hover:text-ink'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="relative mt-5 h-[540px] border border-line-light">
        <div ref={containerRef} className="h-full w-full" />

        {activeCoord && (
          <div className="absolute left-4 top-4 z-[1000] border border-ink bg-ink px-3 py-2 text-paper-bright">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em]">
              Placing block {activeCoord.name}
            </div>
            <div className="mt-1 font-mono text-[10px] opacity-80">
              {activeCoord.lat.toFixed(5)} · {activeCoord.lng.toFixed(5)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
