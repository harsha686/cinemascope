/**
 * SOCIAL SHARING SERVICE
 * Central engine for formatting shareable content, managing aesthetic card templates,
 * generating canonical URLs, Open Graph metadata, and tracking social share analytics.
 */

export const SOCIAL_CONTENT_TYPES = {
  MOVIE: 'MOVIE',
  REVIEW: 'REVIEW',
  USER_PROFILE: 'USER_PROFILE',
  LIST: 'LIST',
  COLLECTION: 'COLLECTION',
  DIARY_ENTRY: 'DIARY_ENTRY',
  WEEKEND_WINNER: 'WEEKEND_WINNER',
  USER_STATS: 'USER_STATS',
};

export const SOCIAL_FORMATS = [
  {
    id: 'story',
    label: 'Instagram Story',
    ratioLabel: '9:16',
    aspectRatio: '9 / 16',
    width: 1080,
    height: 1920,
    badge: '📱 9:16 Story',
    safeTop: 120,
    safeBottom: 160,
  },
  {
    id: 'portrait',
    label: 'Portrait Post',
    ratioLabel: '4:5',
    aspectRatio: '4 / 5',
    width: 1080,
    height: 1350,
    badge: '📸 4:5 Feed',
    safeTop: 40,
    safeBottom: 60,
  },
  {
    id: 'square',
    label: 'Square Post',
    ratioLabel: '1:1',
    aspectRatio: '1 / 1',
    width: 1080,
    height: 1080,
    badge: '⏹️ 1:1 Square',
    safeTop: 30,
    safeBottom: 40,
  },
  {
    id: 'landscape',
    label: 'X / Twitter Post',
    ratioLabel: '16:9',
    aspectRatio: '16 / 9',
    width: 1600,
    height: 900,
    badge: '🐦 16:9 Landscape',
    safeTop: 30,
    safeBottom: 30,
  },
];

export const TEMPLATE_STYLES = [
  {
    id: 'keyart',
    name: 'Studio Accolade',
    emoji: '🏆',
    description: 'Full-bleed key-art, official award banner, and studio masthead.',
    bg: '#000000',
    textColor: '#ffffff',
    accentColor: '#fce08b',
    badgeBg: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    fontFamily: 'sans-serif',
    isKeyArt: true,
  },
  {
    id: 'cinematic',
    name: 'Cinematic Gold',
    emoji: '🎬',
    description: 'Dark, dramatic, high-contrast with glowing gold accents.',
    bg: 'radial-gradient(ellipse at center, rgba(30,26,18,0.98) 0%, rgba(10,10,12,1) 85%)',
    textColor: '#ffffff',
    accentColor: '#c9a84c',
    badgeBg: 'linear-gradient(135deg, rgba(201,168,76,0.25), rgba(201,168,76,0.08))',
    borderColor: 'rgba(201,168,76,0.35)',
    fontFamily: 'serif',
  },
  {
    id: 'scrapbook',
    name: 'Scrapbook',
    emoji: '✂️',
    description: 'Analog paper textures, tape corners, doodles, and polaroid frame aesthetic.',
    bg: 'linear-gradient(135deg, #1c1a17 0%, #121110 100%)',
    textColor: '#f5f0e6',
    accentColor: '#e0af68',
    badgeBg: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(245,240,230,0.25)',
    fontFamily: 'sans-serif',
    isScrapbook: true,
  },
  {
    id: 'minimal',
    name: 'Clean Minimal',
    emoji: '◻️',
    description: 'Clean modern typography, vast negative space, pure elegance.',
    bg: '#0c0c0e',
    textColor: '#ffffff',
    accentColor: '#e2e8f0',
    badgeBg: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
    fontFamily: 'sans-serif',
  },
  {
    id: 'neon',
    name: 'Neon Cyber',
    emoji: '⚡',
    description: 'Bold vibrant Gen Z aesthetic with vivid cyan and purple glows.',
    bg: 'radial-gradient(ellipse at top left, rgba(20,24,45,0.95), rgba(8,8,12,1))',
    textColor: '#ffffff',
    accentColor: '#38bdf8',
    secondaryAccent: '#ec4899',
    badgeBg: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(236,72,153,0.2))',
    borderColor: 'rgba(56,189,248,0.5)',
    fontFamily: 'sans-serif',
  },
  {
    id: 'filmroll',
    name: 'Film Roll',
    emoji: '🎞️',
    description: 'Analog 35mm film strips with perforated edges and frame numbers.',
    bg: '#0a0a0c',
    textColor: '#e4e4e7',
    accentColor: '#fbbf24',
    badgeBg: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.4)',
    fontFamily: 'monospace',
    isFilmRoll: true,
  },
  {
    id: 'editorial',
    name: 'Editorial Magazine',
    emoji: '📰',
    description: 'High-fashion editorial print layout with oversized serif quotes.',
    bg: 'linear-gradient(180deg, #141416 0%, #0c0c0e 100%)',
    textColor: '#fafafa',
    accentColor: '#f43f5e',
    badgeBg: 'rgba(244,63,94,0.15)',
    borderColor: 'rgba(244,63,94,0.3)',
    fontFamily: 'serif',
  },
  {
    id: 'retro',
    name: 'Vintage Cinema Ticket',
    emoji: '🎟️',
    description: 'Classic cinema stub aesthetic with perforated borders and retro stamps.',
    bg: '#161412',
    textColor: '#fed7aa',
    accentColor: '#f97316',
    badgeBg: 'rgba(249,115,22,0.15)',
    borderColor: 'rgba(249,115,22,0.4)',
    fontFamily: 'monospace',
    isTicket: true,
  },
  {
    id: 'darkmode',
    name: 'Obsidian OLED',
    emoji: '🖤',
    description: 'Deep pitch black with razor-sharp typography and glossy glass highlights.',
    bg: '#000000',
    textColor: '#ffffff',
    accentColor: '#a1a1aa',
    badgeBg: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    fontFamily: 'sans-serif',
  },
];

