import { useState } from 'react';
import { LocateFixed, MapPin, Navigation } from 'lucide-react';
import type { LatLng } from '../api/api';

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

const query = (coordinates: LatLng | undefined, location: string) => coordinates ? `${coordinates.lat},${coordinates.lng}` : encodeURIComponent(location);
export const directionsUrl = (coordinates: LatLng | undefined, location: string) => `https://www.google.com/maps/dir/?api=1&destination=${query(coordinates, location)}`;

/**
 * Google Maps without an API key or billing: the classic embed URL plus the official directions link.
 * ponytail: the keyless `output=embed` URL is not a documented API; switch to the Maps Embed API (free, needs a key) if Google ever blocks it.
 */
export function MapEmbed({ coordinates, location, title, className = 'h-64' }: { coordinates?: LatLng; location: string; title: string; className?: string }) {
  return (
    <div className="space-y-2">
      <iframe title={`Map of ${title}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
        src={`https://maps.google.com/maps?q=${query(coordinates, location)}&z=${coordinates ? 15 : 12}&output=embed`}
        className={`w-full rounded-xl border border-slate-200 bg-slate-100 ${className}`} />
      <a href={directionsUrl(coordinates, location)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#006F3C] hover:underline">
        <Navigation className="size-4" />Get directions in Google Maps
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
      {value ? <MapEmbed coordinates={value} location={location} title="your property" className="h-56" />
        : <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><MapPin className="mt-0.5 size-4 shrink-0" />Without a pin, guests see the map for the location text, which can be far off in villages.</p>}
    </div>
  );
}
