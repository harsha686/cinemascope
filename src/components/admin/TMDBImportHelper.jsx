import React, { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, AlertCircle, RefreshCw, X, Check, Compass, SlidersHorizontal, Image as ImageIcon, Key } from 'lucide-react';
import {
  searchTmdbMovies,
  discoverRecentIndianMovies,
  fetchFullTmdbMovieDetails,
  testTmdbConnection,
  getCustomTmdbApiKey,
  setCustomTmdbApiKey
} from '../../services/tmdbService';

export default function TMDBImportHelper({ onImport }) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDiscoverMode, setIsDiscoverMode] = useState(false);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Custom Key Input state
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState(getCustomTmdbApiKey() || '');

  // Selected TMDB Movie details state for Poster Grid Selection
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);

  // Run diagnostics check on modal open
  useEffect(() => {
    if (showModal) {
      testTmdbConnection().then(setDiagnostics);
    }
  }, [showModal]);

  // Debounced real TMDB search handler
  useEffect(() => {
    if (isDiscoverMode) return;

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setError('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await searchTmdbMovies(trimmed, 1, 'IN');
        setResults(res.results);
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotalResults(res.totalResults);
        setIsLoading(false);
        testTmdbConnection().then(setDiagnostics);
      } catch (err) {
        setIsLoading(false);
        setError('TMDB SEARCH TEMPORARILY UNAVAILABLE. Check connection.');
        console.error('TMDB Search error:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, isDiscoverMode]);

  // Discover Recent Indian Cinema Movies
  const handleDiscoverIndianMovies = async () => {
    setIsDiscoverMode(true);
    setSearchQuery('');
    setIsLoading(true);
    setError('');
    try {
      const res = await discoverRecentIndianMovies(1);
      setResults(res.results);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotalResults(res.totalResults);
      setIsLoading(false);
      testTmdbConnection().then(setDiagnostics);
    } catch (err) {
      setIsLoading(false);
      setError('TMDB DISCOVER TEMPORARILY UNAVAILABLE.');
    }
  };

  // Save Custom Key
  const handleSaveCustomKey = () => {
    setCustomTmdbApiKey(customKeyInput);
    setShowKeyInput(false);
    testTmdbConnection().then(res => {
      setDiagnostics(res);
      if (searchQuery) {
        searchTmdbMovies(searchQuery, 1, 'IN').then(r => setResults(r.results));
      }
    });
  };

  // Load More Pages
  const handleLoadMore = async () => {
    if (page >= totalPages || isLoading) return;
    const nextPage = page + 1;
    setIsLoading(true);
    try {
      let res;
      if (isDiscoverMode) {
        res = await discoverRecentIndianMovies(nextPage);
      } else {
        res = await searchTmdbMovies(searchQuery, nextPage, 'IN');
      }
      setResults(prev => [...prev, ...res.results]);
      setPage(res.page);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  // Select movie & fetch full details + credits + multiple poster paths
  const handleSelectTmdbMovie = async (tmdbId) => {
    setIsDetailLoading(true);
    setError('');
    try {
      const fullDetails = await fetchFullTmdbMovieDetails(tmdbId);
      setSelectedMovie(fullDetails);
      setIsDetailLoading(false);
    } catch (err) {
      setIsDetailLoading(false);
      setError('Failed to fetch complete TMDB movie details.');
    }
  };

  // Confirm import with selected poster path
  const handleConfirmImport = (posterUrlOverride = null) => {
    if (!selectedMovie) return;

    const importedData = {
      ...selectedMovie,
      posterUrl: posterUrlOverride || selectedMovie.posterUrl,
      posterSource: 'TMDB',
      posterSourceType: 'OFFICIAL',
      sourcePlatform: 'TMDB',
      status: 'CURRENTLY_SHOWING',
      cities: ['visakhapatnam'],
    };

    onImport(importedData);
    setSelectedMovie(null);
    setShowModal(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setShowModal(true); setSelectedMovie(null); setSearchQuery(''); }}
        className="btn btn-outline btn-sm"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <Sparkles size={14} /> Import TMDB Metadata
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2100,
          background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            maxWidth: 820,
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-card), 0 0 50px rgba(0,0,0,0.9)',
          }}>
            
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(to bottom, rgba(220,182,91,0.05), transparent)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-gold" style={{ fontSize: 9 }}>SOURCE: TMDB REAL API</span>
                  {diagnostics && diagnostics.searchWorking && (
                    <span style={{ fontSize: 10, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 3 }}>
                      ✓ API Active
                    </span>
                  )}
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', marginTop: 4 }}>
                  TMDB Live Movie Discovery & Auto-Fill
                </h3>
              </div>

              <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Custom Key Config Panel */}
              {showKeyInput && (
                <div style={{ padding: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Key size={16} color="var(--gold)" />
                  <input
                    className="input"
                    style={{ flex: 1, fontSize: 12 }}
                    placeholder="Paste TMDB API Key e.g. a07e22bc..."
                    value={customKeyInput}
                    onChange={e => setCustomKeyInput(e.target.value)}
                  />
                  <button type="button" onClick={handleSaveCustomKey} className="btn btn-primary btn-sm">Save Key</button>
                  <button type="button" onClick={() => setShowKeyInput(false)} className="btn btn-ghost btn-sm">Cancel</button>
                </div>
              )}

              {/* STEP B: MOVIE POSTER SELECTOR GRID (If movie selected) */}
              {selectedMovie ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedMovie(null)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 8px', fontSize: 11, marginBottom: 6 }}
                      >
                        ← Back to Search Results
                      </button>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text-primary)' }}>
                        {selectedMovie.title} ({selectedMovie.releaseDate ? selectedMovie.releaseDate.split('-')[0] : ''})
                      </h3>
                      <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 2 }}>
                        {selectedMovie.language} • {selectedMovie.runtime} • Director: {selectedMovie.director}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmImport(selectedMovie.posterUrl)}
                      className="btn btn-primary"
                    >
                      <Check size={14} /> Auto-Fill All Details
                    </button>
                  </div>

                  <div style={{ padding: 16, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.1em' }}>
                      Import Summary Preview
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                      {selectedMovie.overview}
                    </p>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Cast: <span style={{ color: 'var(--text-primary)' }}>{selectedMovie.cast?.join(', ') || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Multiple Posters Grid Selection */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <ImageIcon size={16} color="var(--gold)" />
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--text-primary)' }}>
                        Select TMDB Movie Poster ({selectedMovie.postersList?.length || 0} Available)
                      </h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
                      {selectedMovie.postersList?.map((p, i) => (
                        <div key={p.id || i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                          <img src={p.posterUrl} alt="TMDB Poster Option" style={{ width: '100%', height: 210, objectFit: 'cover' }} onError={e => e.target.src='/demo-frame.jpg'} />
                          <button
                            type="button"
                            onClick={() => handleConfirmImport(p.posterUrl)}
                            className="btn btn-ghost btn-sm"
                            style={{ width: '100%', borderRadius: 0, fontSize: 10, padding: '6px', justifyContent: 'center' }}
                          >
                            Use This Poster
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                /* STEP A: SEARCH & DISCOVERY */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Search Bar & Mode Controls */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                      <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        className="input"
                        style={{ paddingLeft: 38, fontSize: 13 }}
                        placeholder="Search TMDB (e.g. Kalki, Devara, Coolie, Pushpa)..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setIsDiscoverMode(false); }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleDiscoverIndianMovies}
                      className={`btn btn-sm ${isDiscoverMode ? 'btn-primary' : 'btn-outline'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 }}
                    >
                      <Compass size={14} /> Discover Recent Indian Movies
                    </button>
                  </div>

                  {/* Mode / Results Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {isDiscoverMode ? 'Recent Indian Cinema Releases' : searchQuery ? `Real TMDB Results for "${searchQuery}" (${totalResults})` : 'Type a movie title above to search real TMDB API'}
                    </span>
                  </div>

                  {/* Errors */}
                  {error && (
                    <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Details Fetching Spinner */}
                  {isDetailLoading && (
                    <div style={{ padding: '40px 0', textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
                      <RefreshCw size={24} color="var(--gold)" style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                        Fetching full TMDB movie details, cast, director, and posters...
                      </p>
                    </div>
                  )}

                  {/* Real TMDB Results Grid */}
                  {isLoading && page === 1 ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                      <RefreshCw size={28} color="var(--gold)" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                      <p style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', fontSize: 14 }}>
                        Searching real TMDB API...
                      </p>
                    </div>
                  ) : results.length === 0 && (searchQuery || isDiscoverMode) ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)' }}>
                      <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 4 }}>NO MOVIES FOUND</h4>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Try checking the spelling, original title, or English title.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                      {results.map(m => (
                        <div
                          key={m.tmdbId}
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {/* Real TMDB Poster */}
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: '#000' }}>
                            <img src={m.posterUrl} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.src='/demo-frame.jpg'} />
                            <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.85)', color: 'var(--gold)', fontSize: 10, fontFamily: 'var(--font-serif)', padding: '2px 6px', borderRadius: 2 }}>
                              ★ {m.voteAverage || 'N/A'}
                            </div>
                            <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 2 }}>
                              TMDB ID: {m.tmdbId}
                            </div>
                          </div>

                          {/* Info */}
                          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', flex: 1, gap: 6 }}>
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.title}
                            </div>

                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {m.releaseYear || 'TBA'} • Language: {m.language}
                            </div>

                            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {m.overview || 'No overview available.'}
                            </p>

                            <button
                              type="button"
                              onClick={() => handleSelectTmdbMovie(m.tmdbId)}
                              className="btn btn-primary btn-sm"
                              style={{ marginTop: 'auto', width: '100%', justifyContent: 'center', fontSize: 11, padding: '6px' }}
                            >
                              Select Movie
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Load More Pagination */}
                  {results.length > 0 && page < totalPages && (
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="btn btn-outline btn-sm"
                      >
                        {isLoading ? 'Loading More...' : `Load More Results (Page ${page} of ${totalPages})`}
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Diagnostic Footer */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{diagnostics?.message || 'TMDB Connection Status: Checking...'}</span>
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Configure API Key
                </button>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: 11 }}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
