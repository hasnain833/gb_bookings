import { lazy, Suspense, useEffect, useState } from 'react';
import { LocateFixed, MapPin, Navigation, Search } from 'lucide-react';
import type { LatLng } from '../api/api';
import type { PropertyAddress } from '../utils/rooms';

// Leaflet loads only on screens that show the pin map.
const PinMap = lazy(() => import('./PinMap'));
const inputClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15';

const valid = (lat: number, lng: number) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
const round = (value: number) => Math.round(value * 1e6) / 1e6;

/**
 * Reads a pin from a pasted Google Maps link or "lat, lng". Short links (maps.app.goo.gl) only redirect, so they cannot be read here.
 * Order matters: !3d/!4d is the place itself, @ is only where the map was centred.
 */
export function parseCoordinates(text: string): LatLng | null {
  const value = decodeURIComponent(text.trim());
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match && valid(Number(match[1]), Number(match[2]))) return { lat: round(Number(match[1])), lng: round(Number(match[2])) };
  }
  return null;
}

const OsmMap = lazy(() => import('./OsmMap'));

export const directionsUrl = (coordinates: LatLng | undefined, location: string) => `https://www.openstreetmap.org/directions?to=${coordinates ? `${coordinates.lat},${coordinates.lng}` : encodeURIComponent(location)}`;

