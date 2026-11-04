import { format, parseISO, isValid } from 'date-fns';


/** The day after a YYYY-MM-DD date, as YYYY-MM-DD. */
export function nextDay(date: string) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

/**
 * Formats an ISO date string (YYYY-MM-DD) or Date object into "DD Mon YYYY" (e.g. "20 May 2025")
 */
export function formatDateForDisplay(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return '';
  return format(date, 'dd MMM yyyy');
}
