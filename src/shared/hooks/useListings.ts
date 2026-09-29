import { useCallback, useEffect, useState } from 'react';
import type { Listing, ListingType } from '../../types';
import { api, type ListingFilters } from '../api/api';

export function useListings(type?: ListingType | 'all', search = '', filters: ListingFilters = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Callers pass a fresh object each render; key on its contents so it only refetches when a filter changes.
  const filterKey = JSON.stringify(filters);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setListings(await api.getListings({ type, search: search.trim() || undefined, ...JSON.parse(filterKey) }));
    } catch (reason) {
      setListings([]);
      setError(reason instanceof Error ? reason.message : 'Unable to load listings.');
    } finally {
      setLoading(false);
    }
  }, [search, type, filterKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { listings, loading, error, reload };
}
