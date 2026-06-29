'use client';

import dynamic from 'next/dynamic';
import type { JSX } from 'react';
import type { RegionMarker } from '@/lib/api/impactData';
import type { Tree } from '@/lib/types/tree';

export interface ImpactMapWrapperProps {
  regions: RegionMarker[];
  trees?: Tree[];
}

const DynamicImpactMap = dynamic(
  () => import('@/components/organisms/ImpactMap/ImpactMap').then((m) => m.ImpactMap),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" /> }
);

export function ImpactMapWrapper(props: ImpactMapWrapperProps): JSX.Element {
  return <DynamicImpactMap {...props} />;
}
