'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockFarmerDashboard } from '@/lib/api/mock/farmerDashboard';
import type { FarmerDashboardData } from '@/types/farmer-dashboard';

export function useFarmerDashboard(farmerId?: string) {
  const [data, setData] = useState<FarmerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      const params = farmerId ? `?farmerId=${encodeURIComponent(farmerId)}` : '';
      const res = await fetch(`/api/farmer/dashboard${params}`, { signal });
      if (!res.ok) {
        throw new Error('API unavailable, falling back to dashboard');
      }
      const json = await res.json();
      setData(json as FarmerDashboardData);
    } catch {
      try {
        await new Promise((r) => setTimeout(r, 600));
        setData(mockFarmerDashboard);
      } catch (mockErr) {
        setError(mockErr instanceof Error ? mockErr.message : 'Failed to load dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const acceptJob = useCallback(
    async (assignmentId: string) => {
      setAcceptingId(assignmentId);
      try {
        const res = await fetch('/api/planting/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignmentId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? 'Failed to accept job');
        }
        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to accept job');
      } finally {
        setAcceptingId(null);
      }
    },
    [fetchData]
  );

  return { data, isLoading, error, retry: fetchData, acceptJob, acceptingId };
}
