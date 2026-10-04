import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/api';

/** App.tsx listens for this and opens the sign-in modal. */
export const OPEN_SIGN_IN_EVENT = 'gb:open-sign-in';

/** Saved-listing state for listing cards. Signed-out users are sent to sign in. */
export function useWishlist() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.getWishlist()
      .then((items) => setSavedIds(new Set(items.map((item) => item.id))))
      .catch(() => setSavedIds(new Set())); // signed out: nothing saved
  }, []);

  const toggle = async (listingId: string) => {
    const saved = savedIds.has(listingId);
    try {
      await (saved ? api.removeWishlistItem(listingId) : api.addWishlistItem(listingId));
      setSavedIds((current) => {
        const next = new Set(current);
        if (saved) next.delete(listingId); else next.add(listingId);
        return next;
      });
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) window.dispatchEvent(new Event(OPEN_SIGN_IN_EVENT));
    }
  };

  return { isSaved: (listingId: string) => savedIds.has(listingId), toggle };
}
