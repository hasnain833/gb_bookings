import { useEffect, useMemo, useState } from 'react';
import { Car, Filter, MapPin, RefreshCw, Search, SlidersHorizontal, Star } from 'lucide-react';
import type { Listing, ListingType } from '../../types';
import { handleImageError } from '../../types';
import { tListing, useLanguage } from '../../app/LanguageContext';
import { useListings } from '../../shared/hooks/useListings';
import { CardSkeleton } from '../../shared/components/SkeletonLoader';

interface ListingsSearchProps {
  type: ListingType;
  initialFilters: {
    destination: string;
    startDate: string;
    endDate: string;
    extra: { guestCount?: number; experience?: string };
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
  const { isRtl } = useLanguage();
  const [query, setQuery] = useState(initialFilters.destination || '');
  const [maxPrice, setMaxPrice] = useState(PRICE_CEILING);
  const [minimumRating, setMinimumRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [transmission, setTransmission] = useState<'all' | 'Automatic' | 'Manual'>('all');
  const [checkIn, setCheckIn] = useState(initialFilters.startDate || '');
  const [checkOut, setCheckOut] = useState(initialFilters.endDate || '');
  const guests = initialFilters.extra.guestCount || undefined;
  const supportsDates = type === 'hotel' || type === 'homestay';
  const datesValid = supportsDates && Boolean(checkIn && checkOut && checkOut > checkIn);

  // Price, rating, sort and availability are filtered on the server; free-text matching stays client-side for partial words.
  // ponytail: first 100 results only; add pagination when the catalog outgrows it.
  const { listings, loading, error, reload } = useListings(type, '', {
    maxPrice: maxPrice < PRICE_CEILING ? maxPrice : undefined,
    minRating: minimumRating || undefined,
    sort: SORT_PARAM[sortBy],
    ...(datesValid ? { checkIn, checkOut, guests } : {}),
    limit: 100,
  });

  useEffect(() => {
    setQuery(initialFilters.destination || '');
  }, [initialFilters.destination, type]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return listings.filter((listing) => {
      if (term && ![listing.title, listing.location, listing.description].some((value) => value.toLowerCase().includes(term))) return false;
      if (type === 'car' && transmission !== 'all' && listing.carSpecs?.transmission !== transmission) return false;
      return true;
    });
  }, [listings, query, transmission, type]);

  const resetFilters = () => {
    setQuery('');
    setMaxPrice(PRICE_CEILING);
    setCheckIn('');
    setCheckOut('');
    setMinimumRating(0);
    setSortBy('recommended');
    setTransmission('all');
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#006F3C]">Marketplace search</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{TYPE_LABELS[type]}</h1>
          <p className="mt-1 text-sm text-slate-500">{loading ? 'Loading current inventory...' : `${results.length} results`}</p>
        </div>
        <label className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, city, or area"
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#006F3C]"
          />
        </label>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit space-y-5 border-b border-slate-200 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900"><SlidersHorizontal className="h-4 w-4" /> Filters</h2>
            <button onClick={resetFilters} className="text-xs font-bold text-[#006F3C]">Reset</button>
          </div>

          {supportsDates && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-slate-600">Available between</legend>
              <label className="block text-[11px] text-slate-500">Check-in
                <input type="date" min={todayPk()} value={checkIn} onChange={(event) => setCheckIn(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
              </label>
              <label className="block text-[11px] text-slate-500">Check-out
                <input type="date" min={checkIn || todayPk()} value={checkOut} onChange={(event) => setCheckOut(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
              </label>
              {datesValid && <p className="text-[11px] text-slate-500">Showing only properties with a free room{guests ? ` for ${guests} guests` : ''}.</p>}
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

          {type === 'car' && (
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
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Filter className="h-4 w-4" /> Live inventory</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700">
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => <CardSkeleton key={item} />)}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-10 text-center">
              <p className="font-bold text-rose-800">Unable to load inventory</p>
              <p className="mt-1 text-sm text-rose-700">{error}</p>
              <button onClick={() => void reload()} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-rose-900 underline"><RefreshCw className="h-4 w-4" /> Try again</button>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
              <MapPin className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-3 font-bold text-slate-900">No matching {TYPE_LABELS[type].toLowerCase()}</h2>
              <p className="mt-1 text-sm text-slate-500">Change the filters or search another destination.</p>
              <button onClick={resetFilters} className="mt-4 text-sm font-bold text-[#006F3C] underline">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {results.map((rawListing) => {
                const listing = tListing(rawListing, isRtl);
                return (
                  <article key={listing.id} onClick={() => onSelectListing(rawListing)} className="cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-400 hover:shadow-md">
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img src={listing.image} alt={listing.title} className="h-full w-full object-cover transition duration-300 hover:scale-105" onError={handleImageError} />
                      {listing.featured && <span className="absolute left-3 top-3 rounded bg-[#006F3C] px-2.5 py-1 text-[10px] font-bold uppercase text-white">Featured</span>}
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex min-w-0 items-center gap-1 truncate text-slate-500"><MapPin className="h-3.5 w-3.5 text-[#006F3C]" /> {listing.location}</span>
                        <span className="flex items-center gap-1 font-bold text-slate-800"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {listing.rating}</span>
                      </div>
                      <h2 className="line-clamp-2 font-bold text-slate-950">{listing.title}</h2>
                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{listing.description}</p>
                      {listing.type === 'car' && listing.carSpecs && <p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Car className="h-4 w-4" /> {listing.carSpecs.category} · {listing.carSpecs.transmission}</p>}
                      <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
                        <span className="text-base font-black text-slate-950">PKR {listing.price.toLocaleString()}</span>
                        <span className="text-xs text-slate-500">View details</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
