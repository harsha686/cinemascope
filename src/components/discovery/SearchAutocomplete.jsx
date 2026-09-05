import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { searchTmdbMovies } from '../../services/tmdbService';

export default function SearchAutocomplete({ placeholder = 'Search movies...', onSelectMovie, onSelect, className = '' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const callback = onSelectMovie || onSelect;

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
      const list = Array.isArray(data) ? data : (data?.results || []);
      setResults(list.slice(0, 8));
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
    if (callback) callback(movie);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} className={className}>
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input"
          style={{
            width: '100%',
            paddingLeft: '42px',
            paddingRight: '14px',
            height: '46px',
            fontSize: '15px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)'
          }}
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
          maxHeight: '420px',
          overflowY: 'auto',
          zIndex: 100,
          boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
        }}>
          {isLoading ? (
            <div style={{ padding: '18px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Searching global archive...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: '18px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>No results found</div>
          ) : (
            results.map(movie => (
              <div
                key={movie.id || movie.tmdbId}
                onClick={() => handleSelect(movie)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  gap: '12px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ width: '42px', height: '62px', backgroundColor: 'var(--bg)', flexShrink: 0, borderRadius: '2px', overflow: 'hidden' }}>
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--text-muted)' }}>No Poster</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>
                    {movie.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '3px' }}>
                    {movie.releaseYear && <span>{movie.releaseYear}</span>}
                    {movie.language && <span style={{ textTransform: 'uppercase', background: 'rgba(255,255,255,0.06)', padding: '0 4px', borderRadius: '2px', fontSize: '10px' }}>{movie.language}</span>}
                    {movie.voteAverage > 0 && <span style={{ color: 'var(--gold)' }}>★ {movie.voteAverage}</span>}
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
