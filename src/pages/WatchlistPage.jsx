import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, LayoutGrid, List as ListIcon, X, Check, Film, RefreshCw, ArrowLeft } from 'lucide-react';
import { useApp } from '../AppContext';
import * as LibService from '../services/movieLibraryService';
import { fetchFullTmdbMovieDetails } from '../services/tmdbService';
import GlobalMovieCard from '../components/discovery/GlobalMovieCard';

export default function WatchlistPage() {
  const { state } = useApp();
  const currentUser = state.currentUser;
  const navigate = useNavigate();

  const [watchlistItems, setWatchlistItems] = useState([]);
  const [moviesData, setMoviesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [sort, setSort] = useState('dateAdded');

  // Load watchlist
  useEffect(() => {
    if (!currentUser) {
      setWatchlistItems([]);
      setLoading(false);
      return;
    }
    const load = async () => {
      const items = await LibService.getWatchlistMovies(currentUser.id);
      setWatchlistItems(items);
      setLoading(false);
    };
    load();
  }, [currentUser]);

  // Fetch TMDB data for watchlist items
  useEffect(() => {
    if (watchlistItems.length === 0) return;
    const idsToFetch = watchlistItems.map(i => i.tmdbId).filter(id => id && !moviesData[id]);
    if (idsToFetch.length === 0) return;
    const uniqueIds = [...new Set(idsToFetch)];
    Promise.all(uniqueIds.map(async (id) => {
      try {
        const details = await fetchFullTmdbMovieDetails(id);
        return { id, details };
      } catch {
        return { id, details: null };
      }
    })).then(results => {
      const map = {};
      results.forEach(({ id, details }) => {
        const item = watchlistItems.find(w => w.tmdbId === id) || {};
        if (details) {
          map[id] = details;
          if (details.tmdbId) map[details.tmdbId] = details;
          if (details.id) map[details.id] = details;
          if (details.cleanId) map[details.cleanId] = details;
          if (details.requestedId) map[details.requestedId] = details;
        } else {
          map[id] = {
            tmdbId: id,
            title: item.title || item.movieMeta?.title || id,
            posterUrl: item.movieMeta?.posterUrl || null,
          };
        }
      });
      setMoviesData(prev => ({ ...prev, ...map }));
    });
  }, [watchlistItems]);

  const sortedItems = useMemo(() => {
    const list = [...watchlistItems];
    list.sort((a, b) => {
      const mA = moviesData[a.tmdbId];
      const mB = moviesData[b.tmdbId];
      if (sort === 'title') {
        const tA = mA?.title || a.title || a.tmdbId;
        const tB = mB?.title || b.title || b.tmdbId;
        return tA.localeCompare(tB);
      }
      if (sort === 'year') {
        const yA = parseInt(mA?.releaseYear || 0, 10);
        const yB = parseInt(mB?.releaseYear || 0, 10);
        return yB - yA;
      }
      return 0; // dateAdded order preserved
    });
    return list;
  }, [watchlistItems, moviesData, sort]);

  const handleRemove = async (tmdbId) => {
    if (!currentUser) return;
    await LibService.toggleWatchlist(tmdbId, currentUser.id);
    setWatchlistItems(prev => prev.filter(i => i.tmdbId !== tmdbId));
  };

  const handleWatched = async (tmdbId) => {
    if (!currentUser) return;
    await LibService.toggleWatched(tmdbId, currentUser.id);
    await LibService.toggleWatchlist(tmdbId, currentUser.id);
    setWatchlistItems(prev => prev.filter(i => i.tmdbId !== tmdbId));
  };

  if (!currentUser) {
    return (
      <div className="container page-enter" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Bookmark size={48} color="var(--gold)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '1rem', color: 'var(--text-primary)' }}>My Watchlist</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Save movies you want to watch later. Please log in to access your watchlist.</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Log In</button>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '48px 24px 32px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to bottom, rgba(220,182,91,0.03), transparent)' }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Bookmark size={28} color="var(--gold)" />
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--text-primary)' }}>My Watchlist</h1>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 13 }}>
                {watchlistItems.length} {watchlistItems.length === 1 ? 'movie' : 'movies'} you want to watch
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link to="/library" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={14} /> Full Library
              </Link>
              <select className="input" value={sort} onChange={e => setSort(e.target.value)} style={{ fontSize: 12, background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                <option value="dateAdded">Date Added</option>
                <option value="title">Title</option>
                <option value="year">Release Year</option>
              </select>
              <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{ padding: '6px 12px', background: viewMode === 'grid' ? 'var(--gold-faint)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--gold)' : 'var(--text-muted)' }}
                  title="Grid view"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{ padding: '6px 12px', background: viewMode === 'list' ? 'var(--gold-faint)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? 'var(--gold)' : 'var(--text-muted)' }}
                  title="List view"
                >
                  <ListIcon size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ maxWidth: 1200, padding: '32px 24px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} style={{ marginBottom: 12 }} />
            <p>Loading your watchlist…</p>
          </div>
        ) : watchlistItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
            <Bookmark size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 8 }}>Your watchlist is empty</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13 }}>Browse the global movie archive and save movies you want to watch later.</p>
            <button className="btn btn-primary" onClick={() => navigate('/discover')}>Explore Movies</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {sortedItems.map(item => {
              const movie = moviesData[item.tmdbId];
              if (!movie) return (
                <div key={item.tmdbId} style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Film size={24} color="var(--text-muted)" />
                </div>
              );
              return (
                <div key={item.tmdbId} style={{ position: 'relative' }}>
                  <GlobalMovieCard movie={movie} />
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    <button
                      className="btn btn-sm"
                      style={{ flex: 1, fontSize: 10, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                      onClick={() => handleWatched(item.tmdbId)}
                      title="Mark as watched"
                    >
                      <Check size={12} /> Watched
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 8px' }}
                      onClick={() => handleRemove(item.tmdbId)}
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List view
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedItems.map(item => {
              const movie = moviesData[item.tmdbId];
              return (
                <div key={item.tmdbId} style={{ display: 'flex', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '12px 16px', alignItems: 'center' }}>
                  {movie?.posterUrl && (
                    <img src={movie.posterUrl} alt={movie.title} style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/movie/tmdb-${item.tmdbId}`} style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}>
                      {movie?.title || item.tmdbId}
                    </Link>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {movie?.releaseYear} {movie?.language && `· ${movie.language}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-sm" style={{ fontSize: 11, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }} onClick={() => handleWatched(item.tmdbId)}>
                      <Check size={12} /> Watched it!
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => handleRemove(item.tmdbId)} title="Remove" style={{ color: 'var(--text-muted)' }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
