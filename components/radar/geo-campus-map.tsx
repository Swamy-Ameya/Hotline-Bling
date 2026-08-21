'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CampusElevation, DetectionResult } from '@/lib/types';
import { formatCases, formatAttackRate } from './attack-rate-utils';
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
  GraduationCap,
  Trees,
  Compass,
  Milestone
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

export interface CampusLandmark {
  id: string;
  name: string;
  type: 'road' | 'academic' | 'facility' | 'area';
  lat: number;
  lng: number;
}

// Real Manipal University Jaipur (MUJ) GHS Hostel & Mess positions
const MUJ_SATELLITE_DEFAULTS: StampedLocation[] = [
  { id: 'mess', name: 'Old Mess & Dining Hall', shortLabel: 'Old Mess', type: 'mess', lat: 26.84365, lng: 75.56580 },
  { id: 'tank-A', blockKey: 'A', name: 'GHS Hostel Block A', shortLabel: 'Block A', type: 'block', lat: 26.84370, lng: 75.56370 },
  { id: 'tank-B', blockKey: 'B', name: 'GHS Hostel Block B', shortLabel: 'Block B', type: 'block', lat: 26.84390, lng: 75.56445 },
  { id: 'tank-C', blockKey: 'C', name: 'GHS Hostel Block C', shortLabel: 'Block C', type: 'block', lat: 26.84275, lng: 75.56360 },
  { id: 'tank-D', blockKey: 'D', name: 'GHS Hostel Block D', shortLabel: 'Block D', type: 'block', lat: 26.84260, lng: 75.56450 },
  { id: 'water-main', name: 'Main Campus RO Supply', shortLabel: 'Main RO Tank', type: 'water', lat: 26.84430, lng: 75.56510 },
];

