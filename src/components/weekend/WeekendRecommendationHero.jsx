import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Sparkles, Star, Bookmark, Heart, Eye, ArrowRight, Dices, Share2, Flame, Lock } from 'lucide-react';
import {
  getGenreOptions,
  getWinnerForGenre,
  getActiveRound,
  calculateGenreResults,
  getUserPreferredGenre,
  setUserPreferredGenre,
  hasUserVotedInAllGenres,
  getUserVotedGenresCount,
} from '../../services/weekendPickService';
import { toggleWatchlist, toggleFavorite, toggleWatched, getMovieStatusSync } from '../../services/movieLibraryService';
import { useApp } from '../../AppContext';
import PickMyWeekendModal from './PickMyWeekendModal';
import WeekendWinnerBadge from './WeekendWinnerBadge';
import ShareButton from '../social/ShareButton';
import { SOCIAL_CONTENT_TYPES } from '../../services/socialSharingService';

export default function WeekendRecommendationHero() {
  const navigate = useNavigate();
  const { state } = useApp();
  const currentUser = state.currentUser;

  const [genres, setGenres] = useState(() => getGenreOptions());
  const [selectedGenre, setSelectedGenre] = useState(() => getUserPreferredGenre(currentUser?.id));
  const [showPickModal, setShowPickModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeRound, setActiveRound] = useState(() => getActiveRound());
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const syncData = () => {
      setActiveRound(getActiveRound());
      setGenres(getGenreOptions());
      setRevision(r => r + 1);
    };
    window.addEventListener('storage', syncData);
    window.addEventListener('focus', syncData);
    window.addEventListener('cinemascope_genres_updated', syncData);
    window.addEventListener('cinemascope_round_updated', syncData);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', syncData);
      window.removeEventListener('focus', syncData);
      window.removeEventListener('cinemascope_genres_updated', syncData);
      window.removeEventListener('cinemascope_round_updated', syncData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Synchronize preferred genre on user change or genres update
  useEffect(() => {
    if (currentUser?.id) {
      const pref = getUserPreferredGenre(currentUser.id);
      if (pref && genres.some(g => g.id === pref)) {
        setSelectedGenre(pref);
      }
    }
  }, [currentUser?.id, genres]);

  useEffect(() => {
    if (genres.length > 0 && !genres.some(g => g.id === selectedGenre)) {
      setSelectedGenre(genres[0].id);
    }
  }, [genres, selectedGenre]);

  // Update preferred genre in storage when user changes it
  const handleGenreChange = (newGenreId) => {
    setSelectedGenre(newGenreId);
    if (currentUser?.id) {
      setUserPreferredGenre(currentUser.id, newGenreId);
    }
  };

  // Find winner or leading candidate for selected genre
  let winner = null;
  let isLeading = false;

  // 1. If active round has declared winners, get winner for this round
  if (activeRound?.status === 'WINNER_DECLARED') {
    winner = getWinnerForGenre(selectedGenre, activeRound.id);
  }

  // 2. If active round is currently active/upcoming, compute the LIVE leading candidate!
  if (!winner && activeRound && (activeRound.status === 'ACTIVE' || activeRound.status === 'UPCOMING')) {
    const res = calculateGenreResults(activeRound.id, selectedGenre);
    if (res.leadingCandidate) {
      winner = {
        roundId: activeRound.id,
        roundName: activeRound.name,
        edition: activeRound.edition,
        genreId: selectedGenre,
        genreName: res.genreName,
        titleId: res.leadingCandidate.titleId,
        title: res.leadingCandidate.title,
        type: res.leadingCandidate.type || 'MOVIE',
        releaseYear: res.leadingCandidate.releaseYear,
        posterUrl: res.leadingCandidate.posterUrl,
        backdropUrl: res.leadingCandidate.backdropUrl,
        voteCount: res.leadingCandidate.totalVotes,
        votePercentage: res.leadingCandidate.votePercentage,
        totalGenreVotes: res.totalVotes,
        communityScore: Math.round((res.leadingCandidate.rating || 4.8) * 20),
        overview: res.leadingCandidate.overview,
      };
      isLeading = true;
    }
  }

  // 3. Fallback to latest declared historical winner
  if (!winner) {
    winner = getWinnerForGenre(selectedGenre);
  }

  const [status, setStatus] = useState(() => winner ? getMovieStatusSync(winner.titleId, currentUser?.id) : {});

  useEffect(() => {
    if (winner?.titleId) {
      setStatus(getMovieStatusSync(winner.titleId, currentUser?.id));
    }
  }, [winner?.titleId, selectedGenre, currentUser?.id, revision]);

  const handleToggleWatchlist = async () => {
    if (!currentUser) {
      alert('Please log in to add to your watchlist');
      return;
    }
    if (winner) {
      try {
        const res = await toggleWatchlist(winner.titleId, currentUser.id);
        setStatus(res);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      alert('Please log in to favorite');
      return;
    }
    if (winner) {
      try {
        const res = await toggleFavorite(winner.titleId, currentUser.id);
        setStatus(res);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleWatched = async () => {
    if (!currentUser) {
      alert('Please log in to track watched movies');
      return;
    }
    if (winner) {
      try {
        const res = await toggleWatched(winner.titleId, currentUser.id, {
          title: winner.title,
          posterUrl: winner.posterUrl,
        });
        setStatus(res);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formattedUrl = winner
    ? (winner.titleId?.startsWith('tmdb-') ? winner.titleId : `tmdb-${winner.titleId}`)
    : '';

  const genreObj = genres.find(g => g.id === selectedGenre) || genres[0] || { id: selectedGenre, name: selectedGenre, emoji: '🎬' };

  return (
    <section className="weekend-hero-container" style={{
      margin: '32px 0',
      background: 'linear-gradient(135deg, rgba(20,20,26,0.95) 0%, rgba(12,12,16,0.98) 100%)',
      border: '1px solid var(--border)',
      borderLeft: '4px solid var(--gold)',
      borderRadius: 'var(--radius-sm)',
      padding: '28px 24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    }}>
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute',
        top: -60,
        right: -60,
        width: 260,
        height: 260,
        background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top Header Row */}
      <div className="weekend-hero-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.08) 100%)',
            border: '1px solid var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold)',
          }}>
            <Trophy size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)', fontWeight: 700 }}>
                Community Choice
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {activeRound?.edition || 'Weekly Edition'}
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', margin: 0 }}>
              Recommended This Weekend
            </h2>
          </div>
        </div>

        {/* Action triggers & Side-wise Genre Select Menu */}
        <div className="weekend-hero-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Select Genre Menu Side-Wise */}
          <div className="weekend-genre-select-wrap" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 8px',
          }}>
            <span style={{
              fontSize: 11,
              fontFamily: 'var(--font-serif)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap'
            }}>
              Select Genre:
            </span>
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreChange(e.target.value)}
              className="input weekend-genre-select"
              style={{
                width: 'auto',
                minWidth: '135px',
                padding: '4px 10px',
                fontSize: '12px',
                fontFamily: 'var(--font-serif)',
                fontWeight: 600,
                background: '#18140e',
                color: 'var(--gold)',
                border: '1px solid var(--gold-dim)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
              }}
            >
              {genres.map(g => (
                <option key={g.id} value={g.id} style={{ background: '#18140e', color: '#ffffff' }}>
                  {g.emoji} {g.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowPickModal(true)}
            className="btn btn-outline btn-sm weekend-hero-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
          >
            <Dices size={13} /> Pick My Weekend
          </button>

          <button
            type="button"
            onClick={() => navigate('/weekend')}
            className="btn btn-primary btn-sm weekend-hero-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
          >
            <Trophy size={13} /> Vote in This Weekend's Poll →
          </button>
        </div>
      </div>

      {/* Winner Spotlight Card or Vote-Gated Teaser */}
      {(() => {
        const isAdmin = currentUser && currentUser.role === 'ADMIN';
        const hasVotedAll = currentUser && activeRound?.id
          ? hasUserVotedInAllGenres(currentUser.id, activeRound.id)
          : false;

        // If polling is active and user hasn't voted in all genres, show teaser prompt (unless admin)
        if (activeRound?.status === 'ACTIVE' && !hasVotedAll && !isAdmin) {
          const voteProgress = getUserVotedGenresCount(currentUser?.id, activeRound.id);

          return (
            <div style={{
              background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.12) 0%, rgba(15,15,20,0.95) 75%)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 8,
              padding: '36px 24px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(201,168,76,0.15)',
                border: '1px solid var(--gold)',
                color: 'var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 0 20px rgba(201,168,76,0.25)',
              }}>
                <Lock size={26} />
              </div>

              <span className="badge badge-gold" style={{ fontSize: 10, letterSpacing: '0.08em', marginBottom: 10 }}>
                🔒 COMMUNITY LEADER & WINNER HIDDEN
              </span>

              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(20px, 3vw, 26px)',
                color: 'var(--text-primary)',
                margin: '0 0 10px',
              }}>
                To know the Weekend Picker, you have to vote your favorite movie first!
              </h3>

              <p style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                maxWidth: 580,
                margin: '0 auto 20px',
                lineHeight: 1.6,
              }}>
                {currentUser ? (
                  <>
                    You've voted in <strong style={{ color: 'var(--gold)' }}>{voteProgress.votedCount}</strong> of <strong>{voteProgress.totalGenres}</strong> genres.
                    Cast your vote in all {voteProgress.totalGenres} genres to instantly unlock the live standings, poll leaders, and official recommendations!
                  </>
                ) : (
                  <>
                    Log in and vote across all 8 blockbuster genres (Sunday 9:00 PM – Friday 11:00 PM) to unlock this weekend's top community picks and current standings.
                  </>
                )}
              </p>

              {/* Progress bar */}
              {currentUser && (
                <div style={{ maxWidth: 320, margin: '0 auto 24px' }}>
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 6,
                  }}>
                    <div style={{
                      width: `${(voteProgress.votedCount / voteProgress.totalGenres) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #c9a84c, #fbbf24)',
                      borderRadius: 4,
                      transition: 'width 300ms ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {voteProgress.remainingCount} more genre{voteProgress.remainingCount === 1 ? '' : 's'} needed to unlock
                  </div>
                </div>
              )}

              <div className="weekend-teaser-actions" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate('/weekend')}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', fontSize: 13, fontWeight: 700 }}
                >
                  <Trophy size={16} /> Vote Your Favorite Movie First →
                </button>
                <button
                  type="button"
                  onClick={() => setShowPickModal(true)}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 13 }}
                >
                  <Dices size={15} /> 🎲 Pick My Weekend
                </button>
              </div>
            </div>
          );
        }

        if (winner) {
          return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(120px, 160px) 1fr',
              gap: 24,
              alignItems: 'center',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: 18,
            }} className="weekend-winner-spotlight">
              {/* Poster */}
              <div
                className="spotlight-poster-wrap"
                onClick={() => navigate(`/movie/${formattedUrl}`)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <img
                  src={winner.posterUrl}
                  alt={winner.title}
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '1px solid rgba(201,168,76,0.3)',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
                  }}
                  onError={e => { e.target.src = '/demo-frame.jpg'; }}
                />
              </div>

              {/* Details */}
              <div className="spotlight-content-wrap">
                <div className="spotlight-badges-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  {isLeading ? (
                    <span className="badge" style={{ background: 'linear-gradient(135deg, #c9a84c, #eab308)', color: '#000', fontWeight: 700, fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12 }}>
                      <Flame size={11} /> CURRENT POLL LEADER · {winner.genreName || genreObj.name}
                    </span>
                  ) : (
                    <WeekendWinnerBadge genreName={winner.genreName || genreObj.name} size="sm" />
                  )}
                  <span className="badge badge-dim" style={{ fontSize: 9 }}>
                    {winner.type === 'SERIES' ? '📺 TV Series' : '🎬 Movie'}
                  </span>
                  {winner.releaseYear && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {winner.releaseYear}
                    </span>
                  )}
                </div>

                <h3
                  onClick={() => navigate(`/movie/${formattedUrl}`)}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(18px, 2.5vw, 24px)',
                    color: 'var(--text-primary)',
                    margin: '0 0 8px',
                    cursor: 'pointer',
                  }}
                >
                  {winner.title}
                </h3>

                {/* Stats row */}
                <div className="spotlight-stats-row" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontWeight: 600 }}>
                    <Star size={13} fill="var(--gold)" color="var(--gold)" />
                    <span>{winner.communityScore ? `${winner.communityScore}% Community Score` : '4.8 rating'}</span>
                  </div>
                  <span>·</span>
                  <span><strong>{winner.voteCount?.toLocaleString() || '1,420'}</strong> votes {winner.votePercentage ? `(${winner.votePercentage}%)` : ''}</span>
                  <span>·</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {isLeading ? `Leading in ${winner.genreName || genreObj.name}` : `Crowned in ${winner.genreName || genreObj.name}`}
                  </span>
                </div>

                <p style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.55,
                  marginBottom: 16,
                  maxWidth: 680,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {winner.overview || 'Voted by the community as the standout pick for this weekend. Verified and recommended by Cinemascope.'}
                </p>

                {/* Action Bar */}
                <div className="spotlight-actions-row" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/movie/${formattedUrl}`)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
                  >
                    View Details <ArrowRight size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleWatchlist}
                    className={`btn btn-sm ${status.watchlist ? 'btn-primary' : 'btn-outline'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
                  >
                    <Bookmark size={12} fill={status.watchlist ? 'currentColor' : 'none'} />
                    {status.watchlist ? 'In Watchlist' : '+ Watchlist'}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className={`btn btn-sm ${status.favorite ? 'btn-primary' : 'btn-outline'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
                  >
                    <Heart size={12} fill={status.favorite ? '#ef4444' : 'none'} color={status.favorite ? '#ef4444' : 'currentColor'} />
                    {status.favorite ? 'Favorited' : 'Favorite'}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleWatched}
                    className={`btn btn-sm ${status.watched ? 'btn-primary' : 'btn-outline'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
                  >
                    <Eye size={12} />
                    {status.watched ? 'Watched' : 'Mark Watched'}
                  </button>

                  {/* Aesthetic Weekend Winner Share Button */}
                  <ShareButton
                    contentType={SOCIAL_CONTENT_TYPES.WEEKEND_WINNER}
                    data={winner}
                    variant="ghost"
                    size="sm"
                    customLabel="✨ Share Pick"
                  />
                </div>
              </div>
            </div>
          );
        }

        return (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No winner declared yet for {genreObj.name}. Be the first to vote!</p>
            <button onClick={() => navigate('/weekend')} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
              Vote in {genreObj.name} Now
            </button>
          </div>
        );
      })()}

      {/* Pick My Weekend Modal */}
      <PickMyWeekendModal
        isOpen={showPickModal}
        onClose={() => setShowPickModal(false)}
      />
    </section>
  );
}