const RECENT_CREATIONS_KEY = 'cinemascope_recent_creations';
const SHARE_ANALYTICS_KEY = 'cinemascope_share_analytics';

/**
 * Normalizes input data into standard Shareable Content Model
 */
export function normalizeShareableContent({
  type = SOCIAL_CONTENT_TYPES.MOVIE,
  data = {},
  user = null,
}) {
  const baseCanonical = window.location.origin;

  switch (type) {
    case SOCIAL_CONTENT_TYPES.REVIEW: {
      const movieTitle = data.movieTitle || data.movie?.title || data.title || 'Movie Review';
      const cleanExcerpt = extractSmartReviewExcerpt(data.reviewText || data.review || data.content || '');
      const rating = data.rating || data.personal_rating || 5;

      return {
        type: SOCIAL_CONTENT_TYPES.REVIEW,
        id: data.id || `rev-${Date.now()}`,
        headline: `${user?.displayName || data.userDisplayName || 'User'}'s Review`,
        title: movieTitle,
        subtitle: data.releaseYear ? `Released ${data.releaseYear}` : (data.movie?.releaseDate || ''),
        posterUrl: data.posterUrl || data.poster_url || data.movie?.posterUrl || '',
        backdropUrl: data.backdropUrl || data.movie?.backdropUrl || '',
        rating: Number(rating),
        quote: cleanExcerpt,
        fullText: data.reviewText || data.review || '',
        authorName: data.userDisplayName || user?.displayName || 'Film Lover',
        authorHandle: data.userHandle || (data.userDisplayName ? `@${data.userDisplayName.toLowerCase().replace(/\s+/g, '')}` : '@cinemascope_fan'),
        isPro: !!(data.reviewType === 'PROFESSIONAL' || data.isVerifiedPro),
        proPublication: data.publicationName || '',
        posters: data.posterUrl ? [data.posterUrl] : [],
        dateStr: formatDateStr(data.createdAt || data.watched_on || new Date()),
        canonicalUrl: `${baseCanonical}/#/review/${data.id || 'public'}`,
      };
    }

    case SOCIAL_CONTENT_TYPES.USER_STATS: {
      const stats = data.stats || {};
      return {
        type: SOCIAL_CONTENT_TYPES.USER_STATS,
        id: `stats-${user?.id || 'me'}`,
        headline: `MY 2026 IN CINEMA`,
        title: user?.displayName || 'Cinemascope Member',
        subtitle: `Curated Personal Archive`,
        authorName: user?.displayName || 'Cinema Explorer',
        authorHandle: user?.handle || '@cinemascope_user',
        statsList: [
          { label: 'Movies Watched', value: stats.totalWatched || 0, emoji: '🍿' },
          { label: 'Personal Ratings', value: stats.totalRated || 0, emoji: '⭐' },
          { label: 'Watchlist Saved', value: stats.totalWatchlist || 0, emoji: '🔖' },
          { label: 'Average Score', value: stats.avgRating ? `${stats.avgRating} / 5` : '4.5 / 5', emoji: '🏆' },
          { label: 'Weekend Polls', value: stats.weekendVotes || 0, emoji: '🔥' },
        ],
        posters: (data.favoritePosters || []).slice(0, 4),
        quote: "Every film leaves a mark. Here is my cinematic journey.",
        dateStr: `${new Date().getFullYear()} Recap`,
        canonicalUrl: `${baseCanonical}/#/reviewer/${user?.id || 'profile'}`,
      };
    }

    case SOCIAL_CONTENT_TYPES.LIST:
    case SOCIAL_CONTENT_TYPES.COLLECTION: {
      const movies = data.movies || data.items || [];
      const posters = movies.map(m => m.posterUrl || m.poster_url).filter(Boolean);
      return {
        type: type,
        id: data.id || `col-${Date.now()}`,
        headline: type === SOCIAL_CONTENT_TYPES.COLLECTION ? 'CURATED COLLECTION' : 'CUSTOM MOVIE LIST',
        title: data.name || data.title || 'My Favorite Movies',
        subtitle: `${movies.length} Films Selected`,
        description: data.description || '',
        authorName: user?.displayName || data.creatorName || 'Film Curator',
        authorHandle: user ? `@${user.displayName.toLowerCase().replace(/\s+/g, '')}` : '@cinemascope',
        movies: movies.slice(0, 10),
        posters: posters.slice(0, 6),
        quote: data.description ? `"${data.description}"` : 'Handpicked and recommended for fellow movie lovers.',
        dateStr: formatDateStr(data.updated_at || data.created_at || new Date()),
        canonicalUrl: `${baseCanonical}/#/collection/${data.id || ''}`,
      };
    }

    case SOCIAL_CONTENT_TYPES.WEEKEND_WINNER: {
      return {
        type: SOCIAL_CONTENT_TYPES.WEEKEND_WINNER,
        id: data.roundId || `win-${Date.now()}`,
        headline: '🏆 WEEKEND COMMUNITY PICK',
        title: data.title || 'Standout Champion',
        subtitle: `${(data.genreName || 'Cinema').toUpperCase()} GENRE WINNER`,
        posterUrl: data.posterUrl || '',
        backdropUrl: data.backdropUrl || '',
        rating: 5,
        communityScore: data.communityScore || 94,
        voteCount: data.voteCount || 18400,
        votePercentage: data.votePercentage || 64.2,
        edition: data.edition || 'Weekly Edition',
        posters: data.posterUrl ? [data.posterUrl] : [],
        quote: `Voted #1 by the Cinemascope community with ${data.voteCount ? data.voteCount.toLocaleString() : 'thousands of'} votes!`,
        dateStr: 'This Weekend\'s Official Pick',
        canonicalUrl: `${baseCanonical}/#/weekend`,
      };
    }

    case SOCIAL_CONTENT_TYPES.MOVIE:
    default: {
      return {
        type: SOCIAL_CONTENT_TYPES.MOVIE,
        id: data.id || data.tmdbId || 'movie',
        headline: data.isTv ? 'NOW STREAMING' : 'CINEMASCOPE SELECTION',
        title: data.title || data.name || 'Featured Movie',
        subtitle: [data.releaseYear || (data.releaseDate ? data.releaseDate.split('-')[0] : ''), data.language].filter(Boolean).join(' · '),
        posterUrl: data.posterUrl || '',
        backdropUrl: data.backdropUrl || '',
        rating: data.personalRating || (data.voteAverage ? Math.round(data.voteAverage / 2 * 10) / 10 : 4.5),
        userRating: data.personalRating || null,
        genres: (data.genres || []).slice(0, 3).map(g => typeof g === 'string' ? g : g.name),
        quote: data.tagline ? `"${data.tagline}"` : (data.overview ? extractSmartReviewExcerpt(data.overview, 120) : 'An unforgettable cinema experience.'),
        posters: data.posterUrl ? [data.posterUrl] : [],
        runtime: data.runtime || '',
        dateStr: formatDateStr(new Date()),
        canonicalUrl: `${baseCanonical}/#/movie/${data.id || data.tmdbId}`,
      };
    }
  }
}

