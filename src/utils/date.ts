import { format, parseISO, isValid, isBefore, addDays } from 'date-fns';

/**
 * Formats an ISO date string (YYYY-MM-DD) or Date object into "DD Mon YYYY" (e.g. "20 May 2025")
 */
export function formatDateForDisplay(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return '';
  return format(date, 'dd MMM yyyy');
}

/**
 * Validates check-in and check-out dates ensuring check-out is not before check-in.
 * Returns an adjusted check-out date if invalid.
 */
export function ensureValidDateRange(checkInIso: string, checkOutIso: string): { checkIn: string; checkOut: string } {
  const checkIn = parseISO(checkInIso);
  const checkOut = parseISO(checkOutIso);

  if (!isValid(checkIn)) {
    const today = new Date();
    const defaultIn = format(today, 'yyyy-MM-dd');
    const defaultOut = format(addDays(today, 3), 'yyyy-MM-dd');
    return { checkIn: defaultIn, checkOut: defaultOut };
  }

  if (!isValid(checkOut) || isBefore(checkOut, checkIn)) {
    const adjustedOut = addDays(checkIn, 1);
    return {
      checkIn: checkInIso,
      checkOut: format(adjustedOut, 'yyyy-MM-dd'),
    };
  }

  return { checkIn: checkInIso, checkOut: checkOutIso };
}

/**
 * Get minimum allowed check-out date string given a check-in date
 */
export function getMinCheckOutDate(checkInIso: string): string {
  const checkIn = parseISO(checkInIso);
  if (!isValid(checkIn)) return new Date().toISOString().split('T')[0];
  return checkInIso;
}
