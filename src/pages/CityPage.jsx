import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Map, Grid, LayoutList, Plus, Star } from 'lucide-react';
import { useApp } from '../AppContext';
import TheaterCard from '../components/city/TheaterCard';
import TheaterMap from '../components/city/TheaterMap';
import AdminTheaterFormModal from '../components/admin/AdminTheaterFormModal';

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
  const { getCity, getCityTheaters, getTheaterRating, state, dispatch, allCities } = useApp();

  const currentUser = state.currentUser;
  const isAdmin = currentUser && currentUser.role === 'ADMIN';

  const city = getCity(cityId);
  const theaters = getCityTheaters(cityId);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [view, setView] = useState('grid'); // grid | list | map
  const [selectedTheaterId, setSelectedTheaterId] = useState(null);

  // Admin Theater Form State
  const [showTheaterModal, setShowTheaterModal] = useState(false);
  const [theaterToEdit, setTheaterToEdit] = useState(null);

  const handleOpenAddTheater = () => {
    setTheaterToEdit(null);
    setShowTheaterModal(true);
  };

  const handleOpenEditTheater = (theater) => {
    setTheaterToEdit(theater);
    setShowTheaterModal(true);
  };

  const handleDeleteTheater = (theater) => {
    if (window.confirm(`Are you sure you want to delete "${theater.name}"?`)) {
      dispatch({ type: 'DELETE_THEATER', payload: theater.id });
    }
  };

  const handleSaveTheater = (theaterObj) => {
    if (theaterToEdit) {
      dispatch({ type: 'UPDATE_THEATER', payload: theaterObj });
    } else {
      dispatch({ type: 'ADD_THEATER', payload: theaterObj });
    }
    setTheaterToEdit(null);
    setShowTheaterModal(false);
  };

  const filtered = useMemo(() => {
    const list = theaters.filter(t => {
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

    // Sort by top rating (highest rating first, more reviews on ties, then alphabetical)
    return [...list].sort((a, b) => {
      const rA = getTheaterRating ? getTheaterRating(a.id) : { average: 0, count: 0 };
      const rB = getTheaterRating ? getTheaterRating(b.id) : { average: 0, count: 0 };

      // Theaters with reviews come before theaters without reviews
      if (rA.count > 0 && rB.count === 0) return -1;
      if (rA.count === 0 && rB.count > 0) return 1;

      // Both have reviews: compare average rating descending
      if (rB.average !== rA.average) {
        return rB.average - rA.average;
      }

      // If average rating is equal, compare review count descending
      if (rB.count !== rA.count) {
        return rB.count - rA.count;
      }

      // Tie breaker: alphabetical by theater name
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [theaters, search, activeFilter, getTheaterRating, state.reviews]);

  // Determine top-rated theater (must have at least one review)
  const topTheaterId = useMemo(() => {
    if (!filtered || filtered.length === 0) return null;
    const top = filtered[0];
    const r = getTheaterRating ? getTheaterRating(top.id) : { average: 0, count: 0 };
    return r.count > 0 ? top.id : null;
  }, [filtered, getTheaterRating]);

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
              <div style={{ fontSize: 'var(--font-size-xs)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                {city.state} · {city.country}
              </div>
              <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 36px)', color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.15, fontWeight: 700, margin: 0 }}>
                {city.name}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{theaters.length}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>Theaters</div>
              </div>
              <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{totalScreens}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>Screens</div>
              </div>
            </div>
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
            <div style={{ display: 'flex', gap: 2, border: '1px solid var(--border-subtle)', padding: 2, borderRadius: 'var(--radius-sm)' }}>
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
                    background: view === id ? 'rgba(255,255,255,0.12)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: view === id ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    borderRadius: 2,
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
        {/* Results filter summary & sort indicator (Single Canonical Stat) */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {activeFilter !== 'all' ? (
              <span>Filter: <strong>{FILTERS.find(f => f.id === activeFilter)?.label || activeFilter}</strong> ({filtered.length})</span>
            ) : (
              <span>All Listings ({filtered.length})</span>
            )}
          </span>
          <span className="badge" style={{ fontSize: 10, color: 'var(--text-secondary)', gap: 5, padding: '3px 9px' }}>
            <Star size={10} fill="var(--accent)" color="var(--accent)" /> Ranked by Top Rating
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
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>No theaters found</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Try a different search or filter</p>
              <button onClick={() => { setSearch(''); setActiveFilter('all'); }} className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: view === 'list' ? '1fr' : 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: view === 'list' ? 2 : 12,
              background: view === 'list' ? 'var(--border-subtle)' : 'transparent',
              border: view === 'list' ? '1px solid var(--border-subtle)' : 'none',
            }}>
              {filtered.map(t => (
                <TheaterCard
                  key={t.id}
                  theater={t}
                  compact={view === 'list'}
                  isTopRated={t.id === topTheaterId}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Admin Theater Form Modal */}
      {isAdmin && (
        <AdminTheaterFormModal
          key={theaterToEdit ? `edit-${theaterToEdit.id}` : 'new-theater'}
          isOpen={showTheaterModal}
          onClose={() => {
            setShowTheaterModal(false);
            setTheaterToEdit(null);
          }}
          onSave={handleSaveTheater}
          theaterToEdit={theaterToEdit}
          allCities={allCities}
          defaultCityId={city.id}
        />
      )}
    </div>
  );
}
