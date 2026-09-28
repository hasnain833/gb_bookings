import { useMemo, useState } from 'react';
import { ArrowRight, Check, Copy, MapPin, Search, Star, Tag } from 'lucide-react';
import type { Listing } from '../../types';
import { handleImageError } from '../../types';
import { useListings } from '../../shared/hooks/useListings';

interface OffersSectionProps {
  onSelectListing: (listing: Listing) => void;
  onTriggerSearch?: (params: { type: 'offer'; destination: string; dates: string; guests: number }) => void;
}

export default function OffersSection({ onSelectListing, onTriggerSearch }: OffersSectionProps) {
  const { listings, loading, error, reload } = useListings('offer');
  const [query, setQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const offers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return listings;
    return listings.filter((offer) =>
      offer.title.toLowerCase().includes(term) ||
      offer.location.toLowerCase().includes(term) ||
      offer.description.toLowerCase().includes(term) ||
      offer.offerSpecs?.promoCode?.toLowerCase().includes(term)
    );
  }, [listings, query]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onTriggerSearch?.({ type: 'offer', destination: query, dates: '', guests: 1 });
  };

  const handleCopy = async (code: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      <section className="relative min-h-64 overflow-hidden rounded-2xl bg-slate-950 px-5 py-10 text-white sm:px-10">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85"
          alt="Northern Pakistan mountain landscape"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          onError={handleImageError}
        />
        <div className="relative max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <Tag className="h-4 w-4" /> Verified marketplace offers
          </div>
          <h1 className="text-3xl font-black sm:text-4xl">Travel Offers</h1>
          <p className="max-w-xl text-sm text-slate-200">Current promotions published by approved GBBookings vendors.</p>
          <form onSubmit={handleSubmit} className="flex max-w-xl gap-2">
            <label className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search offers by destination or code"
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
              />
            </label>
            <button className="min-h-11 rounded-lg bg-[#006F3C] px-5 text-sm font-bold hover:bg-[#005c32]" type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Available now</h2>
          <p className="mt-1 text-sm text-slate-500">{offers.length} active offers</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-80 animate-pulse rounded-lg bg-slate-200" />)}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button onClick={() => void reload()} className="mt-4 text-sm font-bold text-rose-800 underline">Try again</button>
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
            <Tag className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-3 font-bold text-slate-900">No active offers</h3>
            <p className="mt-1 text-sm text-slate-500">Approved promotions will appear here when vendors publish them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => {
              const details = offer.offerSpecs;
              return (
                <article key={offer.id} onClick={() => onSelectListing(offer)} className="cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-400 hover:shadow-md">
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img src={offer.image} alt={offer.title} className="h-full w-full object-cover transition duration-300 hover:scale-105" onError={handleImageError} />
                    {details?.discountLabel && <span className="absolute left-3 top-3 rounded bg-rose-600 px-2.5 py-1 text-xs font-black text-white">{details.discountLabel}</span>}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span className="flex min-w-0 items-center gap-1 truncate"><MapPin className="h-3.5 w-3.5" /> {offer.location}</span>
                      <span className="flex items-center gap-1 font-bold text-slate-800"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {offer.rating}</span>
                    </div>
                    <h3 className="line-clamp-2 font-bold text-slate-900">{offer.title}</h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{offer.description}</p>
                    {details?.promoCode && (
                      <button onClick={(event) => void handleCopy(details.promoCode!, event)} className="flex min-h-10 w-full items-center justify-center gap-2 rounded border border-dashed border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800">
                        {copiedCode === details.promoCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copiedCode === details.promoCode ? 'Copied' : details.promoCode}
                      </button>
                    )}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="font-black text-slate-900">PKR {offer.price.toLocaleString()}</span>
                      <button className="flex items-center gap-1 text-xs font-bold text-[#006F3C]">View deal <ArrowRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
