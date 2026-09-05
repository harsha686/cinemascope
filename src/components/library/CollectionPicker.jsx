import React, { useState, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { getCollections, addMovieToCollection, removeMovieFromCollection, createCollection } from '../../services/movieLibraryService';

export default function CollectionPicker({ tmdbId, movieMeta, onClose }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await getCollections();
      setCollections(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (collection) => {
    try {
      const hasMovie = (collection.movie_ids || []).includes(tmdbId);
      if (hasMovie) {
        await removeMovieFromCollection(collection.id, tmdbId);
      } else {
        await addMovieToCollection(collection.id, tmdbId, movieMeta);
      }
      await loadCollections();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    
    setIsCreating(true);
    try {
      const newCol = await createCollection(newCollectionName.trim());
      if (newCol) {
        if (tmdbId) {
          await addMovieToCollection(newCol.id, tmdbId, movieMeta);
        }
        setNewCollectionName('');
        await loadCollections();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', width: '100%', maxWidth: '400px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Add to Collection</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Loading collections...</div>
          ) : collections.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px' }}>No collections yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {collections.map(col => {
                const hasMovie = (col.movie_ids || []).includes(tmdbId);
                return (
                  <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '4px', backgroundColor: hasMovie ? 'rgba(255,215,0,0.1)' : 'transparent' }}>
                    <input 
                      type="checkbox" 
                      style={{ display: 'none' }} 
                      checked={hasMovie} 
                      onChange={() => handleToggle(col)} 
                    />
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `1px solid ${hasMovie ? 'var(--gold)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: hasMovie ? 'var(--gold)' : 'transparent' }}>
                      {hasMovie && <Check size={14} color="#000" />}
                    </div>
                    <span style={{ color: hasMovie ? 'var(--gold)' : 'var(--text-primary)' }}>{col.name}</span>
                  </label>
                );
              })}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="input" 
                style={{ flex: 1 }}
                placeholder="New collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
              <button type="submit" className="btn btn-outline" disabled={isCreating || !newCollectionName.trim()}>
                <Plus size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