// Ground-truth MUJ Campus Roads & Physical Landmarks
const MUJ_LANDMARKS: CampusLandmark[] = [
  { id: 'road-main', name: 'Manipal University Marg', type: 'road', lat: 26.84370, lng: 75.56510 },
  { id: 'academic-main', name: 'MUJ Academic Quad & Dome', type: 'academic', lat: 26.84440, lng: 75.56700 },
  { id: 'ghs-quad', name: 'GHS Hostel Central Quad', type: 'area', lat: 26.84330, lng: 75.56405 },
  { id: 'student-hub', name: 'Student Cafeteria & Plaza', type: 'facility', lat: 26.84430, lng: 75.56430 },
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
  
  // Basemap View: 'hybrid' (Real Satellite + Roads/Streets), 'satellite' (Pure Sat), 'streets' (OSM)
  const [mapLayer, setMapLayer] = useState<'hybrid' | 'satellite' | 'streets'>('hybrid');
  const [showLandmarks, setShowLandmarks] = useState(true);

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
      const saved = localStorage.getItem('outbreak_radar_geo_pins_v8');
      if (saved) {
        setLocations(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const savePins = (updated: StampedLocation[]) => {
    setLocations(updated);
    try {
      localStorage.setItem('outbreak_radar_geo_pins_v8', JSON.stringify(updated));
    } catch {}
  };

  const handleResetToDefaults = () => {
    setLocations(MUJ_SATELLITE_DEFAULTS);
    setCenter({ lat: 26.8433, lng: 75.5647 });
    setZoom(17);
    try {
      localStorage.removeItem('outbreak_radar_geo_pins_v8');
    } catch {}
  };

  const handleStartStampingNew = (useGpsNow: boolean = false) => {
    const defaultLabels = {
      block: `Block ${String.fromCharCode(65 + locations.filter((l) => l.type === 'block').length)}`,
      mess: `Dining Mess ${locations.filter((l) => l.type === 'mess').length + 1}`,
      water: `RO Station ${locations.filter((l) => l.type === 'water').length + 1}`,
    };

    const finalName = stampName.trim() || defaultLabels[stampType];
    const shortLabel = finalName.length > 14 ? finalName.slice(0, 14) : finalName;
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

  // Render high-res real satellite and hybrid tiles
  const renderTiles = () => {
    const centerTile = latLngToTile(center.lat, center.lng, zoom);
    const centerPixel = latLngToPixel(center.lat, center.lng, zoom);
    const containerW = mapContainerRef.current ? mapContainerRef.current.clientWidth : 800;
    const containerH = mapContainerRef.current ? mapContainerRef.current.clientHeight : 520;

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
        if (mapLayer === 'hybrid') {
          // Google Hybrid: High-Res Real Satellite Photos + Overlay Roads
          tileUrl = `https://mt1.google.com/vt/lyrs=y&x=${tileX}&y=${tileY}&z=${zoom}`;
        } else if (mapLayer === 'satellite') {
          // Google Pure Satellite: Natural Photographic View
          tileUrl = `https://mt1.google.com/vt/lyrs=s&x=${tileX}&y=${tileY}&z=${zoom}`;
        } else {
          // Clean Voyager Streets with Landmarks
          tileUrl = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tileX}/${tileY}.png`;
        }

        tiles.push(
          <img
            key={`${tileX}-${tileY}-${zoom}-${mapLayer}`}
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
    <Card className="border border-zinc-200 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden bg-zinc-950 text-white relative rounded-2xl">
      {/* Header & Main Toolbelt */}
      <CardHeader className="py-3 px-4 sm:px-6 border-b border-white/[0.08] bg-zinc-900/90 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-red-600 text-white shadow-xs flex items-center justify-center">
              <MapPin className="size-3.5" />
            </div>
            <CardTitle className="text-sm sm:text-base font-bold tracking-tight text-zinc-100">
              Campus Satellite Outbreak Map (Manipal University Jaipur)
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-zinc-400 py-0 h-4">
              {mapLayer === 'hybrid' ? 'Satellite + Roads' : mapLayer === 'satellite' ? 'Photo Sat' : 'Streets'}
            </Badge>
          </div>
          <CardDescription className="text-xs text-zinc-400 mt-0.5">
            Photorealistic satellite view showing real GHS Hostel blocks, Old Mess, Manipal University Marg, and live outbreak heat.
          </CardDescription>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Layer Switcher */}
          <div className="p-0.5 rounded-lg bg-zinc-800/90 border border-white/10 flex items-center text-xs">
            <button
              onClick={() => setMapLayer('hybrid')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mapLayer === 'hybrid'
                  ? 'bg-zinc-700 text-white font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Hybrid
            </button>
            <button
              onClick={() => setMapLayer('satellite')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mapLayer === 'satellite'
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Photo Sat
            </button>
            <button
              onClick={() => setMapLayer('streets')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mapLayer === 'streets'
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Streets
            </button>
          </div>

          {/* Landmark Overlay Toggle */}
          <Button
            size="sm"
            variant={showLandmarks ? 'secondary' : 'outline'}
            onClick={() => setShowLandmarks(!showLandmarks)}
            className="text-xs h-7.5 gap-1 border-white/10 text-zinc-200"
          >
            <Milestone className="size-3 text-amber-400" />
            <span>Landmarks {showLandmarks ? 'ON' : 'OFF'}</span>
          </Button>

          {/* STAMP BUTTON */}
          <Button
            size="sm"
            onClick={() => setIsStampModalOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs h-7.5 px-3 gap-1 shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Stamp Location</span>
          </Button>

          {/* GPS Quick Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetGps}
            className="text-xs h-7.5 gap-1 border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200"
          >
            <Navigation className="size-3 text-blue-400" />
            <span>My GPS</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetToDefaults}
            className="text-xs h-7.5 text-zinc-400 hover:text-zinc-100 px-2"
          >
            <RotateCcw className="size-3 mr-1" /> Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Quick Node Pin Strip */}
        <div className="p-2 rounded-xl bg-zinc-900/80 border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-zinc-300 text-[11px] uppercase tracking-wider">
            <Crosshair className="size-3 text-amber-400" />
            <span>Hostel Pins:</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
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
                  className={`h-6.5 px-2.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 border ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-sm'
                      : isSelected
                      ? 'border-white text-white font-bold bg-zinc-800 shadow-xs'
                      : 'border-white/[0.08] bg-zinc-950 text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  {isBlock && <Building2 className="size-3 text-emerald-400" />}
                  {isMess && <Utensils className="size-3 text-amber-400" />}
                  {isWater && <Droplets className="size-3 text-blue-400" />}
                  <span>{loc.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stamping Instruction Banner */}
        {activeStampTarget && (
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-100 text-xs flex items-center justify-between shadow-md">
            <span className="flex items-center gap-1.5">
              <Crosshair className="size-3.5 text-amber-400" />
              <span>
                <strong>Click anywhere on the satellite view</strong> to place{' '}
                <span className="text-white font-bold underline">
                  {locations.find((l) => l.id === activeStampTarget)?.name}
                </span>.
              </span>
            </span>
            <button
              onClick={() => setActiveStampTarget(null)}
              className="text-[11px] text-amber-300 hover:text-white font-medium px-2 py-0.5 rounded bg-amber-900/40"
            >
              Cancel
            </button>
          </div>
        )}

        {gpsError && (
          <div className="p-2 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs">
            {gpsError}
          </div>
        )}

        {/* Photorealistic Satellite Map Viewport with Visible Buildings & Roads */}
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
          className={`relative w-full aspect-[16/10] max-h-[520px] rounded-xl overflow-hidden border border-white/[0.08] select-none bg-zinc-950 shadow-inner ${
            activeStampTarget ? 'cursor-crosshair ring-2 ring-amber-500' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Base Tiles (Google Hybrid / Photo Sat / Streets) */}
          {renderTiles()}

          {/* VIBRANT RADIANT HEATMAP RINGS */}
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
                {/* Outbreak Heatwave Beacons */}
                {isFlagged ? (
                  <div className="relative flex items-center justify-center">
                    <span className="w-24 h-24 rounded-full bg-red-600/35 blur-md animate-pulse" />
                    <span className="absolute w-14 h-14 rounded-full bg-red-500/40 border border-red-400" />
                    <span className="absolute w-9 h-9 rounded-full border-2 border-white animate-ping" />
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    <span className="w-14 h-14 rounded-full bg-amber-500/25 blur-sm" />
                    <span className="absolute w-8 h-8 rounded-full border border-amber-400/60" />
                  </div>
                )}
              </div>
            );
          })}

          {/* GROUND-TRUTH CAMPUS LANDMARK BADGES */}
          {showLandmarks &&
            MUJ_LANDMARKS.map((lm) => {
              const pos = getMarkerScreenPos(lm.lat, lm.lng);
              const isRoad = lm.type === 'road';
              const isAcademic = lm.type === 'academic';

              return (
                <div
                  key={lm.id}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-15 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-zinc-300 shadow-md whitespace-nowrap"
                >
                  {isRoad ? (
                    <Milestone className="size-3 text-blue-400" />
                  ) : isAcademic ? (
                    <GraduationCap className="size-3 text-purple-400" />
                  ) : (
                    <Trees className="size-3 text-emerald-400" />
                  )}
                  <span>{lm.name}</span>
                </div>
              );
            })}

          {/* STAMPED HOSTEL & MESS NODE MARKERS */}
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
                  className={`relative flex items-center justify-center rounded-full p-1.5 shadow-lg border-2 transition-all ${
                    isSelected ? 'scale-115 ring-2 ring-white' : 'hover:scale-105'
                  } ${
                    isFlagged
                      ? 'bg-red-600 border-white text-white'
                      : cases > 0
                      ? 'bg-amber-500 border-zinc-950 text-zinc-950'
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

                {/* Stamped Building Name Tag */}
                <div className="mt-0.5 px-2 py-0.5 rounded-full bg-zinc-950/95 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-zinc-100 flex items-center gap-1 shadow-lg whitespace-nowrap">
                  <span>{loc.shortLabel}</span>
                  {isFlagged && <span className="text-red-400 font-extrabold">• OUTBREAK</span>}
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
              className="absolute z-40 pointer-events-none px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold text-[10px] shadow-md flex items-center gap-1"
            >
              <MapPin className="size-3" />
              <span>Click to Drop</span>
            </div>
          )}

          {/* Zoom & Recenter Controls */}
          <div className="absolute right-3 bottom-3 z-30 flex flex-col gap-1">
            <button
              onClick={() => setZoom((z) => Math.min(19, z + 1))}
              className="size-7 rounded-lg bg-zinc-900/90 border border-white/20 text-white hover:bg-zinc-800 flex items-center justify-center shadow"
            >
              <Plus className="size-3" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(15, z - 1))}
              className="size-7 rounded-lg bg-zinc-900/90 border border-white/20 text-white hover:bg-zinc-800 flex items-center justify-center shadow"
            >
              <Minus className="size-3" />
            </button>
            <button
              onClick={() => {
                setCenter({ lat: 26.8433, lng: 75.5647 });
                setZoom(17);
              }}
              title="Recenter GHS Hostel"
              className="size-7 rounded-lg bg-zinc-900/90 border border-white/20 text-white hover:bg-zinc-800 flex items-center justify-center shadow"
            >
              <Maximize2 className="size-3" />
            </button>
          </div>

          <div className="absolute left-3 bottom-3 z-30 px-2 py-0.5 rounded-full bg-zinc-950/90 border border-white/20 text-[10px] font-mono text-zinc-300 shadow">
            {center.lat.toFixed(5)}° N, {center.lng.toFixed(5)}° E · Zoom {zoom}
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedLoc && (
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs space-y-2.5 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                {selectedLoc.type === 'mess' ? (
                  <Utensils className="size-3.5 text-amber-400" />
                ) : selectedLoc.type === 'water' ? (
                  <Droplets className="size-3.5 text-blue-400" />
                ) : (
                  <Building2 className="size-3.5 text-emerald-400" />
                )}
                <div>
                  <h4 className="font-bold text-zinc-100 text-xs">{selectedLoc.name}</h4>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Coordinates: {selectedLoc.lat.toFixed(5)}° N, {selectedLoc.lng.toFixed(5)}° E
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setActiveStampTarget(selectedLoc.id)}
                  className="h-6.5 text-[11px] border-white/10 text-zinc-200"
                >
                  <Crosshair className="size-3 mr-1" /> Re-Position
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleDeleteNode(selectedLoc.id)}
                  className="h-6.5 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/40"
                >
                  <Trash2 className="size-3 mr-1" /> Delete
                </Button>

                <Link href={`/radar/${result.scenario}`}>
                  <Button size="xs" className="h-6.5 text-[11px] bg-zinc-100 hover:bg-white text-zinc-950 font-semibold gap-1">
                    <span>Inspect Cluster</span>
                    <ExternalLink className="size-2.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {selectedBlockData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-zinc-950 border border-white/[0.06]">
                  <span className="text-zinc-400 block text-[10px]">Total Cases</span>
                  <span className="font-bold text-zinc-100 text-xs">
                    {formatCases(selectedBlockData.caseCount, selectedBlockData.suppressed)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 border border-white/[0.06]">
                  <span className="text-zinc-400 block text-[10px]">Attack Rate</span>
                  <span className="font-bold text-zinc-100 text-xs">
                    {formatAttackRate(selectedBlockData.attackRate)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 border border-white/[0.06]">
                  <span className="text-zinc-400 block text-[10px]">Floors Monitored</span>
                  <span className="font-bold text-zinc-100 text-xs">5 Floors (10 Filters)</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 border border-white/[0.06]">
                  <span className="text-zinc-400 block text-[10px]">Plumbing Tank</span>
                  <span className="font-bold text-zinc-100 text-xs">{selectedBlockData.tankName}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* STAMP NEW LOCATION MODAL DIALOG */}
      {isStampModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/15 rounded-2xl max-w-sm w-full p-5 space-y-4 text-white shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-red-600 text-white">
                  <Plus className="size-3.5" />
                </div>
                <h3 className="font-bold text-sm">Stamp Campus Location</h3>
              </div>
              <button
                onClick={() => setIsStampModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">1. Type:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStampType('block')}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                    stampType === 'block'
                      ? 'bg-zinc-100 text-zinc-950 border-white font-bold shadow'
                      : 'bg-zinc-950 border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <Building2 className="size-4 text-emerald-500" />
                  <span className="text-[11px]">Hostel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStampType('mess')}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                    stampType === 'mess'
                      ? 'bg-zinc-100 text-zinc-950 border-white font-bold shadow'
                      : 'bg-zinc-950 border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <Utensils className="size-4 text-amber-500" />
                  <span className="text-[11px]">Mess</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStampType('water')}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition-all ${
                    stampType === 'water'
                      ? 'bg-zinc-100 text-zinc-950 border-white font-bold shadow'
                      : 'bg-zinc-950 border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <Droplets className="size-4 text-blue-500" />
                  <span className="text-[11px]">Water</span>
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="locName" className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                2. Name / Label:
              </label>
              <Input
                id="locName"
                value={stampName}
                onChange={(e) => setStampName(e.target.value)}
                placeholder={
                  stampType === 'block'
                    ? 'e.g. Hostel Block E'
                    : stampType === 'mess'
                    ? 'e.g. Old Mess / Night Canteen'
                    : 'e.g. RO Plant 2'
                }
                className="h-8.5 bg-zinc-950 border-white/15 text-xs text-white"
              />
            </div>

            {/* Drop action */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleStartStampingNew(false)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs h-8 gap-1 shadow"
              >
                <Crosshair className="size-3" />
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
                className="flex-1 border-white/15 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 text-xs h-8 gap-1"
              >
                <Navigation className="size-3 text-blue-400" />
                <span>Use GPS</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