/** The listing's pin on OpenStreetMap. Without a pin, the address is looked up instead (Photon: free, no key). */
export function MapEmbed({ coordinates, location, title, className = 'h-64' }: { coordinates?: LatLng; location: string; title: string; className?: string }) {
  const [found, setFound] = useState<LatLng | undefined>();
  const [lookedUp, setLookedUp] = useState(false);
  useEffect(() => {
    if (coordinates || !location) return undefined;
    const controller = new AbortController();
    fetch(`https://photon.komoot.io/api/?${new URLSearchParams({ q: location, limit: '1', lang: 'en', lat: '35.92', lon: '74.31' })}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        const point = data.features?.[0]?.geometry?.coordinates;
        if (point) setFound({ lat: point[1], lng: point[0] });
        setLookedUp(true);
      })
      .catch(() => { if (!controller.signal.aborted) setLookedUp(true); });
    return () => controller.abort();
  }, [coordinates, location]);
  const point = coordinates ?? found;
  const blank = `flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500 ${className}`;
  return (
    <div className="space-y-2">
      {point
        ? <Suspense fallback={<div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />}><OsmMap points={[{ id: 'place', lat: point.lat, lng: point.lng, title }]} zoom={coordinates ? 15 : 12} label={`Map of ${title}`} className={className} /></Suspense>
        : <div className={blank}>{lookedUp ? 'Map not available for this address.' : 'Loading map…'}</div>}
      <a href={directionsUrl(coordinates, location)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#006F3C] hover:underline">
        <Navigation className="size-4" />Get directions on OpenStreetMap
      </a>
    </div>
  );
}

/** Lets a host set the map pin by pasting a Google Maps link or coordinates, or from their phone's location. */
export function LocationPinField({ value, onChange, location }: { value?: LatLng; onChange: (value: LatLng | undefined) => void; location: string }) {
  const [text, setText] = useState(value ? `${value.lat}, ${value.lng}` : '');
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const apply = (input: string) => {
    setText(input);
    if (!input.trim()) { setError(''); onChange(undefined); return; }
    const parsed = parseCoordinates(input);
    setError(parsed ? '' : 'Couldn’t read a location from that. In Google Maps, open the place, copy the full link from the address bar (not a short maps.app link), or paste coordinates like 36.3167, 74.6500.');
    if (parsed) onChange(parsed);
  };
  const locate = () => {
    if (!navigator.geolocation) { setError('This browser cannot share its location.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => { const point = { lat: round(position.coords.latitude), lng: round(position.coords.longitude) }; setText(`${point.lat}, ${point.lng}`); onChange(point); setLocating(false); },
      () => { setError('Location permission was refused. Paste a Google Maps link instead.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">Map pin <span className="font-normal text-slate-500">(recommended)</span>
        <input value={text} onChange={(event) => apply(event.target.value)} placeholder="Paste a Google Maps link or 36.3167, 74.6500"
          className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] font-normal outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={locate} disabled={locating} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><LocateFixed className="size-4" />{locating ? 'Finding you…' : 'Use my current location'}</button>
        <span className="text-xs text-slate-500">Only use this while you are at the property.</span>
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-slate-100" />}>
        <PinMap value={value} onChange={(point) => { setText(`${point.lat}, ${point.lng}`); setError(''); onChange(point); }} />
      </Suspense>
      <p className="flex items-start gap-2 text-xs text-slate-600"><MapPin className="mt-0.5 size-4 shrink-0" />{value
        ? 'Drag the pin to the exact entrance if it is a little off.'
        : `Tap the map where ${location ? 'the property' : 'your property'} is. Without a pin, guests see the map for the address text, which can be far off in villages.`}</p>
    </div>
  );
}

type PhotonFeature = { geometry: { coordinates: [number, number] }; properties: Record<string, string | undefined> };

/** A Photon (OpenStreetMap) result as our address parts. */
function toAddress(p: PhotonFeature['properties']): PropertyAddress {
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  return {
    line1: street ? (p.name && p.name !== p.street ? `${p.name}, ${street}` : street) : p.name ?? '',
    area: p.district ?? p.locality ?? p.suburb ?? '',
    city: p.city ?? p.town ?? p.village ?? p.county ?? p.name ?? '',
    region: p.state ?? '',
    postcode: p.postcode ?? '',
  };
}

/**
 * Address search with suggestions (OpenStreetMap via Photon: free, no key; results nearer Gilgit-Baltistan first),
 * then the address in parts for the partner to check. Picking a suggestion also sets the map pin.
 */
export function AddressFields({ value, onChange, onPin }: { value: PropertyAddress; onChange: (value: PropertyAddress) => void; onPin: (point: LatLng) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); return undefined; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      fetch(`https://photon.komoot.io/api/?${new URLSearchParams({ q: query.trim(), limit: '6', lang: 'en', lat: '35.92', lon: '74.31' })}`, { signal: controller.signal })
        .then((response) => response.json()).then((data) => setResults(data.features ?? []))
        .catch(() => undefined).finally(() => setSearching(false));
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);
  const pick = (feature: PhotonFeature) => {
    onChange({ ...toAddress(feature.properties), region: feature.properties.state || value.region });
    onPin({ lat: round(feature.geometry.coordinates[1]), lng: round(feature.geometry.coordinates[0]) });
    setQuery(''); setResults([]);
  };
  const field = (key: keyof PropertyAddress, label: string, required = false, wide = false) => (
    <label className={`block text-sm font-semibold text-slate-700 ${wide ? 'sm:col-span-2' : ''}`}>{label}{!required && <span className="font-normal text-slate-500"> (optional)</span>}
      <input required={required} maxLength={key === 'postcode' ? 20 : 160} value={value[key] ?? ''} onChange={(event) => onChange({ ...value, [key]: event.target.value })} className={inputClass} />
    </label>
  );
  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-semibold text-slate-700">Find your address
          <span className="relative mt-1.5 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Start typing: hotel name, village or road" aria-autocomplete="list" aria-controls="address-results"
              className={`${inputClass} mt-0 pl-9`} />
          </span>
        </label>
        {(results.length > 0 || searching) && (
          <ul id="address-results" role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {searching && !results.length && <li className="p-3 text-sm text-slate-500">Searching…</li>}
            {results.map((feature, index) => {
              const p = feature.properties;
              return <li key={index} role="option" aria-selected={false}>
                <button type="button" onClick={() => pick(feature)} className="block min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-emerald-50">
                  <span className="font-semibold">{p.name ?? p.street}</span>
                  <span className="block text-xs text-slate-500">{[p.street, p.district ?? p.locality, p.city ?? p.county, p.state, p.country].filter((part, at, all) => part && part !== p.name && all.indexOf(part) === at).join(', ')}</span>
                </button>
              </li>;
            })}
          </ul>
        )}
        <p className="mt-1 text-xs text-slate-500">Not found? Fill in the address below yourself. Search uses OpenStreetMap.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('line1', 'Street, building or village', true, true)}
        {field('area', 'Area or neighbourhood')}
        {field('city', 'Town or city', true)}
        {field('region', 'Region / district')}
        {field('postcode', 'Postcode')}
      </div>
    </div>
  );
}
