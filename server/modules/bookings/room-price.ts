/**
 * A unit's price on one date: a season covering the date wins, then the weekend price (Friday and Saturday
 * nights), then the base price. Hotels and homestays price each night, cars each rented day, tours the start date.
 */
export type PricedUnit = {
  basePriceMinor: number;
  weekendPriceMinor?: number | null;
  seasons?: Array<{ from: string; to: string; priceMinor: number }>;
};

export function nightPriceMinor(unit: PricedUnit, date: string) {
  const season = unit.seasons?.find((item) => item.from <= date && date <= item.to);
  if (season) return season.priceMinor;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  if ((weekday === 5 || weekday === 6) && unit.weekendPriceMinor != null) return unit.weekendPriceMinor;
  return unit.basePriceMinor;
}

export const nightsPriceMinor = (unit: PricedUnit, nights: string[]) =>
  nights.reduce((total, date) => total + nightPriceMinor(unit, date), 0);
