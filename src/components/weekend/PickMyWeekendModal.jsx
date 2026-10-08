import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Dices, Star, ArrowRight, Bookmark, Heart, Film, Tv, RotateCcw, Plus } from 'lucide-react';
import {
  getGenreOptions,
  addGenreOption,
  deleteGenreOption,
  getRandomTitleFromAll,
  getRandomTitleFromAllAsync,
} from '../../services/weekendPickService';
import { toggleWatchlist, toggleFavorite, getMovieStatusSync } from '../../services/movieLibraryService';
import { useApp } from '../../AppContext';

const LANGUAGES = [
  { id: 'all', label: 'All Languages', emoji: '🌐' },
  { id: 'te', label: 'Telugu', emoji: '🎬' },
  { id: 'hi', label: 'Hindi', emoji: '🎭' },
  { id: 'ta', label: 'Tamil', emoji: '🎪' },
  { id: 'ml', label: 'Malayalam', emoji: '🌴' },
  { id: 'kn', label: 'Kannada', emoji: '🌟' },
  { id: 'en', label: 'English', emoji: '🗽' },
  { id: 'ko', label: 'Korean', emoji: '🇰🇷' },
  { id: 'ja', label: 'Japanese', emoji: '🇯🇵' },
];

const ROULETTE_PREFS_KEY = 'cinemascope_roulette_preferences';

function getStoredPreferences() {
  try {
    const raw = localStorage.getItem(ROULETTE_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        languages: Array.isArray(parsed.languages) && parsed.languages.length > 0 ? parsed.languages : ['all'],
        genres: Array.isArray(parsed.genres) && parsed.genres.length > 0 ? parsed.genres : ['all'],
        type: parsed.type || 'ANY',
      };
    }
  } catch (e) {}
  return { languages: ['all'], genres: ['all'], type: 'ANY' };
}

