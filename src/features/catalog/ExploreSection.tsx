import { useMemo, useState } from 'react';
import { ArrowRight, Calendar, Car, Home, MapPin, RefreshCw, Search, ShieldCheck, Star, TentTree, Users } from 'lucide-react';
import type { Listing, ListingType } from '../../types';
import { handleImageError } from '../../types';
import { useListings } from '../../shared/hooks/useListings';
import { CardSkeleton } from '../../shared/components/SkeletonLoader';

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
    return (selected.length ? selected : listings).slice(0, 6);
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

  const submitSearch = (event: React.FormEvent) => {
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
    <div className="space-y-12 pb-20">
      <section className="relative min-h-[470px] overflow-hidden rounded-2xl bg-slate-950">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=90"
          alt="Mountain landscape in northern Pakistan"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-900/10" />
        <div className="relative flex min-h-[470px] flex-col justify-end px-4 py-8 sm:px-8 lg:px-12">
          <div className="max-w-3xl text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Explore Pakistan with verified local partners</p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">Find your next stay, journey, or mountain escape</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base">Search live marketplace inventory and book directly through GBBookings.</p>
          </div>

          <form onSubmit={submitSearch} className="mt-7 rounded-lg border border-white/20 bg-white p-3 shadow-xl">
            <div className="mb-3 flex gap-1 overflow-x-auto border-b border-slate-100 pb-3">
              {SEARCH_TYPES.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" onClick={() => setType(item.id)} className={`flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-bold ${type === item.id ? 'bg-[#006F3C] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
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
              <button type="submit" className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#006F3C] px-5 text-sm font-bold text-white hover:bg-[#005c32]"><Search className="h-4 w-4" /> Search</button>
            </div>
          </form>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#006F3C]">Live inventory</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Featured experiences</h2>
          </div>
          <button onClick={() => setView('hotels')} className="flex items-center gap-1 text-xs font-bold text-[#006F3C]">Browse all <ArrowRight className="h-4 w-4" /></button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <CardSkeleton key={item} />)}</div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button onClick={() => void reload()} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-rose-800 underline"><RefreshCw className="h-4 w-4" /> Try again</button>
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center"><h3 className="font-bold text-slate-900">No listings available yet</h3><p className="mt-1 text-sm text-slate-500">Approved marketplace inventory will appear here.</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
              <article key={listing.id} onClick={() => onSelectListing(listing)} className="cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-400 hover:shadow-md">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img src={listing.image} alt={listing.title} className="h-full w-full object-cover transition duration-300 hover:scale-105" onError={handleImageError} />
                  <span className="absolute left-3 top-3 rounded bg-[#006F3C] px-2.5 py-1 text-[10px] font-bold uppercase text-white">{listing.type}</span>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-1 truncate text-slate-500"><MapPin className="h-3.5 w-3.5" /> {listing.location}</span><span className="flex items-center gap-1 font-bold"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {listing.rating}</span></div>
                  <h3 className="line-clamp-2 font-bold text-slate-950">{listing.title}</h3>
                  <div className="flex items-baseline justify-between border-t border-slate-100 pt-3"><span className="font-black text-slate-950">PKR {listing.price.toLocaleString()}</span><span className="text-xs text-slate-500">View details</span></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {destinations.length > 0 && (
        <section className="space-y-5">
          <div><p className="text-xs font-bold uppercase tracking-wider text-[#006F3C]">Browse by place</p><h2 className="mt-1 text-2xl font-black text-slate-950">Popular destinations</h2></div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {destinations.map((item) => (
              <button key={item.name} onClick={() => browseDestination(item.name)} className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-slate-900 text-left">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-105" onError={handleImageError} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white"><h3 className="font-bold">{item.name}</h3><p className="mt-1 text-xs text-slate-300">{item.count} {item.count === 1 ? 'listing' : 'listings'}</p></div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 border-y border-slate-200 py-6 sm:grid-cols-3">
        <div className="flex items-start gap-3"><ShieldCheck className="h-6 w-6 text-[#006F3C]" /><div><h3 className="text-sm font-bold text-slate-900">Verified inventory</h3><p className="mt-1 text-xs text-slate-500">Only backend-approved listings are displayed.</p></div></div>
        <div className="flex items-start gap-3"><Search className="h-6 w-6 text-[#006F3C]" /><div><h3 className="text-sm font-bold text-slate-900">Current availability</h3><p className="mt-1 text-xs text-slate-500">Search results come directly from marketplace APIs.</p></div></div>
        <div className="flex items-start gap-3"><MapPin className="h-6 w-6 text-[#006F3C]" /><div><h3 className="text-sm font-bold text-slate-900">Local coverage</h3><p className="mt-1 text-xs text-slate-500">Discover stays, tours, and transport across Pakistan.</p></div></div>
      </section>
    </div>
  );
}
