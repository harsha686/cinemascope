import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Folder, Edit2, Trash2, Check, X, ArrowLeft, Plus } from 'lucide-react';
import { useApp } from '../AppContext';
import * as LibService from '../services/movieLibraryService';
import { fetchFullTmdbMovieDetails, searchTmdbMovies } from '../services/tmdbService';
import GlobalMovieCard from '../components/discovery/GlobalMovieCard';

function AddMoviesModal({ collection, onClose, onCollectionUpdated }) {
  const [query, setQuery] = useState('');
  const [libraryMovies, setLibraryMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibraryMovies();
  }, []);

  const loadLibraryMovies = async () => {
    setLoading(true);
    try {
      const lib = await LibService.getLibrary();
      const ids = Object.keys(lib);
      const movies = await Promise.all(
        ids.map(id => fetchFullTmdbMovieDetails(id).catch(() => null))
      );
      setLibraryMovies(movies.filter(Boolean));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchTmdbMovies(query);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayMovies = query.trim() ? searchResults : libraryMovies;

  const handleToggleMovie = async (movie) => {
    const rawId = String(movie.tmdbId || movie.id).replace('tmdb-', '');
    const currentIds = collection.movie_ids || [];
    const isInCol = currentIds.includes(rawId);

    if (isInCol) {
      await LibService.removeMovieFromCollection(collection.id, rawId);
      onCollectionUpdated({
        ...collection,
        movie_ids: currentIds.filter(id => id !== rawId)
      });
    } else {
      await LibService.addMovieToCollection(collection.id, rawId, {
        title: movie.title,
        posterUrl: movie.posterUrl
      });
      onCollectionUpdated({
        ...collection,
        movie_ids: [...currentIds, rawId]
      });
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', width: '100%', maxWidth: '540px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>Add Movies to "{collection.name}"</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input"
              style={{ flex: 1 }}
              placeholder="Search movies by title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
          {!query.trim() && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Showing movies from your personal library
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>Loading movies...</div>
          ) : displayMovies.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
              {query.trim() ? 'No movies found matching search.' : 'No movies found in library. Use the search bar above to find any movie.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayMovies.map(movie => {
                const rawId = String(movie.tmdbId || movie.id).replace('tmdb-', '');
                const isSelected = (collection.movie_ids || []).includes(rawId);
                return (
                  <div
                    key={rawId}
                    onClick={() => handleToggleMovie(movie)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      backgroundColor: isSelected ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      style={{ width: '36px', height: '54px', objectFit: 'cover', borderRadius: '3px', backgroundColor: '#222' }}
                      onError={(e) => { e.target.src = '/demo-frame.jpg'; }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{movie.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{movie.releaseYear || movie.releaseDate?.split('-')[0] || ''} {movie.language ? `• ${movie.language}` : ''}</div>
                    </div>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? 'var(--gold)' : 'transparent'
                    }}>
                      {isSelected && <Check size={16} color="#000" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const { currentUser } = useApp();
  const { collectionId } = useParams();
  const navigate = useNavigate();
  
  const [collection, setCollection] = useState(null);
  const [moviesData, setMoviesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      const cols = await LibService.getCollections();
      const c = cols.find(col => col.id === collectionId);
      if (c) {
        setCollection(c);
        setEditName(c.name);
        setEditDesc(c.description || '');
      } else {
        navigate('/library');
      }
      setLoading(false);
    };
    load();
  }, [collectionId, currentUser, navigate]);

  useEffect(() => {
    if (!collection || !collection.movie_ids || collection.movie_ids.length === 0) {
      setLoading(false);
      return;
    }
    
    let isSubscribed = true;
    const fetchMovies = async () => {
      const idsToFetch = collection.movie_ids.filter(id => {
        const cleanId = String(id).replace('tmdb-', '');
        return !moviesData[id] && !moviesData[`tmdb-${cleanId}`] && !moviesData[cleanId];
      });

      if (idsToFetch.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          idsToFetch.map(id => {
            const cleanId = String(id).replace('tmdb-', '');
            return fetchFullTmdbMovieDetails(cleanId).catch(() => null);
          })
        );
        
        if (!isSubscribed) return;

        const newMoviesData = {};
        results.forEach((movie, idx) => {
          const originalReqId = idsToFetch[idx];
          if (movie) {
            const cleanId = String(originalReqId).replace('tmdb-', '');
            newMoviesData[originalReqId] = movie;
            newMoviesData[`tmdb-${cleanId}`] = movie;
            newMoviesData[cleanId] = movie;
            if (movie.id) newMoviesData[movie.id] = movie;
            if (movie.tmdbId) newMoviesData[movie.tmdbId] = movie;
          }
        });
        
        setMoviesData(prev => ({ ...prev, ...newMoviesData }));
      } catch (error) {
        console.error(error);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchMovies();
    return () => { isSubscribed = false; };
  }, [collection]);

  if (!currentUser) {
    return (
      <div className="container page-enter" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Please log in to view collections.</h2>
      </div>
    );
  }

  if (!collection) return null;

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    await LibService.renameCollection(collection.id, editName, editDesc);
    setCollection(prev => ({ ...prev, name: editName, description: editDesc }));
    setIsEditing(false);
  };

  const handleDeleteCollection = async () => {
    if (window.confirm(`Are you sure you want to delete the collection "${collection.name}"?`)) {
      await LibService.deleteCollection(collection.id);
      navigate('/library');
    }
  };

  const handleRemoveMovie = async (tmdbId) => {
    await LibService.removeMovieFromCollection(collection.id, tmdbId);
    setCollection(prev => ({ ...prev, movie_ids: (prev.movie_ids || []).filter(id => id !== tmdbId) }));
  };

  return (
    <div className="container page-enter" style={{ padding: '2rem 1rem' }}>
      
      <Link to="/library" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '2rem' }}>
        <ArrowLeft size={16} /> Back to Library
      </Link>

      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        
        {isEditing ? (
          <div>
            <input 
              type="text" 
              className="input" 
              value={editName} 
              onChange={e => setEditName(e.target.value)} 
              style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem', width: '100%', maxWidth: '400px' }}
              autoFocus
            />
            <textarea 
              className="input" 
              value={editDesc} 
              onChange={e => setEditDesc(e.target.value)} 
              style={{ width: '100%', maxWidth: '600px', minHeight: '80px', marginBottom: '1rem', display: 'block' }}
              placeholder="Description..."
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit}><Check size={16} /> Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setIsEditing(false); setEditName(collection.name); setEditDesc(collection.description); }}><X size={16} /> Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <Folder size={28} color="var(--gold)" />
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0 }}>{collection.name}</h1>
              </div>
              {collection.description && <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', maxWidth: '600px' }}>{collection.description}</p>}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
                {collection.movie_ids.length} movies • Created {new Date(collection.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Add Movies
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Edit Details
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleDeleteCollection} style={{ color: 'var(--text-muted)' }}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', margin: 0, fontSize: '1.5rem' }}>Movies in this collection</h2>
          {collection.movie_ids.length > 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add Movies
            </button>
          )}
        </div>
        
        {collection.movie_ids.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dashed)' }}>
            <Folder size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--text-muted)' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>This collection is empty</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Add movies from your watched list or search for any movie to include here.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={18} /> Add Movies to Collection
              </button>
              <Link to="/discover" className="btn btn-outline">Discover Movies</Link>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1.5rem'
          }}>
            {collection.movie_ids.map(tmdbId => {
              const cleanId = String(tmdbId).replace('tmdb-', '');
              const movie = moviesData[tmdbId] || moviesData[`tmdb-${cleanId}`] || moviesData[cleanId];
              return (
                <div key={tmdbId} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {movie ? <GlobalMovieCard movie={movie} /> : <div style={{ height: '240px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>Loading...</div>}
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => handleRemoveMovie(tmdbId)} 
                    style={{ marginTop: '0.5rem', color: 'var(--text-muted)', width: '100%' }}
                  >
                    <X size={14} /> Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddMoviesModal
          collection={collection}
          onClose={() => setShowAddModal(false)}
          onCollectionUpdated={(updatedCol) => setCollection(updatedCol)}
        />
      )}
    </div>
  );
}
