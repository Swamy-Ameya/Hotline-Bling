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
  CheckCircle2,
  X,
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
}

// Clean MUJ GHS Hostel & Mess positions
const MUJ_SATELLITE_DEFAULTS: StampedLocation[] = [
  { id: 'mess', name: 'Old Mess & Central Dining', shortLabel: 'Old Mess', type: 'mess', lat: 26.84365, lng: 75.56580 },
  { id: 'tank-A', blockKey: 'A', name: 'Hostel Block A', shortLabel: 'Block A', type: 'block', lat: 26.84370, lng: 75.56370 },
  { id: 'tank-B', blockKey: 'B', name: 'Hostel Block B', shortLabel: 'Block B', type: 'block', lat: 26.84390, lng: 75.56445 },
  { id: 'tank-C', blockKey: 'C', name: 'Hostel Block C', shortLabel: 'Block C', type: 'block', lat: 26.84275, lng: 75.56360 },
  { id: 'tank-D', blockKey: 'D', name: 'Hostel Block D', shortLabel: 'Block D', type: 'block', lat: 26.84260, lng: 75.56450 },
  { id: 'water-main', name: 'Main Campus Water Supply', shortLabel: 'Main RO Tank', type: 'water', lat: 26.84430, lng: 75.56510 },
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
      const saved = localStorage.getItem('outbreak_radar_geo_pins_v4');
      if (saved) {
        setLocations(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const savePins = (updated: StampedLocation[]) => {
    setLocations(updated);
    try {
      localStorage.setItem('outbreak_radar_geo_pins_v4', JSON.stringify(updated));
    } catch {}
  };

  const handleResetToDefaults = () => {
    setLocations(MUJ_SATELLITE_DEFAULTS);
    setCenter({ lat: 26.8433, lng: 75.5647 });
    setZoom(17);
    try {
      localStorage.removeItem('outbreak_radar_geo_pins_v4');
    } catch {}
  };

  // Start stamping a newly defined location
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

  // Click on map to stamp active target
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

  const renderPureSatelliteTiles = () => {
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

        const tileUrl = `https://mt1.google.com/vt/lyrs=s&x=${tileX}&y=${tileY}&z=${zoom}`;

        tiles.push(
          <img
            key={`${tileX}-${tileY}-${zoom}`}
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
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-zinc-950 text-white relative">
      {/* Header & Main Toolbelt */}
      <CardHeader className="py-3 px-4 sm:px-6 border-b border-zinc-800 bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-red-600 text-white flex items-center justify-center">
              <MapPin className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-zinc-100">
              Campus Satellite Outbreak Map
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-zinc-700 text-zinc-400">
              Clean View
            </Badge>
          </div>
          <CardDescription className="text-xs text-zinc-400 mt-0.5">
            Pin and monitor hostel blocks, mess kitchens, and water distribution points directly on satellite imagery.
          </CardDescription>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* BIG PROMINENT STAMP BUTTON */}
          <Button
            size="sm"
            onClick={() => setIsStampModalOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs h-8 px-3 gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>+ Stamp New Location</span>
          </Button>

          {/* GPS Quick Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetGps}
            className="text-xs h-8 gap-1.5 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
          >
            <Navigation className="h-3.5 w-3.5 text-blue-400" />
            <span>My GPS Location</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetToDefaults}
            className="text-xs h-8 text-zinc-400 hover:text-zinc-100"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Default Pins
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Quick Node Pin Strip */}
        <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-zinc-200">
            <Crosshair className="h-4 w-4 text-amber-400" />
            <span>Active Pins:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {locations.map((loc) => {
              const isActive = activeStampTarget === loc.id;
              const isSelected = selectedPinId === loc.id;
              const isBlock = loc.type === 'block';
              const isMess = loc.type === 'mess';
              const isWater = loc.type === 'water';

              return (
                <Button
                  key={loc.id}
                  size="xs"
                  variant={isActive ? 'default' : isSelected ? 'secondary' : 'outline'}
                  onClick={() => {
                    setSelectedPinId(loc.id);
                    setActiveStampTarget(isActive ? null : loc.id);
                  }}
                  className={`h-7 px-2.5 text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400'
                      : isSelected
                      ? 'border-white text-white font-bold bg-zinc-800'
                      : 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {isBlock && <Building2 className="h-3 w-3 mr-1 text-emerald-400" />}
                  {isMess && <Utensils className="h-3 w-3 mr-1 text-amber-400" />}
                  {isWater && <Droplets className="h-3 w-3 mr-1 text-blue-400" />}
                  <span>{loc.shortLabel}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Stamping Instruction Banner */}
        {activeStampTarget && (
          <div className="p-3 rounded-lg bg-amber-950/90 border border-amber-500/70 text-amber-100 text-xs flex items-center justify-between shadow-md animate-in fade-in duration-150">
            <span className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-amber-400 animate-spin-slow" />
              <span>
                <strong>Click anywhere on the satellite image below</strong> to place{' '}
                <span className="text-white font-bold underline">
                  {locations.find((l) => l.id === activeStampTarget)?.name}
                </span>.
              </span>
            </span>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setActiveStampTarget(null)}
              className="h-6 text-xs text-amber-300 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        )}

        {gpsError && (
          <div className="p-2 rounded bg-red-950/80 border border-red-800 text-red-300 text-xs">
            {gpsError}
          </div>
        )}

        {/* Clean Satellite Map Viewport */}
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
          className={`relative w-full aspect-[16/10] max-h-[520px] rounded-xl overflow-hidden border border-zinc-800 select-none bg-zinc-950 ${
            activeStampTarget ? 'cursor-crosshair ring-2 ring-amber-500' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Pure Satellite Tile Layer (0 3rd party labels) */}
          {renderPureSatelliteTiles()}

          {/* Stamped Node Markers (Only user and engine labels) */}
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
                {/* Clean Drop Pin Icon */}
                <div
                  className={`relative flex items-center justify-center rounded-full p-2 shadow-lg border-2 transition-all ${
                    isSelected ? 'scale-115 ring-2 ring-white' : 'hover:scale-105'
                  } ${
                    isFlagged
                      ? 'bg-red-600 border-white text-white'
                      : cases > 0
                      ? 'bg-amber-500 border-white text-zinc-950'
                      : isMess
                      ? 'bg-amber-600 border-white text-white'
                      : isWater
                      ? 'bg-blue-600 border-white text-white'
                      : 'bg-zinc-800 border-zinc-300 text-white'
                  }`}
                >
                  {isMess && <Utensils className="h-4 w-4" />}
                  {isBlock && <Building2 className="h-4 w-4" />}
                  {isWater && <Droplets className="h-4 w-4" />}
                </div>

                {/* Drop Pin Tip */}
                <div
                  className={`w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] -mt-0.5 ${
                    isFlagged
                      ? 'border-t-red-600'
                      : cases > 0
                      ? 'border-t-amber-500'
                      : isMess
                      ? 'border-t-amber-600'
                      : isWater
                      ? 'border-t-blue-600'
                      : 'border-t-zinc-800'
                  }`}
                />

                {/* Stamped Building Name Tag */}
                <div className="mt-1 px-2 py-0.5 rounded bg-zinc-950/95 border border-zinc-700 text-[11px] font-bold text-zinc-100 flex items-center gap-1 shadow-md whitespace-nowrap">
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
              <span className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-500/30 animate-pulse absolute" />
              <span className="h-3 w-3 rounded-full bg-blue-500 border border-white relative z-10" />
            </div>
          )}

          {/* Stamping Cursor Follower Tooltip */}
          {activeStampTarget && mousePos && (
            <div
              style={{ left: `${mousePos.x + 12}px`, top: `${mousePos.y + 12}px` }}
              className="absolute z-40 pointer-events-none px-2.5 py-1 rounded-md bg-amber-500 text-zinc-950 font-bold text-xs shadow-lg flex items-center gap-1"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Click to Drop Pin</span>
            </div>
          )}

          {/* Zoom & Recenter Controls */}
          <div className="absolute right-3 bottom-3 z-30 flex flex-col gap-1.5">
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => setZoom((z) => Math.min(19, z + 1))}
              className="h-7 w-7 bg-zinc-900/90 border-zinc-700 text-white hover:bg-zinc-800 shadow"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => setZoom((z) => Math.max(15, z - 1))}
              className="h-7 w-7 bg-zinc-900/90 border-zinc-700 text-white hover:bg-zinc-800 shadow"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="outline"
              onClick={() => {
                setCenter({ lat: 26.8433, lng: 75.5647 });
                setZoom(17);
              }}
              title="Recenter GHS Hostel"
              className="h-7 w-7 bg-zinc-900/90 border-zinc-700 text-white hover:bg-zinc-800 shadow"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="absolute left-3 bottom-3 z-30 px-2 py-1 rounded bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            Center: {center.lat.toFixed(5)}° N, {center.lng.toFixed(5)}° E · Zoom: {zoom}
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedLoc && (
          <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                {selectedLoc.type === 'mess' ? (
                  <Utensils className="h-4 w-4 text-amber-400" />
                ) : selectedLoc.type === 'water' ? (
                  <Droplets className="h-4 w-4 text-blue-400" />
                ) : (
                  <Building2 className="h-4 w-4 text-emerald-400" />
                )}
                <div>
                  <h4 className="font-bold text-zinc-100">{selectedLoc.name}</h4>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Coordinates: {selectedLoc.lat.toFixed(5)}° N, {selectedLoc.lng.toFixed(5)}° E
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setActiveStampTarget(selectedLoc.id)}
                  className="h-7 text-xs border-zinc-700 text-zinc-200"
                >
                  <Crosshair className="h-3 w-3 mr-1" /> Re-Position on Map
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleDeleteNode(selectedLoc.id)}
                  className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/50"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Remove Pin
                </Button>

                <Link href={`/radar/${result.scenario}`}>
                  <Button size="sm" className="h-7 text-xs bg-zinc-100 hover:bg-white text-zinc-900 font-medium gap-1">
                    <span>Inspect Cluster</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {selectedBlockData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px]">Total Cases</span>
                  <span className="font-bold text-zinc-100">
                    {formatCases(selectedBlockData.caseCount, selectedBlockData.suppressed)}
                  </span>
                </div>
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px]">Attack Rate</span>
                  <span className="font-bold text-zinc-100">
                    {formatAttackRate(selectedBlockData.attackRate)}
                  </span>
                </div>
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px]">Floors Monitored</span>
                  <span className="font-bold text-zinc-100">5 Floors (10 Filters)</span>
                </div>
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px]">Plumbing Tank</span>
                  <span className="font-bold text-zinc-100">{selectedBlockData.tankName}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* STAMP NEW LOCATION MODAL DIALOG */}
      {isStampModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-5 space-y-4 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-600 text-white">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-base">Stamp New Campus Location</h3>
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setIsStampModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Step 1: Type selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">1. Select Location Type:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStampType('block')}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                    stampType === 'block'
                      ? 'bg-zinc-100 text-zinc-950 border-white font-bold shadow'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Building2 className="h-5 w-5 text-emerald-500" />
                  <span>Hostel Block</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStampType('mess')}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                    stampType === 'mess'
                      ? 'bg-zinc-100 text-zinc-950 border-white font-bold shadow'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Utensils className="h-5 w-5 text-amber-500" />
                  <span>Dining Mess</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStampType('water')}
                  className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all ${
                    stampType === 'water'
                      ? 'bg-zinc-100 text-zinc-950 border-white font-bold shadow'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Droplets className="h-5 w-5 text-blue-500" />
                  <span>RO Water Source</span>
                </button>
              </div>
            </div>

            {/* Step 2: Name Input */}
            <div className="space-y-1.5">
              <label htmlFor="locName" className="text-xs font-semibold text-zinc-300">
                2. Location Name / Title:
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
                    : 'e.g. RO Plant #2 (Overhead Tank)'
                }
                className="h-9 bg-zinc-950 border-zinc-700 text-xs text-white"
              />
            </div>

            {/* Step 3: Stamping Mode Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleStartStampingNew(false)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs h-9 gap-1.5 shadow"
              >
                <Crosshair className="h-4 w-4" />
                <span>Click Map to Drop Pin</span>
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
                className="flex-1 border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-xs h-9 gap-1.5"
              >
                <Navigation className="h-3.5 w-3.5 text-blue-400" />
                <span>Stamp at My GPS</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
