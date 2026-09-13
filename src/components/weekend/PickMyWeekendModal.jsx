import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Dices, Trophy, Star, ArrowRight, Bookmark, Check, Heart, Film, Tv, RotateCcw } from 'lucide-react';
import {
  getGenreOptions,
  getRandomVotingCandidate,
  submitVote,
  hasUserVotedInGenre,
  getUserVoteInGenre,
  getActiveRound,
} from '../../services/weekendPickService';
import { toggleWatchlist, toggleFavorite, getMovieStatusSync } from '../../services/movieLibraryService';
import { useApp } from '../../AppContext';

const MOODS = [
  { id: 'any', label: 'Any Vibe', emoji: '✨' },
  { id: 'hyped', label: 'Adrenaline / High Energy', emoji: '⚡', preferredGenre: 'action' },
  { id: 'laugh', label: 'Need a Good Laugh', emoji: '😂', preferredGenre: 'comedy' },
  { id: 'spooky', label: 'Dark & Chilling', emoji: '🌙', preferredGenre: 'horror' },
  { id: 'mindblown', label: 'Mind-Bending & Epic', emoji: '🌌', preferredGenre: 'scifi' },
  { id: 'edge', label: 'Edge of My Seat', emoji: '🔥', preferredGenre: 'thriller' },
  { id: 'cozy', label: 'Warm & Emotional', emoji: '☕', preferredGenre: 'romance' },
];

