import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Plus,
  Film,
  Tv,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Star,
  Globe
} from 'lucide-react';
import { searchTmdbMulti, searchTmdbMovies, searchTmdbTv, fetchTrendingMovies, fetchTrendingTv } from '../../services/tmdbService';
import { addCandidateToRound } from '../../services/weekendPickService';
import { useApp } from '../../AppContext';

export default function UserAddCandidateModal({
  isOpen,
  onClose,
  roundId,
  genreId,
  genreName = 'Genre',
  existingCandidates = [],
  onCandidateAdded
}) {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('tmdb'); // 'tmdb' | 'manual'
  const [mediaFilter, setMediaFilter] = useState('all'); // 'all' | 'movie' | 'tv'
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Manual fallback form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualType, setManualType] = useState('MOVIE');
  const [manualYear, setManualYear] = useState(new Date().getFullYear());
  const [manualLanguage, setManualLanguage] = useState('English');
  const [manualRating, setManualRating] = useState('4.5');
  const [manualPosterUrl, setManualPosterUrl] = useState('');
  const [manualOverview, setManualOverview] = useState('');

  const searchTimeoutRef = useRef(null);

  // Pre-fetch suggestions when modal opens
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedItem(null);
      setErrorMessage('');
      setSuccessMessage('');
      setActiveTab('tmdb');
      return;
    }

    let isCancelled = false;
    const loadInitialSuggestions = async () => {
      setSearching(true);
      try {
        const [moviesRes, tvRes] = await Promise.allSettled([
          fetchTrendingMovies('week'),
          fetchTrendingTv('week')
        ]);
        if (isCancelled) return;

        const movies = moviesRes.status === 'fulfilled' ? (moviesRes.value?.results || []).slice(0, 5) : [];
        const tv = tvRes.status === 'fulfilled' ? (tvRes.value?.results || []).slice(0, 5) : [];
        
        // Tag media types
        const taggedMovies = movies.map(m => ({ ...m, mediaType: 'movie' }));
        const taggedTv = tv.map(t => ({ ...t, mediaType: 'tv', isTv: true }));
        
        const combined = [...taggedMovies, ...taggedTv].sort(() => 0.5 - Math.random()).slice(0, 8);
        setResults(combined);
      } catch (e) {
        console.warn('Could not load trending suggestions:', e);
      } finally {
        if (!isCancelled) setSearching(false);
      }
    };

    loadInitialSuggestions();
    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Debounced search on query or mediaFilter change
  useEffect(() => {
    if (!isOpen || activeTab !== 'tmdb') return;
    if (!query || query.trim().length < 2) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      setErrorMessage('');
      try {
        let res;
        if (mediaFilter === 'movie') {
          res = await searchTmdbMovies(query.trim());
          setResults((res.results || []).map(r => ({ ...r, mediaType: 'movie' })));
        } else if (mediaFilter === 'tv') {
          res = await searchTmdbTv(query.trim());
          setResults((res.results || []).map(r => ({ ...r, mediaType: 'tv', isTv: true })));
        } else {
          res = await searchTmdbMulti(query.trim());
          const filtered = (res.results || []).filter(r => r.mediaType === 'movie' || r.mediaType === 'tv');
          setResults(filtered);
        }
      } catch (err) {
        console.error('Search failed:', err);
        setErrorMessage('Failed to search titles. Please check your connection.');
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, mediaFilter, isOpen, activeTab]);

  if (!isOpen) return null;

  // Check if a title already exists in candidate list
  const isCandidateExisting = (item) => {
    const checkTitle = (item.title || item.name || '').toLowerCase().trim();
    const rawId = String(item.tmdbId || item.id || '');
    return existingCandidates.some(c => {
      const cTitle = (c.title || '').toLowerCase().trim();
      const cId = String(c.titleId || c.id || '');
      return (checkTitle && cTitle === checkTitle) || (rawId && cId.includes(rawId));
    });
  };

  const handleAddFromTmdb = async (item) => {
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const isTv = item.mediaType === 'tv' || !!item.isTv;
      const movieData = {
        id: item.tmdbId || item.id,
        tmdbId: item.tmdbId || item.id,
        title: item.title || item.name,
        type: isTv ? 'SERIES' : 'MOVIE',
        isTv,
        mediaType: isTv ? 'tv' : 'movie',
        releaseYear: item.releaseYear || (item.releaseDate ? item.releaseDate.split('-')[0] : (item.firstAirDate ? item.firstAirDate.split('-')[0] : 2024)),
        releaseDate: item.releaseDate || item.firstAirDate,
        rating: item.voteAverage || (item.voteAverage10 ? item.voteAverage10 / 2 : 4.5),
        voteAverage: item.voteAverage10 || item.voteAverage,
        language: item.language || 'English',
        posterUrl: item.posterUrl,
        backdropUrl: item.backdropUrl,
        overview: item.overview || `Nominated for ${genreName}`,
      };

      const res = addCandidateToRound(roundId, genreId, movieData, currentUser);
      setSuccessMessage(`"${movieData.title}" added to ${genreName} contenders!`);
      if (onCandidateAdded) onCandidateAdded(res.newCandidate);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 900);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to add candidate. Please try again.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!manualTitle.trim()) {
      setErrorMessage('Please enter a movie or series title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const movieData = {
        id: `custom-${Date.now()}`,
        title: manualTitle.trim(),
        type: manualType,
        isTv: manualType === 'SERIES',
        mediaType: manualType === 'SERIES' ? 'tv' : 'movie',
        releaseYear: parseInt(manualYear, 10) || new Date().getFullYear(),
        rating: parseFloat(manualRating) || 4.5,
        language: manualLanguage,
        posterUrl: manualPosterUrl.trim() || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
        backdropUrl: manualPosterUrl.trim() || '',
        overview: manualOverview.trim() || `Nominated by community member for ${genreName}`,
      };

      const res = addCandidateToRound(roundId, genreId, movieData, currentUser);
      setSuccessMessage(`"${movieData.title}" added to ${genreName} contenders!`);
      if (onCandidateAdded) onCandidateAdded(res.newCandidate);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 900);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to add candidate.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card, #111418)',
          border: '1px solid var(--gold, #d4af37)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 30px rgba(212, 175, 55, 0.15)',
          overflow: 'hidden',
          animation: 'fadeIn 200ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold, #d4af37)',
              }}
            >
              <Plus size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif, "Cinzel", Georgia, serif)',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--gold, #d4af37)',
                  margin: 0,
                  letterSpacing: '0.02em',
                }}
              >
                Add Contender to {genreName}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted, #94a3b8)',
                  margin: '2px 0 0',
                }}
              >
                Nominate any movie or series to enter this weekend's community vote
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 150ms ease',
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div
          style={{
            display: 'flex',
            padding: '12px 24px 0',
            gap: 12,
            borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('tmdb')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: activeTab === 'tmdb' ? 600 : 400,
              color: activeTab === 'tmdb' ? 'var(--gold, #d4af37)' : 'var(--text-muted, #94a3b8)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'tmdb' ? '2px solid var(--gold, #d4af37)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Search size={15} />
            Search Database
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: activeTab === 'manual' ? 600 : 400,
              color: activeTab === 'manual' ? 'var(--gold, #d4af37)' : 'var(--text-muted, #94a3b8)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'manual' ? '2px solid var(--gold, #d4af37)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={15} />
            Add Custom Title
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div
            style={{
              margin: '12px 24px 0',
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 6,
              color: '#f87171',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              margin: '12px 24px 0',
              padding: '10px 14px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 6,
              color: '#4ade80',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {activeTab === 'tmdb' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Search input bar & format filter */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted, #94a3b8)',
                    }}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search any movie or web series (e.g. Inception, Mirzapur)..."
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 36px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                      borderRadius: 8,
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setResults([]);
                      }}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted, #94a3b8)',
                        cursor: 'pointer',
                        padding: 2,
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Media format toggles */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    type="button"
                    onClick={() => setMediaFilter('all')}
                    style={{
                      padding: '6px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: mediaFilter === 'all' ? 'var(--gold, #d4af37)' : 'transparent',
                      color: mediaFilter === 'all' ? '#000000' : 'var(--text-secondary, #cbd5e1)',
                      transition: 'all 120ms ease',
                    }}
                  >
                    All Formats
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaFilter('movie')}
                    style={{
                      padding: '6px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: mediaFilter === 'movie' ? 'var(--gold, #d4af37)' : 'transparent',
                      color: mediaFilter === 'movie' ? '#000000' : 'var(--text-secondary, #cbd5e1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 120ms ease',
                    }}
                  >
                    <Film size={12} />
                    Movies
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaFilter('tv')}
                    style={{
                      padding: '6px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: mediaFilter === 'tv' ? 'var(--gold, #d4af37)' : 'transparent',
                      color: mediaFilter === 'tv' ? '#000000' : 'var(--text-secondary, #cbd5e1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 120ms ease',
                    }}
                  >
                    <Tv size={12} />
                    Series
                  </button>
                </div>
              </div>

              {/* Status / Helper */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>
                  {searching ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Loader2 size={12} className="spin" /> Searching global catalog...
                    </span>
                  ) : query.trim().length >= 2 ? (
                    `Found ${results.length} results for "${query}"`
                  ) : (
                    '✨ Popular suggestions this week'
                  )}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted, #64748b)' }}>
                  Genre target: <strong>{genreName}</strong>
                </span>
              </div>

              {/* Results List */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 12,
                  maxHeight: 380,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {results.length === 0 && !searching ? (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                      border: '1px dashed rgba(255,255,255,0.1)',
                    }}
                  >
                    <Film size={28} color="var(--text-muted, #64748b)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 13, color: 'var(--text-secondary, #cbd5e1)' }}>
                      No matching titles found
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', margin: '4px 0 12px' }}>
                      Try different keywords or switch to custom entry tab to add any title manually.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 11 }}
                    >
                      + Add Custom Title
                    </button>
                  </div>
                ) : (
                  results.map((item) => {
                    const isTv = item.mediaType === 'tv' || !!item.isTv;
                    const title = item.title || item.name;
                    const year = item.releaseYear || (item.releaseDate ? item.releaseDate.split('-')[0] : (item.firstAirDate ? item.firstAirDate.split('-')[0] : ''));
                    const rating = item.voteAverage10 ? (item.voteAverage10 / 2).toFixed(1) : (item.voteAverage ? item.voteAverage.toFixed(1) : '4.5');
                    const alreadyAdded = isCandidateExisting(item);

                    return (
                      <div
                        key={`${item.mediaType || 'm'}-${item.id || item.tmdbId}`}
                        style={{
                          display: 'flex',
                          gap: 12,
                          padding: 10,
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: alreadyAdded
                            ? '1px solid rgba(212, 175, 55, 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 8,
                          alignItems: 'center',
                          transition: 'all 150ms ease',
                        }}
                      >
                        {/* Poster thumbnail */}
                        <div
                          style={{
                            width: 48,
                            height: 70,
                            borderRadius: 4,
                            overflow: 'hidden',
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            flexShrink: 0,
                          }}
                        >
                          {item.posterUrl ? (
                            <img
                              src={item.posterUrl}
                              alt={title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              loading="lazy"
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {isTv ? <Tv size={18} /> : <Film size={18} />}
                            </div>
                          )}
                        </div>

                        {/* Title details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span
                              style={{
                                fontSize: 9,
                                padding: '1px 5px',
                                borderRadius: 3,
                                background: isTv ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: isTv ? '#c084fc' : '#93c5fd',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            >
                              {isTv ? 'Series' : 'Movie'}
                            </span>
                            {year && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted, #94a3b8)' }}>
                                {year}
                              </span>
                            )}
                          </div>

                          <h4
                            style={{
                              margin: '0 0 4px',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={title}
                          >
                            {title}
                          </h4>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--gold, #d4af37)' }}>
                            <Star size={11} fill="var(--gold, #d4af37)" />
                            <span>{rating} / 5</span>
                          </div>
                        </div>

                        {/* Add button */}
                        <div>
                          {alreadyAdded ? (
                            <span
                              style={{
                                fontSize: 10,
                                color: 'var(--gold, #d4af37)',
                                background: 'rgba(212, 175, 55, 0.1)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                padding: '4px 8px',
                                borderRadius: 4,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Check size={11} /> In List
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleAddFromTmdb(item)}
                              className="btn btn-primary btn-sm"
                              style={{
                                fontSize: 11,
                                padding: '5px 10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Plus size={12} /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Manual Form */
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4, fontWeight: 600 }}>
                    TITLE *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g. Interstellar or Panchayat"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4, fontWeight: 600 }}>
                    FORMAT *
                  </label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#1a1f26',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 13,
                    }}
                  >
                    <option value="MOVIE">🎬 Movie</option>
                    <option value="SERIES">📺 TV Series</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4, fontWeight: 600 }}>
                    RELEASE YEAR
                  </label>
                  <input
                    type="number"
                    min="1920"
                    max="2030"
                    value={manualYear}
                    onChange={(e) => setManualYear(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 13,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4, fontWeight: 600 }}>
                    LANGUAGE
                  </label>
                  <select
                    value={manualLanguage}
                    onChange={(e) => setManualLanguage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#1a1f26',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 13,
                    }}
                  >
                    <option value="English">English</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Malayalam">Malayalam</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Korean">Korean</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4, fontWeight: 600 }}>
                    RATING (0-5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={manualRating}
                    onChange={(e) => setManualRating(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4, fontWeight: 600 }}>
                  POSTER IMAGE URL (OPTIONAL)
                </label>
                <input
                  type="url"
                  value={manualPosterUrl}
                  onChange={(e) => setManualPosterUrl(e.target.value)}
                  placeholder="https://image.tmdb.org/... or any direct image link"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted, #94a3b8)', marginBottom: 4, fontWeight: 600 }}>
                  SYNOPSIS / WHY SHOULD PEOPLE VOTE FOR THIS? (OPTIONAL)
                </label>
                <textarea
                  rows={3}
                  value={manualOverview}
                  onChange={(e) => setManualOverview(e.target.value)}
                  placeholder="Tell voters what makes this movie or show special..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 13,
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="spin" /> Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Add to {genreName}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer note */}
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(0,0,0,0.3)',
            borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
            fontSize: 11,
            color: 'var(--text-muted, #64748b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>🎯 Added contenders immediately become eligible for voting in <strong>{genreName}</strong></span>
          <span style={{ color: 'var(--gold, #d4af37)' }}>Powered by TMDB</span>
        </div>
      </div>
    </div>
  );
}
