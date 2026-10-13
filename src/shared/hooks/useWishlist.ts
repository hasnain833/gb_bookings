import { useEffect, useState } from 'react';
import { api, ApiError, AUTH_CHANGED_EVENT, hasApiSession } from '../api/api';

/** App.tsx listens for this and opens the sign-in modal. */
export const OPEN_SIGN_IN_EVENT = 'gb:open-sign-in';

/** Saved-listing state for listing cards. Signed-out users are sent to sign in. */
export function useWishlist() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    let requestNumber = 0;
    const update = () => {
      const number = ++requestNumber;
      if (!hasApiSession()) { setSavedIds(new Set()); return; }
      api.getWishlist()
        .then((items) => { if (active && number === requestNumber) setSavedIds(new Set(items.map((item) => item.id))); })
        .catch(() => { if (active && number === requestNumber) setSavedIds(new Set()); });
    };
    update();
    window.addEventListener(AUTH_CHANGED_EVENT, update);
    return () => { active = false; requestNumber += 1; window.removeEventListener(AUTH_CHANGED_EVENT, update); };
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
