import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Tv, ExternalLink, Film, Calendar, ChevronLeft, ChevronRight, Sparkles, Play, Loader2 } from 'lucide-react';
import { useApp } from '../../AppContext';

// High-confidence, verified latest OTT releases fallback
// This ensures that even before Supabase syncs or if remote database lacks OTT fields,
// the popup ALWAYS has real, beautiful content with working TMDB poster images & links!
export const DEFAULT_OTT_RELEASES = [
  {
    id: 'devara-part-1',
    title: 'Devara: Part 1',
    posterUrl: 'https://image.tmdb.org/t/p/w500/lQfuaXjANoTsdx5iS0gCXlK9D2L.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/hAQnXxOwCjgYcKRgTdYPRC8neqL.jpg',
    language: 'Telugu',
    runtime: '2h 58m',
    genres: ['Action', 'Drama', 'Thriller'],
    overview: 'An epic coastal action saga following Devara, a fearless sea commander who fiercely protects his homeland and clan against maritime smuggling and treacherous betrayal.',
    ottPlatform: 'Netflix',
    ottReleaseDate: '2024-11-08',
    ottUrl: 'https://www.netflix.com/title/81729606',
  },
  {
    id: 'lucky-baskhar',
    title: 'Lucky Baskhar',
    posterUrl: 'https://image.tmdb.org/t/p/w500/a47JQFl9L7VDa79tEvnTOJe0rPa.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/q8UyN4XhpmChtneZXdZ8fktQka6.jpg',
    language: 'Telugu',
    runtime: '2h 30m',
    genres: ['Drama', 'Thriller', 'Crime'],
    overview: 'A frustrated middle-class bank cashier in 1980s Bombay pulls off audacious financial scams to achieve immense wealth, risking everything in the process.',
    ottPlatform: 'Netflix',
    ottReleaseDate: '2024-11-28',
    ottUrl: 'https://www.netflix.com',
  },
  {
    id: 'amaran',
    title: 'Amaran',
    posterUrl: 'https://image.tmdb.org/t/p/w500/eCB06m1KUGilEOlIzb40nkQhVY0.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/7cNE2qydew1c8fqnlhWjkE3DHc2.jpg',
    language: 'Tamil',
    runtime: '2h 47m',
    genres: ['Action', 'Biography', 'War'],
    overview: 'The real-life heroic story of Major Mukund Varadarajan, an Indian Army officer awarded the Ashoka Chakra for courage during anti-terrorist operations in Kashmir.',
    ottPlatform: 'Netflix',
    ottReleaseDate: '2024-12-05',
    ottUrl: 'https://www.netflix.com',
  },
  {
    id: 'saripodhaa-sanivaram',
    title: 'Saripodhaa Sanivaram',
    posterUrl: 'https://image.tmdb.org/t/p/w500/e2yVhbMkpi4JvvdIhvRpS0Muge7.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/yxQACC8pPE5RpRU8nFVU830LL6u.jpg',
    language: 'Telugu',
    runtime: '2h 54m',
    genres: ['Action', 'Thriller'],
    overview: 'Surya, a man who unleashes his pent-up rage strictly on Saturdays, confronts a tyrannical police inspector Daya to protect an oppressed town.',
    ottPlatform: 'Netflix',
    ottReleaseDate: '2024-09-26',
    ottUrl: 'https://www.netflix.com',
  },
  {
    id: 'stree-2',
    title: 'Stree 2: Sarkate Ka Aatank',
    posterUrl: 'https://image.tmdb.org/t/p/w500/nfnhwfUEFuSOxxf4jDdBlY6Lccw.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/fVV0A67kDjTTQ4CvUn8LoletRmI.jpg',
    language: 'Hindi',
    runtime: '2h 27m',
    genres: ['Horror', 'Comedy'],
    overview: 'The town of Chanderi is terrorized once again by a headless phantom named Sarkata. Vicky and his loyal friends team up with Stree to defend their town.',
    ottPlatform: 'Amazon Prime Video',
    ottReleaseDate: '2024-10-10',
    ottUrl: 'https://www.primevideo.com',
  },
  {
    id: 'kalki-2898-ad',
    title: 'Kalki 2898 AD',
    posterUrl: 'https://image.tmdb.org/t/p/w500/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/o8XSR1SONnjcsv84NRu6Mwsl5io.jpg',
    language: 'Telugu',
    runtime: '3h 01m',
    genres: ['Sci-Fi', 'Action', 'Epic'],
    overview: 'In a dystopian 2898 AD Kasi ruled by Supreme Yaskin, ancient Mahabharata warriors awaken as the prophecy of Lord Kalki unfolds.',
    ottPlatform: 'Netflix, Amazon Prime Video',
    ottReleaseDate: '2024-08-22',
    ottUrl: 'https://www.netflix.com/title/81732650',
  },
];

