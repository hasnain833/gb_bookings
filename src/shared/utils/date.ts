import { format, parseISO, isValid } from 'date-fns';


/**
 * Formats an ISO date string (YYYY-MM-DD) or Date object into "DD Mon YYYY" (e.g. "20 May 2025")
 */
export function formatDateForDisplay(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return '';
  return format(date, 'dd MMM yyyy');
}
