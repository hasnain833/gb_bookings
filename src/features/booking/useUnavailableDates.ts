import { useEffect, useState } from 'react';
import { api } from '../../shared/api/api';

const NONE: ReadonlySet<string> = new Set();

/** Days this listing is fully booked or closed, so the calendars can grey them out. The server still checks at booking. */
export function useUnavailableDates(listingId: string) {
  const [dates, setDates] = useState(NONE);
  useEffect(() => {
    let active = true;
    api.getUnavailableDates(listingId).then((result) => { if (active) setDates(new Set(result)); }).catch(() => undefined);
    return () => { active = false; };
  }, [listingId]);
  return dates;
}

/** The first blocked day after `day`: a stay or rental starting on `day` can run no further than this. */
export function firstBlockedAfter(dates: ReadonlySet<string>, day: string) {
  return [...dates].filter((date) => date > day).sort()[0];
}
