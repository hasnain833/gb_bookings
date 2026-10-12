import { useCallback, useEffect, useRef, useState } from 'react';
import type { Listing, ListingType } from '../../types';
import { api, type ListingFilters, type Paginated } from '../api/api';

export function useListings(type?: ListingType | 'all', search = '', filters: ListingFilters = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Paginated<Listing>['pagination'] | null>(null);
  const requestNumber = useRef(0);
  // Callers pass a fresh object each render; key on its contents so it only refetches when a filter changes.
  const filterKey = JSON.stringify(filters);

  const reload = useCallback(async () => {
    const number = ++requestNumber.current;
    setLoading(true);
    setError(null);
    try {
      const result = await api.getListingsPage({ type, search: search.trim() || undefined, ...JSON.parse(filterKey) });
      if (number !== requestNumber.current) return;
      setListings(result.data); setPagination(result.meta);
    } catch (reason) {
      if (number !== requestNumber.current) return;
      setListings([]); setPagination(null);
      setError(reason instanceof Error ? reason.message : 'Unable to load listings.');
    } finally {
      if (number === requestNumber.current) setLoading(false);
    }
  }, [search, type, filterKey]);

  useEffect(() => {
    void reload();
    return () => { requestNumber.current += 1; };
  }, [reload]);

  return { listings, loading, error, reload, pagination };
}
