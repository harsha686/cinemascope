import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Film, Star } from 'lucide-react';
import { useApp } from '../AppContext';
import MovieCard from '../components/movies/MovieCard';

export default function MoviesPage() {
  const navigate = useNavigate();
  const { state, allCities, getMovieRating } = useApp();

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

  // Compute top 3 rated movies (with reviews count > 0)
  const topMovieRanks = useMemo(() => {
    const ranks = {};
    if (!filteredMovies || filteredMovies.length === 0) return ranks;

    const rated = [...filteredMovies]
      .map(m => {
        const r = getMovieRating ? getMovieRating(m.id) : { average: 0, count: 0 };
        return { id: m.id, average: r?.average || 0, count: r?.count || 0 };
      })
      .filter(m => m.count > 0)
      .sort((a, b) => {
        if (b.average !== a.average) return b.average - a.average;
        return b.count - a.count;
      });

    rated.slice(0, 3).forEach((item, index) => {
      ranks[item.id] = index + 1;
    });

    return ranks;
  }, [filteredMovies, getMovieRating, state.reviews]);

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: 'clamp(48px, 6vw, 64px) 24px 32px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to bottom, var(--bg-card), var(--bg-primary))' }}>
        <div className="container">
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>
            Now Showing & Catalog
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', color: 'var(--text-primary)', letterSpacing: '-0.01em', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            Browse Movies
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 600, lineHeight: 1.6 }}>
            Explore theatrical releases, technical specifications, community reviews, and screen recommendations.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{ position: 'sticky', top: 'var(--nav-height)', zIndex: 20, background: 'rgba(10,8,6,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', padding: '14px 24px' }}>
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
      <div className="container" style={{ padding: '32px 24px 80px' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredMovies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Film size={36} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.6 }} />
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              No movies found matching your filters
            </h3>
            <button
              onClick={() => { setSearch(''); setSelectedCity('all'); setSelectedStatus('all'); setSelectedLang('all'); }}
              className="btn btn-outline btn-sm"
              style={{ marginTop: 12 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
            gap: 20,
          }}>
            {filteredMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} topRank={topMovieRanks[movie.id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
