'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CampusElevation, DetectionResult } from '@/lib/types';
import { formatCases, formatAttackRate } from './attack-rate-utils';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Building2, 
  Utensils, 
  RotateCcw,
  ExternalLink,
  Plus,
  Minus,
  Maximize2,
  ShieldAlert,
  Layers,
  Map as MapIcon,
  CheckCircle2
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
  type: 'block' | 'mess' | 'tank' | 'filter';
  blockKey?: string;
  lat: number;
  lng: number;
}

// Exact Manipal University Jaipur (MUJ) GHS Hostel & Mess GPS coordinates from satellite survey
const MUJ_SATELLITE_DEFAULTS: StampedLocation[] = [
  { id: 'mess', name: 'Old Mess & Central Dining', shortLabel: 'Old Mess', type: 'mess', lat: 26.84365, lng: 75.56580 },
  { id: 'tank-A', blockKey: 'A', name: 'GHS Hostel Block A (Tank A)', shortLabel: 'Block A', type: 'block', lat: 26.84370, lng: 75.56370 },
  { id: 'tank-B', blockKey: 'B', name: 'GHS Hostel Block B (Tank B)', shortLabel: 'Block B', type: 'block', lat: 26.84390, lng: 75.56445 },
  { id: 'tank-C', blockKey: 'C', name: 'GHS Hostel Block C (Tank C)', shortLabel: 'Block C', type: 'block', lat: 26.84275, lng: 75.56360 },
  { id: 'tank-D', blockKey: 'D', name: 'GHS Hostel Block D (Tank D)', shortLabel: 'Block D', type: 'block', lat: 26.84260, lng: 75.56450 },
];

// Helper to convert lat/lng to Web Mercator tile numbers
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

