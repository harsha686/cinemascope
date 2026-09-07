import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Sparkles, Star, Bookmark, Heart, Eye, ArrowRight, Dices, Share2, Flame } from 'lucide-react';
import {
  GENRE_OPTIONS,
  getWinnerForGenre,
  getActiveRound,
  calculateGenreResults,
  getUserPreferredGenre,
  setUserPreferredGenre,
} from '../../services/weekendPickService';
import { toggleWatchlist, toggleFavorite, toggleWatched, getMovieStatusSync } from '../../services/movieLibraryService';
import { useApp } from '../../AppContext';
import PickMyWeekendModal from './PickMyWeekendModal';
import SocialShareModal from './SocialShareModal';
import WeekendWinnerBadge from './WeekendWinnerBadge';

export default function WeekendRecommendationHero() {
  const navigate = useNavigate();
  const { state } = useApp();
  const currentUser = state.currentUser;

  const [selectedGenre, setSelectedGenre] = useState(() => getUserPreferredGenre(currentUser?.id));
  const [showPickModal, setShowPickModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Update preferred genre in storage when user changes it
  const handleGenreChange = (newGenreId) => {
    setSelectedGenre(newGenreId);
    if (currentUser?.id) {
      setUserPreferredGenre(currentUser.id, newGenreId);
    }
  };

  // Find winner or leading candidate for selected genre
  const activeRound = getActiveRound();
  let winner = getWinnerForGenre(selectedGenre);

  // If no declared winner yet for this round, fall back to leading candidate in active round
  let isLeading = false;
  if (!winner && activeRound) {
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

  const [status, setStatus] = useState(() => winner ? getMovieStatusSync(winner.titleId, currentUser?.id) : {});

  useEffect(() => {
    if (winner?.titleId) {
      setStatus(getMovieStatusSync(winner.titleId, currentUser?.id));
    }
  }, [winner?.titleId, selectedGenre, currentUser?.id]);

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

  const genreObj = GENRE_OPTIONS.find(g => g.id === selectedGenre) || GENRE_OPTIONS[0];

  return (
    <section style={{
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
      <div style={{
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

        {/* Action triggers */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowPickModal(true)}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
          >
            <Dices size={13} /> Pick My Weekend
          </button>

          <button
            type="button"
            onClick={() => navigate('/weekend')}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
          >
            <Trophy size={13} /> Vote in This Weekend's Poll →
          </button>
        </div>
      </div>

      {/* Genre Selector Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 14, marginBottom: 20 }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
          Select Genre:
        </span>
        {GENRE_OPTIONS.map(g => {
          const isSelected = selectedGenre === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => handleGenreChange(g.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 11,
                fontFamily: 'var(--font-serif)',
                background: isSelected ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 150ms ease',
              }}
            >
              <span>{g.emoji}</span>
              <span>{g.name}</span>
            </button>
          );
        })}
      </div>

      {/* Winner Spotlight Card */}
      {winner ? (
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <WeekendWinnerBadge genreName={winner.genreName || genreObj.name} size="sm" />
              {isLeading && (
                <span className="badge" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid #3b82f6', color: '#60a5fa', fontSize: 9 }}>
                  <Flame size={10} style={{ marginRight: 3 }} /> Current Poll Leader
                </span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)', fontWeight: 600 }}>
                <Star size={13} fill="var(--gold)" color="var(--gold)" />
                <span>{winner.communityScore ? `${winner.communityScore}% Community Score` : '4.8 rating'}</span>
              </div>
              <span>·</span>
              <span><strong>{winner.voteCount?.toLocaleString() || '12,500'}</strong> votes {winner.votePercentage ? `(${winner.votePercentage}%)` : ''}</span>
              <span>·</span>
              <span style={{ color: 'var(--text-muted)' }}>Crowned in {winner.genreName || genreObj.name}</span>
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
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

              <button
                type="button"
                title="Share Weekend Winner"
                onClick={() => setShowShareModal(true)}
                className="btn btn-ghost btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}
              >
                <Share2 size={13} /> Share
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>No winner declared yet for {genreObj.name}. Be the first to vote!</p>
          <button onClick={() => navigate('/weekend')} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
            Vote in {genreObj.name} Now
          </button>
        </div>
      )}

      {/* Pick My Weekend Modal */}
      <PickMyWeekendModal
        isOpen={showPickModal}
        onClose={() => setShowPickModal(false)}
      />

      {/* Social Share Modal */}
      {winner && (
        <SocialShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={winner.title}
          genreName={winner.genreName || genreObj.name}
          voteCount={winner.voteCount}
          votePercentage={winner.votePercentage}
          edition={winner.edition || activeRound?.edition}
          posterUrl={winner.posterUrl}
          type={winner.type}
        />
      )}
    </section>
  );
}