function saveStoredPreferences(prefs) {
  try {
    localStorage.setItem(ROULETTE_PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {}
}

export default function PickMyWeekendModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { state } = useApp();
  const currentUser = state.currentUser;

  const [genres, setGenres] = useState(() => getGenreOptions());
  const [selectedLanguages, setSelectedLanguages] = useState(() => getStoredPreferences().languages);
  const [selectedGenres, setSelectedGenres] = useState(() => getStoredPreferences().genres);
  const [selectedType, setSelectedType] = useState(() => getStoredPreferences().type);
  const [seenTitleIds, setSeenTitleIds] = useState([]);
  const [result, setResult] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState({});
  const [noMatchNotice, setNoMatchNotice] = useState(null);
  const [customGenreInput, setCustomGenreInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGenres(getGenreOptions());
      const stored = getStoredPreferences();
      setSelectedLanguages(stored.languages);
      setSelectedGenres(stored.genres);
      setSelectedType(stored.type);
      setSeenTitleIds([]);
      setResult(null);
      setIsSpinning(false);
      setNoMatchNotice(null);
    }
  }, [isOpen]);

  const handleTypeChange = (newType) => {
    setSelectedType(newType);
    setSeenTitleIds([]);
    setNoMatchNotice(null);
    saveStoredPreferences({ languages: selectedLanguages, genres: selectedGenres, type: newType });
  };

  const handleLanguageToggle = (langId) => {
    setSeenTitleIds([]);
    setNoMatchNotice(null);
    setSelectedLanguages(prev => {
      let next;
      if (langId === 'all') {
        next = ['all'];
      } else {
        const withoutAll = prev.filter(l => l !== 'all');
        if (withoutAll.includes(langId)) {
          next = withoutAll.filter(l => l !== langId);
          if (next.length === 0) next = ['all'];
        } else {
          next = [...withoutAll, langId];
        }
      }
      saveStoredPreferences({ languages: next, genres: selectedGenres, type: selectedType });
      return next;
    });
  };

  const handleGenreToggle = (genreId) => {
    setSeenTitleIds([]);
    setNoMatchNotice(null);
    setSelectedGenres(prev => {
      let next;
      if (genreId === 'all') {
        next = ['all'];
      } else {
        const withoutAll = prev.filter(g => g !== 'all');
        if (withoutAll.includes(genreId)) {
          next = withoutAll.filter(g => g !== genreId);
          if (next.length === 0) next = ['all'];
        } else {
          next = [...withoutAll, genreId];
        }
      }
      saveStoredPreferences({ languages: selectedLanguages, genres: next, type: selectedType });
      return next;
    });
  };

  const handleResetFilters = () => {
    setSelectedLanguages(['all']);
    setSelectedGenres(['all']);
    setSelectedType('ANY');
    setSeenTitleIds([]);
    setNoMatchNotice(null);
    saveStoredPreferences({ languages: ['all'], genres: ['all'], type: 'ANY' });
  };

  const handleAddCustomGenre = (e) => {
    if (e) e.preventDefault();
    const trimmed = customGenreInput.trim();
    if (!trimmed) return;

    const existing = genres.find(g => g.name.toLowerCase() === trimmed.toLowerCase() || g.id.toLowerCase() === trimmed.toLowerCase());
    let genreIdToSelect;

    if (existing) {
      genreIdToSelect = existing.id;
    } else {
      try {
        const added = addGenreOption({
          name: trimmed,
          emoji: '✨',
          color: '#eab308',
        });
        setGenres(getGenreOptions());
        genreIdToSelect = added.id;
      } catch (err) {
        const added = addGenreOption({
          id: `custom-${Date.now()}`,
          name: trimmed,
          emoji: '✨',
          color: '#eab308',
        });
        setGenres(getGenreOptions());
        genreIdToSelect = added.id;
      }
    }

    setSelectedGenres(prev => {
      const withoutAll = prev.filter(g => g !== 'all');
      const next = withoutAll.includes(genreIdToSelect) ? withoutAll : [...withoutAll, genreIdToSelect];
      saveStoredPreferences({ languages: selectedLanguages, genres: next, type: selectedType });
      return next;
    });

    setCustomGenreInput('');
    setShowCustomInput(false);
    setSeenTitleIds([]);
    setNoMatchNotice(null);
  };

  const handleDeleteCustomGenre = (gId, e) => {
    if (e) e.stopPropagation();
    try {
      deleteGenreOption(gId);
      setGenres(getGenreOptions());
      setSelectedGenres(prev => {
        const next = prev.filter(g => g !== gId);
        const final = next.length === 0 ? ['all'] : next;
        saveStoredPreferences({ languages: selectedLanguages, genres: final, type: selectedType });
        return final;
      });
    } catch (err) {
      console.warn('Could not delete genre:', err);
    }
  };

  useEffect(() => {
    const handleUpdate = () => setGenres(getGenreOptions());
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('cinemascope_genres_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('cinemascope_genres_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (result?.titleId) {
      setCurrentStatus(getMovieStatusSync(result.titleId, currentUser?.id));
    }
  }, [result, currentUser?.id]);

  if (!isOpen) return null;

  const cleanGenres = genres.filter(g => {
    const name = String(g.name || g.id).toLowerCase();
    return !['telugu', 'hindi', 'tamil', 'malayalam', 'kannada', 'english', 'korean', 'japanese'].includes(name);
  });

  const handleGenerate = async () => {
    setIsSpinning(true);
    setNoMatchNotice(null);

    try {
      let pick = await getRandomTitleFromAllAsync({
        appMovies: state.movies,
        language: selectedLanguages,
        genreId: selectedGenres,
        type: selectedType,
        excludeIds: seenTitleIds,
      });

      // If pool was exhausted with current seenTitleIds, reset seen list and retry fresh
      if (!pick && seenTitleIds.length > 0) {
        pick = await getRandomTitleFromAllAsync({
          appMovies: state.movies,
          language: selectedLanguages,
          genreId: selectedGenres,
          type: selectedType,
          excludeIds: [],
        });
        if (pick) {
          const pickedId = String(pick.titleId || pick.id);
          setSeenTitleIds([pickedId]);
        }
      } else if (pick) {
        const pickedId = String(pick.titleId || pick.id);
        setSeenTitleIds(prev => [...prev, pickedId]);
      }

      if (!pick) {
        const activeLangs = selectedLanguages.includes('all') ? null : selectedLanguages.map(id => LANGUAGES.find(l => l.id === id)?.label || id).join(', ');
        const activeGens = selectedGenres.includes('all') ? null : selectedGenres.map(id => genres.find(g => g.id === id)?.name || id).join(', ');
        setNoMatchNotice({
          languages: activeLangs,
          genres: activeGens,
          type: selectedType === 'SERIES' ? 'TV Series' : (selectedType === 'MOVIE' ? 'Movies' : 'Titles'),
        });
        setResult(null);
      } else {
        setResult(pick);
      }
    } catch (err) {
      console.error('Error picking random title:', err);
      const syncPick = getRandomTitleFromAll({
        appMovies: state.movies,
        language: selectedLanguages,
        genreId: selectedGenres,
        type: selectedType,
        excludeIds: seenTitleIds,
      });
      if (syncPick) {
        const pickedId = String(syncPick.titleId || syncPick.id);
        setSeenTitleIds(prev => [...prev, pickedId]);
        setResult(syncPick);
      } else {
        const activeLangs = selectedLanguages.includes('all') ? null : selectedLanguages.map(id => LANGUAGES.find(l => l.id === id)?.label || id).join(', ');
        const activeGens = selectedGenres.includes('all') ? null : selectedGenres.map(id => genres.find(g => g.id === id)?.name || id).join(', ');
        setNoMatchNotice({
          languages: activeLangs,
          genres: activeGens,
          type: selectedType === 'SERIES' ? 'TV Series' : (selectedType === 'MOVIE' ? 'Movies' : 'Titles'),
        });
      }
    } finally {
      setIsSpinning(false);
    }
  };


  const handleToggleWatchlist = async () => {
    if (!currentUser) return alert('Please log in to add to your watchlist');
    if (!result?.titleId) return;
    try {
      const res = await toggleWatchlist(result.titleId, currentUser.id);
      setCurrentStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentUser) return alert('Please log in to favorite');
    if (!result?.titleId) return;
    try {
      const res = await toggleFavorite(result.titleId, currentUser.id);
      setCurrentStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        maxWidth: 620,
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: 28,
        boxShadow: 'var(--shadow-card)',
        color: 'var(--text-primary)',
        position: 'relative',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: '2px solid rgba(250, 204, 21, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
            flexShrink: 0,
          }}>
            🎲
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)' }}>
                CinemaScope Discovery
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text-primary)', margin: 0 }}>
              Random Pick Roulette
            </h3>
          </div>
        </div>

        {/* Filter Configuration */}
        {!result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Specify your preferences to discover a random movie or TV series across all titles:
            </p>

            {/* Format selector */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                1. Format Preference
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'ANY', label: '🎬 Any Format' },
                  { id: 'MOVIE', label: '🍿 Movies Only' },
                  { id: 'SERIES', label: '📺 TV Series Only' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTypeChange(t.id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: 11,
                      background: selectedType === t.id ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedType === t.id ? 'var(--gold)' : 'var(--border-subtle)'}`,
                      borderRadius: 4,
                      color: selectedType === t.id ? 'var(--gold)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Language Preference */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>2. Language Preference</span>
                  {!selectedLanguages.includes('all') && (
                    <span style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'none', background: 'var(--gold-faint)', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>
                      {selectedLanguages.length} selected
                    </span>
                  )}
                </label>
                {!selectedLanguages.includes('all') && (
                  <button
                    type="button"
                    onClick={() => handleLanguageToggle('all')}
                    style={{ fontSize: 10, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Reset to All
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LANGUAGES.map(l => {
                  const isSelected = l.id === 'all'
                    ? selectedLanguages.includes('all')
                    : selectedLanguages.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleLanguageToggle(l.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 11,
                        background: isSelected ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                        borderRadius: 20,
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: isSelected ? '0 0 10px rgba(220,182,91,0.22)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{l.emoji}</span>
                      <span>{l.label}</span>
                      {isSelected && l.id !== 'all' && (
                        <span style={{ fontSize: 9, opacity: 0.85 }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Genre Preference */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>3. Genre Preference</span>
                  {!selectedGenres.includes('all') && (
                    <span style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'none', background: 'var(--gold-faint)', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>
                      {selectedGenres.length} selected
                    </span>
                  )}
                </label>
                {!selectedGenres.includes('all') && (
                  <button
                    type="button"
                    onClick={() => handleGenreToggle('all')}
                    style={{ fontSize: 10, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Reset to All
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handleGenreToggle('all')}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    background: selectedGenres.includes('all') ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedGenres.includes('all') ? 'var(--gold)' : 'var(--border-subtle)'}`,
                    borderRadius: 20,
                    color: selectedGenres.includes('all') ? 'var(--gold)' : 'var(--text-secondary)',
                    fontWeight: selectedGenres.includes('all') ? 600 : 400,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: selectedGenres.includes('all') ? '0 0 10px rgba(220,182,91,0.22)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>🎲</span>
                  <span>All Genres</span>
                </button>
                {cleanGenres.map(g => {
                  const isSelected = selectedGenres.includes(g.id);
                  const isCustom = !['action', 'comedy', 'horror', 'scifi', 'thriller', 'romance', 'animation', 'drama'].includes(g.id);
                  return (
                    <div
                      key={g.id}
                      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <button
                        type="button"
                        onClick={() => handleGenreToggle(g.id)}
                        style={{
                          padding: isCustom ? '6px 26px 6px 12px' : '6px 12px',
                          fontSize: 11,
                          background: isSelected ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                          borderRadius: 20,
                          color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: isSelected ? '0 0 10px rgba(220,182,91,0.22)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{g.emoji}</span>
                        <span>{g.name}</span>
                        {isSelected && (
                          <span style={{ fontSize: 9, opacity: 0.85 }}>✓</span>
                        )}
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomGenre(g.id, e)}
                          title={`Remove custom genre "${g.name}"`}
                          style={{
                            position: 'absolute',
                            right: 7,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'flex',
                            alignItems: 'center',
                            opacity: 0.65,
                            transition: 'opacity 0.15s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = '1'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.65'; }}
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* + Custom Genre Action Chip */}
                <button
                  type="button"
                  onClick={() => setShowCustomInput(prev => !prev)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    background: showCustomInput ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                    border: `1px dashed ${showCustomInput ? 'var(--gold)' : 'var(--gold-dim)'}`,
                    borderRadius: 20,
                    color: 'var(--gold)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: showCustomInput ? '0 0 10px rgba(220,182,91,0.22)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Plus size={12} />
                  <span>+ Custom Genre</span>
                </button>
              </div>

              {/* Inline Custom Genre Mention / Add Input Form */}
              {showCustomInput ? (
                <form
                  onSubmit={handleAddCustomGenre}
                  style={{
                    marginTop: 10,
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--gold-dim)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  <Sparkles size={14} color="var(--gold)" style={{ marginLeft: 4, flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Mention your own genre (e.g. Cyberpunk, Zombie, Slasher, Time Travel)..."
                    value={customGenreInput}
                    onChange={e => setCustomGenreInput(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontSize: 12,
                      outline: 'none',
                      padding: '6px 8px',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!customGenreInput.trim()}
                    className="btn btn-primary btn-sm"
                    style={{
                      padding: '4px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Add &amp; Select
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                    }}
                  >
                    <X size={14} />
                  </button>
                </form>
              ) : (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Looking for a specific subgenre?
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Plus size={11} /> Mention your own genre
                  </button>
                </div>
              )}
            </div>

            {noMatchNotice && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6,
                fontSize: 12,
                color: '#fca5a5',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div>
                  No {noMatchNotice.type} found
                  {noMatchNotice.languages ? ` in ${noMatchNotice.languages}` : ''}
                  {noMatchNotice.genres ? ` matching "${noMatchNotice.genres}"` : ''}.
                  Try loosening your format or filters.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('ANY')}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 4,
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    🎬 Any Format
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageToggle('all')}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 4,
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    🌐 All Languages
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenreToggle('all')}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 4,
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    🎲 All Genres
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isSpinning}
              onClick={handleGenerate}
              className="btn btn-primary"
              style={{
                marginTop: 8,
                padding: '13px 20px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                color: '#000',
                borderRadius: 6,
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                cursor: isSpinning ? 'not-allowed' : 'pointer',
              }}
            >
              <Dices size={17} style={{ animation: isSpinning ? 'spin 1s linear infinite' : 'none' }} />
              {isSpinning ? 'Finding Your Title...' : (selectedType === 'SERIES' ? '🎲 Roll Random TV Series' : (selectedType === 'MOVIE' ? '🎲 Roll Random Movie' : '🎲 Roll Random Title'))}
            </button>
          </div>
        )}

        {/* Result Screen */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(20,20,24,0.95) 100%)',
              border: '1px solid var(--gold)',
              borderRadius: 6,
              padding: 20,
              display: 'flex',
              gap: 18,
              alignItems: 'center',
              boxShadow: 'var(--shadow-gold)',
            }}>
              {result.posterUrl && (
                <img
                  src={result.posterUrl}
                  alt={result.title}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{
                    width: 105,
                    height: 155,
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '1px solid rgba(201,168,76,0.4)',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-gold" style={{ fontSize: 9, fontWeight: 700 }}>
                    {result.type === 'SERIES' ? '📺 TV SERIES' : '🍿 MOVIE'}
                  </span>
                  <span className="badge badge-dim" style={{ fontSize: 9 }}>
                    {result.genreName}
                  </span>
                  {result.language && (
                    <span className="badge badge-dim" style={{ fontSize: 9 }}>
                      {result.language}
                    </span>
                  )}
                </div>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#fff', marginBottom: 6 }}>
                  {result.title}
                </h4>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>⭐ {result.rating || 4.8} rating</span>
                  {result.releaseYear && (
                    <>
                      <span>·</span>
                      <span>{result.releaseYear}</span>
                    </>
                  )}
                  {result.language && (
                    <>
                      <span>·</span>
                      <span>{result.language}</span>
                    </>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {result.overview || 'Recommended from the Cinemascope collection based on your preferences.'}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleToggleWatchlist}
                className={`btn btn-sm ${currentStatus.watchlist ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11 }}
              >
                <Bookmark size={13} fill={currentStatus.watchlist ? 'currentColor' : 'none'} /> {currentStatus.watchlist ? 'In Watchlist' : '+ Watchlist'}
              </button>

              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`btn btn-sm ${currentStatus.favorite ? 'btn-primary' : 'btn-outline'}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
              >
                <Heart size={13} fill={currentStatus.favorite ? '#ef4444' : 'none'} color={currentStatus.favorite ? '#ef4444' : 'currentColor'} /> {currentStatus.favorite ? 'Favorited' : 'Favorite'}
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (result?.titleId) {
                    const raw = String(result.titleId).replace(/^tmdb-/, '');
                    const isTv = result.type === 'SERIES' || raw.startsWith('tv-');
                    const cleanId = raw.replace(/^tv-/, '');
                    const formattedUrl = isTv ? `tmdb-tv-${cleanId}` : `tmdb-${cleanId}`;
                    navigate(`/movie/${formattedUrl}`);
                  }
                }}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
              >
                View Title <ArrowRight size={13} />
              </button>
            </div>

            {/* Quick Roll Again or Filter Adjust */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 4 }}>
              <button
                type="button"
                disabled={isSpinning}
                onClick={handleGenerate}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '8px 16px' }}
              >
                <Dices size={14} style={{ animation: isSpinning ? 'spin 1s linear infinite' : 'none' }} />
                {isSpinning ? 'Rolling...' : (result.type === 'SERIES' ? '🎲 Roll Another Series' : '🎲 Roll Another Movie')}
              </button>

              <button
                type="button"
                onClick={() => setResult(null)}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
              >
                <RotateCcw size={13} /> Change Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
