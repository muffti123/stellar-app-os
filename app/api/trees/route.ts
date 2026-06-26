import { NextResponse } from 'next/server';
import { getMockTreesResponse } from '@/lib/api/mock/trees';
import type { TreeFilterState, TreeSpecies, TreeStatus } from '@/lib/types/tree';

function parseFilters(searchParams: URLSearchParams): TreeFilterState {
  const species = searchParams.get('species');
  const status = searchParams.get('status');

  return {
    search: searchParams.get('search') ?? '',
    species: (species as TreeSpecies) || 'all',
    region: searchParams.get('region') ?? 'all',
    status: (status as TreeStatus) || 'all',
  };
}

/** GET /api/trees — public tree list with optional filters (#532). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);
  const response = getMockTreesResponse(filters);

  return NextResponse.json(response);
}
