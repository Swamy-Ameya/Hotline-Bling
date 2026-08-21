'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CampusElevation, DetectionResult } from '@/lib/types';
import { formatCases, formatAttackRate } from './attack-rate-utils';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Layers, 
  Building2, 
  Utensils, 
  Waves, 
  CheckCircle2, 
  Radio, 
  Plus, 
  Save, 
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface GeoCampusMapProps {
  elevation: CampusElevation;
  result: DetectionResult;
}

export interface StampedLocation {
  id: string;
  name: string;
  type: 'block' | 'mess' | 'tank' | 'filter';
  blockKey?: string;
  lat: number;
  lng: number;
  customLabel?: string;
}

// Default Manipal University Jaipur (MUJ) hostel sector layout
const DEFAULT_MUJ_COORDS: StampedLocation[] = [
  { id: 'mess', name: 'Central Mess & Dining Hall', type: 'mess', lat: 26.84385, lng: 75.56520 },
  { id: 'tank-A', blockKey: 'A', name: 'Hostel Block A (Tank A)', type: 'block', lat: 26.84460, lng: 75.56430 },
  { id: 'tank-B', blockKey: 'B', name: 'Hostel Block B (Tank B)', type: 'block', lat: 26.84475, lng: 75.56610 },
  { id: 'tank-C', blockKey: 'C', name: 'Hostel Block C (Tank C)', type: 'block', lat: 26.84310, lng: 75.56420 },
  { id: 'tank-D', blockKey: 'D', name: 'Hostel Block D (Tank D)', type: 'block', lat: 26.84295, lng: 75.56600 },
];