// Convert lat/lng to pixel offset within tile coordinates
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
  
  // Center centered on MUJ GHS Hostel & Old Mess
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 26.8433, lng: 75.5647 });
  const [zoom, setZoom] = useState(17);
  const [mapType, setMapType] = useState<'hybrid' | 'satellite' | 'streets'>('hybrid');
  const [isStampingMode, setIsStampingMode] = useState(false);

  // Drag-to-pan state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Load saved stamped pins if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('outbreak_radar_geo_pins_v2');
      if (saved) {
        setLocations(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const savePins = (updated: StampedLocation[]) => {
    setLocations(updated);
    try {
      localStorage.setItem('outbreak_radar_geo_pins_v2', JSON.stringify(updated));
    } catch {}
  };

  const handleResetToDefaults = () => {
    setLocations(MUJ_SATELLITE_DEFAULTS);
    setCenter({ lat: 26.8433, lng: 75.5647 });
    setZoom(17);
    try {
      localStorage.removeItem('outbreak_radar_geo_pins_v2');
    } catch {}
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
          setIsStampingMode(false);
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
    if (activeStampTarget) return; // Stamping mode takes click priority
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    // Convert pixel delta to lat/lng delta at current zoom
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
    setActiveStampTarget(null);
    setIsStampingMode(false);
  };

  // Convert marker lat/lng to container pixel coordinates
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

  // Generate 3x3 grid of map tiles around current center
  const renderTiles = () => {
    const centerTile = latLngToTile(center.lat, center.lng, zoom);
    const centerPixel = latLngToPixel(center.lat, center.lng, zoom);
    const containerW = mapContainerRef.current ? mapContainerRef.current.clientWidth : 800;
    const containerH = mapContainerRef.current ? mapContainerRef.current.clientHeight : 500;

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
        if (mapType === 'hybrid') {
          tileUrl = `https://mt1.google.com/vt/lyrs=y&x=${tileX}&y=${tileY}&z=${zoom}`;
        } else if (mapType === 'satellite') {
          tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${tileY}/${tileX}`;
        } else {
          tileUrl = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tileX}/${tileY}.png`;
        }

        tiles.push(
          <img
            key={`${tileX}-${tileY}-${zoom}-${mapType}`}
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
    <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-zinc-950 text-white">
      <CardHeader className="py-3 px-4 sm:px-6 border-b border-zinc-800 bg-zinc-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-red-600 text-white flex items-center justify-center">
              <MapPin className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-zinc-100">
              Campus Satellite Outbreak Map (Manipal University Jaipur)
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-zinc-700 text-zinc-400">
              GHS Hostels &amp; Mess
            </Badge>
          </div>
          <CardDescription className="text-xs text-zinc-400 mt-0.5">
            Georeferenced Google Satellite imagery with manual pin stamper for hostel buildings, dining halls, and water tanks.
          </CardDescription>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Layer Switcher */}
          <div className="p-0.5 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center text-xs">
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mapType === 'hybrid' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Hybrid
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mapType === 'satellite' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('streets')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                mapType === 'streets' ? 'bg-zinc-700 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Streets
            </button>
          </div>

          {/* GPS Quick Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetGps}
            className="text-xs h-7.5 gap-1.5 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
          >
            <Navigation className="h-3.5 w-3.5 text-blue-400" />
            <span>Use My GPS</span>
          </Button>

          {/* Stamping Mode Toggle */}
          <Button
            size="sm"
            variant={isStampingMode ? 'default' : 'outline'}
            onClick={() => {
              setIsStampingMode(!isStampingMode);
              setActiveStampTarget(null);
            }}
            className={`text-xs h-7.5 gap-1.5 ${
              isStampingMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold'
                : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>{isStampingMode ? 'Stamper Active' : 'Stamp Pin Location'}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetToDefaults}
            className="text-xs h-7.5 text-zinc-400 hover:text-zinc-100"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Pins
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Stamping Instruction Bar */}
        {isStampingMode && (
          <div className="p-3 rounded-lg bg-amber-950/70 border border-amber-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-amber-200 flex items-center gap-1.5">
                <Crosshair className="h-4 w-4 text-amber-400" />
                Select a target below, then click on the satellite map to stamp its location:
              </span>
              <span className="text-[11px] text-amber-300/80">
                You can reposition Block A, Block B, Block C, Block D, or Old Mess to match your hostel layout.
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {locations.map((loc) => {
                const isActive = activeStampTarget === loc.id;
                return (
                  <Button
                    key={loc.id}
                    size="xs"
                    variant={isActive ? 'default' : 'outline'}
                    onClick={() => setActiveStampTarget(isActive ? null : loc.id)}
                    className={`h-7 px-2.5 text-xs ${
                      isActive
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'border-amber-700/60 text-amber-200 hover:bg-amber-900/40'
                    }`}
                  >
                    {loc.shortLabel}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {gpsError && (
          <div className="p-2 rounded bg-red-950/80 border border-red-800 text-red-300 text-xs">
            {gpsError}
          </div>
        )}

        {/* Interactive Satellite Map Viewport */}
        <div
          ref={mapContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleMapClick}
          className={`relative w-full aspect-[16/10] max-h-[500px] rounded-xl overflow-hidden border border-zinc-800 select-none bg-zinc-950 ${
            activeStampTarget ? 'cursor-crosshair ring-2 ring-amber-500' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Real Satellite Tiles */}
          {renderTiles()}

          {/* Subtle Topographic Overlay */}
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />

          {/* Stamped Map Markers */}
          {locations.map((loc) => {
            const isBlock = loc.type === 'block';
            const isMess = loc.type === 'mess';

            const blockData = isBlock && loc.blockKey
              ? elevation.blocks.find((b) => b.label.includes(loc.blockKey!))
              : null;
            
            const isFlagged = isBlock ? blockData?.isFlagged : elevation.mess.isFlagged || result.topCluster?.hypothesis === 'food';
            const cases = isBlock ? blockData?.caseCount ?? 0 : elevation.mess.caseCount;
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
                {/* Clean Google Maps Style Marker Pin */}
                <div
                  className={`relative flex items-center justify-center rounded-full p-2 shadow-lg border-2 transition-all ${
                    isSelected ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                  } ${
                    isFlagged
                      ? 'bg-red-600 border-white text-white'
                      : cases > 0
                      ? 'bg-amber-500 border-white text-zinc-950'
                      : isMess
                      ? 'bg-emerald-600 border-white text-white'
                      : 'bg-zinc-800 border-zinc-300 text-white'
                  }`}
                >
                  {isMess ? <Utensils className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                </div>

                {/* Pin Tip */}
                <div
                  className={`w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] -mt-0.5 ${
                    isFlagged
                      ? 'border-t-red-600'
                      : cases > 0
                      ? 'border-t-amber-500'
                      : isMess
                      ? 'border-t-emerald-600'
                      : 'border-t-zinc-800'
                  }`}
                />

                {/* Marker Name Badge */}
                <div className="mt-1 px-2 py-0.5 rounded bg-zinc-950/90 border border-zinc-700 text-[10px] font-bold text-zinc-100 flex items-center gap-1 shadow whitespace-nowrap">
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

          {/* Map Controls: Zoom + Center */}
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
              title="Recenter MUJ GHS"
              className="h-7 w-7 bg-zinc-900/90 border-zinc-700 text-white hover:bg-zinc-800 shadow"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Coordinate Readout */}
          <div className="absolute left-3 bottom-3 z-30 px-2 py-1 rounded bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            Center: {center.lat.toFixed(5)}° N, {center.lng.toFixed(5)}° E · Zoom: {zoom}
          </div>
        </div>

        {/* Selected Pin Deep Inspection Card */}
        {selectedLoc && (
          <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                {selectedLoc.type === 'mess' ? (
                  <Utensils className="h-4 w-4 text-amber-400" />
                ) : (
                  <Building2 className="h-4 w-4 text-emerald-400" />
                )}
                <div>
                  <h4 className="font-bold text-zinc-100">{selectedLoc.name}</h4>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Lat/Lng: {selectedLoc.lat.toFixed(5)}° N, {selectedLoc.lng.toFixed(5)}° E
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
    </Card>
  );
}
