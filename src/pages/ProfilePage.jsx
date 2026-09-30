import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { User, LogOut, ShieldAlert, Star, Film, MessageSquare, ChevronRight, ChevronDown, ChevronUp, Bookmark, Heart, BookOpen, Folder, Trophy, CheckCircle2, Building2, Users } from 'lucide-react';
import { useApp } from '../AppContext';
import ReviewCard from '../components/reviews/ReviewCard';
import ProfessionalRatingBadge from '../components/reviews/ProfessionalRatingBadge';
import * as LibService from '../services/movieLibraryService';
import ApplicationStatusBanner from '../components/pro/ApplicationStatusBanner';
import { getUserApplication } from '../services/proReviewerService';
import { getUserVotingStats, getUserVotes } from '../services/weekendPickService';
import ShareButton from '../components/social/ShareButton';
import { SOCIAL_CONTENT_TYPES } from '../services/socialSharingService';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, getMovie, getTheater, isVerifiedPro } = useApp();

  // The currently logged in visitor
  const viewerUser = state.currentUser;

  // The user whose profile is being displayed
  const profileUser = useMemo(() => {
    if (userId) {
      const found = state.users?.find(
        u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase())
      );
      if (found) return found;
      if (viewerUser && (viewerUser.id === userId || (viewerUser.email && viewerUser.email.toLowerCase() === userId.toLowerCase()))) {
        return viewerUser;
      }
      return { id: userId, displayName: 'Cinema Member', email: '', role: 'USER' };
    }
    return viewerUser;
  }, [userId, state.users, viewerUser]);

  // Is the logged in user viewing their own profile?
  const isOwnProfile = Boolean(
    !userId || (viewerUser && profileUser && (viewerUser.id === profileUser.id || (viewerUser.email && profileUser.email && viewerUser.email.toLowerCase() === profileUser.email.toLowerCase())))
  );

  const [libStats, setLibStats] = useState({ totalWatchlist: 0, totalWatched: 0, totalFavorites: 0, totalRated: 0, avgRating: 0 });
  const [diaryStats, setDiaryStats] = useState({ totalEntries: 0, thisYearCount: 0, thisMonthCount: 0, rewatches: 0 });
  const [collectionsCount, setCollectionsCount] = useState(0);
  const [weekendVotingStats, setWeekendVotingStats] = useState({ totalVotes: 0, distinctRounds: 0, distinctGenres: 0, winnersVotedCount: 0 });
  const [userPastVotes, setUserPastVotes] = useState([]);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!profileUser?.id) {
      setLibStats({ totalWatchlist: 0, totalWatched: 0, totalFavorites: 0, totalRated: 0, avgRating: 0 });
      setDiaryStats({ totalEntries: 0, thisYearCount: 0, thisMonthCount: 0, rewatches: 0 });
      setCollectionsCount(0);
      setWeekendVotingStats({ totalVotes: 0, distinctRounds: 0, distinctGenres: 0, winnersVotedCount: 0 });
      setUserPastVotes([]);
      return;
    }

    let isMounted = true;
    const load = async () => {
      try {
        const [ls, ds, cols] = await Promise.all([
          LibService.getLibraryStats(profileUser.id),
          isOwnProfile ? LibService.getDiaryStats(profileUser.id) : Promise.resolve({ totalEntries: 0, thisYearCount: 0, thisMonthCount: 0, rewatches: 0 }),
          LibService.getCollections(profileUser.id),
        ]);

        if (!isMounted) return;

        // If viewing another user and remote library is 0, check user's synced stats
        let finalWatched = ls?.totalWatched || 0;
        let finalWatchlist = ls?.totalWatchlist || 0;
        let finalFavorites = ls?.totalFavorites || 0;
        let finalRating = ls?.avgRating || 0;

        if (!isOwnProfile && finalWatched === 0 && profileUser.stats?.watchedCount) {
          finalWatched = profileUser.stats.watchedCount;
        }

        setLibStats({
          totalWatchlist: finalWatchlist,
          totalWatched: finalWatched,
          totalFavorites: finalFavorites,
          totalRated: finalWatched,
          avgRating: finalRating,
        });
        setDiaryStats(ds || { totalEntries: 0, thisYearCount: 0, thisMonthCount: 0, rewatches: 0 });
        setCollectionsCount(cols ? cols.length : 0);
        setWeekendVotingStats(getUserVotingStats(profileUser.id));
        setUserPastVotes(getUserVotes(profileUser.id));
      } catch (e) {
        console.warn('Error loading profile stats:', e);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [profileUser?.id, isOwnProfile, profileUser?.stats]);

  // Published reviews by this profile user
  const userReviews = useMemo(() => {
    if (!profileUser) return [];
    return (state.reviews || []).filter(r => r.userId === profileUser.id && r.status === 'PUBLISHED');
  }, [state.reviews, profileUser]);

  // Calculate composite Cinema Points matching leaderboard
  // Score = (watched * 5) + (reviews * 15) + (votes * 10)
  const cinemaScore = useMemo(() => {
    return (libStats.totalWatched * 5) + (userReviews.length * 15) + (weekendVotingStats.totalVotes * 10);
  }, [libStats.totalWatched, userReviews.length, weekendVotingStats.totalVotes]);

  // Pro reviewer status
  const proApplication = useMemo(
    () => (profileUser && isOwnProfile ? getUserApplication(profileUser.id) : null),
    [profileUser, isOwnProfile, state.professionalApplications]
  );
  const isPro = profileUser ? isVerifiedPro(profileUser.id) : false;

  if (!profileUser) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>Access Restricted</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>Please log in to view your profile.</p>
        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ marginTop: 24 }}>
          Log In
        </button>
      </div>
    );
  }

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const formatDate = (iso) => {
    if (!iso) return 'Recent Member';
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return 'Recent Member';
    }
  };

  const statCards = [
    { label: 'Movies Watched', value: libStats.totalWatched, icon: <Film size={18} color="var(--gold)" />, link: isOwnProfile ? '/library/watched' : null },
    { label: 'Watchlist', value: libStats.totalWatchlist, icon: <Bookmark size={18} color="var(--gold)" />, link: isOwnProfile ? '/watchlist' : null },
    { label: 'Favorites', value: libStats.totalFavorites, icon: <Heart size={18} color="var(--gold)" />, link: isOwnProfile ? '/library/favorites' : null },
    { label: 'Weekend Votes', value: weekendVotingStats.totalVotes, icon: <Trophy size={18} color="var(--gold)" />, link: '/weekend' },
    { label: 'Diary Entries', value: diaryStats.totalEntries, icon: <BookOpen size={18} color="var(--gold)" />, link: isOwnProfile ? '/diary' : null },
    { label: 'Collections', value: collectionsCount, icon: <Folder size={18} color="var(--gold)" />, link: isOwnProfile ? '/library/collections' : null },
    { label: 'Reviews Written', value: userReviews.length, icon: <MessageSquare size={18} color="var(--gold)" />, link: null, action: () => setShowComments(true) },
  ];

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ padding: '60px 24px 40px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to bottom, rgba(220,182,91,0.03), transparent)' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            {/* Avatar & User Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {profileUser.avatarUrl ? (
                <img
                  src={profileUser.avatarUrl}
                  alt={profileUser.displayName}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--gold-dim)',
                  }}
                />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'var(--gold-faint)', border: '2px solid var(--gold-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--gold)',
                }}>
                  {profileUser.displayName ? profileUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--text-primary)', margin: 0 }}>
                    {profileUser.displayName}
                  </h1>
                  {profileUser.role === 'ADMIN' && (
                    <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldAlert size={10} /> ADMIN
                    </span>
                  )}
                  {isPro && (
                    <ProfessionalRatingBadge
                      size="sm"
                      interactive
                      onClick={() => navigate(`/reviewer/${profileUser.id}`)}
                      title="Click to view verified critic profile"
                    />
                  )}
                  {isOwnProfile && (
                    <span className="badge badge-gold" style={{ fontSize: 9 }}>YOU</span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>Member since {formatDate(profileUser.createdAt)}</span>
                  {isOwnProfile && profileUser.email && (
                    <>
                      <span>·</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{profileUser.email}</span>
                    </>
                  )}
                  {!isOwnProfile && (
                    <>
                      <span>·</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Community Cinephile</span>
                    </>
                  )}
                </div>

                {/* Score & Rating Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 16,
                    background: 'rgba(220,182,91,0.12)',
                    border: '1px solid var(--gold-dim)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--gold)',
                  }}>
                    <Trophy size={13} />
                    <span>{cinemaScore} Cinema Points</span>
                  </div>

                  {libStats.avgRating > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Avg Rating: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>★ {libStats.avgRating}</span>
                      {diaryStats.rewatches > 0 && ` · ${diaryStats.rewatches} rewatches`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Own Profile vs Visitor Mode */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <ShareButton
                contentType={SOCIAL_CONTENT_TYPES.USER_STATS}
                data={{
                  stats: {
                    displayName: profileUser.displayName,
                    totalWatched: libStats.totalWatched,
                    totalRated: libStats.totalRated,
                    totalWatchlist: libStats.totalWatchlist,
                    avgRating: libStats.avgRating,
                    weekendVotes: weekendVotingStats.totalVotes,
                    cinemaScore,
                  },
                }}
                variant="primary"
                size="sm"
                customLabel={isOwnProfile ? "✨ Share My Stats" : "✨ Share Profile"}
              />

              {isOwnProfile ? (
                <>
                  <Link to="/library" className="btn btn-outline btn-sm">
                    <Film size={14} /> My Library
                  </Link>
                  {profileUser.role === 'ADMIN' && (
                    <Link to="/admin" className="btn btn-outline btn-sm">
                      <ShieldAlert size={14} /> Admin Dashboard
                    </Link>
                  )}
                  <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: '#f87171' }}>
                    <LogOut size={14} /> Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/leaderboard" className="btn btn-outline btn-sm" style={{ borderColor: 'var(--gold-dim)', color: 'var(--gold)' }}>
                    <Trophy size={14} /> Leaderboard
                  </Link>
                  <Link to="/users" className="btn btn-ghost btn-sm">
                    <Users size={14} /> Find Members
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="container" style={{ maxWidth: 900, padding: '32px 24px 0' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
          {isOwnProfile ? 'My Movie Archive' : `${profileUser.displayName}'s Movie Archive`}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 40 }}>
          {statCards.map(card => {
            const cardContent = (
              <>
                <div style={{ marginBottom: 6 }}>{card.icon}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--gold)', fontWeight: 700 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                  {card.label}
                </div>
              </>
            );

            if (card.link) {
              return (
                <Link
                  key={card.label}
                  to={card.link}
                  style={{
                    padding: '16px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center',
                    textDecoration: 'none',
                    borderRadius: 4,
                    transition: 'border-color 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--gold-dim)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div
                key={card.label}
                onClick={card.action ? card.action : undefined}
                style={{
                  padding: '16px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                  borderRadius: 4,
                  cursor: card.action ? 'pointer' : 'default',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => {
                  if (card.action) e.currentTarget.style.borderColor = 'var(--gold-dim)';
                }}
                onMouseLeave={e => {
                  if (card.action) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          <Link to="/discover" className="btn btn-primary btn-sm">Discover Movies</Link>
          <Link to="/leaderboard" className="btn btn-outline btn-sm" style={{ borderColor: 'var(--gold-dim)', color: 'var(--gold)' }}>
            <Trophy size={14} /> Community Leaderboard
          </Link>
          <Link to="/weekend" className="btn btn-outline btn-sm">Weekend Picks</Link>
          {isOwnProfile && (
            <>
              <Link to="/library" className="btn btn-outline btn-sm">My Library</Link>
              <Link to="/diary" className="btn btn-outline btn-sm">Movie Diary</Link>
              <Link to="/watchlist" className="btn btn-outline btn-sm">Watchlist</Link>
            </>
          )}
          {!isOwnProfile && (
            <Link to="/users" className="btn btn-outline btn-sm">
              <Users size={14} /> Find Members
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowComments(prev => !prev)}
            className="btn btn-outline btn-sm"
            style={{
              borderColor: showComments ? 'var(--gold)' : 'var(--border-subtle)',
              background: showComments ? 'var(--gold-faint)' : 'transparent',
              color: showComments ? 'var(--gold)' : 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MessageSquare size={14} color="var(--gold)" />
            <span>{isOwnProfile ? 'My Reviews' : `${profileUser.displayName}'s Reviews`} ({userReviews.length})</span>
            {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Professional Reviewer Status */}
        {isOwnProfile && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
              Professional Reviewer Application
            </h2>
            <ApplicationStatusBanner application={proApplication} />
            {isPro && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                As a verified reviewer, your reviews on movie pages will appear in the dedicated <strong style={{ color: '#10b981' }}>Professional Reviews</strong> section with a ✓ badge.
              </div>
            )}
          </div>
        )}

        {!isOwnProfile && isPro && (
          <div style={{ marginBottom: 40, padding: 18, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={18} color="#10b981" />
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Verified Professional Critic</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  {profileUser.displayName} is a verified cinema reviewer on CinemaScope. Their reviews feature comprehensive multi-attribute technical evaluations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Weekend Voting Activity */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={14} color="var(--gold)" /> {isOwnProfile ? 'Weekend Pick Voting Activity' : `${profileUser.displayName}'s Weekend Voting Activity`}
            </h2>
            <Link to="/weekend" className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: 11 }}>
              Go to Weekend Voting →
            </Link>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: 20
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
              <div style={{ padding: '12px 14px', background: 'rgba(220,182,91,0.06)', borderRadius: 4, border: '1px solid rgba(220,182,91,0.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Votes Cast</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
                  {weekendVotingStats.totalVotes}
                </div>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rounds Participated</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
                  {weekendVotingStats.distinctRounds}
                </div>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Genres Voted</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
                  {weekendVotingStats.distinctGenres}
                </div>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(16,185,129,0.06)', borderRadius: 4, border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: 11, color: '#10b981' }}>Winners Voted For</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-serif)', marginTop: 2 }}>
                  {weekendVotingStats.winnersVotedCount}
                </div>
              </div>
            </div>

            {userPastVotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                {isOwnProfile
                  ? "You haven't voted in any weekend rounds yet. Cast your vote this weekend to support your favorite movies & series!"
                  : `${profileUser.displayName} hasn't voted in any weekend rounds yet.`}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Recent Votes
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {userPastVotes.slice(0, 5).map((v, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.25)',
                      borderRadius: 4,
                      border: '1px solid var(--border-subtle)',
                      fontSize: 12
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="badge badge-gold" style={{ fontSize: 9 }}>{v.genreId?.toUpperCase()}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          Candidate #{v.candidateId?.slice(-6) || v.candidateId}
                        </span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Reviews & Comments Menu */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setShowComments(prev => !prev)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 20px',
              background: showComments ? 'rgba(220,182,91,0.06)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderBottom: showComments ? '1px solid var(--border-subtle)' : 'none',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--gold-faint)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquare size={18} color="var(--gold)" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', margin: 0 }}>
                  {isOwnProfile ? 'My Reviews & Comments' : `${profileUser.displayName}'s Reviews & Comments`}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {userReviews.length} {userReviews.length === 1 ? 'review written' : 'reviews written'} · Click to {showComments ? 'hide' : 'view'} all
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-gold" style={{ fontSize: 11, padding: '3px 10px' }}>
                {userReviews.length} {userReviews.length === 1 ? 'Review' : 'Reviews'}
              </span>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                {showComments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
          </button>

          {/* Collapsible Content */}
          {showComments && (
            <div style={{ padding: 20 }}>
              {userReviews.length === 0 ? (
                <div style={{ padding: '36px 20px', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-subtle)', textAlign: 'center', borderRadius: 4 }}>
                  <MessageSquare size={28} color="var(--text-muted)" style={{ marginBottom: 10 }} />
                  <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {isOwnProfile ? 'No comments or reviews written yet' : `${profileUser.displayName} hasn't written any reviews yet`}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                    {isOwnProfile ? 'Browse films & theaters to rate and leave your comments!' : 'Check back after more cinema screenings.'}
                  </p>
                  {isOwnProfile && (
                    <button onClick={() => navigate('/discover')} className="btn btn-primary btn-sm">
                      Explore Movies
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {userReviews.map(rev => {
                    const isTheater = !!rev.theaterId;
                    const targetMovie = !isTheater && rev.movieId ? getMovie(rev.movieId) : null;
                    const targetTheater = isTheater ? getTheater(rev.theaterId) : null;
                    const targetUrl = isTheater ? `/theater/${rev.theaterId}` : `/movie/${rev.movieId}`;
                    
                    let targetTitle = isTheater
                      ? (targetTheater?.name || rev.theaterName || 'Theater')
                      : (targetMovie?.title || rev.movieTitle || rev.parameterRatings?.movieTitle);

                    if (!targetTitle && rev.movieId) {
                      const cleaned = String(rev.movieId).replace(/^tmdb-/, '');
                      targetTitle = cleaned.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    }
                    if (!targetTitle) targetTitle = isTheater ? 'Theater' : 'Movie';

                    return (
                      <div key={rev.id} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', padding: 18, borderRadius: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                          <Link to={targetUrl} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                            {isTheater ? <Building2 size={16} color="var(--gold)" /> : <Film size={16} color="var(--gold)" />}
                            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', fontWeight: 600 }}>
                              {targetTitle}
                            </span>
                            {isTheater && (
                              <span className="badge badge-dim" style={{ fontSize: 9 }}>Theater</span>
                            )}
                            <ChevronRight size={14} color="var(--gold)" />
                          </Link>
                          <span className="badge badge-verified" style={{ fontSize: 9 }}>{rev.status || 'PUBLISHED'}</span>
                        </div>
                        <ReviewCard
                          review={rev}
                          onEdit={isOwnProfile ? () => navigate(targetUrl) : undefined}
                          onDelete={isOwnProfile ? (id) => dispatch({ type: 'DELETE_REVIEW', payload: id }) : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
