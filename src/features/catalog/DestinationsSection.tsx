import { useMemo, useState } from 'react';
import { ArrowRight, MapPin, RefreshCw, Search } from 'lucide-react';
import { handleImageError } from '../../types';
import { useListings } from '../../shared/hooks/useListings';

interface DestinationsSectionProps {
  onTriggerSearch: (params: { type: 'hotel'; destination: string; dates: string; guests: number }) => void;
  setView: (view: string) => void;
}

export default function DestinationsSection({ onTriggerSearch }: DestinationsSectionProps) {
  const { listings, loading, error, reload } = useListings('destination');
  const [query, setQuery] = useState('');

  const destinations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return listings;
    return listings.filter((item) =>
      item.title.toLowerCase().includes(term) ||
      item.location.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    );
  }, [listings, query]);

  const openDestination = (destination: string) => {
    onTriggerSearch({ type: 'hotel', destination, dates: '', guests: 2 });
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#006F3C]">Explore Pakistan</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950">Destinations</h1>
            <p className="mt-1 text-sm text-slate-500">Browse destination guides published by the marketplace team.</p>
          </div>
          <label className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search destinations" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#006F3C]" />
          </label>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="aspect-[16/10] animate-pulse rounded-lg bg-slate-200" />)}</div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-10 text-center"><p className="font-semibold text-rose-700">{error}</p><button onClick={() => void reload()} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-rose-800 underline"><RefreshCw className="h-4 w-4" /> Try again</button></div>
      ) : destinations.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center"><MapPin className="mx-auto h-9 w-9 text-slate-400" /><h2 className="mt-3 font-bold text-slate-900">No destinations available</h2><p className="mt-1 text-sm text-slate-500">Published destination guides will appear here.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <article key={destination.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[16/10] overflow-hidden bg-slate-100"><img src={destination.image} alt={destination.title} className="h-full w-full object-cover" onError={handleImageError} /></div>
              <div className="space-y-3 p-5"><p className="flex items-center gap-1 text-xs font-bold text-[#006F3C]"><MapPin className="h-3.5 w-3.5" /> {destination.location}</p><h2 className="text-lg font-bold text-slate-950">{destination.title}</h2><p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{destination.description}</p><button onClick={() => openDestination(destination.title)} className="flex min-h-10 items-center gap-2 text-sm font-bold text-[#006F3C]">View available stays <ArrowRight className="h-4 w-4" /></button></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
