import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Folder, Edit2, Trash2, Check, X, ArrowLeft } from 'lucide-react';
import { useApp } from '../AppContext';
import * as LibService from '../services/movieLibraryService';
import { fetchFullTmdbMovieDetails } from '../services/tmdbService';
import GlobalMovieCard from '../components/discovery/GlobalMovieCard';

export default function CollectionPage() {
  const { currentUser } = useApp();
  const { collectionId } = useParams();
  const navigate = useNavigate();
  
  const [collection, setCollection] = useState(null);
  const [moviesData, setMoviesData] = useState({});
  const [loading, setLoading] = useState(true);
  
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
    if (!collection) return;
    
    const fetchMovies = async () => {
      const idsToFetch = collection.movie_ids.filter(id => !moviesData[id]);
      if (idsToFetch.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          idsToFetch.map(id => fetchFullTmdbMovieDetails(id).catch(() => null))
        );
        
        const newMoviesData = {};
        results.forEach(movie => {
          if (movie) newMoviesData[movie.id] = movie;
        });
        
        setMoviesData(prev => ({ ...prev, ...newMoviesData }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [collection, moviesData]);

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
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Movies in this collection</h2>
        
        {collection.movie_ids.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dashed)' }}>
            <Folder size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: 'var(--text-muted)' }} />
            <h3 style={{ marginBottom: '1rem' }}>This collection is empty</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Go to any movie page and click "Add to Collection" to put it here.</p>
            <Link to="/discover" className="btn btn-outline">Discover Movies</Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1.5rem'
          }}>
            {collection.movie_ids.map(tmdbId => {
              const movie = moviesData[tmdbId];
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
    </div>
  );
}
