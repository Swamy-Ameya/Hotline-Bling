'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CampusElevation, DetectionResult } from '@/lib/types';
import { formatCases } from './attack-rate-utils';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Building2, 
  Utensils, 
  Droplets,
  RotateCcw,
  ExternalLink,
  Plus,
  Minus,
  Maximize2,
  Trash2,
  X,
  Layers,
  Save,
  Check,
  Copy
} from 'lucide-react';
import Link from 'next/link';

interface GeoCampusMapProps {
  elevation: CampusElevation;
  result: DetectionResult;
}

export interface StampedLocation {
  id: string;
  name: string;
  shortLabel: string;
  type: 'block' | 'mess' | 'water';
  blockKey?: string;
  lat: number;
  lng: number;
}

// Baked MUJ GHS Hostel, Blue Dove Mess & RO Plant ground truth layout
const MUJ_SATELLITE_DEFAULTS: StampedLocation[] = [
  { id: 'tank-B', blockKey: 'B', name: 'B2 – Boys Hostel', shortLabel: 'Block B2', type: 'block', lat: 26.84398, lng: 75.56405 },
  { id: 'tank-A', blockKey: 'A', name: 'B1 – Boys Hostel', shortLabel: 'Block B1', type: 'block', lat: 26.84368, lng: 75.56470 },
  { id: 'tank-D', blockKey: 'D', name: 'G2 – Girls Hostel', shortLabel: 'Block G2', type: 'block', lat: 26.84310, lng: 75.56435 },
  { id: 'tank-C', blockKey: 'C', name: 'G1 – Girls Hostel', shortLabel: 'Block G1', type: 'block', lat: 26.84305, lng: 75.56485 },
  { id: 'mess', name: 'Blue Dove Mess & Dining', shortLabel: 'Blue Dove Mess', type: 'mess', lat: 26.84270, lng: 75.56370 },
  { id: 'water-main', name: 'Main Campus Water Supply', shortLabel: 'RO Plant', type: 'water', lat: 26.84245, lng: 75.56335 },
];

function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

function latLngToPixel(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n * 256;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * 256;
  return { x, y };
}

