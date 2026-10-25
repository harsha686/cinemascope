import { tmdbFetch, fetchFullTmdbMovieDetails, getTmdbImageUrl } from './tmdbService';
import { supabaseService, isSupabaseConfigured } from './supabase';

const LAST_SYNC_KEY = 'cinemascope_last_catalog_update';
const AUTO_SYNC_ENABLED_KEY = 'cinemascope_auto_catalog_sync';

/**
 * Check if automated catalog updating is turned ON
 */
export function isAutoCatalogSyncEnabled() {
  try {
    const val = localStorage.getItem(AUTO_SYNC_ENABLED_KEY);
    return val === null ? true : val === 'true'; // Enabled by default
  } catch (e) {
    return true;
  }
}

/**
 * Enable or disable automated catalog updating
 */
export function setAutoCatalogSyncEnabled(enabled) {
  try {
    localStorage.setItem(AUTO_SYNC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (e) {}
}

/**
 * Get human-readable string of when catalog was last refreshed
 */
export function getLastCatalogUpdateTime() {
  try {
    const val = localStorage.getItem(LAST_SYNC_KEY);
    if (!val) return 'Never';
    const date = new Date(val);
    if (isNaN(date.getTime())) return 'Never';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return 'Never';
  }
}

/**
 * Normalizes title into a clean URL-friendly ID
 */
function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Intelligently distributes theaters for a movie across registered cities
 * Ensures different movies get diverse, realistic theater lineups instead of identical copies
 */
export function assignDiverseTheatersForMovie(movieIdentifier) {
  const VIZAG_THEATERS = [
    'varun-inox',
    'ambience-mall-pvr',
    'jagadamba-cinema-theatre',
    'sangam-sarat',
    'melody-theatre',
    'kameswari-kinnera',
    'miraj-cinemas',
    'aaa',
    'stbl-cine-world',
    'mukta-a2-cinemas',
    'sri-lakshmi-narasimha-theatre',
    'mohini-cinemas',
    'sree-leelamahal-theatre',
    'urvasi',
    'sree-rama-picture-palace',
    'svc-gokul-theater',
    'jyothi-theatre',
  ];

  const HYD_THEATERS = [
    'sandhya-70-mm-8697',
    'aparna-cinemas',
    'art-cinemas',
  ];

  let hash = 0;
  const str = String(movieIdentifier || 'movie');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const vizagCount = 3 + (posHash % 4); // 3 to 6
  const vizagPicked = [];
  const vizagPool = [...VIZAG_THEATERS];
  for (let i = 0; i < vizagCount; i++) {
    const idx = (posHash + i * 3) % vizagPool.length;
    vizagPicked.push(vizagPool.splice(idx, 1)[0]);
  }

  const hydCount = 1 + (posHash % 2); // 1 or 2
  const hydPicked = [];
  const hydPool = [...HYD_THEATERS];
  for (let i = 0; i < hydCount; i++) {
    const idx = (posHash + i * 2) % hydPool.length;
    hydPicked.push(hydPool.splice(idx, 1)[0]);
  }

  return [...vizagPicked, ...hydPicked];
}

/**
 * Fetch top recent and upcoming Indian theatrical releases from TMDB
 */
export async function fetchLiveIndianCatalog({ deletedMovieIds = [], limit = 8 } = {}) {
  const deletedSet = new Set((deletedMovieIds || []).map(id => String(id).toLowerCase()));
  const today = new Date().toISOString().split('T')[0];
  const dPast = new Date();
  dPast.setDate(dPast.getDate() - 75); // Last 75 days
  const gteDate = dPast.toISOString().split('T')[0];

  const dFuture = new Date();
  dFuture.setDate(dFuture.getDate() + 90); // Next 90 days
  const lteDateFuture = dFuture.toISOString().split('T')[0];

  const discoveredCandidates = [];
  const seenTmdbIds = new Set();

  try {
    // 1. Fetch Indian releases in Telugu, Tamil, Hindi, Malayalam, Kannada with verified vote threshold
    const indianNowPlaying = await tmdbFetch(
      `/discover/movie?region=IN&sort_by=popularity.desc&primary_release_date.gte=${gteDate}&primary_release_date.lte=${today}&with_original_language=te|ta|hi|ml|kn&with_origin_country=IN&include_adult=false&vote_count.gte=15&page=1`
    );

    (indianNowPlaying.results || []).forEach(m => {
      if (m.id && m.poster_path && (m.title || m.original_title)) {
        if (!seenTmdbIds.has(m.id)) {
          seenTmdbIds.add(m.id);
          discoveredCandidates.push({ ...m, isUpcoming: false });
        }
      }
    });

    // 2. Fetch Now Playing in Indian theaters with verified vote threshold
    const nowPlayingAll = await tmdbFetch(`/movie/now_playing?region=IN&page=1`);
    (nowPlayingAll.results || []).forEach(m => {
      if (m.id && m.poster_path && (m.title || m.original_title) && (m.vote_count || 0) >= 15) {
        if (!seenTmdbIds.has(m.id)) {
          seenTmdbIds.add(m.id);
          discoveredCandidates.push({ ...m, isUpcoming: false });
        }
      }
    });

    // 3. Fetch upcoming Indian movies for Coming Soon tab
    const indianUpcoming = await tmdbFetch(
      `/discover/movie?region=IN&sort_by=popularity.desc&primary_release_date.gte=${today}&primary_release_date.lte=${lteDateFuture}&with_original_language=te|ta|hi|ml|kn&with_origin_country=IN&include_adult=false&page=1`
    );
    (indianUpcoming.results || []).forEach(m => {
      if (m.id && m.poster_path && (m.title || m.original_title)) {
        if (!seenTmdbIds.has(m.id)) {
          seenTmdbIds.add(m.id);
          discoveredCandidates.push({ ...m, isUpcoming: true });
        }
      }
    });
  } catch (err) {
    console.warn('Error discovering Indian catalog from TMDB:', err);
    return [];
  }

  // Filter candidates against blacklist
  const validCandidates = discoveredCandidates.filter(m => {
    const slug = slugify(m.title || m.original_title);
    if (deletedSet.has(slug)) return false;
    if (deletedSet.has(`tmdb-${m.id}`)) return false;
    if (deletedSet.has(String(m.id))) return false;
    return true;
  });

  // Enrich top candidates with full credits, trailers, and certifications
  const enrichedMovies = [];
  const selectedCandidates = validCandidates.slice(0, limit * 2);

  for (const item of selectedCandidates) {
    if (enrichedMovies.length >= limit) break;
    try {
      const details = await fetchFullTmdbMovieDetails(item.id);
      if (!details) continue;

      const slug = slugify(details.title || item.title);
      if (deletedSet.has(slug) || deletedSet.has(`tmdb-${item.id}`)) continue;

      const isUpcoming = Boolean(item.isUpcoming || (details.releaseDate && details.releaseDate > today));

      // STRICT FILTERING: Prevent unreleased, fake, or non-theatrical titles from entering Now Showing
      if (!isUpcoming) {
        // Must be officially released in TMDB
        if (details.tmdbStatus && details.tmdbStatus !== 'Released') {
          continue;
        }
        // Must have verified minimum votes to avoid speculative fan-made pages
        if ((details.voteCount || 0) < 10) {
          continue;
        }
        // Must have a valid theatrical duration (> 40 minutes)
        if ((details.runtimeMinutes || 0) < 40) {
          continue;
        }
      }

      const movieObj = {
        id: slug || `tmdb-${item.id}`,
        title: details.title || item.title,
        originalTitle: details.originalTitle || item.original_title || details.title,
        posterUrl: details.posterUrl || (item.poster_path ? getTmdbImageUrl(item.poster_path, 'w500') : ''),
        posterSource: 'TMDB / Official',
        posterSourceType: 'OFFICIAL',
        backdropUrl: details.backdropUrl || details.posterUrl,
        language: details.language || 'Telugu',
        runtime: details.runtime || '2h 30m',
        releaseDate: details.releaseDate || item.release_date || today,
        genres: (details.genres && details.genres.length > 0) ? details.genres : ['Action', 'Drama'],
        overview: details.overview || item.overview || 'Now running in cinemas.',
        cast: (details.cast && details.cast.length > 0) ? details.cast : ['Lead Actors'],
        director: (details.director && details.director !== 'Unknown Director') ? details.director : 'Director',
        certificate: details.certificate || 'U/A',
        trailerUrl: details.trailerUrl || '',
        aspectRatio: '2.39:1',
        status: isUpcoming ? 'COMING_SOON' : 'CURRENTLY_SHOWING',
        cities: ['visakhapatnam'],
        theaters: [], // Theaters are strictly assigned by Admin in Admin Dashboard, never auto-fabricated
        ottPlatform: details.ottPlatform || '',
        ottReleaseDate: details.ottReleaseDate || '',
        ottUrl: details.ottWatchUrl || '',
        isAutoImported: true,
      };

      enrichedMovies.push(movieObj);
    } catch (e) {
      console.warn(`Could not enrich movie ${item.id}:`, e);
    }
  }

  return enrichedMovies;
}

/**
 * Synchronize the movie catalog with TMDB Indian theatrical releases
 */
export async function syncLiveTheatricalCatalog({
  force = false,
  existingMovies = [],
  deletedMovieIds = [],
  dispatch,
} = {}) {
  // Check throttle if not forced
  if (!force) {
    if (!isAutoCatalogSyncEnabled()) {
      return { success: false, skipped: true, reason: 'Automated catalog sync is disabled.' };
    }
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    if (lastSync) {
      const elapsedMs = Date.now() - new Date(lastSync).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      // If synced in the last 24h and we already have at least 6 movies, skip
      if (elapsedMs < twentyFourHours && (existingMovies || []).length >= 6) {
        return { success: false, skipped: true, reason: 'Catalog was already updated recently.' };
      }
    }
  }

  const existingIds = new Set((existingMovies || []).map(m => m.id?.toLowerCase()));
  const existingTitles = new Set((existingMovies || []).map(m => (m.title || '').trim().toLowerCase()));

  const fetched = await fetchLiveIndianCatalog({
    deletedMovieIds,
    limit: 10,
  });

  if (!fetched || fetched.length === 0) {
    return { success: false, addedCount: 0, message: 'No new movies found from TMDB.' };
  }

  // Filter only genuinely new movies
  const newMovies = fetched.filter(m => {
    const idLower = m.id.toLowerCase();
    const titleLower = m.title.trim().toLowerCase();
    if (existingIds.has(idLower)) return false;
    if (existingTitles.has(titleLower)) return false;
    return true;
  });

  if (newMovies.length === 0) {
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return { success: true, addedCount: 0, message: 'All latest releases are already in catalog.' };
  }

  // Save new movies to Supabase
  if (isSupabaseConfigured()) {
    for (const m of newMovies) {
      await supabaseService.saveMovie(m).catch(console.warn);
    }
  }

  // Dispatch new movies to AppContext state if dispatch provided
  if (dispatch) {
    const combined = [...existingMovies, ...newMovies];
    dispatch({ type: 'SET_MOVIES', payload: combined });
    try {
      localStorage.setItem('cinemascope_movies', JSON.stringify(combined));
    } catch (_) {}
  }

  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

  return {
    success: true,
    addedCount: newMovies.length,
    newMovies,
    message: `Added ${newMovies.length} fresh Indian theatrical releases!`,
  };
}
