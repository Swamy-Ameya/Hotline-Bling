'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Copy, Check, MapPin, Layers } from 'lucide-react';
import { Surface, NeuButton } from '@/components/neu';
import { BLOCKS, MESSES, RO_PLANT } from '@/lib/domain/campus';

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
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-8">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/radar"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="flex items-center gap-2">
          <NeuButton onClick={exportCode} className="flex items-center gap-1.5 text-xs py-2">
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied TS Snippet' : 'Export TS Code'}
          </NeuButton>

          <NeuButton
            variant="primary"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 text-xs py-2"
          >
            {saved ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
            {saved ? 'Saved Coordinates' : 'Save Coordinates'}
          </NeuButton>
        </div>
      </div>

      <Surface className="p-6 mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">Campus Satellite Placement Editor</h1>
        <p className="text-xs text-slate-500 mt-1">
          Calibrate ground-truth building coordinates on high-res Esri satellite tiles. Select a block from the chips below, then tap anywhere on the satellite image to place its exact location.
        </p>

        {/* Block Selector Chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {coords.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBlockId(b.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                selectedBlockId === b.id
                  ? 'bg-slate-900 text-white shadow-sm scale-105'
                  : 'neu-inset-sm text-slate-700 hover:text-slate-900'
              }`}
            >
              Block {b.name}
            </button>
          ))}
        </div>
      </Surface>

      {/* Satellite Map Container */}
      <Surface className="p-2 overflow-hidden h-[540px] relative">
        <div ref={containerRef} className="w-full h-full rounded-xl" />

        {activeCoord && (
          <div className="absolute top-4 left-4 z-[1000] rounded-xl bg-slate-900/90 px-3.5 py-2 text-white shadow backdrop-blur-md text-xs">
            <div className="font-bold flex items-center gap-1.5">
              <MapPin className="size-3.5 text-red-400" /> Active Placement: Block {activeCoord.name}
            </div>
            <div className="text-[11px] font-mono text-slate-300 mt-0.5">
              Lat: {activeCoord.lat.toFixed(5)} · Lng: {activeCoord.lng.toFixed(5)}
            </div>
          </div>
        )}
      </Surface>
    </div>
  );
}
