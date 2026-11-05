import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type MapPoint = { id: string; lat: number; lng: number; title: string; label?: string; onSelect?: () => void };

const PIN = '<svg width="28" height="37" viewBox="0 0 32 42" aria-hidden="true"><path d="M16 0C7.2 0 0 7 0 15.7 0 27.5 16 42 16 42s16-14.5 16-26.3C32 7 24.800 0 16 0z" fill="#006F3C"/><circle cx="16" cy="16" r="6" fill="#fff"/></svg>';

function iconFor(point: MapPoint) {
  if (!point.label) return L.divIcon({ className: '', html: PIN, iconSize: [28, 37], iconAnchor: [14, 37] });
  // Built as an element, so listing text is never read as HTML.
  const label = document.createElement('span');
  label.textContent = point.label;
  label.style.cssText = 'display:inline-block;white-space:nowrap;padding:3px 8px;border-radius:999px;background:#006F3C;color:#fff;font:600 12px system-ui;box-shadow:0 1px 4px rgb(0 0 0/.35);transform:translate(-50%,-50%)';
  return L.divIcon({ className: '', html: label, iconSize: [0, 0] });
}

/**
 * OpenStreetMap with one or many pins. Loaded on demand with Leaflet.
 * ponytail: tiles come from tile.openstreetmap.org, which allows light use only; switch the tile URL to a hosted provider if traffic grows.
 */
export default function OsmMap({ points, label, className = 'h-64', zoom = 14 }: { points: MapPoint[]; label: string; className?: string; zoom?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(points.map((point) => [point.id, point.lat, point.lng, point.label]));

  useEffect(() => {
    if (!box.current || !points.length) return undefined;
    const map = L.map(box.current, { scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    for (const point of points) {
      const marker = L.marker([point.lat, point.lng], { icon: iconFor(point), title: point.title, alt: point.title, keyboard: Boolean(point.onSelect) }).addTo(map);
      if (point.onSelect) marker.on('click', point.onSelect);
    }
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], zoom);
    else map.fitBounds(L.latLngBounds(points.map((point) => [point.lat, point.lng])), { padding: [48, 48], maxZoom: zoom });
    return () => { map.remove(); };
    // The key holds what the map shows; the click handlers change on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, zoom]);

  return <div ref={box} role="region" aria-label={label} className={`isolate w-full rounded-xl border border-slate-200 bg-slate-100 ${className}`} />;
}
