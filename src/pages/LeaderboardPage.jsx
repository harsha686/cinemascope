import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Star, Film, MessageSquare, Award, Flame, ChevronRight, User, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../AppContext';
import * as LibService from '../services/movieLibraryService';
import { getUserVotingStats } from '../services/weekendPickService';

// Default mock stats for demonstration users so the leaderboard is immediately rich & engaging
const SEED_USER_STATS = {
  'user-1': { watched: 18, reviews: 4, votes: 12, avgRating: 4.6 },
  'user-2': { watched: 14, reviews: 3, votes: 8, avgRating: 4.2 },
  'user-3': { watched: 22, reviews: 5, votes: 15, avgRating: 4.5 },
  'user-4': { watched: 9, reviews: 2, votes: 5, avgRating: 4.1 },
  'admin-1': { watched: 35, reviews: 10, votes: 24, avgRating: 4.8 },
};

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { state, isVerifiedPro } = useApp();
  const currentUser = state.currentUser;

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'reviewers' | 'watched' | 'voters'
  const [currentLibStats, setCurrentLibStats] = useState(null);

  // Load real library stats for active logged in user
  useEffect(() => {
    if (currentUser?.id) {
      LibService.getLibraryStats(currentUser.id).then(stats => {
        setCurrentLibStats(stats);
      }).catch(() => {});
    }
  }, [currentUser]);

  // Aggregate stats across all known users in the community
  const leaderboardUsers = useMemo(() => {
    const rawUsers = state.users || [];
    
    return rawUsers.map(user => {
      const isCurrent = currentUser && currentUser.id === user.id;

      // Count reviews in state
      const userReviews = (state.reviews || []).filter(r => r.userId === user.id && r.status === 'PUBLISHED');
      const reviewCountFromState = userReviews.length;

      // Count votes in state / weekend service
      const votingStats = getUserVotingStats(user.id);
      const voteCount = votingStats?.totalVotes || 0;

      // Watched count from local library if current user, or seed
      let watchedCount = 0;
      if (isCurrent && currentLibStats) {
        watchedCount = currentLibStats.totalWatched || 0;
      } else {
        // Try local storage key if available
        try {
          const key = `cinemascope_user_library_${user.id}`;
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            watchedCount = Object.values(parsed).filter(m => m.watched).length;
          }
        } catch (e) {}
      }

      // Fallback to seed stats for baseline community activity
      const seed = SEED_USER_STATS[user.id] || { watched: 5, reviews: 1, votes: 2, avgRating: 4.0 };
      const effectiveWatched = Math.max(watchedCount, seed.watched);
      const effectiveReviews = Math.max(reviewCountFromState, seed.reviews);
      const effectiveVotes = Math.max(voteCount, seed.votes);

      // Calculate composite cinema score
      // Score = (watched * 5) + (reviews * 15) + (votes * 10)
      const cinemaScore = (effectiveWatched * 5) + (effectiveReviews * 15) + (effectiveVotes * 10);

      // Average rating calculation
      let avgRating = seed.avgRating;
      if (userReviews.length > 0) {
        const sum = userReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        avgRating = Math.round((sum / userReviews.length) * 10) / 10;
      }

      return {
        id: user.id,
        displayName: user.displayName || 'Cinema Lover',
        email: user.email,
        role: user.role,
        isPro: isVerifiedPro ? isVerifiedPro(user.id) : false,
        isCurrent,
        watchedCount: effectiveWatched,
        reviewCount: effectiveReviews,
        voteCount: effectiveVotes,
        avgRating,
        cinemaScore,
      };
    });
  }, [state.users, state.reviews, currentUser, currentLibStats, isVerifiedPro]);

  // Sort list based on active category
  const sortedUsers = useMemo(() => {
    const list = [...leaderboardUsers];
    if (activeTab === 'reviewers') {
      return list.sort((a, b) => b.reviewCount - a.reviewCount || b.cinemaScore - a.cinemaScore);
    }
    if (activeTab === 'watched') {
      return list.sort((a, b) => b.watchedCount - a.watchedCount || b.cinemaScore - a.cinemaScore);
    }
    if (activeTab === 'voters') {
      return list.sort((a, b) => b.voteCount - a.voteCount || b.cinemaScore - a.cinemaScore);
    }
    // Overall / All
    return list.sort((a, b) => b.cinemaScore - a.cinemaScore);
  }, [leaderboardUsers, activeTab]);

  // Top 3 Podium
  const topThree = sortedUsers.slice(0, 3);

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, #FFD700, #B8860B)', color: '#0a0806', label: '1st', icon: '👑' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, #E0E0E0, #9E9E9E)', color: '#0a0806', label: '2nd', icon: '🥈' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, #CD7F32, #8B4513)', color: '#ffffff', label: '3rd', icon: '🥉' };
    return { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', label: `#${rank}`, icon: null };
  };

  return (
    <div className="page-enter" style={{ minHeight: '85vh', paddingBottom: 80 }}>
      {/* Hero Header */}
      <div
        style={{
          padding: '50px 24px 36px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'radial-gradient(ellipse at 50% -20%, rgba(220,182,91,0.18), transparent 70%)',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ maxWidth: 860 }}>
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
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            <Trophy size={14} /> CinemaScope Hall of Fame
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(28px, 4vw, 40px)',
              color: 'var(--text-primary)',
              marginBottom: 10,
              letterSpacing: '0.02em',
            }}
          >
            Community Leaderboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
            Honoring our top movie reviewers, most dedicated cinephiles, and active weekend pick voters shaping our cinema rankings.
          </p>

          {/* Category Tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 30,
              padding: 4,
              marginTop: 28,
              gap: 4,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {[
              { id: 'all', label: 'Overall Champions', icon: Trophy },
              { id: 'reviewers', label: 'Top Reviewers', icon: MessageSquare },
              { id: 'watched', label: 'Most Films Watched', icon: Film },
              { id: 'voters', label: 'Weekend Voters', icon: Flame },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 18px',
                    borderRadius: 24,
                    border: 'none',
                    background: isActive ? 'var(--gold)' : 'transparent',
                    color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 860, padding: '36px 24px 0' }}>
        {/* Podium for Top 3 */}
        {topThree.length >= 3 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 36,
              alignItems: 'end',
            }}
          >
            {/* Rank 2 */}
            <div
              onClick={() => navigate(`/profile/${topThree[1].id}`)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(224,224,224,0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
                order: 1,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>🥈</div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '2px solid #E0E0E0',
                  margin: '0 auto 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#E0E0E0',
                  fontFamily: 'var(--font-serif)',
                }}
              >
                {topThree[1].displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>
                {topThree[1].displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Rank #2 · {topThree[1].isPro ? 'Verified Critic' : 'Cinephile'}
              </div>
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>
                  {activeTab === 'reviewers' ? `${topThree[1].reviewCount} reviews` :
                   activeTab === 'watched' ? `${topThree[1].watchedCount} watched` :
                   activeTab === 'voters' ? `${topThree[1].voteCount} votes` :
                   `${topThree[1].cinemaScore} pts`}
                </span>
              </div>
            </div>

            {/* Rank 1 (Tallest / Highlighted) */}
            <div
              onClick={() => navigate(`/profile/${topThree[0].id}`)}
              style={{
                background: 'linear-gradient(180deg, rgba(220,182,91,0.12), var(--bg-card))',
                border: '2px solid var(--gold)',
                borderRadius: 'var(--radius-sm)',
                padding: '32px 18px',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: '0 8px 30px rgba(220,182,91,0.15)',
                transition: 'transform 0.15s ease',
                order: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--gold)',
                  color: 'var(--bg-primary)',
                  fontWeight: 800,
                  fontSize: 10,
                  padding: '3px 12px',
                  borderRadius: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Champion
              </div>
              <div style={{ fontSize: 34, marginBottom: 6 }}>👑</div>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--gold-faint)',
                  border: '2px solid var(--gold)',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 700,
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-serif)',
                }}
              >
                {topThree[0].displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text-primary)', fontWeight: 700 }}>
                {topThree[0].displayName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 2, fontWeight: 500 }}>
                1st Place · {topThree[0].isPro ? 'Verified Professional' : 'Grand Cinephile'}
              </div>
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(220,182,91,0.1)', borderRadius: 4, border: '1px solid rgba(220,182,91,0.2)' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>
                  {activeTab === 'reviewers' ? `${topThree[0].reviewCount} reviews` :
                   activeTab === 'watched' ? `${topThree[0].watchedCount} watched` :
                   activeTab === 'voters' ? `${topThree[0].voteCount} votes` :
                   `${topThree[0].cinemaScore} pts`}
                </span>
              </div>
            </div>

            {/* Rank 3 */}
            <div
              onClick={() => navigate(`/profile/${topThree[2].id}`)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(205,127,50,0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
                order: 2,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>🥉</div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '2px solid #CD7F32',
                  margin: '0 auto 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#CD7F32',
                  fontFamily: 'var(--font-serif)',
                }}
              >
                {topThree[2].displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>
                {topThree[2].displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Rank #3 · {topThree[2].isPro ? 'Verified Critic' : 'Cinephile'}
              </div>
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>
                  {activeTab === 'reviewers' ? `${topThree[2].reviewCount} reviews` :
                   activeTab === 'watched' ? `${topThree[2].watchedCount} watched` :
                   activeTab === 'voters' ? `${topThree[2].voteCount} votes` :
                   `${topThree[2].cinemaScore} pts`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Full Ranked Table */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--text-primary)', margin: 0 }}>
              Full Leaderboard Rankings
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {sortedUsers.length} Active Members
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sortedUsers.map((u, index) => {
              const rank = index + 1;
              const badge = getRankBadge(rank);

              return (
                <div
                  key={u.id}
                  onClick={() => navigate(`/profile/${u.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: index < sortedUsers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    background: u.isCurrent ? 'rgba(220,182,91,0.04)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    gap: 16,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = u.isCurrent ? 'rgba(220,182,91,0.04)' : 'transparent'}
                >
                  {/* Left: Rank + User info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: badge.bg,
                        color: badge.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {badge.label}
                    </div>

                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--gold-faint)',
                        border: '1px solid var(--gold-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--gold)',
                        flexShrink: 0,
                      }}
                    >
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {u.displayName}
                        </span>
                        {u.isCurrent && (
                          <span className="badge badge-gold" style={{ fontSize: 9 }}>YOU</span>
                        )}
                        {u.isPro && (
                          <span className="badge badge-verified" style={{ fontSize: 9, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <CheckCircle2 size={10} /> Critic
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>★ {u.avgRating} avg</span>
                        <span>·</span>
                        <span>{u.watchedCount} watched</span>
                        <span>·</span>
                        <span>{u.reviewCount} reviews</span>
                        <span>·</span>
                        <span>{u.voteCount} votes</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Key Stat & Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>
                        {activeTab === 'reviewers' ? u.reviewCount :
                         activeTab === 'watched' ? u.watchedCount :
                         activeTab === 'voters' ? u.voteCount :
                         u.cinemaScore}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {activeTab === 'reviewers' ? 'Reviews' :
                         activeTab === 'watched' ? 'Films' :
                         activeTab === 'voters' ? 'Votes' :
                         'Cinema Pts'}
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info callout */}
        <div
          style={{
            marginTop: 28,
            padding: '16px 20px',
            background: 'rgba(220,182,91,0.04)',
            border: '1px solid rgba(220,182,91,0.15)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              How is the CinemaScore calculated?
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Earn 5 points per movie watched, 15 points per detailed review written, and 10 points per weekend voting round.
            </div>
          </div>
          <button onClick={() => navigate('/discover')} className="btn btn-primary btn-sm">
            Watch &amp; Rate More Films
          </button>
        </div>
      </div>
    </div>
  );
}
