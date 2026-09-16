import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Dices, Star, ArrowRight, Bookmark, Heart, Film, Tv, RotateCcw } from 'lucide-react';
import {
  getGenreOptions,
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

export default function PickMyWeekendModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { state } = useApp();
  const currentUser = state.currentUser;

  const [genres, setGenres] = useState(() => getGenreOptions());
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedType, setSelectedType] = useState('ANY'); // ANY | MOVIE | SERIES
  const [result, setResult] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState({});
  const [noMatchNotice, setNoMatchNotice] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setGenres(getGenreOptions());
      setSelectedLanguage('all');
      setSelectedGenre('all');
      setResult(null);
      setIsSpinning(false);
      setNoMatchNotice(null);
    }
  }, [isOpen]);

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
      const pick = await getRandomTitleFromAllAsync({
        appMovies: state.movies,
        language: selectedLanguage,
        genreId: selectedGenre,
        type: selectedType,
      });

      if (!pick) {
        const gObj = genres.find(g => g.id === selectedGenre);
        const lObj = LANGUAGES.find(l => l.id === selectedLanguage);
        setNoMatchNotice({
          language: lObj?.label || (selectedLanguage !== 'all' ? selectedLanguage : null),
          genre: gObj?.name || (selectedGenre !== 'all' ? selectedGenre : null),
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
        language: selectedLanguage,
        genreId: selectedGenre,
        type: selectedType,
      });
      if (syncPick) {
        setResult(syncPick);
      } else {
        setNoMatchNotice({
          language: selectedLanguage !== 'all' ? selectedLanguage : null,
          genre: selectedGenre !== 'all' ? selectedGenre : null,
          type: selectedType,
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
                    onClick={() => setSelectedType(t.id)}
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
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                2. Language Preference
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LANGUAGES.map(l => {
                  const isSelected = selectedLanguage === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedLanguage(l.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 11,
                        background: isSelected ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                        borderRadius: 20,
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{l.emoji}</span>
                      <span>{l.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Genre Preference */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                3. Genre Preference
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setSelectedGenre('all')}
                  style={{
                    padding: '6px 12px',
                    fontSize: 11,
                    background: selectedGenre === 'all' ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedGenre === 'all' ? 'var(--gold)' : 'var(--border-subtle)'}`,
                    borderRadius: 20,
                    color: selectedGenre === 'all' ? 'var(--gold)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>🎲</span>
                  <span>All Genres</span>
                </button>
                {cleanGenres.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGenre(g.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: 11,
                      background: selectedGenre === g.id ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedGenre === g.id ? 'var(--gold)' : 'var(--border-subtle)'}`,
                      borderRadius: 20,
                      color: selectedGenre === g.id ? 'var(--gold)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{g.emoji}</span>
                    <span>{g.name}</span>
                  </button>
                ))}
              </div>
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
                  {noMatchNotice.language ? ` in ${noMatchNotice.language}` : ''}
                  {noMatchNotice.genre ? ` matching "${noMatchNotice.genre}"` : ''}.
                  Try loosening your format or filters.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => { setSelectedType('ANY'); setNoMatchNotice(null); }}
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
                    onClick={() => { setSelectedLanguage('all'); setNoMatchNotice(null); }}
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
                    onClick={() => { setSelectedGenre('all'); setNoMatchNotice(null); }}
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
                padding: '12px 20px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Dices size={16} style={{ animation: isSpinning ? 'spin 1s linear infinite' : 'none' }} />
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