/**
 * Smart excerpt generator preserving punctuation and complete sentences
 */
export function extractSmartReviewExcerpt(text, maxLength = 160) {
  if (!text || typeof text !== 'string') return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;

  // Try finding sentence break within limit
  const firstSentence = clean.split(/[.!?]/)[0];
  if (firstSentence.length >= 40 && firstSentence.length <= maxLength) {
    return `${firstSentence.trim()}.`;
  }

  // Fallback to word boundary truncate
  const truncated = clean.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.substring(0, lastSpace > 0 ? lastSpace : maxLength).trim()}…`;
}

function formatDateStr(dateVal) {
  try {
    const d = new Date(dateVal);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Recent';
  }
}

/**
 * Generates Open Graph & Twitter meta tags for a given shareable item
 */
export function generateOpenGraphMetadata(normalizedContent) {
  const appName = 'CinemaScope';
  const siteUrl = window.location.origin;

  let ogTitle = `${normalizedContent.title} | ${appName}`;
  let ogDescription = normalizedContent.quote || normalizedContent.subtitle || 'Discover ratings, theaters, and formats on CinemaScope.';
  let ogImage = normalizedContent.backdropUrl || normalizedContent.posterUrl || `${siteUrl}/demo-frame.jpg`;

  if (normalizedContent.type === SOCIAL_CONTENT_TYPES.REVIEW) {
    ogTitle = `${normalizedContent.authorName} rates ${normalizedContent.title} ★${normalizedContent.rating}/5`;
    ogDescription = `"${normalizedContent.quote}" — Read the full review on CinemaScope.`;
  } else if (normalizedContent.type === SOCIAL_CONTENT_TYPES.WEEKEND_WINNER) {
    ogTitle = `🏆 Weekend Winner: ${normalizedContent.title} (${normalizedContent.subtitle})`;
    ogDescription = `Voted by the community as the standout pick for this weekend!`;
  } else if (normalizedContent.type === SOCIAL_CONTENT_TYPES.COLLECTION) {
    ogTitle = `${normalizedContent.title} (${normalizedContent.subtitle})`;
    ogDescription = `Curated movie collection on CinemaScope.`;
  }

  return {
    title: ogTitle,
    description: ogDescription,
    image: ogImage,
    url: normalizedContent.canonicalUrl,
    type: 'video.movie',
    siteName: appName,
    twitterCard: 'summary_large_image',
    twitterTitle: ogTitle,
    twitterDescription: ogDescription,
    twitterImage: ogImage,
  };
}

/**
 * Saves generated card to user history
 */
export function saveCreationToHistory(creation) {
  try {
    const raw = localStorage.getItem(RECENT_CREATIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const updated = [
      {
        ...creation,
        id: `created-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
      ...list.slice(0, 19), // keep last 20
    ];
    localStorage.setItem(RECENT_CREATIONS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save creation history:', e);
  }
}

