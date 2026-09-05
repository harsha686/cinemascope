import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { searchTmdbMovies } from '../../services/tmdbService';

export default function SearchAutocomplete({ placeholder = 'Search movies...', onSelectMovie, className = '' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      if (e.key === 'Enter' && isOpen && results.length > 0) {
        handleSelect(results[0]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async () => {
    setIsLoading(true);
    setIsOpen(true);
    try {
      const data = await searchTmdbMovies(query);
      setResults(data.slice(0, 8));
    } catch (error) {
      console.error('Search error', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (movie) => {
    setQuery('');
    setIsOpen(false);
    if (onSelectMovie) onSelectMovie(movie);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '400px' }} className={className}>
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input"
          style={{ width: '100%', paddingLeft: '40px' }}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim().length >= 2) setIsOpen(true); }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 50
        }}>
          {isLoading ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>No results found</div>
          ) : (
            results.map(movie => (
              <div
                key={movie.id || movie.tmdbId}
                onClick={() => handleSelect(movie)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  gap: '12px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ width: '40px', height: '60px', backgroundColor: 'var(--bg)', flexShrink: 0 }}>
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>No img</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                    <span>{movie.releaseYear || ''}</span>
                    <span style={{ textTransform: 'uppercase' }}>{movie.language || ''}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
