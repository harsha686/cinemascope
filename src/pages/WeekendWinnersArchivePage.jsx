import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Search, Filter, Share2, Star, ArrowRight, Bookmark, Heart, Eye, Dices, Film } from 'lucide-react';
import {
  getAllWinners,
  getHistoricalWinners,
  GENRE_OPTIONS,
} from '../services/weekendPickService';
import { toggleWatchlist, toggleFavorite, toggleWatched, getMovieStatusSync } from '../services/movieLibraryService';
import { useApp } from '../AppContext';
import SocialShareModal from '../components/weekend/SocialShareModal';
import PickMyWeekendModal from '../components/weekend/PickMyWeekendModal';
import WeekendWinnerBadge from '../components/weekend/WeekendWinnerBadge';

function WinnerArchiveCard({ winner, onShare }) {
  const navigate = useNavigate();
  const { state } = useApp();
  const currentUser = state.currentUser;

  const [status, setStatus] = useState(() => getMovieStatusSync(winner.titleId, currentUser?.id));

  useEffect(() => {
    if (winner?.titleId) {
      setStatus(getMovieStatusSync(winner.titleId, currentUser?.id));
    }
  }, [winner?.titleId, currentUser?.id]);

  const handleToggleWatchlist = async (e) => {
    e.stopPropagation();
    if (!currentUser) return alert('Please log in to track watchlist');
    try {
      const res = await toggleWatchlist(winner.titleId, currentUser.id);
      setStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!currentUser) return alert('Please log in to favorite');
    try {
      const res = await toggleFavorite(winner.titleId, currentUser.id);
      setStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWatched = async (e) => {
    e.stopPropagation();
    if (!currentUser) return alert('Please log in to track watched');
    try {
      const res = await toggleWatched(winner.titleId, currentUser.id, {
        title: winner.title,
        posterUrl: winner.posterUrl,
      });
      setStatus(res);
    } catch (err) {
      console.error(err);
    }
  };

  const formattedUrl = winner.titleId?.startsWith('tmdb-') ? winner.titleId : `tmdb-${winner.titleId}`;

  return (
    <div
      onClick={() => navigate(`/movie/${formattedUrl}`)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Poster */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3', background: 'rgba(0,0,0,0.4)' }}>
        <img
          src={winner.posterUrl}
          alt={winner.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = '/demo-frame.jpg'; }}
        />
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span className="badge badge-gold" style={{ fontSize: 9 }}>
            🏆 {winner.genreName}
          </span>
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span className="badge badge-dim" style={{ fontSize: 9 }}>
            {winner.type === 'SERIES' ? 'TV SERIES' : 'MOVIE'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>
            {winner.roundName || winner.edition || 'Weekend Pick'}
          </div>
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            {winner.title}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>⭐ {winner.communityScore ? `${winner.communityScore}%` : '4.8'}</span>
            <span>·</span>
            <span>{winner.voteCount?.toLocaleString() || 1200} votes</span>
            {winner.releaseYear && <span>· {winner.releaseYear}</span>}
          </div>
        </div>

        {/* Action Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 6 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              title="Watchlist"
              onClick={handleToggleWatchlist}
              style={{
                background: status.watchlist ? 'var(--gold-faint)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${status.watchlist ? 'var(--gold)' : 'var(--border-subtle)'}`,
                color: status.watchlist ? 'var(--gold)' : 'var(--text-muted)',
                padding: '4px 6px',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              <Bookmark size={12} fill={status.watchlist ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              title="Favorite"
              onClick={handleToggleFavorite}
              style={{
                background: status.favorite ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${status.favorite ? '#ef4444' : 'var(--border-subtle)'}`,
                color: status.favorite ? '#ef4444' : 'var(--text-muted)',
                padding: '4px 6px',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              <Heart size={12} fill={status.favorite ? '#ef4444' : 'none'} />
            </button>
            <button
              type="button"
              title="Watched"
              onClick={handleToggleWatched}
              style={{
                background: status.watched ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${status.watched ? '#10b981' : 'var(--border-subtle)'}`,
                color: status.watched ? '#10b981' : 'var(--text-muted)',
                padding: '4px 6px',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              <Eye size={12} />
            </button>
          </div>

          <button
            type="button"
            title="Share Winner"
            onClick={() => onShare(winner)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '3px 6px', fontSize: 10, color: 'var(--text-muted)' }}
          >
            <Share2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WeekendWinnersArchivePage() {
  const navigate = useNavigate();

  const [genreFilter, setGenreFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [shareData, setShareData] = useState(null);
  const [showPickModal, setShowPickModal] = useState(false);

  const filteredWinners = useMemo(() => {
    return getHistoricalWinners({
      genreId: genreFilter,
      year: yearFilter,
      type: typeFilter,
      query: searchQuery,
    });
  }, [genreFilter, yearFilter, typeFilter, searchQuery]);

  return (
    <div className="page-enter" style={{ minHeight: '90vh', paddingBottom: 60 }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(10,10,14,0.98) 60%)',
        borderBottom: '1px solid var(--border)',
        padding: '50px 24px 40px',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link to="/weekend" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Weekend Pick</Link>
            <span>/</span>
            <span style={{ color: 'var(--gold)' }}>Winners Archive</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-gold" style={{ fontSize: 10 }}>
                  🏆 HALL OF FAME
                </span>
                <span className="badge badge-dim" style={{ fontSize: 10 }}>
                  {filteredWinners.length} Crowne{filteredWinners.length !== 1 ? 'd' : 'd'} Winner{filteredWinners.length !== 1 ? 's' : ''}
                </span>
              </div>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(28px, 4.5vw, 42px)',
                color: 'var(--text-primary)',
                margin: '0 0 10px',
              }}>
                Weekend Winner History
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
                Every crowned champion chosen by the Cinemascope community over the weeks and months.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowPickModal(true)}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Dices size={13} /> Pick My Weekend
              </button>
              <button
                type="button"
                onClick={() => navigate('/weekend')}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trophy size={13} /> Active Poll →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter Toolbar */}
      <div className="container" style={{ marginTop: 28 }}>
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 24,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          padding: 14,
          borderRadius: 4,
          alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="input"
              style={{ paddingLeft: 34, fontSize: 12 }}
              placeholder="Search winners by title or genre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Genre Filter */}
          <select
            className="input"
            style={{ width: 'auto', fontSize: 12 }}
            value={genreFilter}
            onChange={e => setGenreFilter(e.target.value)}
          >
            <option value="all">All Genres</option>
            {GENRE_OPTIONS.map(g => (
              <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            className="input"
            style={{ width: 'auto', fontSize: 12 }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Formats</option>
            <option value="MOVIE">🎬 Movies Only</option>
            <option value="SERIES">📺 TV Series Only</option>
          </select>

          {/* Year Filter */}
          <select
            className="input"
            style={{ width: 'auto', fontSize: 12 }}
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="all">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        {/* Results Grid */}
        {filteredWinners.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
          }}>
            <Trophy size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)' }}>
              No winners match your filters
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Try clearing your search query or choosing another genre.
            </p>
            <button
              type="button"
              onClick={() => {
                setGenreFilter('all');
                setTypeFilter('all');
                setYearFilter('all');
                setSearchQuery('');
              }}
              className="btn btn-outline btn-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 20,
          }}>
            {filteredWinners.map((winner, idx) => (
              <WinnerArchiveCard
                key={`${winner.roundId}-${winner.genreId}-${winner.titleId}-${idx}`}
                winner={winner}
                onShare={w => setShareData(w)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <PickMyWeekendModal
        isOpen={showPickModal}
        onClose={() => setShowPickModal(false)}
      />

      {shareData && (
        <SocialShareModal
          isOpen={!!shareData}
          onClose={() => setShareData(null)}
          title={shareData.title}
          genreName={shareData.genreName}
          voteCount={shareData.voteCount}
          votePercentage={shareData.votePercentage}
          edition={shareData.roundName || shareData.edition}
          posterUrl={shareData.posterUrl}
          type={shareData.type}
        />
      )}
    </div>
  );
}