export function getCreationHistory() {
  try {
    const raw = localStorage.getItem(RECENT_CREATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function clearCreationHistory() {
  localStorage.removeItem(RECENT_CREATIONS_KEY);
}

/**
 * Records anonymous share event
 */
export function trackShareEvent({ contentType, format, templateId, method }) {
  try {
    const raw = localStorage.getItem(SHARE_ANALYTICS_KEY);
    const events = raw ? JSON.parse(raw) : [];
    events.push({
      contentType,
      format,
      templateId,
      method, // 'DOWNLOAD' | 'NATIVE_SHARE' | 'X_SHARE' | 'WHATSAPP_SHARE' | 'COPY_LINK'
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(SHARE_ANALYTICS_KEY, JSON.stringify(events.slice(-100)));
  } catch (e) {
    // ignore
  }
}

export function getShareAnalytics() {
  try {
    const raw = localStorage.getItem(SHARE_ANALYTICS_KEY);
    const events = raw ? JSON.parse(raw) : [];
    const byMethod = {};
    const byFormat = {};
    const byTemplate = {};

    events.forEach(ev => {
      byMethod[ev.method] = (byMethod[ev.method] || 0) + 1;
      byFormat[ev.format] = (byFormat[ev.format] || 0) + 1;
      byTemplate[ev.templateId] = (byTemplate[ev.templateId] || 0) + 1;
    });

    return {
      totalShares: events.length,
      byMethod,
      byFormat,
      byTemplate,
      recentEvents: events.slice(-10).reverse(),
    };
  } catch (e) {
    return { totalShares: 0, byMethod: {}, byFormat: {}, byTemplate: {}, recentEvents: [] };
  }
}