// Branded styling for major OTT platforms
const BRAND_COLORS = {
  'netflix': { bg: '#E50914', text: '#FFFFFF', name: 'Netflix', border: 'rgba(229, 9, 20, 0.4)' },
  'amazon prime video': { bg: '#00A8E1', text: '#FFFFFF', name: 'Prime Video', border: 'rgba(0, 168, 225, 0.4)' },
  'prime video': { bg: '#00A8E1', text: '#FFFFFF', name: 'Prime Video', border: 'rgba(0, 168, 225, 0.4)' },
  'disney+ hotstar': { bg: '#0C3C82', text: '#FFFFFF', name: 'Disney+ Hotstar', border: 'rgba(12, 60, 130, 0.4)' },
  'hotstar': { bg: '#0C3C82', text: '#FFFFFF', name: 'Disney+ Hotstar', border: 'rgba(12, 60, 130, 0.4)' },
  'aha': { bg: '#FF5C00', text: '#FFFFFF', name: 'Aha Video', border: 'rgba(255, 92, 0, 0.4)' },
  'zee5': { bg: '#8230C6', text: '#FFFFFF', name: 'Zee5', border: 'rgba(130, 48, 198, 0.4)' },
  'sonyliv': { bg: '#002B49', text: '#FFFFFF', name: 'SonyLIV', border: 'rgba(0, 43, 73, 0.4)' },
  'jiocinema': { bg: '#E11383', text: '#FFFFFF', name: 'JioCinema', border: 'rgba(225, 19, 131, 0.4)' },
  'apple tv': { bg: '#1c1c1e', text: '#FFFFFF', name: 'Apple TV', border: 'rgba(255, 255, 255, 0.3)' },
};

function getBrandInfo(platformName = '') {
  if (!platformName) return { bg: '#dcb65b', text: '#000000', name: 'OTT Streaming', border: 'rgba(220,182,91,0.4)' };
  const first = platformName.split(',')[0].trim().toLowerCase();
  for (const [key, val] of Object.entries(BRAND_COLORS)) {
    if (first.includes(key) || key.includes(first)) {
      return val;
    }
  }
  return { bg: 'rgba(220,182,91,0.9)', text: '#000000', name: platformName.split(',')[0].trim(), border: 'rgba(220,182,91,0.4)' };
}

