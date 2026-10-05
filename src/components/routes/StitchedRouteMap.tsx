'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { StitchedRoute, ConnectorBridge, PassCrossingAssessment } from '@/types/routes';
import { Mountain, Compass, Wind, AlertTriangle, ShieldCheck } from 'lucide-react';

interface StitchedRouteMapProps {
  stitchedRoute: StitchedRoute;
  activePassId?: string | null;
  onSelectPass?: (pass: PassCrossingAssessment) => void;
}

function MapBoundsController({ coordinates }: { coordinates: [number, number, number?][] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const latLngs = coordinates.map((pt) => [pt[0], pt[1]] as [number, number]);
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [coordinates, map]);

  return null;
}

function createCustomPin(
  iconSymbol: string,
  badgeBg: string,
  label?: string
): L.DivIcon {
  const html = `
    <div class="relative group cursor-pointer flex flex-col items-center">
      <div class="w-8 h-8 rounded-full ${badgeBg} border-2 border-white shadow-2xl flex items-center justify-center font-bold text-xs transform transition-transform hover:scale-125">
        ${iconSymbol}
      </div>
      ${
        label
          ? `<span class="mt-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white text-[10px] font-semibold whitespace-nowrap shadow-md border border-white/20">
              ${label}
            </span>`
          : ''
      }
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-stitched-marker',
    iconSize: [32, 48],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export default function StitchedRouteMap({
  stitchedRoute,
  activePassId,
  onSelectPass,
}: StitchedRouteMapProps) {
  const coordinates = stitchedRoute.coordinates;

  const latLngs = useMemo(() => {
    return coordinates.map((pt) => [pt[0], pt[1]] as [number, number]);
  }, [coordinates]);

  const defaultCenter = useMemo<[number, number]>(() => {
    if (coordinates.length > 0) {
      return [coordinates[0][0], coordinates[0][1]];
    }
    return [27.9881, 86.925]; // Everest region default
  }, [coordinates]);

  const startCoord = coordinates[0];
  const endCoord = coordinates[coordinates.length - 1];

  return (
    <div
      data-slot="base"
      className="w-full h-[420px] sm:h-[500px] lg:h-[560px] rounded-3xl overflow-hidden relative border border-border/40 shadow-2xl bg-neutral-950"
    >
      <MapContainer
        center={defaultCenter}
        zoom={9}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapBoundsController coordinates={coordinates} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={18}
        />

        {/* Main continuous route in Himalayan Gold */}
        {latLngs.length > 1 && (
          <Polyline
            positions={latLngs}
            pathOptions={{
              color: '#B68D40',
              weight: 4.5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Render Geodesic Connector Bridges in dashed cyan */}
        {stitchedRoute.connectors.map((bridge, idx) => {
          const bridgeCoords: [number, number][] = [
            [bridge.startCoord[0], bridge.startCoord[1]],
            ...(bridge.interpolatedPoints || []).map((pt) => [pt[0], pt[1]] as [number, number]),
            [bridge.endCoord[0], bridge.endCoord[1]],
          ];
          return (
            <Polyline
              key={`bridge-${idx}`}
              positions={bridgeCoords}
              pathOptions={{
                color: '#38bdf8',
                weight: 3.5,
                dashArray: '6, 8',
                opacity: 0.9,
              }}
            />
          );
        })}

        {/* Start Point Pin */}
        {startCoord && (
          <Marker
            position={[startCoord[0], startCoord[1]]}
            icon={createCustomPin('🟢', 'bg-emerald-600', 'Start')}
          >
            <Popup className="himalayan-popup">
              <div className="p-2 text-xs text-neutral-900">
                <p className="font-extrabold text-emerald-700">Expedition Trailhead</p>
                <p className="font-semibold">{stitchedRoute.segments[0]?.startPoint || 'Start'}</p>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Elevation: {startCoord[2] || 0}m
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* End Point Pin */}
        {endCoord && (
          <Marker
            position={[endCoord[0], endCoord[1]]}
            icon={createCustomPin('🏁', 'bg-rose-600', 'Finish')}
          >
            <Popup className="himalayan-popup">
              <div className="p-2 text-xs text-neutral-900">
                <p className="font-extrabold text-rose-700">Expedition Terminus</p>
                <p className="font-semibold">
                  {stitchedRoute.segments[stitchedRoute.segments.length - 1]?.endPoint || 'Finish'}
                </p>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Elevation: {endCoord[2] || 0}m
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* High Passes Crossed Markers */}
        {stitchedRoute.traversedPasses.map((pass) => {
          const isOptimal = pass.currentStatus === 'OPTIMAL_WINDOW';
          const isCaution = pass.currentStatus === 'CAUTION_WINDOW';
          const pinBg = isOptimal ? 'bg-emerald-600' : isCaution ? 'bg-amber-500' : 'bg-rose-600';

          return (
            <Marker
              key={pass.passId}
              position={[pass.coordinates.lat, pass.coordinates.lng]}
              icon={createCustomPin('🏔️', pinBg, `${pass.passName} (${pass.elevationM}m)`)}
              eventHandlers={{
                click: () => onSelectPass?.(pass),
              }}
            >
              <Popup className="himalayan-popup">
                <div className="p-2 text-xs text-neutral-900 space-y-1 max-w-[220px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sm">{pass.passName}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOptimal
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCaution
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pass.currentStatus === 'OPTIMAL_WINDOW'
                        ? '🟢 Optimal'
                        : pass.currentStatus === 'CAUTION_WINDOW'
                        ? '🟡 Caution'
                        : '🔴 High Risk'}
                    </span>
                  </div>
                  <p className="text-neutral-500 text-[11px]">
                    {pass.nativeName} • {pass.elevationM.toLocaleString()}m
                  </p>
                  <p className="text-neutral-700 text-[11px] leading-tight">
                    {pass.morningWindowRecommendation}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="backdrop-blur-xl bg-black/80 border border-white/10 rounded-2xl p-2.5 text-[11px] text-white flex flex-col gap-1.5 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 rounded bg-[#B68D40]" />
            <span className="text-gray-300">Stitched Trail Track</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 border-t-2 border-dashed border-[#38bdf8]" />
            <span className="text-gray-300">Geodesic Connector Bridge</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-300">High Pass (Optimal)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-300">High Pass (Caution)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
