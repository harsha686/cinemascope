import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Map, Grid, LayoutList } from 'lucide-react';
import YoutubeIcon from '../components/shared/YoutubeIcon';
import { useApp } from '../AppContext';
import TheaterCard from '../components/city/TheaterCard';
import TheaterMap from '../components/city/TheaterMap';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'single-screen', label: 'Single Screen' },
  { id: 'multiplex', label: 'Multiplexes' },
  { id: 'twin', label: 'Twin Cinema' },
  { id: 'dolby', label: 'Dolby Atmos' },
  { id: '4k', label: '4K' },
  { id: 'laser', label: 'Laser' },
  { id: 'barco', label: 'Barco' },
];

export default function CityPage() {
  const { cityId } = useParams();
  const navigate = useNavigate();
  const { getCity, getCityTheaters } = useApp();

  const city = getCity(cityId);
  const theaters = getCityTheaters(cityId);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [view, setView] = useState('grid'); // grid | list | map
  const [selectedTheaterId, setSelectedTheaterId] = useState(null);

  const filtered = useMemo(() => {
    return theaters.filter(t => {
      // Search
      const q = search.toLowerCase();
      const matchSearch = !q ||
        t.name.toLowerCase().includes(q) ||
        t.area?.toLowerCase().includes(q) ||
        t.features?.some(f => f.toLowerCase().includes(q)) ||
        t.type.toLowerCase().includes(q) ||
        t.screens?.some(s =>
          s.formatName?.toLowerCase().includes(q) ||
          s.aspectRatio?.includes(q) ||
          s.soundSystem?.toLowerCase().includes(q) ||
          s.projection?.toLowerCase().includes(q)
        );

      // Filter
      let matchFilter = true;
      if (activeFilter === 'all') matchFilter = true;
      else if (activeFilter === 'single-screen') matchFilter = t.type === 'single-screen';
      else if (activeFilter === 'multiplex') matchFilter = t.type === 'multiplex';
      else if (activeFilter === 'twin') matchFilter = t.type === 'twin';
      else if (activeFilter === 'dolby') matchFilter = t.features?.some(f => f.toLowerCase().includes('atmos'));
      else if (activeFilter === '4k') matchFilter = t.features?.some(f => f.toLowerCase().includes('4k'));
      else if (activeFilter === 'laser') matchFilter = t.features?.some(f => f.toLowerCase().includes('laser'));
      else if (activeFilter === 'barco') matchFilter = t.features?.some(f => f.toLowerCase().includes('barco'));

      return matchSearch && matchFilter;
    });
  }, [theaters, search, activeFilter]);

  const totalScreens = theaters.reduce((s, t) => s + t.totalScreens, 0);

  if (!city) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>City Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12, marginBottom: 24 }}>We don't have data for this city yet.</p>
        <button onClick={() => navigate('/')} className="btn btn-outline">← Back Home</button>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Hero */}
      <div style={{ padding: '60px 24px 40px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to bottom, rgba(201,168,76,0.03), transparent)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <button onClick={() => navigate('/')} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              Home
            </button>
            <span style={{ color: 'var(--border)' }}>/</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{city.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
                {city.state} · {city.country}
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 48px)', color: 'var(--text-primary)', letterSpacing: '0.05em', lineHeight: 1 }}>
                {city.name.toUpperCase()}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--gold)' }}>{theaters.length}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Theaters</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--gold)' }}>{totalScreens}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Screens</div>
              </div>
            </div>
          </div>

          {/* Data notice */}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="https://youtube.com/@theatrebabu9796" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--gold)', textDecoration: 'none', fontFamily: 'var(--font-serif)', letterSpacing: '0.08em' }}>
              <YoutubeIcon size={12} /> TheatreBabu
            </a>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>· Theater data sourced from YouTube reviews · Not officially verified</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ position: 'sticky', top: 'var(--nav-height)', zIndex: 20, background: 'rgba(10,8,6,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 24px' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Search + view toggle */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                className="input"
                style={{ paddingLeft: 36, fontSize: 12 }}
                placeholder="Search theaters, formats, Dolby Atmos, Barco..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search theaters"
              />
            </div>
            <div style={{ display: 'flex', gap: 2, border: '1px solid var(--border-subtle)', padding: 2 }}>
              {[
                { id: 'grid', icon: Grid },
                { id: 'list', icon: LayoutList },
                { id: 'map', icon: Map },
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  style={{
                    padding: '6px 8px',
                    background: view === id ? 'var(--gold-faint)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: view === id ? 'var(--gold)' : 'var(--text-muted)',
                    display: 'flex',
                    transition: 'all var(--transition-fast)',
                  }}
                  aria-label={id}
                  title={id.charAt(0).toUpperCase() + id.slice(1)}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                className={`filter-chip ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: '32px 24px' }}>
        {/* Results count */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', letterSpacing: '0.1em' }}>
            {filtered.length} theater{filtered.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* Map view */}
        {view === 'map' && (
          <div style={{ marginBottom: 24 }}>
            <TheaterMap
              theaters={filtered}
              selectedId={selectedTheaterId}
              onSelect={t => setSelectedTheaterId(t.id)}
              cityLat={city.latitude}
              cityLng={city.longitude}
            />
          </div>
        )}

        {/* Grid / List view */}
        {(view === 'grid' || view === 'list' || (view === 'map' && selectedTheaterId)) && (
          filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 8 }}>No theaters found</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Try a different search or filter</p>
              <button onClick={() => { setSearch(''); setActiveFilter('all'); }} className="btn btn-ghost" style={{ marginTop: 16 }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: view === 'list' ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: view === 'list' ? 2 : 12,
              background: view === 'list' ? 'var(--border-subtle)' : 'transparent',
              border: view === 'list' ? '1px solid var(--border-subtle)' : 'none',
            }}>
              {filtered.map(t => (
                <TheaterCard key={t.id} theater={t} compact={view === 'list'} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