function formatReleaseDate(dateStr) {
  if (!dateStr) return 'Streaming Now';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function OttReleasePopupModal() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [ottMovies, setOttMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveData, setIsLiveData] = useState(false);
  const filmstripRef = useRef(null);

  // Auto-scroll active thumbnail into view in filmstrip
  useEffect(() => {
    if (!filmstripRef.current) return;
    const activeEl = filmstripRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  // Fetch live TMDB OTT releases (last 30 days) on mount
  useEffect(() => {
    let cancelled = false;
    async function loadLiveOttReleases() {
      setIsLoading(true);
      try {
        const { fetchRecentOttReleasesIndia } = await import('../../services/tmdbService');
        const liveMovies = await fetchRecentOttReleasesIndia();
        if (cancelled) return;

        if (liveMovies && liveMovies.length > 0) {
          // Sort descending by OTT release date (most recent first)
          const sorted = [...liveMovies].sort((a, b) => {
            const da = new Date(a.ottReleaseDate || a.releaseDate || 0).getTime();
            const db = new Date(b.ottReleaseDate || b.releaseDate || 0).getTime();
            return db - da;
          });
          setOttMovies(sorted);
          setIsLiveData(true);
        } else {
          // No live results within 30 days — use fallback
          setOttMovies(DEFAULT_OTT_RELEASES);
          setIsLiveData(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('OTT popup: live fetch failed, using fallback', err);
          setOttMovies(DEFAULT_OTT_RELEASES);
          setIsLiveData(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadLiveOttReleases();
    return () => { cancelled = true; };
  }, []);

  const activeMovie = ottMovies[currentIndex] || ottMovies[0] || DEFAULT_OTT_RELEASES[0];

  // Auto-pop logic when user visits the site
  useEffect(() => {
    // Check if dismissed for today via localStorage
    const dismissedUntil = localStorage.getItem('cinemascope_ott_popup_dismissed_until');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return;
    }

    // Check if dismissed in this specific tab session via Close button
    const sessionDismissed = sessionStorage.getItem('cinemascope_ott_popup_closed_session');
    if (sessionDismissed === 'true') {
      return;
    }

    // Auto-pop cleanly after brief 500ms delay for smooth page entry
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Support manual trigger from Navbar or any button via custom event
  useEffect(() => {
    const handleManualOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-ott-popup', handleManualOpen);
    return () => window.removeEventListener('open-ott-popup', handleManualOpen);
  }, []);

  // Keyboard navigation & Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' && ottMovies.length > 1) {
        setCurrentIndex(prev => (prev + 1) % ottMovies.length);
      } else if (e.key === 'ArrowLeft' && ottMovies.length > 1) {
        setCurrentIndex(prev => (prev - 1 + ottMovies.length) % ottMovies.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, ottMovies.length]);

  const [touchStartX, setTouchStartX] = useState(null);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || !e.changedTouches || !e.changedTouches[0]) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 40 && ottMovies.length > 1) {
      // Swiped left -> Next movie
      setCurrentIndex(prev => (prev + 1) % ottMovies.length);
    } else if (diff < -40 && ottMovies.length > 1) {
      // Swiped right -> Previous movie
      setCurrentIndex(prev => (prev - 1 + ottMovies.length) % ottMovies.length);
    }
    setTouchStartX(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('cinemascope_ott_popup_closed_session', 'true');
    if (dontShowToday) {
      // Dismiss for 24 hours
      const nextDay = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('cinemascope_ott_popup_dismissed_until', String(nextDay));
    }
  };

  const handleNavigateMovie = () => {
    if (!activeMovie) return;
    handleClose();
    const targetId = activeMovie.tmdbId ? `tmdb-${activeMovie.tmdbId}` : activeMovie.id;
    navigate(`/movie/${targetId}`);
  };

  if (!isOpen) return null;

  // While fetching live data, show a loading overlay
  if (isLoading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          background: 'linear-gradient(180deg, #181410 0%, #0d0a08 100%)',
          border: '1px solid rgba(220,182,91,0.35)',
          borderRadius: 14,
          padding: '40px 56px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}>
          <Loader2 size={36} color="var(--gold)" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontFamily: 'var(--font-serif)', letterSpacing: '0.05em' }}>
            Fetching latest OTT releases…
          </p>
        </div>
      </div>
    );
  }

  if (!activeMovie) return null;

  const fallbackPlatformUrl = () => {
    const p = (activeMovie.ottPlatform || '').toLowerCase();
    if (p.includes('netflix')) return 'https://www.netflix.com';
    if (p.includes('prime') || p.includes('amazon')) return 'https://www.primevideo.com';
    if (p.includes('hotstar')) return 'https://www.hotstar.com';
    if (p.includes('zee5')) return 'https://www.zee5.com';
    if (p.includes('aha')) return 'https://www.aha.video';
    if (p.includes('sonyliv')) return 'https://www.sonyliv.com';
    if (p.includes('apple')) return 'https://tv.apple.com';
    if (p.includes('jio')) return 'https://www.jiocinema.com';
    return null;
  };
  const brand = getBrandInfo(activeMovie.ottPlatform);
  const formattedDate = formatReleaseDate(activeMovie.ottReleaseDate);
  const watchUrl = activeMovie.ottUrl || activeMovie.ottWatchUrl || fallbackPlatformUrl();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'ottFadeIn 200ms ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          background: 'linear-gradient(180deg, #181410 0%, #0d0a08 100%)',
          border: '1px solid rgba(220, 182, 91, 0.4)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(220, 182, 91, 0.15)',
          borderRadius: 14,
          maxWidth: 620,
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          animation: 'ottModalIn 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Hero Banner with Backdrop */}
        <div
          style={{
            height: 210,
            position: 'relative',
            background: activeMovie.backdropUrl
              ? `url(${activeMovie.backdropUrl}) center/cover no-repeat`
              : activeMovie.posterUrl
              ? `url(${activeMovie.posterUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg, #2b1f14, #120e0a)',
          }}
        >
          {/* Gradients to blend into dark card body */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(13,10,8,0.7) 60%, #0d0a08 100%)',
            }}
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 30,
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(220,182,91,0.25)';
              e.currentTarget.style.borderColor = 'var(--gold)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
          >
            <X size={18} />
          </button>

          {/* Multiple releases switcher pill at top-right (unblocked by content body) */}
          {ottMovies.length > 1 && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                right: 56,
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: 'rgba(0,0,0,0.78)',
                padding: '3px 8px',
                borderRadius: 20,
                border: '1px solid rgba(220,182,91,0.35)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(prev => (prev - 1 + ottMovies.length) % ottMovies.length);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                title="Previous OTT title"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-serif)', fontWeight: 700, padding: '0 4px', userSelect: 'none' }}>
                {currentIndex + 1} / {ottMovies.length}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(prev => (prev + 1) % ottMovies.length);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                title="Next OTT title"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Prominent Side Navigation Arrows */}
          {ottMovies.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(prev => (prev - 1 + ottMovies.length) % ottMovies.length);
                }}
                aria-label="Previous movie"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 25,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.65)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(6px)',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(220,182,91,0.3)';
                  e.currentTarget.style.borderColor = 'var(--gold)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.65)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(prev => (prev + 1) % ottMovies.length);
                }}
                aria-label="Next movie"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 25,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.65)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(6px)',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(220,182,91,0.3)';
                  e.currentTarget.style.borderColor = 'var(--gold)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.65)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Top Live Badge */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 20,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(220, 182, 91, 0.55)',
                borderRadius: 20,
                color: 'var(--gold)',
                fontSize: 10,
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Sparkles size={11} color="var(--gold)" />
              Latest OTT Release
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                background: isLiveData ? 'rgba(16, 185, 129, 0.18)' : 'rgba(220,182,91,0.12)',
                border: `1px solid ${isLiveData ? 'rgba(16, 185, 129, 0.45)' : 'rgba(220,182,91,0.35)'}`,
                borderRadius: 20,
                color: isLiveData ? '#34d399' : 'var(--gold)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isLiveData ? '#34d399' : 'var(--gold)',
                  boxShadow: isLiveData ? '0 0 8px #34d399' : '0 0 6px var(--gold)',
                  display: 'inline-block',
                }}
              />
              {isLiveData ? 'Live · Last 30 Days' : 'Streaming Now'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '0 24px 22px', position: 'relative' }}>
          {/* Overlapping Poster + Title Row */}
          <div style={{ display: 'flex', gap: 18, marginTop: -50, alignItems: 'flex-end', marginBottom: 16 }}>
            {/* Poster */}
            <div
              onClick={handleNavigateMovie}
              style={{
                width: 96,
                height: 142,
                borderRadius: 8,
                overflow: 'hidden',
                flexShrink: 0,
                border: '2px solid rgba(220, 182, 91, 0.45)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                cursor: 'pointer',
                background: '#1a1612',
                transition: 'transform 180ms ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img
                src={activeMovie.posterUrl}
                alt={activeMovie.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = '/demo-frame.jpg'; }}
              />
            </div>

            {/* Title & Streaming Platform Badge */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Platform Branding Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 4,
                    background: brand.bg,
                    color: brand.text,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    boxShadow: `0 2px 8px ${brand.border}`,
                  }}
                >
                  <Tv size={12} />
                  {brand.name}
                </span>

                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={11} />
                  {formattedDate}
                </span>
              </div>

              <h2
                onClick={handleNavigateMovie}
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 4px',
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeMovie.title}
              </h2>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span>{activeMovie.language || 'Telugu'}</span>
                <span>•</span>
                <span>{activeMovie.runtime || 'Movie'}</span>
                {activeMovie.genres && activeMovie.genres.length > 0 && (
                  <>
                    <span>•</span>
                    <span style={{ color: 'var(--text-muted)' }}>{activeMovie.genres.slice(0, 2).join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Synopsis */}
          {activeMovie.overview && (
            <p
              style={{
                fontSize: 12.5,
                lineHeight: 1.55,
                color: 'var(--text-muted)',
                margin: '0 0 20px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {activeMovie.overview}
            </p>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: watchUrl ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 14 }}>
            {watchUrl && (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 6,
                  textDecoration: 'none',
                  background: brand.bg === '#E50914'
                    ? 'linear-gradient(135deg, #E50914, #B81D24)'
                    : brand.bg === '#00A8E1'
                    ? 'linear-gradient(135deg, #00A8E1, #007EB9)'
                    : 'var(--gold)',
                  color: brand.bg === '#E50914' || brand.bg === '#00A8E1' ? '#FFFFFF' : '#000000',
                  border: 'none',
                }}
              >
                <Play size={14} fill="currentColor" />
                Stream on {brand.name}
                <ExternalLink size={12} />
              </a>
            )}

            <button
              type="button"
              onClick={handleNavigateMovie}
              className="btn btn-outline"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 16px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 6,
              }}
            >
              <Film size={14} />
              Theater Specs & Reviews
            </button>
          </div>

          {/* Scrollable Filmstrip of All Releases */}
          {ottMovies.length > 1 && (
            <div style={{ marginTop: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-serif)', fontWeight: 700, letterSpacing: '0.04em' }}>
                  All Latest OTT Releases ({ottMovies.length})
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  Scroll or tap to view
                </span>
              </div>
              <div
                ref={filmstripRef}
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  padding: '4px 2px 8px',
                  scrollbarWidth: 'thin',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {ottMovies.map((m, idx) => (
                  <button
                    key={m.id || idx}
                    type="button"
                    data-active={idx === currentIndex}
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      flexShrink: 0,
                      width: 46,
                      height: 66,
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: idx === currentIndex ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.18)',
                      background: '#1a1612',
                      cursor: 'pointer',
                      padding: 0,
                      position: 'relative',
                      transform: idx === currentIndex ? 'scale(1.06)' : 'scale(1)',
                      transition: 'all 150ms ease',
                      boxShadow: idx === currentIndex ? '0 0 12px rgba(220,182,91,0.55)' : 'none',
                    }}
                    title={`${m.title} (${m.language || ''})`}
                  >
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/demo-frame.jpg'; }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Bar: Carousel navigation & Don't show today checkbox */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 10,
              borderTop: '1px solid var(--border-subtle)',
              fontSize: 11,
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={e => setDontShowToday(e.target.checked)}
                style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
              />
              <span>Don't show again today</span>
            </label>

            {ottMovies.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255,255,255,0.06)',
                  padding: '3px 8px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setCurrentIndex(prev => (prev - 1 + ottMovies.length) % ottMovies.length)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 4px', display: 'flex' }}
                  title="Previous"
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-serif)', fontWeight: 700, padding: '0 4px', userSelect: 'none' }}>
                  {currentIndex + 1} of {ottMovies.length}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentIndex(prev => (prev + 1) % ottMovies.length)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 4px', display: 'flex' }}
                  title="Next"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
