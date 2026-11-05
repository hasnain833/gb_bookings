import { HOME_TYPES, HOTEL_TYPES } from '../../shared/utils/rooms';
import { lazy, Suspense, useEffect, useState } from 'react';
import { MapPin, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import type { Listing, ListingType } from '../../types';
import { useListings } from '../../shared/hooks/useListings';
import { EXPERIENCE_TYPES } from '../../shared/api/api';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { CardSkeleton } from '../../shared/components/SkeletonLoader';
import { nextDay } from '../../shared/utils/date';
import { api } from '../../shared/api/api';
import type { MapPoint } from '../../shared/components/OsmMap';
import ListingCard from '../../shared/components/ListingCard';
import Select from '../../shared/components/Select';
import DateInput from '../../shared/components/DateInput';

const OsmMap = lazy(() => import('../../shared/components/OsmMap'));

interface ListingsSearchProps {
  type: ListingType;
  initialFilters: {
    destination: string;
    startDate: string;
    endDate: string;
    extra: { guestCount?: number; experience?: string; withDriver?: boolean; category?: string; sort?: 'price-low' };
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
  const [sortBy, setSortBy] = useState<SortOption>(initialFilters.extra.sort ?? 'recommended');
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
  const [freeCancellation, setFreeCancellation] = useState(false);
  const [minStars, setMinStars] = useState(0);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [places, setPlaces] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const homestays = type === 'homestay';
  const searchTerm = useDebouncedValue(query.trim());
  const priceLimit = useDebouncedValue(maxPrice);
  const cars = type === 'car';
  const tours = type === 'tour';
  const stays = type === 'hotel' || homestays;
  const [category, setCategory] = useState(initialFilters.extra.category ?? '');
  const supportsDates = type === 'hotel' || type === 'homestay' || cars;
  // Car rentals may start and end on the same day (the return date is a rented day).
  const datesValid = supportsDates && Boolean(checkIn && checkOut && (cars ? checkOut >= checkIn : checkOut > checkIn));
  // Tours: one start date; the server checks free seats (and a departure on fixed-date tours) that day.
  const tourDate = tours && checkIn ? { checkIn, checkOut: checkIn, guests: guests || undefined } : {};

  // The server applies filters before pagination so matching properties cannot disappear beyond the first page.
  const { listings, loading, error, reload, pagination } = useListings(type, searchTerm, {
    maxPrice: priceLimit < PRICE_CEILING ? priceLimit : undefined,
    minRating: minimumRating || undefined,
    sort: SORT_PARAM[sortBy],
    guests: guests || undefined,
    ...(datesValid ? { checkIn, checkOut } : {}),
    ...tourDate,
    ...(category && (tours || stays) ? { category } : {}),
    amenities: facilities.trim() || undefined,
    ...(homestays ? { experience: experience || undefined, stayType: stayType || undefined } : {}),
    ...(supportsDates && !cars && breakfast ? { breakfast: 'true' as const } : {}),
    ...(freeCancellation ? { freeCancellation: 'true' as const } : {}),
    ...(type === 'hotel' && minStars ? { minStars } : {}),
    ...(cars && transmission !== 'all' ? { transmission } : {}),
    ...(cars && driver ? { driver } : {}),
    limit: 24, page,
  });
  useEffect(() => { setPage(1); }, [searchTerm, priceLimit, minimumRating, sortBy, checkIn, checkOut, guests, facilities, experience, stayType, breakfast, freeCancellation, minStars, transmission, driver, category, type]);
  useEffect(() => { api.getTopPlaces(type, 20).then((result) => setPlaces(result.map((place) => place.name))).catch(() => undefined); }, [type]);
  useEffect(() => { setExperience(initialFilters.extra.experience ?? ''); }, [initialFilters.extra.experience]);

  useEffect(() => {
    setQuery(initialFilters.destination || '');
  }, [initialFilters.destination, type]);

  // Keep the current listings on screen while a filter change refreshes them; skeletons only on first load.
  const firstLoad = loading && listings.length === 0;
  const typed = query.trim().toLowerCase();
  const suggestions = suggesting ? places.filter((place) => place.toLowerCase() !== typed && (!typed || place.toLowerCase().includes(typed))).slice(0, 6) : [];
  const perUnit = type === 'car' ? 'day' : type === 'tour' ? 'person' : 'night';
  const mapPoints: MapPoint[] = listings.flatMap((listing) => listing.coordinates ? [{ id: listing.id, lat: listing.coordinates.lat, lng: listing.coordinates.lng, title: listing.title, label: `PKR ${listing.price.toLocaleString()}`, onSelect: () => onSelectListing(listing) }] : []);

  const resetFilters = () => {
    setQuery('');
    setMaxPrice(PRICE_CEILING);
    setCheckIn('');
    setCheckOut('');
    setGuests(0);
    setMinimumRating(0);
    setSortBy('recommended');
    setTransmission('all'); setDriver('');
    setFacilities(''); setExperience(''); setStayType(''); setBreakfast(false); setFreeCancellation(false); setMinStars(0); setCategory(''); setPage(1);
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
            onChange={(event) => { setQuery(event.target.value); setSuggesting(true); }}
            onFocus={() => setSuggesting(true)}
            onBlur={() => setSuggesting(false)}
            onKeyDown={(event) => { if (event.key === 'Escape') setSuggesting(false); }}
            placeholder="Search by name, city, or area"
            autoComplete="off"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#006F3C]"
          />
          {suggestions.length > 0 && <ul aria-label="Suggested places" className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
            {suggestions.map((place) => <li key={place}><button type="button" onMouseDown={(event) => { event.preventDefault(); setQuery(place); setSuggesting(false); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-slate-700 hover:bg-emerald-50"><MapPin className="size-4 shrink-0 text-slate-400" aria-hidden="true" />{place}</button></li>)}
          </ul>}
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
                <DateInput min={todayPk()} value={checkIn} onChange={(event) => { setCheckIn(event.target.value); if (checkOut && event.target.value >= checkOut && !(cars && event.target.value === checkOut)) setCheckOut(''); }}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
              </label>
              <label className="block text-[11px] text-slate-500">{cars ? 'Return' : 'Check-out'}
                <DateInput min={cars ? checkIn || todayPk() : nextDay(checkIn || todayPk())} value={checkOut} onChange={(event) => setCheckOut(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
              </label>
              <label className="block text-[11px] text-slate-500">{cars ? 'Passengers' : 'Guests'}
                <Select value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                  <option value={0}>Any</option>
                  {Array.from({ length: cars ? 20 : 10 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {cars ? 'passenger' : 'guest'}{count > 1 ? 's' : ''}</option>)}
                </Select>
              </label>
              {datesValid ? <p className="text-[11px] text-slate-500">{cars ? `Showing only cars free on every day${guests ? ` with ${guests} seats in total` : ''}.` : `Showing only properties with free rooms${guests ? ` for ${guests} guest${guests > 1 ? 's' : ''} in total` : ''}.`}</p>
                : <p className="text-[11px] text-slate-500">{guests ? `Showing places that can take ${guests} ${cars ? 'passengers' : 'guests'} in total, across all their ${cars ? 'cars' : 'rooms'}. ` : ''}{cars ? 'Add both dates to see only cars that are free.' : 'Add both dates to see only properties with free rooms.'}</p>}
            </fieldset>
          )}

          {tours && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-slate-600">When</legend>
              <label className="block text-[11px] text-slate-500">Start date
                <DateInput min={todayPk()} value={checkIn} onChange={(event) => setCheckIn(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
              </label>
              <label className="block text-[11px] text-slate-500">Travellers
                <Select value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                  <option value={0}>Any</option>
                  {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} traveller{count > 1 ? 's' : ''}</option>)}
                </Select>
              </label>
              <p className="text-[11px] text-slate-500">{checkIn ? `Showing only tours starting that day with ${guests || 1} free seat${(guests || 1) > 1 ? 's' : ''}.` : 'Add a start date to see only tours with free seats.'}</p>
            </fieldset>
          )}
          {(tours || stays) && (
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-600">{tours ? 'Type of tour' : 'Type of property'}</span>
              <Select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="">Any type</option>
                {(tours ? ['Trekking', 'Sightseeing', 'Jeep safari', 'Cultural', 'Adventure', 'Day trip'] : homestays ? HOME_TYPES : HOTEL_TYPES).map((item) => <option key={item}>{item}</option>)}
              </Select>
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-xs font-bold text-slate-600">Maximum price: PKR {maxPrice.toLocaleString()}{maxPrice >= PRICE_CEILING ? '+' : ''}</span>
            <input type="range" min="1000" max={PRICE_CEILING} step="1000" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="w-full accent-[#006F3C]" />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-slate-600">Minimum rating</span>
            <Select value={minimumRating} onChange={(event) => setMinimumRating(Number(event.target.value))} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value={0}>Any rating</option>
              <option value={3}>3+ stars</option>
              <option value={4}>4+ stars</option>
              <option value={4.5}>4.5+ stars</option>
            </Select>
          </label>

          {type === 'hotel' && <label className="block space-y-2">
            <span className="text-xs font-bold text-slate-600">Hotel class</span>
            <Select value={minStars} onChange={(event) => setMinStars(Number(event.target.value))} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
              <option value={0}>Any class</option>
              {[3, 4, 5].map((stars) => <option key={stars} value={stars}>{stars} stars{stars < 5 ? ' or more' : ''}</option>)}
            </Select>
          </label>}

          <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={freeCancellation} onChange={(event) => setFreeCancellation(event.target.checked)} className="size-4 accent-[#006F3C]" />Free cancellation</label>

          {supportsDates && !cars && <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={breakfast} onChange={(event) => setBreakfast(event.target.checked)} className="size-4 accent-[#006F3C]" />Breakfast included</label>}

          {supportsDates && !cars && <label className="block space-y-2"><span className="text-xs font-bold text-slate-600">Facilities and amenities</span><input value={facilities} onChange={(event) => setFacilities(event.target.value)} placeholder="WiFi, Parking" className="min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /><span className="block text-[11px] text-slate-500">Separate required facilities with commas.</span></label>}

          {homestays && <>
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-600">Experience</span>
              <Select value={experience} onChange={(event) => setExperience(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="">Any experience</option>
                {EXPERIENCE_TYPES.map((value) => <option key={value}>{value}</option>)}
              </Select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-600">Type of stay</span>
              <Select value={stayType} onChange={(event) => setStayType(event.target.value as typeof stayType)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="">Rooms or entire home</option>
                <option value="rooms">Private rooms</option>
                <option value="entire_home">Entire home</option>
              </Select>
            </label>
          </>}

          {cars && (
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-600">Driver</span>
              <Select value={driver} onChange={(event) => setDriver(event.target.value as typeof driver)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="">With or without</option>
                <option value="with_driver">With driver</option>
                <option value="self_drive">Self-drive</option>
              </Select>
            </label>
          )}

          {cars && (
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-600">Transmission</span>
              <Select value={transmission} onChange={(event) => setTransmission(event.target.value as typeof transmission)} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="all">All</option>
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </Select>
            </label>
          )}
        </aside>

        <main className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div role="group" aria-label="Show results as" className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs font-bold">
              {(['list', 'map'] as const).map((option) => <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)} className={`min-h-9 rounded-md px-3 capitalize ${view === option ? 'bg-[#006F3C] text-white' : 'text-slate-700 hover:bg-slate-50'}`}>{option}</button>)}
            </div>
            <Select aria-label="Sort results" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700">
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Highest rated</option>
            </Select>
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
          ) : view === 'map' ? (
            <div className="space-y-2">
              {mapPoints.length > 0
                ? <Suspense fallback={<div className="h-[32rem] animate-pulse rounded-xl bg-slate-100" />}><OsmMap points={mapPoints} label={`Map of ${TYPE_LABELS[type].toLowerCase()}`} className="h-[32rem]" /></Suspense>
                : <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">None of these have a map pin yet. Switch back to the list.</p>}
              <p className="text-xs text-slate-500">Prices are starting prices per {perUnit}. Press a price to open it.{mapPoints.length < listings.length ? ` ${listings.length - mapPoints.length} on this page ${listings.length - mapPoints.length === 1 ? 'has' : 'have'} no pin, so ${listings.length - mapPoints.length === 1 ? 'it isn’t' : 'they aren’t'} shown.` : ''}</p>
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
