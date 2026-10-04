import { useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Calendar, Car, Home, MapPin, RefreshCw, Search, TentTree, Users } from 'lucide-react';
import type { Listing, ListingType } from '../../types';
import { handleImageError } from '../../types';
import { useListings } from '../../shared/hooks/useListings';
import { CardSkeleton } from '../../shared/components/SkeletonLoader';
import ListingCard from '../../shared/components/ListingCard';

interface ExploreSectionProps {
  setView: (view: string) => void;
  setSearchFilters: (filters: {
    destination?: string;
    startDate?: string;
    endDate?: string;
    extra?: { guestCount?: number; isHomestay?: boolean };
  }) => void;
  onSelectListing: (listing: Listing) => void;
}

type SearchType = Extract<ListingType, 'hotel' | 'homestay' | 'car' | 'tour'>;

const SEARCH_TYPES: Array<{ id: SearchType; label: string; icon: typeof Home }> = [
  { id: 'hotel', label: 'Hotels', icon: Home },
  { id: 'homestay', label: 'Homestays', icon: Users },
  { id: 'car', label: 'Cars', icon: Car },
  { id: 'tour', label: 'Tours', icon: TentTree },
];

export default function ExploreSection({ setView, setSearchFilters, onSelectListing }: ExploreSectionProps) {
  const { listings, loading, error, reload } = useListings('all');
  const [type, setType] = useState<SearchType>('hotel');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(2);

  const featured = useMemo(() => {
    const selected = listings.filter((listing) => listing.featured);
    return (selected.length ? selected : listings).slice(0, 8);
  }, [listings]);

  const destinations = useMemo(() => {
    const groups = new Map<string, { name: string; count: number; image: string }>();
    listings.forEach((listing) => {
      const name = listing.location.split(',')[0].trim();
      if (!name) return;
      const existing = groups.get(name);
      groups.set(name, {
        name,
        count: (existing?.count ?? 0) + 1,
        image: existing?.image ?? listing.image,
      });
    });
    return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [listings]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchFilters({
      destination,
      startDate,
      endDate,
      extra: { guestCount: guests, isHomestay: type === 'homestay' },
    });
    window.dispatchEvent(new CustomEvent('nav-to-type', { detail: { type, destination } }));
  };

  const browseDestination = (name: string) => {
    setSearchFilters({ destination: name, startDate: '', endDate: '', extra: { guestCount: guests } });
    window.dispatchEvent(new CustomEvent('nav-to-type', { detail: { type: 'hotel', destination: name } }));
  };

  return (
    <div className="space-y-10 pb-16">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=90"
          alt="Mountain landscape in northern Pakistan"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-900/10" />
        <div className="relative flex flex-col justify-end min-h-[380px] px-4 pt-16 pb-8 sm:min-h-[420px] sm:px-8 lg:px-10">
          <div className="max-w-3xl text-white">
            <h1 className="text-3xl font-bold leading-tight sm:text-[2.6rem]">Find your next stay in Gilgit-Baltistan</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">Hotels, homestays, tours and cars from local partners. Pay at the property.</p>
          </div>

          <form onSubmit={submitSearch} className="mt-6 rounded-xl bg-white p-2.5 shadow-lg">
            <div className="mb-2.5 flex gap-1 overflow-x-auto border-b border-slate-100 pb-2.5">
              {SEARCH_TYPES.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" onClick={() => setType(item.id)} className={`flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium ${type === item.id ? 'bg-emerald-50 text-[#006F3C]' : 'text-slate-600 hover:bg-slate-100'}`}>
                    <Icon className="h-4 w-4" /> {item.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1.5fr)_1fr_1fr_120px_auto]">
              <label className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Where are you going?" className="min-h-12 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-[#006F3C]" />
              </label>
              <label className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="min-h-12 w-full rounded-md border border-slate-200 pl-10 pr-2 text-sm text-slate-700 outline-none focus:border-[#006F3C]" />
              </label>
              <label className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="min-h-12 w-full rounded-md border border-slate-200 pl-10 pr-2 text-sm text-slate-700 outline-none focus:border-[#006F3C]" />
              </label>
              <label className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="number" min={1} max={20} value={guests} onChange={(event) => setGuests(Number(event.target.value))} className="min-h-12 w-full rounded-md border border-slate-200 pl-10 pr-2 text-sm text-slate-700 outline-none focus:border-[#006F3C]" aria-label="Guests" />
              </label>
              <button type="submit" className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#006F3C] px-5 text-sm font-semibold text-white hover:bg-[#005c32]"><Search className="h-4 w-4" /> Search</button>
            </div>
          </form>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-950">Featured stays &amp; experiences</h2>
          <button onClick={() => setView('hotels')} className="flex items-center gap-1 text-sm font-semibold text-[#006F3C] hover:underline">Browse all <ArrowRight className="h-4 w-4" /></button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <CardSkeleton key={item} />)}</div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button onClick={() => void reload()} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-rose-800 underline"><RefreshCw className="h-4 w-4" /> Try again</button>
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center"><h3 className="font-bold text-slate-900">No listings available yet</h3><p className="mt-1 text-sm text-slate-500">Approved marketplace inventory will appear here.</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} tag={listing.type} onSelect={() => onSelectListing(listing)} />
            ))}
          </div>
        )}
      </section>

      {destinations.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-bold text-slate-950">Popular destinations</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {destinations.map((item) => (
              <button key={item.name} onClick={() => browseDestination(item.name)} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-900 text-left">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-105" onError={handleImageError} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white"><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-xs text-slate-300">{item.count} {item.count === 1 ? 'listing' : 'listings'}</p></div>
              </button>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
