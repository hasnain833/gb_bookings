import { Car, MapPin, Star } from 'lucide-react';
import { handleImageError, type Listing } from '../../types';

/** Compact listing card for the homepage and search results. `detailed` adds the description and car specs. */
export default function ListingCard({ listing, onSelect, tag, detailed = false }: {
  listing: Listing; onSelect: () => void; tag?: string; detailed?: boolean;
}) {
  const perNight = listing.type === 'hotel' || listing.type === 'homestay';
  return (
    <article onClick={onSelect} className="cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-emerald-400 hover:shadow-md">
      <div className={`relative overflow-hidden bg-slate-100 ${detailed ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
        <img src={listing.image} alt={listing.title} className="h-full w-full object-cover transition duration-300 hover:scale-105" onError={handleImageError} />
        {tag && <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium capitalize text-slate-800">{tag}</span>}
      </div>
      <div className={detailed ? 'space-y-2.5 p-4' : 'space-y-2 p-3'}>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="flex min-w-0 items-center gap-1 truncate text-slate-500"><MapPin className="h-3.5 w-3.5 shrink-0" /> {listing.location}</span>
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            {listing.rating ? <><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {listing.rating}</> : <span className="text-[#006F3C]">New</span>}
          </span>
        </div>
        <h3 className={`font-semibold text-slate-950 ${detailed ? 'line-clamp-2' : 'line-clamp-1 text-sm'}`}>{listing.title}</h3>
        {detailed && <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">{listing.description}</p>}
        {detailed && listing.type === 'car' && listing.carSpecs && (
          <p className="flex items-center gap-2 text-xs font-medium text-slate-500"><Car className="h-4 w-4" /> {listing.carSpecs.category} · {listing.carSpecs.transmission}</p>
        )}
        <p className={`pt-1 font-bold text-slate-950 ${detailed ? 'text-base' : 'text-sm'}`}>
          PKR {listing.price.toLocaleString()}{perNight && <span className="text-xs font-normal text-slate-500"> / night</span>}
        </p>
      </div>
    </article>
  );
}
