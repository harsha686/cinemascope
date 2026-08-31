import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Film, Star } from 'lucide-react';
import { useApp } from '../AppContext';
import MovieCard from '../components/movies/MovieCard';

export default function MoviesPage() {
  const navigate = useNavigate();
  const { state, allCities } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(state.selectedCity?.id || 'all');
  const [selectedStatus, setSelectedStatus] = useState('CURRENTLY_SHOWING');
  const [selectedLang, setSelectedLang] = useState('all');

  const languages = ['all', 'Telugu', 'Hindi', 'English', 'Tamil'];

  const filteredMovies = useMemo(() => {
    return state.movies.filter(m => {
      // Search
      const q = search.toLowerCase();
      const matchQuery = !q ||
        m.title.toLowerCase().includes(q) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
        (m.director && m.director.toLowerCase().includes(q)) ||
        (m.cast && m.cast.some(c => c.toLowerCase().includes(q))) ||
        (m.genres && m.genres.some(g => g.toLowerCase().includes(q)));

      // Status
      const matchStatus = selectedStatus === 'all' || m.status === selectedStatus;

      // City
      const matchCity = selectedCity === 'all' || (m.cities && m.cities.includes(selectedCity));

      // Language
      const matchLang = selectedLang === 'all' || m.language.toLowerCase() === selectedLang.toLowerCase();

      return matchQuery && matchStatus && matchCity && matchLang;
    });
  }, [state.movies, search, selectedStatus, selectedCity, selectedLang]);

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '60px 24px 40px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to bottom, rgba(220,182,91,0.03), transparent)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Movie Discovery
            </span>
            <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            Browse Movies
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
            Discover current movies, technical specs, user reviews, and recommended screens in your city.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{ position: 'sticky', top: 'var(--nav-height)', zIndex: 20, background: 'rgba(10,8,6,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', padding: '16px 24px' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="input"
                style={{ paddingLeft: 38, fontSize: 13 }}
                placeholder="Search movies, directors, actors, genres..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* City Selector */}
            <select
              className="input"
              style={{ width: 'auto', minWidth: 160, fontSize: 13 }}
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
            >
              <option value="all">All Cities</option>
              {allCities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Language Selector */}
            <select
              className="input"
              style={{ width: 'auto', minWidth: 130, fontSize: 13 }}
              value={selectedLang}
              onChange={e => setSelectedLang(e.target.value)}
            >
              {languages.map(l => (
                <option key={l} value={l}>{l === 'all' ? 'All Languages' : l}</option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
            {[
              { id: 'CURRENTLY_SHOWING', label: 'Now Showing' },
              { id: 'COMING_SOON', label: 'Coming Soon' },
              { id: 'all', label: 'All Movies' },
            ].map(s => (
              <button
                key={s.id}
                className={`filter-chip ${selectedStatus === s.id ? 'active' : ''}`}
                onClick={() => setSelectedStatus(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container" style={{ padding: '36px 24px 80px' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', letterSpacing: '0.1em' }}>
            Showing {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredMovies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Film size={36} color="var(--gold-dim)" style={{ marginBottom: 12 }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 8 }}>
              No movies found matching your filters
            </h3>
            <button
              onClick={() => { setSearch(''); setSelectedCity('all'); setSelectedStatus('all'); setSelectedLang('all'); }}
              className="btn btn-ghost"
              style={{ marginTop: 12 }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 20,
          }}>
            {filteredMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
