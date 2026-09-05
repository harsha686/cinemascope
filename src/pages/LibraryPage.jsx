import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Film, CheckCircle, Bookmark, Heart, BookOpen, Folder, Plus, Search, LayoutGrid, List as ListIcon, X, RefreshCw } from 'lucide-react';
import { useApp } from '../AppContext';
import * as LibService from '../services/movieLibraryService';
import { fetchFullTmdbMovieDetails } from '../services/tmdbService';
import GlobalMovieCard from '../components/discovery/GlobalMovieCard';

export default function LibraryPage() {
  const { state } = useApp();
  const currentUser = state.currentUser;
  const navigate = useNavigate();
  const { section: sectionParam } = useParams();

  const [activeSection, setActiveSection] = useState(sectionParam || 'all');
  const [library, setLibrary] = useState({});
  const [stats, setStats] = useState({ totalWatchlist: 0, totalWatched: 0, totalFavorites: 0, totalRated: 0, avgRating: 0 });
  const [collections, setCollections] = useState([]);
  const [diaryStats, setDiaryStats] = useState({ totalEntries: 0 });
  const [moviesData, setMoviesData] = useState({});
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sort, setSort] = useState('dateAdded');

  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    const [lib, s, cols, ds] = await Promise.all([
      LibService.getLibrary(),
      LibService.getLibraryStats(),
      LibService.getCollections(),
      LibService.getDiaryStats(),
    ]);
    setLibrary(lib);
    setStats(s);
    setCollections(cols);
    setDiaryStats(ds);
  }, [currentUser]);

  useEffect(() => { loadData(); }, [loadData]);

  // All tmdbIds that the user has interacted with
  const allTmdbIds = useMemo(() => Object.keys(library), [library]);

  // Items for current section
  const sectionItems = useMemo(() => {
    const entries = Object.entries(library).map(([tmdbId, status]) => ({ tmdbId, ...status }));
    switch (activeSection) {
      case 'watched': return entries.filter(i => i.watched);
      case 'watchlist': return entries.filter(i => i.watchlist);
      case 'favorites': return entries.filter(i => i.favorite);
      case 'all': return entries;
      default: return entries;
    }
  }, [library, activeSection]);

  // Filtered + sorted items
  const displayedItems = useMemo(() => {
    let items = [...sectionItems];
    if (searchQuery) {
      items = items.filter(item => {
        const m = moviesData[item.tmdbId];
        return m?.title?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    items.sort((a, b) => {
      const mA = moviesData[a.tmdbId];
      const mB = moviesData[b.tmdbId];
      if (sort === 'title' && mA && mB) return mA.title.localeCompare(mB.title);
      if (sort === 'year' && mA && mB) return (mB.releaseYear || 0) - (mA.releaseYear || 0);
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
    return items;
  }, [sectionItems, searchQuery, sort, moviesData]);

  // Fetch TMDB data for items not yet loaded
  useEffect(() => {
    const idsToFetch = displayedItems.map(i => i.tmdbId).filter(id => id && !moviesData[id]);
    if (idsToFetch.length === 0) return;
    setLoadingMovies(true);
    Promise.all([...new Set(idsToFetch)].slice(0, 20).map(id =>
      fetchFullTmdbMovieDetails(id).catch(() => null)
    )).then(results => {
      const map = {};
      results.forEach(m => { if (m) map[m.tmdbId] = m; });
      setMoviesData(prev => ({ ...prev, ...map }));
    }).finally(() => setLoadingMovies(false));
  }, [displayedItems]);

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    await LibService.createCollection(newCollectionName.trim(), newCollectionDesc);
    setShowCollectionModal(false);
    setNewCollectionName('');
    setNewCollectionDesc('');
    await loadData();
  };

  if (!currentUser) {
    return (
      <div className="container page-enter" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Film size={48} color="var(--gold)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '1rem', color: 'var(--text-primary)' }}>My Movie Library</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Build your personal movie archive. Track everything you watch, rate, and love.</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Log In</button>
      </div>
    );
  }

  const sidebarBtn = (section) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '10px 14px', borderRadius: 4,
    background: activeSection === section ? 'var(--bg-card)' : 'transparent',
    color: activeSection === section ? 'var(--gold)' : 'var(--text-secondary)',
    border: activeSection === section ? '1px solid var(--border-subtle)' : '1px solid transparent',
    textAlign: 'left', cursor: 'pointer', fontSize: 13,
    marginBottom: 4, transition: 'all 0.15s',
  });

  return (
    <div className="page-enter">
      <div style={{ padding: '40px 24px 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--text-primary)', marginBottom: 6 }}>My Movie Library</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
            {stats.totalWatched} watched · {stats.totalWatchlist} in watchlist · {stats.totalFavorites} favorites · {diaryStats.totalEntries} diary entries
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 1200, padding: '32px 24px 80px', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Sidebar */}
        <aside style={{ flex: '0 0 210px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '20px 16px', position: 'sticky', top: 80 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
            MY LIBRARY
          </div>
          <button style={sidebarBtn('all')} onClick={() => setActiveSection('all')}>
            <Film size={15} /> All Movies
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{allTmdbIds.length}</span>
          </button>
          <button style={sidebarBtn('watched')} onClick={() => setActiveSection('watched')}>
            <CheckCircle size={15} /> Watched
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{stats.totalWatched}</span>
          </button>
          <button style={sidebarBtn('watchlist')} onClick={() => setActiveSection('watchlist')}>
            <Bookmark size={15} /> Watchlist
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{stats.totalWatchlist}</span>
          </button>
          <button style={sidebarBtn('favorites')} onClick={() => setActiveSection('favorites')}>
            <Heart size={15} /> Favorites
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{stats.totalFavorites}</span>
          </button>
          <Link to="/diary" style={{ ...sidebarBtn('diary'), textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={15} /> Diary
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{diaryStats.totalEntries}</span>
          </Link>
          <button style={sidebarBtn('collections')} onClick={() => setActiveSection('collections')}>
            <Folder size={15} /> Collections
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{collections.length}</span>
          </button>

          {collections.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
              {collections.map(c => (
                <Link key={c.id} to={`/collection/${c.id}`} style={{ display: 'block', padding: '6px 8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 12, borderRadius: 3, marginBottom: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  📁 {c.name}
                </Link>
              ))}
            </div>
          )}

          <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 12, justifyContent: 'flex-start', fontSize: 12 }} onClick={() => setShowCollectionModal(true)}>
            <Plus size={13} /> New Collection
          </button>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 300 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            {activeSection !== 'collections' && (
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  placeholder="Search your library…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 32, width: '100%', fontSize: 13 }}
                />
              </div>
            )}
            {activeSection !== 'collections' && (
              <select className="input" value={sort} onChange={e => setSort(e.target.value)} style={{ fontSize: 12, minWidth: 130 }}>
                <option value="dateAdded">Date Added</option>
                <option value="title">Title A–Z</option>
                <option value="year">Release Year</option>
                <option value="rating">My Rating</option>
              </select>
            )}
            <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
              <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', background: viewMode === 'grid' ? 'var(--gold-faint)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--gold)' : 'var(--text-muted)' }}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', background: viewMode === 'list' ? 'var(--gold-faint)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? 'var(--gold)' : 'var(--text-muted)' }}>
                <ListIcon size={14} />
              </button>
            </div>
          </div>

          {/* Collections Grid */}
          {activeSection === 'collections' ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {collections.map(col => (
                  <Link key={col.id} to={`/collection/${col.id}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: 20, textDecoration: 'none', display: 'block' }}>
                    <Folder size={28} color="var(--gold)" style={{ marginBottom: 10 }} />
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{col.name}</div>
                    {col.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{col.description}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(col.movie_ids || []).length} movies</div>
                  </Link>
                ))}
                <button onClick={() => setShowCollectionModal(true)} style={{ background: 'transparent', border: '1px dashed var(--border)', borderRadius: 4, padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 120 }}>
                  <Plus size={24} color="var(--text-muted)" />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>New Collection</span>
                </button>
              </div>
              {collections.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
                  <Folder size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                  <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 8 }}>No collections yet</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13 }}>Create folders to organize your movies into personal collections.</p>
                  <button className="btn btn-primary" onClick={() => setShowCollectionModal(true)}>Create First Collection</button>
                </div>
              )}
            </div>
          ) : displayedItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
              <Film size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                {activeSection === 'all' ? 'Your library is empty' :
                 activeSection === 'watched' ? 'No movies marked as watched' :
                 activeSection === 'watchlist' ? 'Your watchlist is empty' :
                 'No favorites yet'}
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13 }}>
                Explore the global movie archive and start building your collection.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/discover')}>Explore Movies</button>
            </div>
          ) : (
            <>
              {loadingMovies && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
                  <RefreshCw size={14} /> Loading movie data…
                </div>
              )}
              {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                  {displayedItems.map(item => {
                    const movie = moviesData[item.tmdbId];
                    if (!movie) return (
                      <div key={item.tmdbId} style={{ aspectRatio: '2/3', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Film size={20} color="var(--text-muted)" />
                      </div>
                    );
                    return <GlobalMovieCard key={item.tmdbId} movie={movie} />;
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {displayedItems.map(item => {
                    const movie = moviesData[item.tmdbId];
                    return (
                      <div key={item.tmdbId} style={{ display: 'flex', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '12px 16px', alignItems: 'center' }}>
                        {movie?.posterUrl && <img src={movie.posterUrl} alt={movie.title} style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link to={`/movie/tmdb-${item.tmdbId}`} style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}>
                            {movie?.title || item.tmdbId}
                          </Link>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{movie?.releaseYear} {movie?.language && `· ${movie.language}`}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {item.watched && <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 8px', borderRadius: 10 }}>Watched</span>}
                          {item.favorite && <span style={{ fontSize: 10, background: 'rgba(220,182,91,0.12)', color: 'var(--gold)', border: '1px solid var(--gold-dim)', padding: '2px 8px', borderRadius: 10 }}>Favorite</span>}
                          {item.rating && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>★ {item.rating}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* New Collection Modal */}
      {showCollectionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, padding: 32, width: '100%', maxWidth: 420, margin: '0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>New Collection</h3>
              <button onClick={() => setShowCollectionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCollection}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Best Sci-Fi, Weekend Movies…"
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  style={{ width: '100%' }}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Description (optional)</label>
                <textarea
                  className="input"
                  placeholder="What's this collection about?"
                  value={newCollectionDesc}
                  onChange={e => setNewCollectionDesc(e.target.value)}
                  style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Collection</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCollectionModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
