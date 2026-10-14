import { useEffect, useState } from 'react';
import { api, type ListingPhoto, type VendorListing, type VendorRoom } from '../../shared/api/api';

const text = (value: unknown) => Array.isArray(value) ? value.join(', ') : value == null || value === '' ? '—' : String(value);

function Photos({ photos, label }: { photos: ListingPhoto[]; label: string }) {
  return <div className="flex gap-2 overflow-x-auto">{photos.map((photo, index) => <a key={`${photo.url}-${index}`} href={photo.url} target="_blank" rel="noreferrer" className="w-32 shrink-0" aria-label={`Open ${label} ${index + 1}`}>
    <img src={photo.url} alt={photo.caption || `${label} ${index + 1}`} className="h-24 w-32 max-w-none rounded-lg object-cover" />
    {photo.caption && <span className="mt-1 block truncate text-[11px] text-slate-500">{photo.caption}</span>}
  </a>)}</div>;
}

/** Before → after rows for the fields an edit changes. */
function Changes({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const flat = (value: Record<string, unknown>) => Object.entries(value).flatMap(([key, item]) =>
    item && typeof item === 'object' && !Array.isArray(item) ? Object.entries(item).map(([inner, v]) => [`${key}.${inner}`, v] as const) : [[key, item] as const]);
  const old = new Map(flat(before));
  const rows = flat(after).filter(([key, value]) => key !== 'photos' && text(old.get(key)) !== text(value));
  return <>
    {rows.length > 0 && <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">{rows.map(([key, value]) => <div key={key} className="contents">
      <dt className="capitalize text-slate-500">{key.replace(/^(hotelSpecs|homestaySpecs)\./, '').replace(/([A-Z])/g, ' $1').toLowerCase()}</dt>
      <dd className="whitespace-pre-wrap"><span className="text-slate-500 line-through">{text(old.get(key))}</span> → <strong className="text-slate-900">{text(value)}</strong></dd>
    </div>)}</dl>}
    {Array.isArray(after.photos) && <div className="space-y-1"><p className="text-xs font-semibold text-slate-600">New photo set (first is the cover)</p><Photos photos={after.photos as ListingPhoto[]} label="Proposed photo" /></div>}
  </>;
}

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
  const changedRooms = rooms.filter((room) => room.pendingRevision);
  return <div className="mt-3 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
    {listing.pendingRevision && <section className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-xs font-semibold text-amber-900">Changes waiting for review · {new Date(listing.pendingRevision.submittedAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })} · guests still see the current version below</p>
      <Changes before={listing as unknown as Record<string, unknown>} after={listing.pendingRevision.changes as Record<string, unknown>} />
      {changedRooms.map((room) => <div key={room.id} className="space-y-1 rounded-md bg-white p-2">
        <p className="text-xs font-semibold">{room.pendingRevision!.isNew ? `New room category: ${room.name}` : `Room: ${room.name}`}</p>
        {room.pendingRevision!.isNew
          ? <><p className="text-xs text-slate-600">{room.totalRooms} rooms · {room.bedType} · {room.maxAdults} adults / {room.maxChildren} children · PKR {room.basePrice.toLocaleString()} per night</p>{room.photos.length > 0 && <Photos photos={room.photos} label="Room photo" />}</>
          : <Changes before={room as unknown as Record<string, unknown>} after={room.pendingRevision!.changes as Record<string, unknown>} />}
      </div>)}
      {loading && <p className="text-xs text-slate-500">Loading room changes…</p>}
    </section>}
    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{listing.description}</p>
    <Photos photos={listing.photos?.length ? listing.photos : listing.images.map((url) => ({ url }))} label="Property photo" />
    {listing.hotelSpecs && <dl className="grid gap-2 text-xs text-slate-600"><div><dt className="font-semibold">Check-in / check-out</dt><dd>{listing.hotelSpecs.checkInTime} / {listing.hotelSpecs.checkOutTime}</dd></div>{(['amenities', 'facilities', 'policies'] as const).map((key) => <div key={key}><dt className="font-semibold capitalize">{key}</dt><dd>{listing.hotelSpecs?.[key].join(', ') || 'None provided'}</dd></div>)}</dl>}
    <h3 className="text-sm font-semibold">Room categories for approval</h3>
    {loading && <p role="status" className="text-xs text-slate-500">Loading rooms…</p>}
    {error && <div role="alert" className="text-xs text-rose-700">{error}<button type="button" onClick={() => setAttempt((value) => value + 1)} className="ml-2 min-h-11 underline">Try again</button></div>}
    {!loading && !error && rooms.length === 0 && <p className="text-xs text-slate-500">No room categories.</p>}
    {!loading && !error && rooms.map((room) => <div key={room.id} className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-sm font-semibold">{room.name}<span className="ml-2 text-xs font-normal capitalize text-slate-500">{room.status}</span></p><p className="mt-1 text-xs leading-5 text-slate-600">{room.totalRooms} rooms · {room.bedType} · {room.maxAdults} adults / {room.maxChildren} children · PKR {room.basePrice.toLocaleString()} per night</p>{room.description && <p className="mt-1 text-xs text-slate-600">{room.description}</p>}{room.amenities.length > 0 && <p className="mt-1 text-xs text-slate-500">{room.amenities.join(', ')}</p>}{room.photos.length > 0 && <div className="mt-2"><Photos photos={room.photos} label="Room photo" /></div>}</div>)}
  </div>;
}
