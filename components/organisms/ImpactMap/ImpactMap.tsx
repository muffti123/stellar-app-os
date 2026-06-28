'use client';

import { useEffect, type JSX } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import type { RegionMarker } from '@/lib/api/impactData';
import type { Tree, TreeStatus } from '@/lib/types/tree';
import 'leaflet/dist/leaflet.css';

export interface ImpactMapProps {
  regions: RegionMarker[];
  trees?: Tree[];
}

function radiusForTrees(trees: number): number {
  return 8 + Math.min(trees / 40_000, 1) * 32;
}

function colorForStatus(status: TreeStatus): { fill: string; stroke: string } {
  const colors: Partial<Record<TreeStatus, { fill: string; stroke: string }>> = {
    funded: { fill: '#94a3b8', stroke: '#64748b' },
    planted: { fill: '#14B6E7', stroke: '#0ea5e9' },
    verified: { fill: '#00B36B', stroke: '#059669' },
    completed: { fill: '#3E1BDB', stroke: '#4f46e5' },
    failed: { fill: '#ef4444', stroke: '#dc2626' },
  };
  return colors[status] ?? { fill: '#94a3b8', stroke: '#64748b' };
}

export function ImpactMap({ regions, trees = [] }: ImpactMapProps): JSX.Element {
  useEffect(() => {
    Promise.resolve().then(() => {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      });
    });
  }, []);

  return (
    <MapContainer
      center={[5, 20]}
      zoom={3}
      scrollWheelZoom={false}
      className="h-full w-full rounded-xl"
      aria-label="Planting locations map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {regions.map((region) => (
        <CircleMarker
          key={region.id}
          center={[region.lat, region.lng]}
          radius={radiusForTrees(region.treesPlanted)}
          pathOptions={{
            color: '#14B6E7',
            fillColor: '#00B36B',
            fillOpacity: 0.35,
            weight: 2,
          }}
        >
          <Tooltip>
            <strong>{region.name}</strong>
            <br />
            {region.treesPlanted.toLocaleString()} trees
            <br />
            {region.farmers.toLocaleString()} farmers
          </Tooltip>
        </CircleMarker>
      ))}
      {trees.map((tree) => {
        const colors = colorForStatus(tree.status);
        return (
          <CircleMarker
            key={tree.id}
            center={[tree.lat, tree.lng]}
            radius={6}
            pathOptions={{
              color: colors.stroke,
              fillColor: colors.fill,
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Tooltip>
              <strong>{tree.treeId}</strong>
              <br />
              {tree.species} · {tree.region}
              <br />
              Status: {tree.status}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
