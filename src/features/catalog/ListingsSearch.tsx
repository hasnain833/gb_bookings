import { useEffect, useState } from 'react';
import { MapPin, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import type { Listing, ListingType } from '../../types';
import { useListings } from '../../shared/hooks/useListings';
import { EXPERIENCE_TYPES } from '../../shared/api/api';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { CardSkeleton } from '../../shared/components/SkeletonLoader';
import ListingCard from '../../shared/components/ListingCard';

interface ListingsSearchProps {
  type: ListingType;
  initialFilters: {
    destination: string;
    startDate: string;
    endDate: string;
    extra: { guestCount?: number; experience?: string; withDriver?: boolean };
  };
  onSelectListing: (listing: Listing) => void;
}

type SortOption = 'recommended' | 'price-low' | 'price-high' | 'rating';

const SORT_PARAM = { recommended: 'recommended', 'price-low': 'price-asc', 'price-high': 'price-desc', rating: 'rating' } as const;
const PRICE_CEILING = 100000;
const todayPk = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());

const TYPE_LABELS: Record<ListingType, string> = {
  hotel: 'Hotels',
  homestay: 'Homestays',
  car: 'Vehicles',
  tour: 'Tours',
  destination: 'Destinations',
  offer: 'Offers',
};

export default function ListingsSearch({ type, initialFilters, onSelectListing }: ListingsSearchProps) {
  const [query, setQuery] = useState(initialFilters.destination || '');
  const [maxPrice, setMaxPrice] = useState(PRICE_CEILING);
  const [minimumRating, setMinimumRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [transmission, setTransmission] = useState<'all' | 'Automatic' | 'Manual'>('all');
  // Landing pages send their two dates as "YYYY-MM-DD to YYYY-MM-DD".
  const [initialStart, initialEnd] = (initialFilters.startDate || '').split(' to ');
  const [checkIn, setCheckIn] = useState(/^\d{4}-\d{2}-\d{2}$/.test(initialStart ?? '') ? initialStart : '');
  const [checkOut, setCheckOut] = useState(initialFilters.endDate || (/^\d{4}-\d{2}-\d{2}$/.test(initialEnd ?? '') ? initialEnd : ''));
  const [driver, setDriver] = useState<'' | 'with_driver' | 'self_drive'>(initialFilters.extra.withDriver === undefined ? '' : initialFilters.extra.withDriver ? 'with_driver' : 'self_drive');
  const [showFilters, setShowFilters] = useState(false);
  const [facilities, setFacilities] = useState('');
  const [page, setPage] = useState(1);
  const [guests, setGuests] = useState(initialFilters.extra.guestCount || 0);
  const [experience, setExperience] = useState(initialFilters.extra.experience ?? '');
  const [stayType, setStayType] = useState<'' | 'rooms' | 'entire_home'>('');
  const [breakfast, setBreakfast] = useState(false);
  const homestays = type === 'homestay';
  const searchTerm = useDebouncedValue(query.trim());
  const priceLimit = useDebouncedValue(maxPrice);
  const cars = type === 'car';
  const supportsDates = type === 'hotel' || type === 'homestay' || cars;
  // Car rentals may start and end on the same day (the return date is a rented day).
  const datesValid = supportsDates && Boolean(checkIn && checkOut && (cars ? checkOut >= checkIn : checkOut > checkIn));

  // The server applies filters before pagination so matching properties cannot disappear beyond the first page.
  const { listings, loading, error, reload, pagination } = useListings(type, searchTerm, {
    maxPrice: priceLimit < PRICE_CEILING ? priceLimit : undefined,
    minRating: minimumRating || undefined,
    sort: SORT_PARAM[sortBy],
    ...(datesValid ? { checkIn, checkOut, guests: guests || undefined } : {}),
    amenities: facilities.trim() || undefined,
    ...(homestays ? { experience: experience || undefined, stayType: stayType || undefined } : {}),
    ...(supportsDates && !cars && breakfast ? { breakfast: 'true' as const } : {}),
    ...(cars && transmission !== 'all' ? { transmission } : {}),
    ...(cars && driver ? { driver } : {}),
    limit: 24, page,
  });
  useEffect(() => { setPage(1); }, [searchTerm, priceLimit, minimumRating, sortBy, checkIn, checkOut, guests, facilities, experience, stayType, breakfast, transmission, driver, type]);
  useEffect(() => { setExperience(initialFilters.extra.experience ?? ''); }, [initialFilters.extra.experience]);

  useEffect(() => {
    setQuery(initialFilters.destination || '');
  }, [initialFilters.destination, type]);

  // Keep the current listings on screen while a filter change refreshes them; skeletons only on first load.
  const firstLoad = loading && listings.length === 0;

  const resetFilters = () => {
    setQuery('');
    setMaxPrice(PRICE_CEILING);
    setCheckIn('');
    setCheckOut('');
    setGuests(0);
    setMinimumRating(0);
    setSortBy('recommended');
    setTransmission('all'); setDriver('');
    setFacilities(''); setExperience(''); setStayType(''); setBreakfast(false); setPage(1);
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{TYPE_LABELS[type]}{query.trim() && <span className="text-slate-500 font-normal"> in {query.trim()}</span>}</h1>
          <p className="mt-1 text-sm text-slate-500">{firstLoad ? 'Loading…' : `${pagination?.total ?? listings.length} ${(pagination?.total ?? listings.length) === 1 ? 'result' : 'results'}`}{loading && !firstLoad && <span className="ml-2 text-slate-400">· updating…</span>}</p>
        </div>
        <label className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Search by name, city, or area"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, city, or area"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#006F3C]"
          />
        </label>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <button onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} className="lg:hidden flex items-center justify-center gap-2 min-h-10 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700">
          <SlidersHorizontal className="h-4 w-4" /> {showFilters ? 'Hide filters' : 'Filters'}
        </button>
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block h-fit space-y-5 border-b border-slate-200 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><SlidersHorizontal className="h-4 w-4" /> Filters</h2>
            <button onClick={resetFilters} className="text-xs font-bold text-[#006F3C]">Reset</button>
          </div>

          {supportsDates && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-slate-600">Available between</legend>
              <label className="block text-[11px] text-slate-500">{cars ? 'Pickup' : 'Check-in'}
                <input type="date" min={todayPk()} value={checkIn} onChange={(event) => setCheckIn(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
              </label>
              <label className="block text-[11px] text-slate-500">{cars ? 'Return' : 'Check-out'}
                <input type="date" min={checkIn || todayPk()} value={checkOut} onChange={(event) => setCheckOut(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
              </label>
              <label className="block text-[11px] text-slate-500">{cars ? 'Passengers' : 'Guests'}
                <select value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                  <option value={0}>Any</option>
                  {Array.from({ length: cars ? 20 : 10 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {cars ? 'passenger' : 'guest'}{count > 1 ? 's' : ''}</option>)}
                </select>
              </label>
              {datesValid ? <p className="text-[11px] text-slate-500">{cars ? `Showing only cars free on every day${guests ? ` with ${guests} seat${guests > 1 ? 's' : ''}` : ''}.` : `Showing only properties with a free room${guests ? ` for ${guests} guest${guests > 1 ? 's' : ''}` : ''}.`}</p>
                : <p className="text-[11px] text-slate-500">{cars ? 'Add both dates to see only cars that are free.' : 'Add both dates to see only properties with free rooms.'}</p>}
            </fieldset>
          )}

          <label className="block space-y-2">
            <span className="text-xs font-bold text-slate-600">Maximum price: PKR {maxPrice.toLocaleString()}{maxPrice >= PRICE_CEILING ? '+' : ''}</span>
            <input type="range" min="1000" max={PRICE_CEILING} step="1000" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="w-full accent-[#006F3C]" />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-slate-600">Minimum rating</span>
            <select value={minimumRating} onChange={(event) => setMinimumRating(Number(event.target.value))} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value={0}>Any rating</option>
              <option value={3}>3+ stars</option>
              <option value={4}>4+ stars</option>
              <option value={4.5}>4.5+ stars</option>
            </select>
          </label>

          {supportsDates && !cars && <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={breakfast} onChange={(event) => setBreakfast(event.target.checked)} className="size-4 accent-[#006F3C]" />Breakfast included</label>}

          {supportsDates && !cars && <label className="block space-y-2"><span className="text-xs font-bold text-slate-600">Facilities and amenities</span><input value={facilities} onChange={(event) => setFacilities(event.target.value)} placeholder="WiFi, Parking" className="min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /><span className="block text-[11px] text-slate-500">Separate required facilities with commas.</span></label>}

          {homestays && <>
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-600">Experience</span>
              <select value={experience} onChange={(event) => setExperience(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="">Any experience</option>
                {EXPERIENCE_TYPES.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-600">Type of stay</span>
              <select value={stayType} onChange={(event) => setStayType(event.target.value as typeof stayType)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="">Rooms or entire home</option>
                <option value="rooms">Private rooms</option>
                <option value="entire_home">Entire home</option>
              </select>
            </label>
          </>}

          {cars && (
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-600">Driver</span>
              <select value={driver} onChange={(event) => setDriver(event.target.value as typeof driver)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="">With or without</option>
                <option value="with_driver">With driver</option>
                <option value="self_drive">Self-drive</option>
              </select>
            </label>
          )}

          {cars && (
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-600">Transmission</span>
              <select value={transmission} onChange={(event) => setTransmission(event.target.value as typeof transmission)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="all">All</option>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </label>
          )}
        </aside>

        <main className="space-y-4">
          <div className="flex items-center justify-end">
            <select aria-label="Sort results" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700">
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>

          {firstLoad ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => <CardSkeleton key={item} />)}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-10 text-center">
              <p className="font-bold text-rose-800">Unable to load inventory</p>
              <p className="mt-1 text-sm text-rose-700">{error}</p>
              <button onClick={() => void reload()} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-rose-900 underline"><RefreshCw className="h-4 w-4" /> Try again</button>
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
              <MapPin className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-3 font-bold text-slate-900">
                No {TYPE_LABELS[type].toLowerCase()}{query.trim() ? ` in "${query.trim()}"` : ''} match your filters
              </h2>
              {query.trim() ? (
                <button onClick={() => setQuery('')} className="mt-4 rounded-lg bg-[#006F3C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005c32]">
                  Clear search
                </button>
              ) : (
                <>
                  <p className="mt-1 text-sm text-slate-500">Try other dates, a higher price, or a lower rating.</p>
                  <button onClick={resetFilters} className="mt-4 text-sm font-semibold text-[#006F3C] underline">Clear all filters</button>
                </>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} tag={listing.featured ? 'Featured' : undefined} detailed onSelect={() => onSelectListing(listing)} />
              ))}
            </div>
          )}
        </main>
      </div>
      {pagination && pagination.pages > 1 && <nav aria-label="Search pages" className="flex items-center justify-end gap-3 text-sm"><button disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)} className="min-h-11 rounded border px-4 disabled:opacity-50">Previous</button><span>Page {pagination.page} of {pagination.pages}</span><button disabled={loading || page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className="min-h-11 rounded border px-4 disabled:opacity-50">Next</button></nav>}
    </div>
  );
}
