import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, User, ShieldAlert, Star, MessageSquare, Film, X, ChevronRight } from 'lucide-react';
import { useApp } from '../AppContext';
import { getUserVotingStats } from '../services/weekendPickService';
import ProfessionalRatingBadge from '../components/reviews/ProfessionalRatingBadge';

const SEED_USER_STATS = {
  'user-1': { watched: 18, reviews: 4 },
  'user-2': { watched: 14, reviews: 3 },
  'user-3': { watched: 22, reviews: 5 },
  'user-4': { watched: 9, reviews: 2 },
  'admin-1': { watched: 35, reviews: 10 },
};

export default function UserSearchPage() {
  const { state, isVerifiedPro } = useApp();
  const [query, setQuery] = useState('');

  // Build user list with stats
  const allUsers = useMemo(() => {
    return (state.users || []).map(user => {
      const userReviews = (state.reviews || []).filter(
        r => r.userId === user.id && r.status === 'PUBLISHED'
      );
      const votingStats = getUserVotingStats(user.id);
      const voteCount = votingStats?.totalVotes || 0;
      const seed = SEED_USER_STATS[user.id] || { watched: 3, reviews: 0 };
      const reviewCount = Math.max(userReviews.length, seed.reviews);

      // Try to get watched count from localStorage
      let watchedCount = seed.watched;
      try {
        const saved = localStorage.getItem(`cinemascope_user_library_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          const lsWatched = Object.values(parsed).filter(m => m.watched).length;
          watchedCount = Math.max(lsWatched, seed.watched);
        }
      } catch (e) {}

      const isPro = isVerifiedPro ? isVerifiedPro(user.id) : false;

      return {
        ...user,
        displayName: user.displayName || 'Cinema Lover',
        reviewCount,
        watchedCount,
        voteCount,
        isPro,
      };
    });
  }, [state.users, state.reviews, isVerifiedPro]);

  // Filter by search query
  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(u =>
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [allUsers, query]);

  const getRoleBadge = (user) => {
    if (user.role === 'ADMIN') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '2px 7px',
            borderRadius: 12,
            background: 'rgba(220,182,91,0.15)',
            border: '1px solid var(--gold-dim)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--gold)',
            letterSpacing: '0.05em',
          }}
        >
          <ShieldAlert size={9} /> ADMIN
        </span>
      );
    }
    return null;
  };

  return (
    <div className="page-enter" style={{ minHeight: '85vh', paddingBottom: 80 }}>
      {/* Header */}
      <div
        style={{
          padding: '44px 24px 32px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'radial-gradient(ellipse at 50% -30%, rgba(220,182,91,0.12), transparent 65%)',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ maxWidth: 700 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 14px',
              borderRadius: 20,
              background: 'var(--gold-faint)',
              border: '1px solid var(--gold-dim)',
              fontSize: 12,
              color: 'var(--gold)',
              marginBottom: 14,
              fontWeight: 600,
            }}
          >
            <Users size={14} /> Community Members
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(24px, 4vw, 36px)',
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Find Members
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            Search for cinema lovers by name and visit their public profile
          </p>

          {/* Search Bar */}
          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Search by name..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              style={{
                paddingLeft: 40,
                paddingRight: query ? 38 : 16,
                height: 46,
                fontSize: 14,
                borderRadius: 24,
                border: '1px solid var(--border-neutral)',
                background: 'var(--bg-card)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container" style={{ maxWidth: 700, padding: '28px 24px' }}>
        {/* Count */}
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Users size={13} />
          {query
            ? `${filteredUsers.length} result${filteredUsers.length !== 1 ? 's' : ''} for "${query}"`
            : `${allUsers.length} registered member${allUsers.length !== 1 ? 's' : ''}`}
        </div>

        {filteredUsers.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              color: 'var(--text-muted)',
            }}
          >
            <User size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>No members found matching "{query}"</p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 10 }}
            >
              Clear search
            </button>
          </div>
        )}

        {/* User Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredUsers.map(user => (
            <Link
              key={user.id}
              to={`/profile/${user.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  border: '1px solid var(--border-subtle)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--gold-dim)';
                  e.currentTarget.style.background = 'rgba(220,182,91,0.04)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = '';
                }}
              >
                {/* Avatar */}
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--gold-dim)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      background: 'var(--gold-faint)',
                      border: '2px solid var(--gold-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 700,
                      color: 'var(--gold)',
                      flexShrink: 0,
                    }}
                  >
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.displayName}
                    </span>
                    {getRoleBadge(user)}
                    {user.isPro && (
                      <ProfessionalRatingBadge size="xs" />
                    )}
                    {state.currentUser?.id === user.id && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 10,
                          background: 'rgba(74,222,128,0.12)',
                          border: '1px solid rgba(74,222,128,0.3)',
                          color: '#4ade80',
                          fontWeight: 600,
                        }}
                      >
                        You
                      </span>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      marginTop: 5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Film size={11} />
                      {user.watchedCount} watched
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <MessageSquare size={11} />
                      {user.reviewCount} review{user.reviewCount !== 1 ? 's' : ''}
                    </span>
                    {user.voteCount > 0 && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        <Star size={11} />
                        {user.voteCount} vote{user.voteCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA to leaderboard */}
        {!query && allUsers.length > 0 && (
          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <Link
              to="/leaderboard"
              className="btn btn-ghost btn-sm"
              style={{ gap: 6, color: 'var(--gold)' }}
            >
              View Community Leaderboard <ChevronRight size={13} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
