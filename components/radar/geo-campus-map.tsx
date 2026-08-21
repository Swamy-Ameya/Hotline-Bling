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
  Box,
  Sparkles
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
  floors?: number;
}

// Clean MUJ GHS Hostel & Mess positions
const MUJ_SATELLITE_DEFAULTS: StampedLocation[] = [
  { id: 'mess', name: 'Old Mess & Central Dining', shortLabel: 'Old Mess', type: 'mess', lat: 26.84365, lng: 75.56580, floors: 2 },
  { id: 'tank-A', blockKey: 'A', name: 'Hostel Block A', shortLabel: 'Block A', type: 'block', lat: 26.84370, lng: 75.56370, floors: 5 },
  { id: 'tank-B', blockKey: 'B', name: 'Hostel Block B', shortLabel: 'Block B', type: 'block', lat: 26.84390, lng: 75.56445, floors: 5 },
  { id: 'tank-C', blockKey: 'C', name: 'Hostel Block C', shortLabel: 'Block C', type: 'block', lat: 26.84275, lng: 75.56360, floors: 5 },
  { id: 'tank-D', blockKey: 'D', name: 'Hostel Block D', shortLabel: 'Block D', type: 'block', lat: 26.84260, lng: 75.56450, floors: 5 },
  { id: 'water-main', name: 'Main Campus Water Supply', shortLabel: 'Main RO Tank', type: 'water', lat: 26.84430, lng: 75.56510, floors: 1 },
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
  
  // Basemap style & 3D Extrusion state
  const [mapStyle, setMapStyle] = useState<'light' | 'satellite' | 'dark'>('light');
  const [is3DExaggerated, setIs3DExaggerated] = useState(true);

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
      const saved = localStorage.getItem('outbreak_radar_geo_pins_v9');
      if (saved) {
        setLocations(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const savePins = (updated: StampedLocation[]) => {
    setLocations(updated);
    try {
      localStorage.setItem('outbreak_radar_geo_pins_v9', JSON.stringify(updated));
    } catch {}
  };

  const handleResetToDefaults = () => {
    setLocations(MUJ_SATELLITE_DEFAULTS);
    setCenter({ lat: 26.8433, lng: 75.5647 });
    setZoom(17);
    try {
      localStorage.removeItem('outbreak_radar_geo_pins_v9');
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
        floors: stampType === 'block' ? 5 : stampType === 'mess' ? 2 : 1,
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
      floors: stampType === 'block' ? 5 : stampType === 'mess' ? 2 : 1,
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
    <Card className="border border-zinc-200 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden bg-zinc-950 text-white relative rounded-2xl">
      {/* Header & Main Toolbelt */}
      <CardHeader className="py-3 px-4 sm:px-6 border-b border-white/[0.08] bg-zinc-900/90 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-red-600 text-white shadow-xs flex items-center justify-center">
              <Box className="size-3.5" />
            </div>
            <CardTitle className="text-sm sm:text-base font-bold tracking-tight text-zinc-100">
              3D Raised Campus Buildings &amp; Outbreak Radar
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-zinc-400 py-0 h-4">
              {is3DExaggerated ? '3D Extruded Buildings' : 'Flat Map'}
            </Badge>
          </div>
          <CardDescription className="text-xs text-zinc-400 mt-0.5">
            Exaggerated 3D architectural prisms for hostel blocks, dining mess, and plumbing tanks with floor-level outbreak illumination.
          </CardDescription>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 3D Extrusion Toggle */}
          <Button
            size="sm"
            variant={is3DExaggerated ? 'secondary' : 'outline'}
            onClick={() => setIs3DExaggerated(!is3DExaggerated)}
            className="text-xs h-7.5 gap-1 border-white/10 text-zinc-200"
          >
            <Box className="size-3 text-emerald-400" />
            <span>3D Height {is3DExaggerated ? 'ON' : 'OFF'}</span>
          </Button>

          {/* Basemap Style Switcher */}
          <div className="p-0.5 rounded-lg bg-zinc-800/90 border border-white/10 flex items-center text-xs">
            <button
              onClick={() => setMapStyle('light')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mapStyle === 'light'
                  ? 'bg-white text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mapStyle === 'satellite'
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sat
            </button>
            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mapStyle === 'dark'
                  ? 'bg-zinc-700 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Dark
            </button>
          </div>

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
            <span>GPS</span>
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
            <span>3D Buildings:</span>
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
                <strong>Click anywhere on the map</strong> to stamp/reposition{' '}
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

        {/* 3D Interactive Map Canvas with Raised Architectural Buildings */}
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
          className={`relative w-full aspect-[16/10] max-h-[540px] rounded-xl overflow-hidden border border-white/[0.08] select-none ${
            mapStyle === 'light' ? 'bg-[#f4f3f0]' : 'bg-[#09090b]'
          } shadow-inner ${
            activeStampTarget ? 'cursor-crosshair ring-2 ring-amber-500' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Base Tiles Layer */}
          {renderTiles()}

          {/* 3D RAISED EXTRUDED ARCHITECTURAL BUILDINGS */}
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

            // Exaggerated 3D Building Height (pixels)
            const height = is3DExaggerated
              ? isBlock
                ? 56
                : isMess
                ? 36
                : 24
              : 0;

            const width = isBlock ? 68 : isMess ? 82 : 48;
            const depth = isBlock ? 42 : isMess ? 50 : 34;

            return (
              <div
                key={loc.id}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeStampTarget) {
                    handleMapClick(e as any);
                  } else {
                    setSelectedPinId(isSelected ? null : loc.id);
                  }
                }}
                className={`absolute z-20 cursor-pointer transition-all duration-200 group flex flex-col items-center select-none ${
                  isSelected ? 'scale-105' : 'hover:scale-[1.03]'
                }`}
              >
                {/* 3D Cast Drop Shadow */}
                {is3DExaggerated && (
                  <div
                    style={{
                      width: `${width + 16}px`,
                      height: `${depth + 10}px`,
                      transform: 'translate(10px, 14px) skewX(-20deg)',
                    }}
                    className="absolute bg-black/40 rounded-xl blur-sm pointer-events-none"
                  />
                )}

                {/* 3D Raised Isometric Building Prism */}
                {is3DExaggerated ? (
                  <div
                    style={{ width: `${width}px`, height: `${depth + height}px` }}
                    className="relative flex flex-col justify-end"
                  >
                    {/* Front 3D Extruded Building Wall */}
                    <div
                      style={{
                        height: `${height}px`,
                        width: `${width}px`,
                        bottom: '0',
                      }}
                      className={`absolute rounded-b-lg border-x border-b shadow-md transition-colors overflow-hidden flex flex-col justify-around py-1 px-1.5 ${
                        isFlagged
                          ? 'bg-gradient-to-b from-red-800 to-red-950 border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.5)]'
                          : cases > 0
                          ? 'bg-gradient-to-b from-amber-700 to-amber-950 border-amber-500'
                          : isMess
                          ? 'bg-gradient-to-b from-zinc-700 to-zinc-900 border-zinc-600'
                          : isWater
                          ? 'bg-gradient-to-b from-blue-800 to-blue-950 border-blue-600'
                          : 'bg-gradient-to-b from-zinc-600 to-zinc-800 border-zinc-500'
                      }`}
                    >
                      {/* Floor Lines & Windows Grid */}
                      <div className="w-full flex justify-between gap-0.5 opacity-60">
                        <span className="h-1 flex-1 bg-white/40 rounded-xs" />
                        <span className="h-1 flex-1 bg-white/40 rounded-xs" />
                        <span className="h-1 flex-1 bg-white/40 rounded-xs" />
                      </div>
                      <div className="w-full flex justify-between gap-0.5 opacity-60">
                        <span className="h-1 flex-1 bg-white/40 rounded-xs" />
                        <span className="h-1 flex-1 bg-white/40 rounded-xs" />
                        <span className="h-1 flex-1 bg-white/40 rounded-xs" />
                      </div>
                      <div className="w-full flex justify-between gap-0.5 opacity-60">
                        <span className="h-1 flex-1 bg-white/40 rounded-xs" />
                        <span className="h-1 flex-1 bg-white/40 rounded-xs" />
                        <span className="h-1 flex-1 bg-white/40 rounded-xs" />
                      </div>
                    </div>

                    {/* Raised 3D Rooftop Face */}
                    <div
                      style={{
                        width: `${width}px`,
                        height: `${depth}px`,
                        top: '0',
                      }}
                      className={`absolute rounded-t-lg border-2 shadow-lg flex flex-col items-center justify-center transition-all ${
                        isSelected ? 'ring-2 ring-white scale-102' : ''
                      } ${
                        isFlagged
                          ? 'bg-red-600 border-white text-white animate-pulse'
                          : cases > 0
                          ? 'bg-amber-500 border-white text-zinc-950'
                          : isMess
                          ? 'bg-amber-600 border-zinc-200 text-white'
                          : isWater
                          ? 'bg-blue-600 border-zinc-200 text-white'
                          : 'bg-zinc-800 border-zinc-300 text-white'
                      }`}
                    >
                      {/* Rooftop Utility / Tank Icon */}
                      <div className="flex items-center gap-1 font-bold text-[10px]">
                        {isMess && <Utensils className="size-3" />}
                        {isBlock && <Building2 className="size-3" />}
                        {isWater && <Droplets className="size-3" />}
                        <span className="tracking-tight">{loc.shortLabel}</span>
                      </div>

                      {/* Cases / Status Pill on Roof */}
                      {isFlagged ? (
                        <span className="mt-0.5 px-1 py-0.2 rounded bg-white text-red-700 text-[8px] font-extrabold tracking-tighter">
                          OUTBREAK
                        </span>
                      ) : cases > 0 ? (
                        <span className="mt-0.5 px-1 py-0.2 rounded bg-zinc-950 text-amber-400 text-[8px] font-bold">
                          {formatCases(cases, false)} SICK
                        </span>
                      ) : (
                        <span className="text-[8px] opacity-70 font-mono">
                          {isBlock ? '5 Floors' : isMess ? 'Shared' : 'RO Tank'}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Flat Marker Fallback */
                  <div className="flex flex-col items-center">
                    <div
                      className={`p-1.5 rounded-full border-2 shadow-md ${
                        isFlagged
                          ? 'bg-red-600 border-white text-white'
                          : cases > 0
                          ? 'bg-amber-500 border-zinc-900 text-zinc-950'
                          : 'bg-zinc-900 border-white text-white'
                      }`}
                    >
                      {isMess ? <Utensils className="size-3" /> : <Building2 className="size-3" />}
                    </div>
                    <div className="mt-0.5 px-2 py-0.5 rounded-full bg-zinc-950/90 border border-white/20 text-[10px] font-bold text-zinc-100">
                      {loc.shortLabel}
                    </div>
                  </div>
                )}
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
              <span>Click to Drop 3D Building</span>
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
            3D Elevation View · Zoom {zoom}
          </div>
        </div>

        {/* Selected 3D Building Inspection Drawer */}
        {selectedLoc && (
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                {selectedLoc.type === 'mess' ? (
                  <Utensils className="size-4 text-amber-400" />
                ) : selectedLoc.type === 'water' ? (
                  <Droplets className="size-4 text-blue-400" />
                ) : (
                  <Building2 className="size-4 text-emerald-400" />
                )}
                <div>
                  <h4 className="font-bold text-zinc-100 text-sm">{selectedLoc.name}</h4>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    3D Elevation: {selectedLoc.floors ?? 5} Stories · Coordinates: {selectedLoc.lat.toFixed(5)}° N, {selectedLoc.lng.toFixed(5)}° E
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setActiveStampTarget(selectedLoc.id)}
                  className="h-7 text-xs border-white/10 text-zinc-200"
                >
                  <Crosshair className="size-3 mr-1" /> Re-Position on Map
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleDeleteNode(selectedLoc.id)}
                  className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
                >
                  <Trash2 className="size-3 mr-1" /> Delete
                </Button>

                <Link href={`/radar/${result.scenario}`}>
                  <Button size="xs" className="h-7 text-xs bg-zinc-100 hover:bg-white text-zinc-950 font-semibold gap-1">
                    <span>Inspect Cluster</span>
                    <ExternalLink className="size-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {selectedBlockData && (
              <div className="space-y-2">
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
                    <span className="text-zinc-400 block text-[10px]">Plumbing Lineage</span>
                    <span className="font-bold text-zinc-100 text-xs">{selectedBlockData.tankName}</span>
                  </div>
                </div>

                {/* 5-Story Floor Matrix */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {selectedBlockData.floors.map((fl) => (
                    <div
                      key={fl.nodeId}
                      className={`p-2 rounded-lg border text-center text-[10px] flex flex-col justify-between ${
                        fl.isFlagged
                          ? 'bg-red-950 border-red-500 text-red-200 font-bold'
                          : fl.caseCount > 0
                          ? 'bg-amber-950/60 border-amber-600 text-amber-200'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <span>{fl.label}</span>
                      <span className="font-mono mt-0.5">{formatCases(fl.caseCount, fl.suppressed)} cases</span>
                    </div>
                  ))}
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
                <h3 className="font-bold text-sm">Stamp New 3D Building</h3>
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
                  <span className="text-[11px]">5-Story Hostel</span>
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
                  <span className="text-[11px]">2-Story Mess</span>
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
                  <span className="text-[11px]">Water Tank</span>
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="locName" className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                2. Building Name / Title:
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