export function GeoCampusMap({ elevation, result }: GeoCampusMapProps) {
  const [locations, setLocations] = useState<StampedLocation[]>(MUJ_SATELLITE_DEFAULTS);
  const [activeStampTarget, setActiveStampTarget] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isBaked, setIsBaked] = useState(false);
  
  // Basemap View: 'light' (CartoDB Light Positron), 'satellite' (Pure Sat), 'dark' (Carto Dark)
  const [mapStyle, setMapStyle] = useState<'light' | 'satellite' | 'dark'>('light');

  // Custom Node Modal Dialog State
  const [isStampModalOpen, setIsStampModalOpen] = useState(false);
  const [stampName, setStampName] = useState('');
  const [stampType, setStampType] = useState<'block' | 'mess' | 'water'>('block');

  // Map state
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 26.8433, lng: 75.5647 });
  const [zoom, setZoom] = useState(17);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Drag-to-pan state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Load saved stamped pins from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('outbreak_radar_geo_pins_v12');
      if (saved) {
        setLocations(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const savePins = (updated: StampedLocation[]) => {
    setLocations(updated);
    try {
      localStorage.setItem('outbreak_radar_geo_pins_v12', JSON.stringify(updated));
    } catch {}
  };

  // Bake & lock current pin layout as default
  const handleBakeLayout = () => {
    try {
      localStorage.setItem('outbreak_radar_geo_pins_v12', JSON.stringify(locations));
      localStorage.setItem('outbreak_radar_geo_baked_layout', JSON.stringify(locations));
      setIsBaked(true);
      setTimeout(() => setIsBaked(false), 3000);
    } catch {}
  };

  const handleCopyLayoutJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(locations, null, 2));
      setIsBaked(true);
      setTimeout(() => setIsBaked(false), 3000);
    } catch {}
  };

  const handleResetToDefaults = () => {
    setLocations(MUJ_SATELLITE_DEFAULTS);
    setCenter({ lat: 26.8433, lng: 75.5647 });
    setZoom(17);
    try {
      localStorage.removeItem('outbreak_radar_geo_pins_v11');
    } catch {}
  };

  const handleStartStampingNew = (useGpsNow: boolean = false) => {
    const defaultLabels = {
      block: `Block B${locations.filter((l) => l.type === 'block').length + 1}`,
      mess: `Blue Dove Mess`,
      water: `RO Station ${locations.filter((l) => l.type === 'water').length + 1}`,
    };

    const finalName = stampName.trim() || defaultLabels[stampType];
    const shortLabel = finalName.length > 16 ? finalName.slice(0, 16) : finalName;
    const newId = `node-${Date.now()}`;

    if (useGpsNow && userGps) {
      const newNode: StampedLocation = {
        id: newId,
        name: finalName,
        shortLabel,
        type: stampType,
        lat: userGps.lat,
        lng: userGps.lng,
      };
      const updated = [...locations, newNode];
      savePins(updated);
      setSelectedPinId(newId);
      setIsStampModalOpen(false);
      setStampName('');
      return;
    }

    const newNode: StampedLocation = {
      id: newId,
      name: finalName,
      shortLabel,
      type: stampType,
      lat: center.lat,
      lng: center.lng,
    };

    const updated = [...locations, newNode];
    savePins(updated);
    setActiveStampTarget(newId);
    setIsStampModalOpen(false);
    setStampName('');
  };

  const handleDeleteNode = (id: string) => {
    const updated = locations.filter((l) => l.id !== id);
    savePins(updated);
    if (selectedPinId === id) setSelectedPinId(null);
    if (activeStampTarget === id) setActiveStampTarget(null);
  };

  // Browser Geolocation
  const handleGetGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserGps(coords);
        setCenter(coords);

        if (activeStampTarget) {
          const updated = locations.map((l) =>
            l.id === activeStampTarget ? { ...l, lat: coords.lat, lng: coords.lng } : l
          );
          savePins(updated);
          setActiveStampTarget(null);
        }
      },
      (err) => {
        setGpsError(`GPS Error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeStampTarget) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    const n = Math.pow(2, zoom);
    const lngDelta = -(dx / (n * 256)) * 360;
    const latDelta = (dy / (n * 256)) * 180;

    setCenter((prev) => ({
      lat: Math.max(-85, Math.min(85, prev.lat + latDelta)),
      lng: prev.lng + lngDelta,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeStampTarget || !mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickPixelX = e.clientX - rect.left;
    const clickPixelY = e.clientY - rect.top;

    const centerPixel = latLngToPixel(center.lat, center.lng, zoom);
    const targetPixelX = centerPixel.x + (clickPixelX - rect.width / 2);
    const targetPixelY = centerPixel.y + (clickPixelY - rect.height / 2);

    const n = Math.pow(2, zoom);
    const clickedLng = (targetPixelX / (n * 256)) * 360 - 180;
    const clickedLatRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * targetPixelY) / (n * 256))));
    const clickedLat = (clickedLatRad * 180) / Math.PI;

    const updated = locations.map((loc) =>
      loc.id === activeStampTarget ? { ...loc, lat: clickedLat, lng: clickedLng } : loc
    );

    savePins(updated);
    setSelectedPinId(activeStampTarget);
    setActiveStampTarget(null);
  };

  const getMarkerScreenPos = (lat: number, lng: number) => {
    if (!mapContainerRef.current) return { x: 0, y: 0 };
    const rect = mapContainerRef.current.getBoundingClientRect();
    const centerPixel = latLngToPixel(center.lat, center.lng, zoom);
    const markerPixel = latLngToPixel(lat, lng, zoom);

    return {
      x: rect.width / 2 + (markerPixel.x - centerPixel.x),
      y: rect.height / 2 + (markerPixel.y - centerPixel.y),
    };
  };

  // Render high-res real vector/satellite basemap tiles
  const renderTiles = () => {
    const centerTile = latLngToTile(center.lat, center.lng, zoom);
    const centerPixel = latLngToPixel(center.lat, center.lng, zoom);
    const containerW = mapContainerRef.current ? mapContainerRef.current.clientWidth : 800;
    const containerH = mapContainerRef.current ? mapContainerRef.current.clientHeight : 540;

    const tiles = [];
    const radius = 2; // 5x5 tile grid

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const tileX = centerTile.x + dx;
        const tileY = centerTile.y + dy;

        const tilePixelX = tileX * 256;
        const tilePixelY = tileY * 256;

        const screenX = containerW / 2 + (tilePixelX - centerPixel.x);
        const screenY = containerH / 2 + (tilePixelY - centerPixel.y);

        let tileUrl = '';
        if (mapStyle === 'light') {
          tileUrl = `https://a.basemaps.cartocdn.com/light_nolabels/${zoom}/${tileX}/${tileY}.png`;
        } else if (mapStyle === 'satellite') {
          tileUrl = `https://mt1.google.com/vt/lyrs=s&x=${tileX}&y=${tileY}&z=${zoom}`;
        } else {
          tileUrl = `https://a.basemaps.cartocdn.com/dark_nolabels/${zoom}/${tileX}/${tileY}.png`;
        }

        tiles.push(
          <img
            key={`${tileX}-${tileY}-${zoom}-${mapStyle}`}
            src={tileUrl}
            alt=""
            loading="lazy"
            className="absolute select-none pointer-events-none"
            style={{
              width: '256px',
              height: '256px',
              left: `${screenX}px`,
              top: `${screenY}px`,
            }}
          />
        );
      }
    }
    return tiles;
  };

  const selectedLoc = locations.find((l) => l.id === selectedPinId);
  const selectedBlockData = selectedLoc?.blockKey
    ? elevation.blocks.find((b) => b.label.includes(selectedLoc.blockKey!))
    : null;

  return (
    <Card className="border border-zinc-200/80 shadow-ao-card overflow-hidden bg-white text-zinc-900 relative rounded-2xl">
      {/* Header & Main Toolbelt */}
      <CardHeader className="py-4 px-6 border-b border-zinc-100 bg-white/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <MapPin className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 text-ao-subtle">
              Campus Heatmap &amp; Infrastructure
            </CardTitle>
            <Badge variant="outline" className="text-[11px] font-mono border-zinc-200 text-zinc-500 py-0.5 px-2">
              {mapStyle === 'light' ? 'Light Canvas' : mapStyle === 'satellite' ? 'HD Satellite' : 'Dark Canvas'}
            </Badge>
          </div>
          <CardDescription className="text-xs text-zinc-500 mt-0.5">
            Manipal University Jaipur · Boys Hostels (B1–B12), Girls Hostels (G1–G7) &amp; Blue Dove Mess
          </CardDescription>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Basemap Style Switcher (Translucent Glass) */}
          <div className="p-0.5 rounded-xl bg-zinc-100/90 backdrop-blur-md border border-zinc-200/80 flex items-center text-xs">
            <button
              onClick={() => setMapStyle('light')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mapStyle === 'light'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mapStyle === 'satellite'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mapStyle === 'dark'
                  ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Dark
            </button>
          </div>

          {/* BAKE / LOCK LAYOUT BUTTON */}
          <Button
            size="sm"
            onClick={handleBakeLayout}
            className={`text-xs h-8 px-3 gap-1.5 rounded-xl border transition-all ${
              isBaked
                ? 'bg-emerald-600 border-emerald-600 text-white font-semibold shadow-xs'
                : 'bg-white/80 hover:bg-white text-zinc-700 border-zinc-200/80 backdrop-blur-md shadow-xs'
            }`}
          >
            {isBaked ? <Check className="size-3.5" /> : <Save className="size-3.5 text-zinc-500" />}
            <span>{isBaked ? 'Baked!' : 'Bake Layout'}</span>
          </Button>

          {/* STAMP BUTTON */}
          <Button
            size="sm"
            onClick={() => setIsStampModalOpen(true)}
            className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs h-8 px-3.5 gap-1.5 shadow-ao-button rounded-xl"
          >
            <Plus className="size-3.5" />
            <span>Stamp Location</span>
          </Button>

          {/* GPS Quick Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetGps}
            className="text-xs h-8 gap-1.5 border-zinc-200/80 bg-white/80 hover:bg-white text-zinc-700 backdrop-blur-md rounded-xl shadow-xs"
          >
            <Navigation className="size-3.5 text-blue-600" />
            <span>My GPS</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetToDefaults}
            className="text-xs h-8 text-zinc-500 hover:text-zinc-900 px-2 rounded-xl"
          >
            <RotateCcw className="size-3 mr-1" /> Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Quick Node Pin Strip with Translucent Glass Aesthetic */}
        <div className="p-3 rounded-2xl bg-zinc-50/80 backdrop-blur-md border border-zinc-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-500 text-[11px] uppercase tracking-wider">
            <Crosshair className="size-3.5 text-zinc-400" />
            <span>Campus Nodes:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {locations.map((loc) => {
              const isActive = activeStampTarget === loc.id;
              const isSelected = selectedPinId === loc.id;
              const isBlock = loc.type === 'block';
              const isMess = loc.type === 'mess';
              const isWater = loc.type === 'water';

              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setSelectedPinId(loc.id);
                    setActiveStampTarget(isActive ? null : loc.id);
                  }}
                  className={`h-7.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border backdrop-blur-md active:scale-[0.98] ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 font-semibold border-amber-500 shadow-sm'
                      : isSelected
                      ? 'border-zinc-900 text-zinc-900 font-semibold bg-white/95 shadow-sm'
                      : 'border-zinc-200/80 bg-white/65 hover:bg-white/95 text-zinc-700 hover:border-zinc-300 shadow-xs'
                  }`}
                >
                  {isBlock && <Building2 className="size-3 text-zinc-500" />}
                  {isMess && <Utensils className="size-3 text-amber-600" />}
                  {isWater && <Droplets className="size-3 text-blue-600" />}
                  <span>{loc.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stamping Instruction Banner */}
        {activeStampTarget && (
          <div className="p-3 rounded-xl bg-amber-50/90 backdrop-blur-md border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <Crosshair className="size-4 text-amber-600" />
              <span>
                <strong>Click anywhere on the map</strong> to place{' '}
                <span className="font-semibold underline">
                  {locations.find((l) => l.id === activeStampTarget)?.name}
                </span>.
              </span>
            </span>
            <button
              onClick={() => setActiveStampTarget(null)}
              className="text-xs text-amber-700 hover:text-amber-900 font-medium px-2.5 py-1 rounded-md bg-amber-100/80"
            >
              Cancel
            </button>
          </div>
        )}

        {gpsError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {gpsError}
          </div>
        )}

        {/* Map Canvas */}
        <div
          ref={mapContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setMousePos(null);
          }}
          onClick={handleMapClick}
          className={`relative w-full aspect-[16/10] max-h-[540px] rounded-2xl overflow-hidden border border-zinc-200/90 select-none ${
            mapStyle === 'light' ? 'bg-[#f4f3f0]' : 'bg-[#09090b]'
          } shadow-inner ${
            activeStampTarget ? 'cursor-crosshair ring-2 ring-amber-500' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Base Tiles */}
          {renderTiles()}

          {/* EXPANSIVE RADIANT HEATMAPS FOR OUTBREAK SCENARIO */}
          {locations.map((loc) => {
            const isBlock = loc.type === 'block';
            const isMess = loc.type === 'mess';
            const blockData = isBlock && loc.blockKey
              ? elevation.blocks.find((b) => b.label.includes(loc.blockKey!))
              : null;

            const isFlagged = isBlock
              ? blockData?.isFlagged
              : isMess
              ? elevation.mess.isFlagged || result.topCluster?.hypothesis === 'food'
              : false;

            const cases = isBlock ? blockData?.caseCount ?? 0 : isMess ? elevation.mess.caseCount : 0;
            const pos = getMarkerScreenPos(loc.lat, loc.lng);

            if (!isFlagged && cases === 0) return null;

            return (
              <div
                key={`heat-${loc.id}`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-10 pointer-events-none flex items-center justify-center"
              >
                {/* Expansive High-Impact Heatwave Halo */}
                {isFlagged ? (
                  <div className="relative flex items-center justify-center">
                    {/* Tier 3 Outermost Radiant Ambient Spread (200px) */}
                    <span className="w-52 h-52 rounded-full bg-red-500/20 blur-xl animate-pulse" />
                    {/* Tier 2 Middle Intense Heat Zone (120px) */}
                    <span className="absolute w-32 h-32 rounded-full bg-red-600/35 blur-md" />
                    {/* Tier 1 Core Outbreak Ring (72px) */}
                    <span className="absolute w-20 h-20 rounded-full border-2 border-red-500/80 bg-red-500/20 animate-ping" />
                    <span className="absolute w-14 h-14 rounded-full border border-red-400/90" />
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    <span className="w-28 h-28 rounded-full bg-amber-500/20 blur-md" />
                    <span className="absolute w-16 h-16 rounded-full border border-amber-500/50" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Stamped Node Markers with Precision 3D Pin Style */}
          {locations.map((loc) => {
            const isBlock = loc.type === 'block';
            const isMess = loc.type === 'mess';
            const isWater = loc.type === 'water';

            const blockData = isBlock && loc.blockKey
              ? elevation.blocks.find((b) => b.label.includes(loc.blockKey!))
              : null;
            
            const isFlagged = isBlock
              ? blockData?.isFlagged
              : isMess
              ? elevation.mess.isFlagged || result.topCluster?.hypothesis === 'food'
              : false;

            const cases = isBlock ? blockData?.caseCount ?? 0 : isMess ? elevation.mess.caseCount : 0;
            const isSelected = selectedPinId === loc.id;
            const pos = getMarkerScreenPos(loc.lat, loc.lng);

            return (
              <div
                key={loc.id}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -100%)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeStampTarget) {
                    handleMapClick(e as any);
                  } else {
                    setSelectedPinId(isSelected ? null : loc.id);
                  }
                }}
                className="absolute z-20 cursor-pointer transition-transform duration-150 group flex flex-col items-center"
              >
                {/* Precision Drop Pin Icon */}
                <div
                  className={`relative flex items-center justify-center rounded-full p-1.5 shadow-md border-2 transition-all ${
                    isSelected ? 'scale-115 ring-2 ring-zinc-950' : 'hover:scale-105'
                  } ${
                    isFlagged
                      ? 'bg-red-600 border-white text-white'
                      : cases > 0
                      ? 'bg-amber-500 border-zinc-900 text-zinc-950'
                      : isMess
                      ? 'bg-amber-600 border-white text-white'
                      : isWater
                      ? 'bg-blue-600 border-white text-white'
                      : 'bg-zinc-900 border-white text-white'
                  }`}
                >
                  {isMess && <Utensils className="size-3" />}
                  {isBlock && <Building2 className="size-3" />}
                  {isWater && <Droplets className="size-3" />}
                </div>

                {/* Needle Tip */}
                <div
                  className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] -mt-0.5 ${
                    isFlagged
                      ? 'border-t-red-600'
                      : cases > 0
                      ? 'border-t-amber-500'
                      : isMess
                      ? 'border-t-amber-600'
                      : isWater
                      ? 'border-t-blue-600'
                      : 'border-t-zinc-900'
                  }`}
                />

                {/* Micro Label Tag */}
                <div className="mt-0.5 px-2.5 py-0.5 rounded-full bg-zinc-900/90 backdrop-blur-md border border-white/20 text-[10px] font-mono font-semibold text-white flex items-center gap-1 shadow-md whitespace-nowrap">
                  <span>{loc.shortLabel}</span>
                  {isFlagged && <span className="text-red-400 font-bold">• ALERT</span>}
                </div>
              </div>
            );
          })}

          {/* User Live GPS Marker */}
          {userGps && (
            <div
              style={{
                left: `${getMarkerScreenPos(userGps.lat, userGps.lng).x}px`,
                top: `${getMarkerScreenPos(userGps.lat, userGps.lng).y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-30 pointer-events-none flex flex-col items-center"
            >
              <span className="size-4 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-500/40 animate-pulse absolute" />
              <span className="size-2.5 rounded-full bg-blue-500 border border-white relative z-10" />
            </div>
          )}

          {/* Cursor Drop Follower */}
          {activeStampTarget && mousePos && (
            <div
              style={{ left: `${mousePos.x + 10}px`, top: `${mousePos.y + 10}px` }}
              className="absolute z-40 pointer-events-none px-2.5 py-1 rounded-md bg-amber-500 text-zinc-950 font-semibold text-[11px] shadow-md flex items-center gap-1"
            >
              <MapPin className="size-3" />
              <span>Click to Drop</span>
            </div>
          )}

          {/* Zoom & Recenter Controls */}
          <div className="absolute right-3 bottom-3 z-30 flex flex-col gap-1">
            <button
              onClick={() => setZoom((z) => Math.min(19, z + 1))}
              className="size-7 rounded-lg bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-800 hover:bg-white flex items-center justify-center shadow-xs"
            >
              <Plus className="size-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(15, z - 1))}
              className="size-7 rounded-lg bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-800 hover:bg-white flex items-center justify-center shadow-xs"
            >
              <Minus className="size-3.5" />
            </button>
            <button
              onClick={() => {
                setCenter({ lat: 26.8433, lng: 75.5647 });
                setZoom(17);
              }}
              title="Recenter GHS Hostels"
              className="size-7 rounded-lg bg-white/90 backdrop-blur-md border border-zinc-200 text-zinc-800 hover:bg-white flex items-center justify-center shadow-xs"
            >
              <Maximize2 className="size-3.5" />
            </button>
          </div>

          <div className="absolute left-3 bottom-3 z-30 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 text-[11px] font-mono text-zinc-600 shadow-xs">
            {center.lat.toFixed(5)}° N, {center.lng.toFixed(5)}° E · Zoom {zoom}
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedLoc && (
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-200">
              <div className="flex items-center gap-2.5">
                {selectedLoc.type === 'mess' ? (
                  <Utensils className="size-4 text-amber-600" />
                ) : selectedLoc.type === 'water' ? (
                  <Droplets className="size-4 text-blue-600" />
                ) : (
                  <Building2 className="size-4 text-zinc-700" />
                )}
                <div>
                  <h4 className="font-semibold text-zinc-900 text-sm">{selectedLoc.name}</h4>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Coordinates: {selectedLoc.lat.toFixed(5)}° N, {selectedLoc.lng.toFixed(5)}° E
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setActiveStampTarget(selectedLoc.id)}
                  className="h-7 text-xs border-zinc-200 bg-white text-zinc-700"
                >
                  <Crosshair className="size-3 mr-1" /> Re-Position
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleDeleteNode(selectedLoc.id)}
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-3 mr-1" /> Delete
                </Button>

                <Link href={`/radar/${result.scenario}`}>
                  <Button size="xs" className="h-7 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-medium gap-1">
                    <span>Inspect</span>
                    <ExternalLink className="size-2.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {selectedBlockData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200">
                  <span className="text-zinc-400 block text-[10px] uppercase font-medium">Sick Reports</span>
                  <span className="font-bold text-zinc-900 text-xs">
                    {formatCases(selectedBlockData.caseCount, selectedBlockData.suppressed)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200">
                  <span className="text-zinc-400 block text-[10px] uppercase font-medium">Monitoring</span>
                  <span className="font-bold text-zinc-900 text-xs">5 Floors Active</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200">
                  <span className="text-zinc-400 block text-[10px] uppercase font-medium">Capacity</span>
                  <span className="font-bold text-zinc-900 text-xs">180 Students</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200">
                  <span className="text-zinc-400 block text-[10px] uppercase font-medium">Water Supply</span>
                  <span className="font-bold text-zinc-900 text-xs">{selectedBlockData.tankName}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* STAMP NEW LOCATION MODAL DIALOG */}
      {isStampModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-6 space-y-4 text-zinc-900 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-zinc-900 text-white">
                  <Plus className="size-4" />
                </div>
                <h3 className="font-bold text-sm">Stamp Campus Building</h3>
              </div>
              <button
                onClick={() => setIsStampModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">1. Select Type:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStampType('block')}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                    stampType === 'block'
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-xs'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  <Building2 className="size-4" />
                  <span className="text-[11px]">Hostel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStampType('mess')}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                    stampType === 'mess'
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-xs'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  <Utensils className="size-4" />
                  <span className="text-[11px]">Mess</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStampType('water')}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                    stampType === 'water'
                      ? 'bg-zinc-900 text-white border-zinc-900 font-semibold shadow-xs'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  <Droplets className="size-4" />
                  <span className="text-[11px]">Water</span>
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="locName" className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                2. Label (B1–B12 / G1–G7):
              </label>
              <Input
                id="locName"
                value={stampName}
                onChange={(e) => setStampName(e.target.value)}
                placeholder={
                  stampType === 'block'
                    ? 'e.g. B3 Boys Hostel / G3 Girls Hostel'
                    : stampType === 'mess'
                    ? 'e.g. Blue Dove Mess / Food Court'
                    : 'e.g. RO Plant 2'
                }
                className="h-9 bg-white border-zinc-200 text-xs text-zinc-900"
              />
            </div>

            {/* Drop action */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleStartStampingNew(false)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs h-9 gap-1.5 shadow-xs rounded-xl"
              >
                <Crosshair className="size-3.5" />
                <span>Click Map to Drop</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (userGps) {
                    handleStartStampingNew(true);
                  } else {
                    handleGetGps();
                    handleStartStampingNew(true);
                  }
                }}
                className="flex-1 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs h-9 gap-1.5 rounded-xl"
              >
                <Navigation className="size-3.5 text-blue-600" />
                <span>Use GPS</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
