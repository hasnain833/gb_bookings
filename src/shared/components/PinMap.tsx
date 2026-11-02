import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '../api/api';

// Gilgit, where the map opens before a pin is set.
const GB_CENTRE: L.LatLngTuple = [35.92, 74.31];
const round = (value: number) => Math.round(value * 1e6) / 1e6;
// Drawn pin, so no marker image files are needed.
const pinIcon = L.divIcon({
  className: '',
  html: '<svg width="32" height="42" viewBox="0 0 32 42" aria-hidden="true"><path d="M16 0C7.2 0 0 7 0 15.7 0 27.5 16 42 16 42s16-14.5 16-26.3C32 7 24.8 0 16 0z" fill="#006F3C"/><circle cx="16" cy="15.5" r="6" fill="#fff"/></svg>',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

/**
 * OpenStreetMap (free, no key) with a pin the partner drags, or taps the map to place. Loaded on demand with Leaflet.
 * ponytail: tiles come from tile.openstreetmap.org, which allows light use only; switch the tile URL to a hosted provider if partner traffic grows.
 */
export default function PinMap({ value, onChange }: { value?: LatLng; onChange: (value: LatLng) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | undefined>(undefined);
  const marker = useRef<L.Marker | undefined>(undefined);
  const latest = useRef(onChange);
  latest.current = onChange;
  const place = (point: L.LatLng) => latest.current({ lat: round(point.lat), lng: round(point.lng) });

  useEffect(() => {
    const instance = L.map(box.current!, { scrollWheelZoom: false }).setView(value ? [value.lat, value.lng] : GB_CENTRE, value ? 15 : 8);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(instance);
    instance.on('click', (event: L.LeafletMouseEvent) => place(event.latlng));
    map.current = instance;
    return () => { instance.remove(); map.current = undefined; marker.current = undefined; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow pins set elsewhere too (address search, a pasted link, "use my location").
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    if (!value) { marker.current?.remove(); marker.current = undefined; return; }
    const point: L.LatLngTuple = [value.lat, value.lng];
    if (marker.current) marker.current.setLatLng(point);
    else {
      marker.current = L.marker(point, { draggable: true, icon: pinIcon, title: 'Your property' }).addTo(instance);
      marker.current.on('dragend', () => place(marker.current!.getLatLng()));
    }
    if (!instance.getBounds().contains(point)) instance.setView(point, Math.max(instance.getZoom(), 15));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  return <div ref={box} className="isolate h-72 w-full rounded-xl border border-slate-200 bg-slate-100" aria-label="Map. Tap the map or drag the pin to your property." />;
}
