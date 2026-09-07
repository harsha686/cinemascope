import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Star, Check, Bookmark, Heart, Eye, ArrowUpRight, Flame } from 'lucide-react';
import { toggleWatchlist, toggleFavorite, toggleWatched, getMovieStatusSync } from '../../services/movieLibraryService';
import { useApp } from '../../AppContext';

export default function CandidateVoteCard({
  candidate,
  genreId,
  hasVotedInGenre = false,
  userVotedCandidateId = null,
  onVote,
  isRoundActive = true,
  showLiveResults = true,
  rank = null,
}) {
  const navigate = useNavigate();
  const { state } = useApp();
  const currentUser = state.currentUser;

  const isUserPick = userVotedCandidateId === candidate.id || userVotedCandidateId === candidate.titleId;
  const isLeader = rank === 1;

  const [status, setStatus] = useState(() => getMovieStatusSync(candidate.titleId, currentUser?.id));

  useEffect(() => {
    if (candidate?.titleId) {
      setStatus(getMovieStatusSync(candidate.titleId, currentUser?.id));
    }
  }, [candidate?.titleId, currentUser?.id]);

  const handleToggleWatchlist = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('Please log in to add to your watchlist');
      return;
    }
    try {
      const res = await toggleWatchlist(candidate.titleId, currentUser.id);
      setStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('Please log in to favorite');
      return;
    }
    try {
      const res = await toggleFavorite(candidate.titleId, currentUser.id);
      setStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWatched = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      alert('Please log in to track watched movies');
      return;
    }
    try {
      const res = await toggleWatched(candidate.titleId, currentUser.id, {
        title: candidate.title,
        posterUrl: candidate.posterUrl,
      });
      setStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  const formattedUrl = candidate.titleId?.startsWith('tmdb-') || candidate.titleId?.startsWith('tt')
    ? candidate.titleId
    : `tmdb-${candidate.titleId}`;

  return (
    <div style={{
      background: isUserPick
        ? 'linear-gradient(135deg, rgba(201,168,76,0.14) 0%, var(--bg-card) 100%)'
        : 'var(--bg-card)',
      border: isUserPick
        ? '1px solid var(--gold)'
        : isLeader
        ? '1px solid rgba(201,168,76,0.4)'
        : '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-sm)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'all 200ms ease',
      position: 'relative',
      boxShadow: isUserPick ? '0 0 15px rgba(201,168,76,0.2)' : 'none',
    }}>
      {/* Top badges */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '3px 7px',
            borderRadius: 3,
            background: candidate.type === 'SERIES' ? 'rgba(168,85,247,0.85)' : 'rgba(0,0,0,0.75)',
            color: '#fff',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            {candidate.type === 'SERIES' ? '📺 TV SERIES' : '🎬 MOVIE'}
          </span>
          {candidate.language && (
            <span style={{
              fontSize: 9,
              padding: '3px 6px',
              borderRadius: 3,
              background: 'rgba(0,0,0,0.65)',
              color: 'var(--text-secondary)',
            }}>
              {candidate.language}
            </span>
          )}
        </div>

        {isLeader && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #c9a84c, #eab308)',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            boxShadow: '0 2px 8px rgba(201,168,76,0.3)',
          }}>
            <Flame size={10} /> LEADING
          </span>
        )}
      </div>

      {/* Poster image */}
      <div
        onClick={() => navigate(`/movie/${formattedUrl}`)}
        style={{
          width: '100%',
          aspectRatio: '16/9',
          maxHeight: 180,
          background: 'rgba(0,0,0,0.5)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img
          src={candidate.backdropUrl || candidate.posterUrl}
          alt={candidate.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 300ms ease',
          }}
          onError={e => {
            e.target.src = candidate.posterUrl || '/demo-frame.jpg';
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, var(--bg-card) 0%, transparent 70%)',
        }} />

        {/* Floating Poster thumbnail in corner */}
        <img
          src={candidate.posterUrl}
          alt={candidate.title}
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            width: 44,
            height: 66,
            objectFit: 'cover',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />

        <div style={{
          position: 'absolute',
          bottom: 10,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          background: 'rgba(0,0,0,0.7)',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          color: 'var(--gold)',
          fontWeight: 600,
        }}>
          <Star size={11} fill="var(--gold)" color="var(--gold)" />
          <span>{candidate.rating || 4.7}</span>
        </div>
      </div>

      {/* Content body */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <h4
              onClick={() => navigate(`/movie/${formattedUrl}`)}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 15,
                color: 'var(--text-primary)',
                margin: 0,
                cursor: 'pointer',
                lineHeight: 1.25,
              }}
            >
              {candidate.title}
            </h4>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
              {candidate.releaseYear}
            </span>
          </div>

          <p style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.45,
            margin: '6px 0 12px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {candidate.overview || 'Featured contender for this weekend\'s community pick.'}
          </p>
        </div>

        {/* Live Vote Progress Bar (if active/voted/transparent) */}
        {(showLiveResults || hasVotedInGenre) && candidate.votePercentage !== undefined && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <span>{candidate.totalVotes?.toLocaleString() || 0} votes</span>
              <span style={{ fontWeight: 700, color: isUserPick ? 'var(--gold)' : 'var(--text-primary)' }}>
                {candidate.votePercentage}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${candidate.votePercentage}%`,
                height: '100%',
                background: isUserPick
                  ? 'linear-gradient(90deg, #c9a84c, #fbbf24)'
                  : isLeader
                  ? 'linear-gradient(90deg, #60a5fa, #3b82f6)'
                  : 'rgba(255,255,255,0.25)',
                borderRadius: 3,
                transition: 'width 400ms ease',
              }} />
            </div>
          </div>
        )}

        {/* Actions row */}
        {(() => {
          const inWatchlist = Boolean(status?.watchlist || status?.inWatchlist);
          const isFavorite = Boolean(status?.favorite || status?.isFavorite);
          const isWatched = Boolean(status?.watched || status?.isWatched);

          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 4 }}>
              {/* Quick library shortcuts */}
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  title={inWatchlist ? 'In Watchlist (Click to remove)' : 'Add to Watchlist'}
                  onClick={handleToggleWatchlist}
                  style={{
                    background: inWatchlist ? 'var(--gold-faint)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${inWatchlist ? 'var(--gold)' : 'var(--border-subtle)'}`,
                    color: inWatchlist ? 'var(--gold)' : 'var(--text-muted)',
                    borderRadius: 3,
                    padding: '5px 7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bookmark size={12} fill={inWatchlist ? 'var(--gold)' : 'none'} />
                </button>

                <button
                  type="button"
                  title={isFavorite ? 'Favorited (Click to remove)' : 'Add to Favorites'}
                  onClick={handleToggleFavorite}
                  style={{
                    background: isFavorite ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isFavorite ? '#ef4444' : 'var(--border-subtle)'}`,
                    color: isFavorite ? '#ef4444' : 'var(--text-muted)',
                    borderRadius: 3,
                    padding: '5px 7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Heart size={12} fill={isFavorite ? '#ef4444' : 'none'} />
                </button>

                <button
                  type="button"
                  title={isWatched ? 'Watched (Click to remove)' : 'Mark as Watched'}
                  onClick={handleToggleWatched}
                  style={{
                    background: isWatched ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isWatched ? '#10b981' : 'var(--border-subtle)'}`,
                    color: isWatched ? '#10b981' : 'var(--text-muted)',
                    borderRadius: 3,
                    padding: '5px 7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Eye size={12} />
                </button>
              </div>

          {/* VOTE BUTTON */}
          {isUserPick ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--gold)',
              background: 'var(--gold-faint)',
              padding: '6px 12px',
              borderRadius: 3,
              border: '1px solid var(--gold)',
            }}>
              <Check size={12} /> Your Vote
            </div>
          ) : hasVotedInGenre ? (
            <div style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              padding: '6px 8px',
            }}>
              Voted for another pick
            </div>
          ) : isRoundActive ? (
            <button
              type="button"
              onClick={() => onVote(candidate)}
              className="btn btn-primary btn-sm"
              style={{
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Trophy size={12} /> Vote
            </button>
          ) : (
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Voting Closed
            </div>
          )}
        </div>
          );
        })()}
      </div>
    </div>
  );
}