export function GeoCampusMap({ elevation, result }: GeoCampusMapProps) {
  const [locations, setLocations] = useState<StampedLocation[]>(DEFAULT_MUJ_COORDS);
  const [activeStampTarget, setActiveStampTarget] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 26.84385, lng: 75.56520 });
  const [zoom, setZoom] = useState(17);
  const [isStampingMode, setIsStampingMode] = useState(false);

  // Load custom stamped locations from localStorage if saved
  useEffect(() => {
    try {
      const saved = localStorage.getItem('outbreak_radar_geo_pins');
      if (saved) {
        setLocations(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save locations
  const handleSavePins = () => {
    localStorage.setItem('outbreak_radar_geo_pins', JSON.stringify(locations));
  };

  const handleResetPins = () => {
    setLocations(DEFAULT_MUJ_COORDS);
    localStorage.removeItem('outbreak_radar_geo_pins');
    setMapCenter({ lat: 26.84385, lng: 75.56520 });
  };

  // Browser HTML5 Geolocation API
  const handleGetGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserGps(coords);
        setMapCenter(coords);

        // If stamping target is selected, stamp to user's exact current location
        if (activeStampTarget) {
          setLocations((prev) =>
            prev.map((loc) => (loc.id === activeStampTarget ? { ...loc, lat: coords.lat, lng: coords.lng } : loc))
          );
        }
      },
      (error) => {
        setGpsError(`GPS Error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Convert lat/lng to container pixel coordinates for rendering
  const getPixelPosition = (lat: number, lng: number) => {
    // Relative offset scale around map center
    const latSpan = 0.0035;
    const lngSpan = 0.0045;

    const y = ((mapCenter.lat + latSpan / 2 - lat) / latSpan) * 100;
    const x = ((lng - (mapCenter.lng - lngSpan / 2)) / lngSpan) * 100;

    return { top: `${Math.min(92, Math.max(8, y))}%`, left: `${Math.min(92, Math.max(8, x))}%` };
  };

  // Click on map to stamp active target
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeStampTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const latSpan = 0.0035;
    const lngSpan = 0.0045;

    const clickedLat = mapCenter.lat + latSpan / 2 - clickY * latSpan;
    const clickedLng = mapCenter.lng - lngSpan / 2 + clickX * lngSpan;

    setLocations((prev) =>
      prev.map((loc) => (loc.id === activeStampTarget ? { ...loc, lat: clickedLat, lng: clickedLng } : loc))
    );

    setActiveStampTarget(null);
    setIsStampingMode(false);
  };

  const selectedLoc = locations.find((l) => l.id === selectedPinId);
  const selectedBlockData = selectedLoc?.blockKey
    ? elevation.blocks.find((b) => b.label.includes(selectedLoc.blockKey!))
    : null;

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-white shadow-xl overflow-hidden">
      <CardHeader className="py-3 px-4 sm:px-6 border-b border-zinc-800 bg-zinc-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5">
              <Radio className="h-4 w-4 animate-pulse text-red-400" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">GEO-SPATIAL RADAR</span>
            </div>
            <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
              Campus Satellite Pinboard &amp; Outbreak Map
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-400 mt-0.5">
            Georeferenced hostel buildings, central kitchen, and water distribution tanks with live infection overlays.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* GPS Quick Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetGps}
            className="text-xs h-8 gap-1.5 border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200"
          >
            <Navigation className="h-3.5 w-3.5 text-blue-400" />
            <span>Use My GPS</span>
          </Button>

          {/* Stamping Mode Toggle */}
          <Button
            size="sm"
            variant={isStampingMode ? 'default' : 'secondary'}
            onClick={() => setIsStampingMode(!isStampingMode)}
            className={`text-xs h-8 gap-1.5 ${isStampingMode ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold' : ''}`}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>{isStampingMode ? 'Stamping Active' : 'Manual Stamper'}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetPins}
            className="text-xs h-8 text-zinc-400 hover:text-zinc-100"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Pins
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* GPS Info or Stamp Prompt Bar */}
        {isStampingMode && (
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <Crosshair className="h-4 w-4 text-amber-400" />
                Select a campus building, then click anywhere on the map to stamp its real coordinates:
              </span>
              <span className="text-[11px] text-amber-300/80">
                You can also click &ldquo;Use My GPS&rdquo; while standing inside a block to stamp with high accuracy.
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {locations.map((loc) => {
                const isActive = activeStampTarget === loc.id;
                return (
                  <Button
                    key={loc.id}
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    onClick={() => setActiveStampTarget(isActive ? null : loc.id)}
                    className={`text-xs h-7 px-2.5 ${isActive ? 'bg-amber-500 text-zinc-950 font-bold' : 'border-amber-700/60 text-amber-200'}`}
                  >
                    {loc.name.split(' ')[0]} {loc.blockKey ?? ''}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {gpsError && (
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
            {gpsError}
          </div>
        )}

        {userGps && (
          <div className="flex items-center justify-between text-xs text-blue-300 bg-blue-950/40 p-2 rounded-lg border border-blue-900 font-mono">
            <span className="flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-blue-400" /> Your Live GPS Location:
            </span>
            <span>{userGps.lat.toFixed(5)}° N, {userGps.lng.toFixed(5)}° E</span>
          </div>
        )}

        {/* Map Canvas with Real Cartographic Tiles */}
        <div
          onClick={handleMapClick}
          className={`relative w-full aspect-[16/10] max-h-[460px] rounded-2xl overflow-hidden border border-zinc-800 select-none ${
            activeStampTarget ? 'cursor-crosshair ring-2 ring-amber-500' : 'cursor-default'
          }`}
          style={{
            // Dark map aesthetic with OSM tiles
            backgroundImage: `radial-gradient(circle at center, rgba(16, 185, 129, 0.05) 0%, rgba(9, 9, 11, 0.95) 100%), url('https://a.basemaps.cartocdn.com/dark_all/17/93245/54312.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Subtle Radar Scan Wave */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[90%] h-[90%] rounded-full border border-emerald-500/15 animate-[spin_12s_linear_infinite]" />
            <div className="w-[60%] h-[60%] rounded-full border border-emerald-500/10" />
            <div className="w-[30%] h-[30%] rounded-full border border-emerald-500/10" />
          </div>

          {/* Stamped Pins */}
          {locations.map((loc) => {
            const isBlock = loc.type === 'block';
            const isMess = loc.type === 'mess';

            // Find live infection status from engine elevation
            const blockData = isBlock && loc.blockKey
              ? elevation.blocks.find((b) => b.label.includes(loc.blockKey!))
              : null;
            
            const isFlagged = isBlock ? blockData?.isFlagged : elevation.mess.isFlagged || result.topCluster?.hypothesis === 'food';
            const cases = isBlock ? blockData?.caseCount ?? 0 : elevation.mess.caseCount;
            const isSelected = selectedPinId === loc.id;
            const pos = getPixelPosition(loc.lat, loc.lng);

            return (
              <div
                key={loc.id}
                style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeStampTarget) {
                    handleMapClick(e as any);
                  } else {
                    setSelectedPinId(isSelected ? null : loc.id);
                  }
                }}
                className={`absolute z-20 cursor-pointer transition-all duration-300 group flex flex-col items-center`}
              >
                {/* Outbreak Heat Aura */}
                {isFlagged ? (
                  <span className="absolute -inset-4 rounded-full bg-red-600/40 blur-md pointer-events-none animate-ping" />
                ) : cases > 0 ? (
                  <span className="absolute -inset-2 rounded-full bg-amber-500/30 blur-sm pointer-events-none" />
                ) : (
                  <span className="absolute -inset-1 rounded-full bg-emerald-500/10 blur-xs pointer-events-none" />
                )}

                {/* Stamped Icon Pin */}
                <div
                  className={`p-2.5 rounded-2xl border-2 flex items-center justify-center shadow-2xl transition-transform ${
                    isSelected ? 'scale-125 ring-4 ring-white' : 'hover:scale-110'
                  } ${
                    isFlagged
                      ? 'bg-red-600 border-white text-white animate-bounce'
                      : cases > 0
                      ? 'bg-amber-500 border-amber-300 text-zinc-950'
                      : isMess
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-zinc-900 border-zinc-600 text-zinc-200'
                  }`}
                >
                  {isMess ? <Utensils className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                </div>

                {/* Pin Label Tag */}
                <div className="mt-1 px-2 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-700 text-[10px] font-bold text-zinc-100 flex items-center gap-1 shadow-md whitespace-nowrap">
                  <span>{loc.name}</span>
                  {isFlagged && <span className="text-red-400 font-extrabold">• OUTBREAK</span>}
                </div>
              </div>
            );
          })}

          {/* User GPS Live Marker */}
          {userGps && (
            <div
              style={{ ...getPixelPosition(userGps.lat, userGps.lng), transform: 'translate(-50%, -50%)' }}
              className="absolute z-30 pointer-events-none flex flex-col items-center"
            >
              <span className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-500/40 animate-ping absolute" />
              <span className="h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white relative z-10" />
              <span className="mt-1 px-1.5 py-0.2 rounded bg-blue-900/90 border border-blue-400 text-[9px] font-bold text-blue-100">
                You
              </span>
            </div>
          )}
        </div>

        {/* Selected Pin Deep Inspection Card */}
        {selectedLoc && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 transition-all animate-in fade-in duration-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                {selectedLoc.type === 'mess' ? (
                  <Utensils className="h-5 w-5 text-amber-400" />
                ) : (
                  <Building2 className="h-5 w-5 text-emerald-400" />
                )}
                <div>
                  <h4 className="font-bold text-sm text-zinc-100">{selectedLoc.name}</h4>
                  <p className="text-xs text-zinc-400 font-mono">
                    Stamped Coordinates: {selectedLoc.lat.toFixed(5)}° N, {selectedLoc.lng.toFixed(5)}° E
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/radar/${result.scenario}`}>
                  <Button size="sm" className="h-7 text-xs bg-zinc-100 hover:bg-white text-zinc-900 font-semibold gap-1">
                    <span>Inspect Cluster Drill-Down</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {selectedBlockData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px]">Total Cases</span>
                  <span className="font-bold text-zinc-100 text-sm">
                    {formatCases(selectedBlockData.caseCount, selectedBlockData.suppressed)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px]">Attack Rate</span>
                  <span className="font-bold text-zinc-100 text-sm">
                    {formatAttackRate(selectedBlockData.attackRate)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px]">Floors Monitored</span>
                  <span className="font-bold text-zinc-100 text-sm">5 Floors (10 Filters)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px]">Plumbing Lineage</span>
                  <span className="font-bold text-zinc-100 text-sm">{selectedBlockData.tankName}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
