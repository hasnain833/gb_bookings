import { useEffect, useState } from 'react';
import { api, type VendorListing, type VendorRoom } from '../../shared/api/api';

export default function ListingReviewDetails({ listing }: { listing: VendorListing }) {
  const [rooms, setRooms] = useState<VendorRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.admin.listListingRooms(listing.id)
      .then((data) => { if (active) setRooms(data); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load rooms.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [listing.id, attempt]);
  return <div className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{listing.description}</p>
    <div className="flex gap-2 overflow-x-auto">{listing.images.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" aria-label={`Open property photo ${index + 1}`}><img src={url} alt={`Property photo ${index + 1}`} className="h-24 w-32 max-w-none rounded-lg object-cover" /></a>)}</div>
    {listing.hotelSpecs && <dl className="grid gap-2 text-xs text-slate-600"><div><dt className="font-semibold">Check-in / check-out</dt><dd>{listing.hotelSpecs.checkInTime} / {listing.hotelSpecs.checkOutTime}</dd></div>{(['amenities', 'facilities', 'policies'] as const).map((key) => <div key={key}><dt className="font-semibold capitalize">{key}</dt><dd>{listing.hotelSpecs?.[key].join(', ') || 'None provided'}</dd></div>)}</dl>}
    <h3 className="text-sm font-semibold">Room categories for approval</h3>
    {loading && <p role="status" className="text-xs text-slate-500">Loading rooms…</p>}
    {error && <div role="alert" className="text-xs text-rose-700">{error}<button type="button" onClick={() => setAttempt((value) => value + 1)} className="ml-2 min-h-11 underline">Try again</button></div>}
    {!loading && !error && rooms.length === 0 && <p className="text-xs text-slate-500">No room categories.</p>}
    {!loading && !error && rooms.map((room) => <div key={room.id} className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-sm font-semibold">{room.name}<span className="ml-2 text-xs font-normal capitalize text-slate-500">{room.status}</span></p><p className="mt-1 text-xs leading-5 text-slate-600">{room.totalRooms} rooms · {room.bedType} · {room.maxAdults} adults / {room.maxChildren} children · PKR {room.basePrice.toLocaleString()} per night</p>{room.description && <p className="mt-1 text-xs text-slate-600">{room.description}</p>}{room.amenities.length > 0 && <p className="mt-1 text-xs text-slate-500">{room.amenities.join(', ')}</p>}</div>)}
  </div>;
}
