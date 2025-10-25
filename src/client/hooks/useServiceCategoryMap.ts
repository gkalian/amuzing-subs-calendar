import { useMemo } from 'react';
import subscriptionsData from '../data/subscriptions.json';
import type { ServiceCategory } from '../types';

export function useServiceCategoryMap(): Record<string, string> {
  return useMemo(() => {
    const map: Record<string, string> = {};
    try {
      const cats = subscriptionsData as unknown as ServiceCategory[];
      for (const c of cats) {
        if (!c || !Array.isArray(c.services)) continue;
        for (const s of c.services) map[s.id] = c.category;
      }
    } catch {}
    return map;
  }, []);
}
