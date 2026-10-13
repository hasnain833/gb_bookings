import { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useListings } from '../../shared/hooks/useListings';
import { CardSkeleton } from '../../shared/components/SkeletonLoader';
import ListingCard from '../../shared/components/ListingCard';
import type { Listing, ListingType } from '../../types';

export default function FeaturedRow({ type, label, onBrowse, onSelectListing }: {
  type: ListingType; label: string; onBrowse: () => void; onSelectListing: (listing: Listing) => void;
}) {
  const { listings, loading, error, reload } = useListings(type, '', { limit: 12, sort: 'recommended' });
  const row = useRef<HTMLDivElement>(null);
  return <section className="min-w-0 space-y-4" aria-labelledby={`featured-${type}`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id={`featured-${type}`} className="text-xl font-bold text-slate-950">Featured {label}</h2><div className="flex items-center gap-3"><button type="button" onClick={onBrowse} className="flex min-h-11 items-center gap-1 text-sm font-semibold text-[#006F3C]">Browse all<ArrowRight className="size-4" /></button>{!loading && !error && listings.length > 0 && <div className="hidden gap-1 sm:flex">{[-1, 1].map((direction) => <button key={direction} type="button" aria-label={`Scroll ${label.toLowerCase()} ${direction === -1 ? 'left' : 'right'}`} onClick={() => row.current?.scrollBy({ left: direction * row.current.clientWidth * 0.8, behavior: 'smooth' })} className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50">{direction === -1 ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</button>)}</div>}</div></div>
    {error ? <div className="rounded-xl border border-slate-200 bg-white p-6 text-center" role="status"><p className="text-sm font-semibold text-slate-700">We couldn’t load {label.toLowerCase()} right now.</p><p className="mt-1 text-xs text-slate-500">Please try again in a moment.</p><button type="button" onClick={() => void reload()} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#006F3C]"><RefreshCw className="size-4" />Try again</button></div>
      : !loading && listings.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No {label.toLowerCase()} are available yet. Please check back soon.</div>
        : <div ref={row} tabIndex={0} aria-label={`Featured ${label.toLowerCase()}, scroll for more`} className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-emerald-600">{loading ? [0, 1, 2, 3].map((index) => <div key={index} className="w-[280px] shrink-0 sm:w-[290px]"><CardSkeleton /></div>) : listings.map((listing) => <div key={listing.id} className="w-[280px] shrink-0 snap-start sm:w-[290px]"><ListingCard listing={listing} onSelect={() => onSelectListing(listing)} /></div>)}</div>}
  </section>;
}
