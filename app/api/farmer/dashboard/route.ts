import { NextResponse } from 'next/server';
import { mockFarmerDashboard } from '@/lib/api/mock/farmerDashboard';

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get('farmerId');

  if (farmerId && farmerId !== mockFarmerDashboard.farmerId) {
    return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
  }

  return NextResponse.json(mockFarmerDashboard);
}
