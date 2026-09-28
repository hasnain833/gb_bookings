import { useCallback, useEffect, useState } from 'react';
import type { Listing, ListingType } from '../../types';
import { api } from '../api/api';

export function useListings(type?: ListingType | 'all', search = '') {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setListings(await api.getListings({ type, search: search.trim() || undefined }));
    } catch (reason) {
      setListings([]);
      setError(reason instanceof Error ? reason.message : 'Unable to load listings.');
    } finally {
      setLoading(false);
    }
  }, [search, type]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { listings, loading, error, reload };
}
