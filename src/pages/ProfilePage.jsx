import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { User, LogOut, ShieldAlert, Star, Film, MessageSquare, ChevronRight, ChevronDown, ChevronUp, Bookmark, Heart, BookOpen, Folder, Trophy, CheckCircle2, Building2, Users, Bell, Search, Tv, X, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../AppContext';
import ReviewCard from '../components/reviews/ReviewCard';
import ProfessionalRatingBadge from '../components/reviews/ProfessionalRatingBadge';
import * as LibService from '../services/movieLibraryService';
import { getUserPublicArchive } from '../services/showcaseArchiveService';
import { fetchFullTmdbMovieDetails } from '../services/tmdbService';
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
  const [showNotifications, setShowNotifications] = useState(false);

  // Movie Archive Explorer State
  const [activeArchiveTab, setActiveArchiveTab] = useState('watched'); // 'watched' | 'favorites' | 'watchlist' | 'diary' | 'collections' | 'reviews' | 'votes'
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all'); // 'all' | 'movie' | 'tv'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'rating' | 'year' | 'title'
  const [archiveData, setArchiveData] = useState({ all: [], watched: [], favorites: [], watchlist: [], stats: {} });
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [collectionsList, setCollectionsList] = useState([]);
  const [loadingArchive, setLoadingArchive] = useState(true);

  useEffect(() => {
    if (!profileUser?.id) {
      setLibStats({ totalWatchlist: 0, totalWatched: 0, totalFavorites: 0, totalRated: 0, avgRating: 0 });
      setDiaryStats({ totalEntries: 0, thisYearCount: 0, thisMonthCount: 0, rewatches: 0 });
      setCollectionsCount(0);
      setWeekendVotingStats({ totalVotes: 0, distinctRounds: 0, distinctGenres: 0, winnersVotedCount: 0 });
      setUserPastVotes([]);
      setArchiveData({ all: [], watched: [], favorites: [], watchlist: [], stats: {} });
      setDiaryEntries([]);
      setCollectionsList([]);
      setLoadingArchive(false);
      return;
    }

    let isMounted = true;
    const load = async () => {
      setLoadingArchive(true);
      try {
        const [ls, ds, cols, diaryData, archive] = await Promise.all([
          LibService.getLibraryStats(profileUser.id),
          LibService.getDiaryStats(profileUser.id),
          LibService.getCollections(profileUser.id),
          LibService.getDiary(profileUser.id),
          getUserPublicArchive(profileUser.id, profileUser),
        ]);

        if (!isMounted) return;

        // If viewing another user and remote library is 0, check user's synced stats
        let finalWatched = archive?.stats?.totalWatched || ls?.totalWatched || 0;
        let finalWatchlist = archive?.stats?.totalWatchlist || ls?.totalWatchlist || 0;
        let finalFavorites = archive?.stats?.totalFavorites || ls?.totalFavorites || 0;
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
        setDiaryStats(ds || { totalEntries: diaryData?.length || 0, thisYearCount: 0, thisMonthCount: 0, rewatches: 0 });
        setCollectionsCount(cols ? cols.length : 0);
        setWeekendVotingStats(getUserVotingStats(profileUser.id));
        setUserPastVotes(getUserVotes(profileUser.id));
        setArchiveData(archive || { all: [], watched: [], favorites: [], watchlist: [], stats: {} });
        setDiaryEntries(diaryData || []);
        setCollectionsList(cols || []);
      } catch (e) {
        console.warn('Error loading profile stats and archive:', e);
      } finally {
        if (isMounted) setLoadingArchive(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [profileUser?.id, isOwnProfile, profileUser?.stats]);

  const profileAttemptedIdsRef = useRef(new Set());
  const isEnrichingProfileRef = useRef(false);

  // Progressive TMDB batch enricher for any items with missing poster or placeholder title
  useEffect(() => {
    if (!archiveData?.all || archiveData.all.length === 0) return;

    const unattempted = archiveData.all.filter(item => {
      const cleanId = String(item.tmdbId || item.id || '').replace(/^tmdb-/, '');
      if (!cleanId || profileAttemptedIdsRef.current.has(cleanId)) return false;
      const isPlaceholderTitle = !item.title || /^Title #\d+$/i.test(item.title) || item.title === 'Movie';
      const isMissingPoster = !item.posterUrl;
      return isPlaceholderTitle || isMissingPoster;
    });

    if (unattempted.length === 0 || isEnrichingProfileRef.current) return;

    let isCancelled = false;
    isEnrichingProfileRef.current = true;

    const runProfileEnricher = async () => {
      const CHUNK_SIZE = 8;
      const metadataToPersist = {};

      for (let i = 0; i < unattempted.length; i += CHUNK_SIZE) {
        if (isCancelled) break;
        const chunk = unattempted.slice(i, i + CHUNK_SIZE);
        chunk.forEach(item => {
          const cleanId = String(item.tmdbId || item.id).replace(/^tmdb-/, '');
          profileAttemptedIdsRef.current.add(cleanId);
        });

        const fetchedResults = await Promise.all(
          chunk.map(async (item) => {
            const cleanId = String(item.tmdbId || item.id).replace(/^tmdb-/, '');
            try {
              const details = await fetchFullTmdbMovieDetails(cleanId);
              return { item, details };
            } catch (err) {
              return { item, details: null };
            }
          })
        );

        if (isCancelled) break;

        const patchMap = {};
        fetchedResults.forEach(({ item, details }) => {
          if (details) {
            const cleanId = String(item.tmdbId || item.id).replace(/^tmdb-/, '');
            const enriched = {
              title: details.title || details.originalTitle || item.title,
              posterUrl: details.posterUrl || item.posterUrl,
              releaseYear: details.releaseYear || (details.releaseDate ? details.releaseDate.split('-')[0] : item.releaseYear),
              mediaType: details.isTv ? 'tv' : (item.mediaType || 'movie'),
              isTv: details.isTv || item.isTv,
              type: details.isTv ? 'SERIES' : 'MOVIE',
              rating: item.rating || (details.voteAverage ? details.voteAverage : null),
            };
            patchMap[cleanId] = enriched;
            patchMap[item.id] = enriched;
            metadataToPersist[cleanId] = {
              title: enriched.title,
              posterUrl: enriched.posterUrl,
              releaseYear: enriched.releaseYear,
              type: enriched.type,
            };
          }
        });

        if (Object.keys(patchMap).length > 0) {
          setArchiveData(prev => {
            const updateItem = (it) => {
              const key = String(it.tmdbId || it.id).replace(/^tmdb-/, '');
              const patch = patchMap[key] || patchMap[it.id];
              return patch ? { ...it, ...patch } : it;
            };

            return {
              ...prev,
              all: (prev.all || []).map(updateItem),
              watched: (prev.watched || []).map(updateItem),
              favorites: (prev.favorites || []).map(updateItem),
              watchlist: (prev.watchlist || []).map(updateItem),
            };
          });
        }

        // Polite pacing to prevent hitting rate limits
        if (i + CHUNK_SIZE < unattempted.length) {
          await new Promise(r => setTimeout(r, 120));
        }
      }

      if (profileUser?.id && Object.keys(metadataToPersist).length > 0) {
        LibService.updateLibraryMetadataBatch(metadataToPersist, profileUser.id).catch(console.warn);
      }

      if (!isCancelled) {
        isEnrichingProfileRef.current = false;
      }
    };

    runProfileEnricher();

    return () => {
      isCancelled = true;
      isEnrichingProfileRef.current = false;
    };
  }, [archiveData?.all?.length, profileUser?.id]);

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

  // Notifications for profile user
  const userNotifications = useMemo(() => {
    if (!profileUser?.id) return [];
    return (state.notifications || [])
      .filter(n => n.recipientId === profileUser.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [state.notifications, profileUser?.id]);

  const unreadNotifCount = useMemo(() => {
    return userNotifications.filter(n => !n.isRead).length;
  }, [userNotifications]);

  const totalLikesReceived = useMemo(() => {
    return userReviews.reduce((sum, r) => sum + (r.likesCount || 0), 0);
  }, [userReviews]);

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

  const handleStatCardClick = (tabId) => {
    if (tabId === 'likes' && isOwnProfile) {
      setShowNotifications(prev => !prev);
      return;
    }
    if (tabId === 'reviews') {
      setShowComments(prev => !prev);
      return;
    }
    setActiveArchiveTab(tabId);
    const el = document.getElementById('movie-archive-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const statCards = [
    { id: 'watched', label: 'Movies Watched', value: libStats.totalWatched, icon: <Film size={18} color="var(--gold)" /> },
    { id: 'watchlist', label: 'Watchlist', value: libStats.totalWatchlist, icon: <Bookmark size={18} color="var(--gold)" /> },
    { id: 'favorites', label: 'Favorites', value: libStats.totalFavorites, icon: <Heart size={18} color="var(--gold)" /> },
    { id: 'likes', label: 'Helpful Likes', value: totalLikesReceived, icon: <Heart size={18} color="#ef4444" /> },
    { id: 'reviews', label: 'Reviews Written', value: userReviews.length, icon: <MessageSquare size={18} color="var(--gold)" /> },
    { id: 'votes', label: 'Weekend Votes', value: weekendVotingStats.totalVotes, icon: <Trophy size={18} color="var(--gold)" /> },
    { id: 'diary', label: 'Diary Entries', value: diaryStats.totalEntries, icon: <BookOpen size={18} color="var(--gold)" /> },
    { id: 'collections', label: 'Collections', value: collectionsCount, icon: <Folder size={18} color="var(--gold)" /> },
  ];

  // Items for the active archive tab
  const currentTabItems = useMemo(() => {
    let list = [];
    if (activeArchiveTab === 'watched') list = archiveData.watched || [];
    else if (activeArchiveTab === 'favorites') list = archiveData.favorites || [];
    else if (activeArchiveTab === 'watchlist') list = archiveData.watchlist || [];
    else return [];

    // Filter by mediaType
    if (mediaTypeFilter === 'movie') {
      list = list.filter(item => !item.isTv && item.mediaType !== 'tv');
    } else if (mediaTypeFilter === 'tv') {
      list = list.filter(item => item.isTv || item.mediaType === 'tv');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => (item.title || '').toLowerCase().includes(q));
    }

    // Sort
    const sorted = [...list];
    if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'year') {
      sorted.sort((a, b) => (parseInt(b.releaseYear, 10) || 0) - (parseInt(a.releaseYear, 10) || 0));
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return sorted;
  }, [activeArchiveTab, archiveData, mediaTypeFilter, searchQuery, sortBy]);

  // Counts for media type badges in the current tab
  const activeTabRawList = useMemo(() => {
    if (activeArchiveTab === 'watched') return archiveData.watched || [];
    if (activeArchiveTab === 'favorites') return archiveData.favorites || [];
    if (activeArchiveTab === 'watchlist') return archiveData.watchlist || [];
    return [];
  }, [activeArchiveTab, archiveData]);

  const activeMoviesCount = useMemo(() => {
    return activeTabRawList.filter(item => !item.isTv && item.mediaType !== 'tv').length;
  }, [activeTabRawList]);

  const activeSeriesCount = useMemo(() => {
    return activeTabRawList.filter(item => item.isTv || item.mediaType === 'tv').length;
  }, [activeTabRawList]);

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
      <div className="container" style={{ maxWidth: 960, padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            {isOwnProfile ? 'My Movie Archive' : `${profileUser.displayName}'s Movie Archive`}
          </h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Click any category below to browse titles &amp; activity
          </span>
        </div>

        {/* 7 Interactive Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: 10, marginBottom: 30 }}>
          {statCards.map(card => {
            const isSelected = activeArchiveTab === card.id;
            return (
              <div
                key={card.id}
                onClick={() => handleStatCardClick(card.id)}
                style={{
                  padding: '16px 10px',
                  background: isSelected ? 'rgba(220,182,91,0.09)' : 'var(--bg-card)',
                  border: isSelected ? '2px solid var(--gold)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 16px rgba(220,182,91,0.25)' : 'none',
                  textAlign: 'center',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--gold-dim)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'none';
                  }
                }}
              >
                <div style={{ marginBottom: 6 }}>{card.icon}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--gold)', fontWeight: 700 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', color: isSelected ? 'var(--gold)' : 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4, fontWeight: isSelected ? 700 : 500 }}>
                  {card.label}
                </div>
                {isSelected && (
                  <div style={{ width: 18, height: 2, background: 'var(--gold)', margin: '6px auto 0', borderRadius: 2 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
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
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setShowNotifications(prev => !prev)}
              className="btn btn-outline btn-sm"
              style={{
                borderColor: showNotifications ? 'var(--gold)' : unreadNotifCount > 0 ? 'var(--gold-dim)' : 'var(--border-subtle)',
                background: showNotifications ? 'var(--gold-faint)' : unreadNotifCount > 0 ? 'rgba(220,182,91,0.08)' : 'transparent',
                color: (showNotifications || unreadNotifCount > 0) ? 'var(--gold)' : 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Bell size={14} color="var(--gold)" />
              <span>Notifications</span>
              {unreadNotifCount > 0 && (
                <span className="badge badge-gold" style={{ fontSize: 10, padding: '1px 6px' }}>
                  {unreadNotifCount} new
                </span>
              )}
              {showNotifications ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        {/* Verified Professional Reviewer Callout */}
        {!isOwnProfile && isPro && (
          <div style={{ marginBottom: 32, padding: 18, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={20} color="#10b981" />
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Verified Professional Critic</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  {profileUser.displayName} is a verified cinema reviewer on CinemaScope. Their reviews feature comprehensive multi-attribute technical evaluations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Section (Own Profile) */}
        {isOwnProfile && showNotifications && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 20, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} color="var(--gold)" /> Notifications &amp; Likes ({userNotifications.length})
              </h3>
              {unreadNotifCount > 0 && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ', payload: profileUser.id })}
                  style={{ fontSize: 11, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {userNotifications.length === 0 ? (
              <div style={{ padding: '24px 16px', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-subtle)', textAlign: 'center', borderRadius: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                No notifications yet. When members like your reviews, alerts will appear here!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {userNotifications.map(notif => {
                  const isUnread = !notif.isRead;
                  const targetUrl = notif.targetType === 'THEATER' ? `/theater/${notif.targetId}` : `/movie/${notif.targetId}`;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (isUnread) dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notif.id });
                        navigate(targetUrl);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: isUnread ? 'rgba(220,182,91,0.06)' : 'rgba(0,0,0,0.2)',
                        border: `1px solid ${isUnread ? 'rgba(220,182,91,0.3)' : 'var(--border-subtle)'}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--gold)', fontWeight: 700, fontSize: 12, flexShrink: 0,
                        }}>
                          {(notif.actorName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                            <strong style={{ color: 'var(--gold)' }}>{notif.actorName}</strong>
                            {' '}liked your review on{' '}
                            <strong style={{ color: 'var(--text-primary)' }}>{notif.targetTitle}</strong>
                          </div>
                          {notif.reviewSnippet && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                              "{notif.reviewSnippet}"
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MOVIE ARCHIVE EXPLORER ── */}
        <div id="movie-archive-section" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '24px 20px', marginBottom: 40 }}>
          {/* Header & Sub-nav Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeArchiveTab === 'watched' && <Film size={18} color="var(--gold)" />}
                {activeArchiveTab === 'favorites' && <Heart size={18} color="var(--gold)" />}
                {activeArchiveTab === 'watchlist' && <Bookmark size={18} color="var(--gold)" />}
                {activeArchiveTab === 'votes' && <Trophy size={18} color="var(--gold)" />}
                {activeArchiveTab === 'diary' && <BookOpen size={18} color="var(--gold)" />}
                {activeArchiveTab === 'collections' && <Folder size={18} color="var(--gold)" />}
                {activeArchiveTab === 'reviews' && <MessageSquare size={18} color="var(--gold)" />}

                <span>
                  {activeArchiveTab === 'watched' && (isOwnProfile ? 'My Watched Movies & Series' : `${profileUser.displayName}'s Watched Movies & Series`)}
                  {activeArchiveTab === 'favorites' && (isOwnProfile ? 'My Favorite Movies & Series' : `${profileUser.displayName}'s Favorite Movies & Series`)}
                  {activeArchiveTab === 'watchlist' && (isOwnProfile ? 'My Watchlist' : `${profileUser.displayName}'s Watchlist`)}
                  {activeArchiveTab === 'votes' && (isOwnProfile ? 'My Weekend Votes Activity' : `${profileUser.displayName}'s Weekend Votes`)}
                  {activeArchiveTab === 'diary' && (isOwnProfile ? 'My Movie Diary' : `${profileUser.displayName}'s Movie Diary`)}
                  {activeArchiveTab === 'collections' && (isOwnProfile ? 'My Curated Collections' : `${profileUser.displayName}'s Collections`)}
                  {activeArchiveTab === 'reviews' && (isOwnProfile ? 'My Published Reviews' : `${profileUser.displayName}'s Published Reviews`)}
                </span>
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {activeArchiveTab === 'watched' && `Browsing ${libStats.totalWatched} titles logged in cinema library`}
                {activeArchiveTab === 'favorites' && `Browsing ${libStats.totalFavorites} all-time favorites`}
                {activeArchiveTab === 'watchlist' && `Browsing ${libStats.totalWatchlist} titles queued to watch`}
                {activeArchiveTab === 'votes' && `${weekendVotingStats.totalVotes} weekend poll votes cast`}
                {activeArchiveTab === 'diary' && `${diaryStats.totalEntries} logged cinema screenings`}
                {activeArchiveTab === 'collections' && `${collectionsCount} custom movie collections`}
                {activeArchiveTab === 'reviews' && `${userReviews.length} detailed movie & theater reviews written`}
              </p>
            </div>

            {/* Quick Link to full library pages for owner */}
            {isOwnProfile && (
              <div style={{ display: 'flex', gap: 8 }}>
                {activeArchiveTab === 'watched' && (
                  <Link to="/library/watched" className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
                    Full Library View →
                  </Link>
                )}
                {activeArchiveTab === 'favorites' && (
                  <Link to="/library/favorites" className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
                    Manage Favorites →
                  </Link>
                )}
                {activeArchiveTab === 'watchlist' && (
                  <Link to="/watchlist" className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
                    Manage Watchlist →
                  </Link>
                )}
                {activeArchiveTab === 'diary' && (
                  <Link to="/diary" className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
                    Open Diary Page →
                  </Link>
                )}
                {activeArchiveTab === 'collections' && (
                  <Link to="/library/collections" className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
                    Manage Collections →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Tab Navigation Pill Bar */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setActiveArchiveTab('watched')}
              className={`btn ${activeArchiveTab === 'watched' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              <Film size={13} /> Watched ({libStats.totalWatched})
            </button>
            <button
              type="button"
              onClick={() => setActiveArchiveTab('favorites')}
              className={`btn ${activeArchiveTab === 'favorites' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              <Heart size={13} /> Favorites ({libStats.totalFavorites})
            </button>
            <button
              type="button"
              onClick={() => setActiveArchiveTab('watchlist')}
              className={`btn ${activeArchiveTab === 'watchlist' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              <Bookmark size={13} /> Watchlist ({libStats.totalWatchlist})
            </button>
            <button
              type="button"
              onClick={() => setActiveArchiveTab('diary')}
              className={`btn ${activeArchiveTab === 'diary' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              <BookOpen size={13} /> Diary ({diaryStats.totalEntries})
            </button>
            <button
              type="button"
              onClick={() => setActiveArchiveTab('collections')}
              className={`btn ${activeArchiveTab === 'collections' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              <Folder size={13} /> Collections ({collectionsCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveArchiveTab('reviews')}
              className={`btn ${activeArchiveTab === 'reviews' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              <MessageSquare size={13} /> Reviews ({userReviews.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveArchiveTab('votes')}
              className={`btn ${activeArchiveTab === 'votes' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              <Trophy size={13} /> Weekend Votes ({weekendVotingStats.totalVotes})
            </button>
          </div>

          {/* ── TAB 1: MOVIES & SERIES (WATCHED, FAVORITES, WATCHLIST) ── */}
          {(activeArchiveTab === 'watched' || activeArchiveTab === 'favorites' || activeArchiveTab === 'watchlist') && (
            <div>
              {/* Filter & Search Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                {/* Media Type Filter (All / Movies / Series) */}
                <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 3, gap: 3 }}>
                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter('all')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 16,
                      border: 'none',
                      background: mediaTypeFilter === 'all' ? 'var(--gold)' : 'transparent',
                      color: mediaTypeFilter === 'all' ? '#000' : 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    All ({activeTabRawList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter('movie')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 16,
                      border: 'none',
                      background: mediaTypeFilter === 'movie' ? 'var(--gold)' : 'transparent',
                      color: mediaTypeFilter === 'movie' ? '#000' : 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Film size={11} /> Movies ({activeMoviesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter('tv')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 16,
                      border: 'none',
                      background: mediaTypeFilter === 'tv' ? 'var(--gold)' : 'transparent',
                      color: mediaTypeFilter === 'tv' ? '#000' : 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Tv size={11} /> Series &amp; TV ({activeSeriesCount})
                  </button>
                </div>

                {/* Search & Sort Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Search Bar */}
                  <div style={{ position: 'relative', width: 220 }}>
                    <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Filter titles..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        paddingLeft: 30,
                        paddingRight: searchQuery ? 28 : 10,
                        height: 32,
                        fontSize: 12,
                        borderRadius: 16,
                        border: '1px solid var(--border-subtle)',
                        background: 'rgba(0,0,0,0.25)',
                        color: 'var(--text-primary)',
                        width: '100%',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Sort By Dropdown */}
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{
                      height: 32,
                      fontSize: 11,
                      padding: '0 10px',
                      borderRadius: 16,
                      border: '1px solid var(--border-subtle)',
                      background: 'rgba(0,0,0,0.25)',
                      color: 'var(--text-secondary)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="recent">Recently Added</option>
                    <option value="rating">Highest Rated</option>
                    <option value="year">Newest Year</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Movie Cards Grid */}
              {loadingArchive ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Film size={28} style={{ opacity: 0.4, marginBottom: 12 }} />
                  <p style={{ fontSize: 13 }}>Loading cinema archive...</p>
                </div>
              ) : currentTabItems.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.15)', border: '1px dashed var(--border-subtle)', borderRadius: 6 }}>
                  {activeArchiveTab === 'favorites' ? <Heart size={32} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: 10 }} /> :
                   activeArchiveTab === 'watchlist' ? <Bookmark size={32} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: 10 }} /> :
                   <Film size={32} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: 10 }} />}
                  <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                    {searchQuery ? `No titles found matching "${searchQuery}"` : 'No titles found in this list'}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    {searchQuery ? 'Try clearing your search query' : 'Check back as more films and series are added to this archive.'}
                  </p>
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="btn btn-ghost btn-sm" style={{ marginTop: 10, fontSize: 11 }}>
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 14,
                  }}
                >
                  {currentTabItems.map(item => {
                    const isTv = item.isTv || item.mediaType === 'tv';
                    const targetMovieUrl = isTv
                      ? (String(item.tmdbId).startsWith('tv-') ? `/movie/tmdb-${item.tmdbId}` : `/movie/tmdb-tv-${item.tmdbId}`)
                      : (String(item.tmdbId).startsWith('tmdb-') ? `/movie/${item.tmdbId}` : `/movie/tmdb-${item.tmdbId}`);

                    return (
                      <div
                        key={item.id || item.tmdbId}
                        onClick={() => navigate(targetMovieUrl)}
                        className="interactive-card"
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          position: 'relative',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--gold-dim)';
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Poster Container */}
                        <div style={{ position: 'relative', width: '100%', paddingBottom: '148%', background: '#080706' }}>
                          {item.posterUrl ? (
                            <img
                              src={item.posterUrl}
                              alt={item.title}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }
                              }}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : null}
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: item.posterUrl ? 'none' : 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 10,
                              textAlign: 'center',
                              background: 'linear-gradient(135deg, rgba(220,182,91,0.08), rgba(18,17,16,0.95))',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <Film size={26} color="var(--gold-dim)" style={{ marginBottom: 6, opacity: 0.7 }} />
                            <span
                              style={{
                                fontSize: 10,
                                color: 'var(--text-secondary)',
                                fontWeight: 600,
                                lineHeight: 1.2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {item.title}
                            </span>
                          </div>

                          {/* Top Badges (Media Type & Favorite Indicator) */}
                          <div style={{ position: 'absolute', top: 5, left: 5, right: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                            <span
                              style={{
                                padding: '2px 5px',
                                borderRadius: 3,
                                fontSize: 8,
                                fontWeight: 700,
                                background: isTv ? 'rgba(59, 130, 246, 0.88)' : 'rgba(0, 0, 0, 0.75)',
                                color: '#ffffff',
                                backdropFilter: 'blur(4px)',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {isTv ? 'SERIES' : 'MOVIE'}
                            </span>

                            {item.favorite && (
                              <span
                                style={{
                                  padding: '2px 4px',
                                  borderRadius: 3,
                                  background: 'rgba(239, 68, 68, 0.9)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                                title="Favorite"
                              >
                                <Heart size={9} fill="#fff" />
                              </span>
                            )}
                          </div>

                          {/* Bottom Badges (Rating & Rewatch) */}
                          {item.rating && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 5,
                                right: 5,
                                background: 'rgba(0, 0, 0, 0.85)',
                                border: '1px solid var(--gold-dim)',
                                borderRadius: 10,
                                padding: '1px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                color: 'var(--gold)',
                                fontSize: 10,
                                fontWeight: 700,
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              <Star size={9} fill="var(--gold)" color="var(--gold)" />
                              <span>{item.rating}</span>
                            </div>
                          )}

                          {item.watchCount > 1 && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 5,
                                left: 5,
                                background: 'rgba(0, 0, 0, 0.85)',
                                borderRadius: 10,
                                padding: '1px 5px',
                                color: 'var(--text-secondary)',
                                fontSize: 9,
                                fontWeight: 600,
                              }}
                            >
                              🔁 {item.watchCount}x
                            </div>
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div style={{ padding: '8px 8px 10px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.title}
                          </h4>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                            {item.releaseYear || (isTv ? 'TV Series' : 'Movie')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: MOVIE DIARY ── */}
          {activeArchiveTab === 'diary' && (
            <div>
              {diaryEntries.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.15)', border: '1px dashed var(--border-subtle)', borderRadius: 6 }}>
                  <BookOpen size={32} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: 10 }} />
                  <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                    {isOwnProfile ? 'No movie diary entries logged yet' : `${profileUser.displayName} hasn't logged any diary entries yet`}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
                    {isOwnProfile ? 'Log screenings with dates, cinema formats, and impressions in your diary!' : 'Screening logs will appear here once recorded.'}
                  </p>
                  {isOwnProfile && (
                    <Link to="/diary" className="btn btn-primary btn-sm">
                      Open Diary Page
                    </Link>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {diaryEntries.map((entry, idx) => {
                    const dateObj = new Date(entry.watched_on || entry.created_at);
                    const movieUrl = entry.tmdb_id ? `/movie/tmdb-${entry.tmdb_id}` : null;

                    return (
                      <div
                        key={entry.id || idx}
                        style={{
                          display: 'flex',
                          gap: 14,
                          padding: 14,
                          background: 'rgba(0,0,0,0.25)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          alignItems: 'center',
                        }}
                      >
                        {/* Date badge */}
                        <div style={{ width: 70, flexShrink: 0, textAlign: 'center', borderRight: '1px solid var(--border-subtle)', paddingRight: 10 }}>
                          <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {dateObj.toLocaleDateString(undefined, { month: 'short' })}
                          </div>
                          <div style={{ fontSize: 20, fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {dateObj.getDate()}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            {dateObj.getFullYear()}
                          </div>
                        </div>

                        {/* Poster thumbnail */}
                        {entry.poster_url && (
                          <img
                            src={entry.poster_url}
                            alt={entry.movie_title}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                          />
                        )}

                        {/* Title & Notes */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {movieUrl ? (
                              <Link
                                to={movieUrl}
                                style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
                              >
                                {entry.movie_title}
                              </Link>
                            ) : (
                              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                                {entry.movie_title}
                              </span>
                            )}

                            {entry.personal_rating && (
                              <span style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                <Star size={11} fill="var(--gold)" /> {entry.personal_rating}
                              </span>
                            )}

                            {entry.is_rewatch && (
                              <span className="badge badge-dim" style={{ fontSize: 9 }}>🔁 Rewatch</span>
                            )}
                          </div>

                          {entry.review_text && (
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
                              "{entry.review_text}"
                            </p>
                          )}

                          {Array.isArray(entry.tags) && entry.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                              {entry.tags.map(t => (
                                <span key={t} style={{ fontSize: 9, color: 'var(--gold)', background: 'var(--gold-faint)', padding: '1px 6px', borderRadius: 10 }}>
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: COLLECTIONS ── */}
          {activeArchiveTab === 'collections' && (
            <div>
              {collectionsList.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.15)', border: '1px dashed var(--border-subtle)', borderRadius: 6 }}>
                  <Folder size={32} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: 10 }} />
                  <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                    {isOwnProfile ? 'No movie collections created yet' : `${profileUser.displayName} hasn't created any collections yet`}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
                    {isOwnProfile ? 'Group movies into custom themed lists like "Sci-Fi Masterpieces" or "Weekend Marathons"!' : 'Custom lists will appear here once created.'}
                  </p>
                  {isOwnProfile && (
                    <Link to="/library/collections" className="btn btn-primary btn-sm">
                      Create Collection
                    </Link>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {collectionsList.map(col => (
                    <div
                      key={col.id}
                      onClick={() => navigate(`/collection/${col.id}`)}
                      className="interactive-card"
                      style={{
                        padding: 16,
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span className="badge badge-gold" style={{ fontSize: 9 }}>
                            {col.movie_ids?.length || 0} Titles
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(col.updated_at || col.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                          {col.name}
                        </h4>
                        {col.description && (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                            {col.description}
                          </p>
                        )}
                      </div>

                      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--gold)', fontSize: 11, fontWeight: 600 }}>
                        <span>Explore Collection →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 4: REVIEWS & COMMENTS ── */}
          {activeArchiveTab === 'reviews' && (
            <div>
              {userReviews.length === 0 ? (
                <div style={{ padding: '48px 20px', background: 'rgba(0,0,0,0.15)', border: '1px dashed var(--border-subtle)', textAlign: 'center', borderRadius: 6 }}>
                  <MessageSquare size={32} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: 10 }} />
                  <h4 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                    {isOwnProfile ? 'No comments or reviews written yet' : `${profileUser.displayName} hasn't written any reviews yet`}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
                    {isOwnProfile ? 'Browse films & theaters to rate and leave your impressions!' : 'Check back after more cinema screenings.'}
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
                      <div key={rev.id} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', padding: 18, borderRadius: 6 }}>
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

          {/* ── TAB 5: WEEKEND VOTES ── */}
          {activeArchiveTab === 'votes' && (
            <div>
              {/* Votes Overview Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 18 }}>
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
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  {isOwnProfile
                    ? "You haven't voted in any weekend rounds yet. Cast your vote this weekend to support your favorite movies & series!"
                    : `${profileUser.displayName} hasn't voted in any weekend rounds yet.`}
                  <div style={{ marginTop: 12 }}>
                    <Link to="/weekend" className="btn btn-outline btn-sm">
                      Go to Weekend Voting →
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                    Recent Poll Votes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {userPastVotes.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'rgba(0,0,0,0.25)',
                          borderRadius: 4,
                          border: '1px solid var(--border-subtle)',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-gold" style={{ fontSize: 9 }}>{v.genreId?.toUpperCase() || 'GENRE'}</span>
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
          )}
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

