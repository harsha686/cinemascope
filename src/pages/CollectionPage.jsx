import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Folder, Edit2, Trash2, Check, X, ArrowLeft, Plus, Share2, Bookmark, Globe, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext';
import * as LibService from '../services/movieLibraryService';
import { fetchFullTmdbMovieDetails, searchTmdbMovies } from '../services/tmdbService';
import GlobalMovieCard from '../components/discovery/GlobalMovieCard';
import ShareButton from '../components/social/ShareButton';
import SocialMetaTags from '../components/social/SocialMetaTags';
import ShareCollectionModal from '../components/library/ShareCollectionModal';
import { SOCIAL_CONTENT_TYPES } from '../services/socialSharingService';

function AddMoviesModal({ collection, onClose, onCollectionUpdated, userId }) {
  const [query, setQuery] = useState('');
  const [libraryMovies, setLibraryMovies] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibraryMovies();
  }, [userId]);

  const loadLibraryMovies = async () => {
    setLoading(true);
    try {
      const lib = await LibService.getLibrary(userId);
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
      await LibService.removeMovieFromCollection(collection.id, rawId, userId);
      onCollectionUpdated({
        ...collection,
        movie_ids: currentIds.filter(id => id !== rawId)
      });
    } else {
      await LibService.addMovieToCollection(collection.id, rawId, {
        title: movie.title,
        posterUrl: movie.posterUrl
      }, userId);
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hintUserId = searchParams.get('u');
  const encodedData = searchParams.get('d');
  
  const [collection, setCollection] = useState(null);
  const [moviesData, setMoviesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const c = await LibService.getCollectionById(collectionId, hintUserId, encodedData);
        if (!active) return;
        if (c) {
          setCollection(c);
          setEditName(c.name);
          setEditDesc(c.description || '');
        } else {
          setCollection(null);
        }
      } catch (err) {
        console.error('Error loading collection:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [collectionId, hintUserId, encodedData]);

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

  const isOwner = Boolean(
    currentUser && collection && (
      (collection.user_id && String(collection.user_id) === String(currentUser.id)) ||
      (!collection.user_id && currentUser.id === 'admin-1')
    )
  );

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    await LibService.renameCollection(collection.id, editName, editDesc, currentUser?.id);
    setCollection(prev => ({ ...prev, name: editName, description: editDesc }));
    setIsEditing(false);
  };

  const handleDeleteCollection = async () => {
    if (window.confirm(`Are you sure you want to delete the collection "${collection.name}"?`)) {
      await LibService.deleteCollection(collection.id, currentUser?.id);
      navigate('/library');
    }
  };

  const handleRemoveMovie = async (tmdbId) => {
    await LibService.removeMovieFromCollection(collection.id, tmdbId, currentUser?.id);
    setCollection(prev => ({ ...prev, movie_ids: (prev.movie_ids || []).filter(id => id !== tmdbId) }));
  };

  const handleSaveToMyLibrary = async () => {
    if (!currentUser) {
      alert('Please log in or sign up to save this collection to your personal library.');
      navigate('/login');
      return;
    }
    setSavingToLibrary(true);
    try {
      await LibService.saveSharedCollectionToMyLibrary(collection, currentUser.id);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Could not save collection to library.');
    } finally {
      setSavingToLibrary(false);
    }
  };

  if (loading && !collection) {
    return (
      <div className="container page-enter" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--gold)', fontFamily: 'var(--font-serif)', fontSize: 18 }}>
          <Folder size={24} /> Loading Collection…
        </div>
      </div>
    );
  }

  if (!collection && !loading) {
    return (
      <div className="container page-enter" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <Folder size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', marginBottom: 8 }}>
          Collection Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 460, margin: '0 auto 24px' }}>
          This collection may be private, moved, or the shared link may be invalid.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/library" className="btn btn-outline btn-sm">Go to My Library</Link>
          <Link to="/discover" className="btn btn-primary btn-sm">Explore Movies</Link>
        </div>
      </div>
    );
  }

  const moviesList = (collection.movie_ids || [])
    .map(id => {
      const cleanId = String(id).replace('tmdb-', '');
      return moviesData[id] || moviesData[`tmdb-${cleanId}`] || moviesData[cleanId] || null;
    })
    .filter(Boolean);

  const creatorDisplayName = collection.creatorName || (isOwner ? (currentUser?.displayName || 'You') : 'Cinemascope Curator');

  return (
    <div className="container page-enter" style={{ padding: '2rem 1rem' }}>
      {/* Social Metadata for Link Previews */}
      <SocialMetaTags
        contentType={SOCIAL_CONTENT_TYPES.COLLECTION}
        data={{
          id: collection.id,
          name: collection.name,
          description: collection.description,
          creatorName: creatorDisplayName,
          movies: moviesList,
        }}
      />
      
      {/* Top Breadcrumbs / Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <Link
          to={isOwner ? "/library" : "/discover"}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13 }}
        >
          <ArrowLeft size={16} /> {isOwner ? 'Back to Library' : 'Explore Movies'}
        </Link>

        {/* Public Sharing Indicator / Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-gold" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe size={11} /> PUBLIC COLLECTION
          </span>
          {!isOwner && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Curated by <strong style={{ color: 'var(--gold)' }}>{creatorDisplayName}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '2rem', position: 'relative' }}>
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
              {collection.description && <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', maxWidth: '600px', lineHeight: 1.5 }}>{collection.description}</p>}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
                {collection.movie_ids?.length || 0} movies • {collection.created_at ? `Created ${new Date(collection.created_at).toLocaleDateString()}` : 'Curated on Cinemascope'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Prominent Share Link Button */}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowShareModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
              >
                <Share2 size={14} /> Share Link
              </button>

              {/* Aesthetic Card Generator */}
              <ShareButton
                contentType={SOCIAL_CONTENT_TYPES.COLLECTION}
                data={{
                  id: collection.id,
                  name: collection.name,
                  description: collection.description,
                  creatorName: creatorDisplayName,
                  movies: moviesList,
                }}
                variant="outline"
                size="sm"
                customLabel="✨ Create Aesthetic"
              />

              {/* Viewer: Save to personal library */}
              {!isOwner && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={savingToLibrary || savedToast}
                  onClick={handleSaveToMyLibrary}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: savedToast ? '#4ade80' : 'var(--gold)',
                    borderColor: savedToast ? '#4ade80' : 'var(--gold-dim)',
                  }}
                >
                  {savedToast ? <Check size={14} /> : <Bookmark size={14} />}
                  {savedToast ? 'Saved to My Library!' : 'Save to My Collections'}
                </button>
              )}

              {/* Owner actions */}
              {isOwner && (
                <>
                  <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
                    <Edit2 size={14} /> Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAddModal(true)}>
                    <Plus size={14} /> Add Movies
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={handleDeleteCollection} style={{ color: '#ef4444' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Saved to Library Notification Toast */}
        {savedToast && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(74, 222, 128, 0.15)',
              border: '1px solid #4ade80',
              color: '#4ade80',
              padding: '6px 14px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              animation: 'fadeIn 200ms ease',
            }}
          >
            <Check size={14} />
            <span>Collection copied into your personal library!</span>
            <Link to="/library" style={{ color: '#fff', textDecoration: 'underline', marginLeft: 6 }}>
              View in Library →
            </Link>
          </div>
        )}
      </div>

      {/* Movies in Collection */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', margin: 0 }}>Movies in Collection</h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {collection.movie_ids?.length || 0} {collection.movie_ids?.length === 1 ? 'title' : 'titles'}
          </span>
        </div>
        
        {(!collection.movie_ids || collection.movie_ids.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No movies in this collection yet.</p>
            {isOwner && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>Add Movies</button>
            )}
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
                  {isOwner && (
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => handleRemoveMovie(tmdbId)} 
                      style={{ marginTop: '0.5rem', color: 'var(--text-muted)', width: '100%' }}
                    >
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Movies Modal (Owner only) */}
      {showAddModal && isOwner && (
        <AddMoviesModal
          collection={collection}
          userId={currentUser?.id}
          onClose={() => setShowAddModal(false)}
          onCollectionUpdated={(updatedCol) => setCollection(updatedCol)}
        />
      )}

      {/* Share Collection Modal */}
      {showShareModal && (
        <ShareCollectionModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          collection={collection}
          movies={moviesList}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