export default function PickMyWeekendModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { state } = useApp();
  const currentUser = state.currentUser;

  const [genres, setGenres] = useState(() => getGenreOptions());
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedMood, setSelectedMood] = useState('any');
  const [selectedType, setSelectedType] = useState('ANY'); // ANY | MOVIE | SERIES
  const [unvotedOnly, setUnvotedOnly] = useState(false);
  const [result, setResult] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState({});
  const [votedInGenre, setVotedInGenre] = useState(false);
  const [userVotedCandidateId, setUserVotedCandidateId] = useState(null);

  const activeRound = getActiveRound();

  useEffect(() => {
    if (isOpen) {
      setGenres(getGenreOptions());
      setResult(null);
      setIsSpinning(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => setGenres(getGenreOptions());
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('cinemascope_genres_updated', handleUpdate);
    window.addEventListener('cinemascope_round_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('cinemascope_genres_updated', handleUpdate);
      window.removeEventListener('cinemascope_round_updated', handleUpdate);
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
    if (result && currentUser?.id && result.roundId && result.genreId) {
      const hasVoted = hasUserVotedInGenre(currentUser.id, result.roundId, result.genreId);
      setVotedInGenre(hasVoted);
      if (hasVoted) {
        const vote = getUserVoteInGenre(currentUser.id, result.roundId, result.genreId);
        setUserVotedCandidateId(vote?.candidateId || null);
      } else {
        setUserVotedCandidateId(null);
      }
    }
  }, [result, currentUser?.id]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsSpinning(true);

    setTimeout(() => {
      try {
        const pick = getRandomVotingCandidate({
          roundId: activeRound?.id,
          genreId: selectedGenre,
          mood: selectedMood,
          type: selectedType,
          unvotedOnly,
          userId: currentUser?.id,
        });
        setResult(pick);
      } catch (err) {
        console.error('Error picking random voting title:', err);
      } finally {
        setIsSpinning(false);
      }
    }, 350);
  };

  const handleVoteForCandidate = () => {
    if (!currentUser) return alert('Please log in to cast your vote.');
    if (!result?.roundId || !result?.genreId || !result?.id) return;
    try {
      submitVote(currentUser.id, result.roundId, result.genreId, result.id);
      setVotedInGenre(true);
      setUserVotedCandidateId(result.id);
      setResult(prev => prev ? { ...prev, votes: (prev.votes || 0) + 1 } : prev);
      window.dispatchEvent(new Event('cinemascope_vote_submitted'));
    } catch (err) {
      alert(err.message || 'Could not register vote.');
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

  const isCurrentCandidateVotedByUser = votedInGenre && userVotedCandidateId === result?.id;

  return (
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
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.05) 100%)',
            border: '1px solid var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold)',
            fontSize: 20,
          }}>
            🎲
          </div>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)' }}>
              Weekend Voting Polls
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text-primary)', margin: 0 }}>
              Random Movie / Series
            </h3>
          </div>
        </div>

        {/* Filter Configuration */}
        {!result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Specify your preferences to discover a random title competing in this weekend's active voting poll:
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

            {/* Genre selector */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                2. Voting Genre
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
                  }}
                >
                  🎲 All Genres
                </button>
                {genres.map(g => (
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
                    }}
                  >
                    {g.emoji} {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood selector (optional) */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                3. Mood / Vibe (Optional)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                {MOODS.map(m => {
                  const isSelected = selectedMood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMood(m.id)}
                      style={{
                        padding: '8px 10px',
                        fontSize: 11,
                        background: isSelected ? 'var(--gold-faint)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                        borderRadius: 4,
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        textAlign: 'left',
                      }}
                    >
                      <span>{m.emoji}</span>
                      <span style={{ fontSize: 11 }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unvoted categories toggle */}
            {currentUser && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 4 }}>
                <input
                  type="checkbox"
                  checked={unvotedOnly}
                  onChange={e => setUnvotedOnly(e.target.checked)}
                  style={{ accentColor: 'var(--gold)' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Only show titles from genres I haven't voted in yet (help me decide my vote)
                </span>
              </label>
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
              {isSpinning ? 'Rolling the Candidates...' : '🎲 Roll Random Movie'}
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
                    🗳️ VOTING CANDIDATE
                  </span>
                  <span className="badge badge-dim" style={{ fontSize: 9 }}>
                    {result.genreName}
                  </span>
                  <span className="badge badge-dim" style={{ fontSize: 9 }}>
                    {result.type === 'SERIES' ? 'TV SERIES' : 'MOVIE'}
                  </span>
                </div>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: '#fff', marginBottom: 6 }}>
                  {result.title}
                </h4>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>⭐ {result.rating || 4.8} rating</span>
                  <span>·</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{result.votes || 0} votes</span>
                  {result.rank && (
                    <>
                      <span>·</span>
                      <span>Rank #{result.rank} in {result.genreName}</span>
                    </>
                  )}
                  {result.releaseYear && (
                    <>
                      <span>·</span>
                      <span>{result.releaseYear}</span>
                    </>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {result.overview || 'Competing in this weekend\'s community vote. Cast your ballot to make it this week\'s official winner!'}
                </p>
              </div>
            </div>

            {/* Voting Action Banner */}
            {currentUser && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 4,
                border: `1px solid ${isCurrentCandidateVotedByUser ? 'rgba(74,222,128,0.4)' : 'var(--gold-dim)'}`,
                background: isCurrentCandidateVotedByUser ? 'rgba(74,222,128,0.1)' : 'rgba(201,168,76,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isCurrentCandidateVotedByUser ? '#4ade80' : 'var(--gold)' }}>
                    {isCurrentCandidateVotedByUser
                      ? '✓ You voted for this title in ' + result.genreName + '!'
                      : votedInGenre
                        ? `You have already voted in ${result.genreName}`
                        : `Ready to back ${result.title}?`}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {isCurrentCandidateVotedByUser
                      ? 'Your vote is currently counted toward the weekend standings.'
                      : votedInGenre
                        ? 'You can change your vote directly from the category poll.'
                        : `1-click cast your vote for ${result.genreName} category`}
                  </div>
                </div>

                {!votedInGenre && (
                  <button
                    type="button"
                    onClick={handleVoteForCandidate}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 11, padding: '6px 14px' }}
                  >
                    <Trophy size={13} /> Vote for This Title
                  </button>
                )}
              </div>
            )}

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
                    const formattedUrl = result.titleId.startsWith('tmdb-') ? result.titleId : `tmdb-${result.titleId}`;
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
                {isSpinning ? 'Rolling...' : '🎲 Roll Another Movie'}
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
    </div>
  );
}
