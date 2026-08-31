import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

export default function TheaterMap({ theaters, selectedId, onSelect, cityLat, cityLng }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof window === 'undefined') return;

    // Dynamically import leaflet (it's loaded via CDN in index.html)
    const L = window.L;
    if (!L) return;

    // Init map
    const map = L.map(mapRef.current, {
      center: [cityLat || theaters[0]?.latitude || 17.68, cityLng || theaters[0]?.longitude || 83.21],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    leafletMap.current = map;

    return () => { map.remove(); leafletMap.current = null; };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = leafletMap.current;
    if (!L || !map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const goldIcon = L.divIcon({
      className: 'theater-map-marker',
      html: `<div style="
        width: 28px;
        height: 28px;
        background: var(--bg-card);
        border: 2px solid var(--gold);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(201,168,76,0.4);
        cursor: pointer;
        transition: all 200ms;
      ">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--gold)"></div>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const selectedIcon = L.divIcon({
      className: 'theater-map-marker-selected',
      html: `<div style="
        width: 34px;
        height: 34px;
        background: var(--gold);
        border: 2px solid #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 20px rgba(201,168,76,0.6);
        cursor: pointer;
      ">
        <div style="width:10px;height:10px;border-radius:50%;background:var(--bg-primary)"></div>
      </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    theaters.forEach(t => {
      if (!t.latitude || !t.longitude) return;

      const marker = L.marker([t.latitude, t.longitude], {
        icon: t.id === selectedId ? selectedIcon : goldIcon,
      });

      const popupContent = `
        <div style="font-family: var(--font-sans); min-width: 180px;">
          <div style="font-family: 'Cinzel', serif; font-size: 12px; color: var(--gold); letter-spacing: 0.08em; margin-bottom: 4px;">
            ${t.name}
          </div>
          <div style="font-size: 10px; color: var(--text-secondary); margin-bottom: 6px;">${t.area || ''}</div>
          <div style="font-size: 10px; color: var(--text-muted)">${t.totalScreens} screen${t.totalScreens > 1 ? 's' : ''} · ${t.type}</div>
          <a href="#/theater/${t.id}" style="
            display: inline-block;
            margin-top: 8px;
            font-family: 'Cinzel', serif;
            font-size: 9px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--gold);
            text-decoration: none;
          ">View →</a>
        </div>
      `;

      marker.bindPopup(popupContent, { className: 'theater-map-popup' });
      marker.on('click', () => { if (onSelect) onSelect(t); });
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Fit bounds
    if (theaters.length > 0) {
      const valid = theaters.filter(t => t.latitude && t.longitude);
      if (valid.length > 1) {
        const bounds = L.latLngBounds(valid.map(t => [t.latitude, t.longitude]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [theaters, selectedId]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={mapRef}
        style={{ width: '100%', height: 380, border: '1px solid var(--border-subtle)', borderRadius: 2 }}
        aria-label="Theater map"
      />
      <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(10,8,6,0.85)', border: '1px solid var(--border-subtle)' }}>
        <MapPin size={10} color="var(--gold)" />
        <span style={{ fontSize: 9, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          OpenStreetMap · Click marker for details
        </span>
      </div>
    </div>
  );
}
