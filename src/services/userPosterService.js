import { tmdbFetch, getTmdbImageUrl } from './tmdbService';

const FAVORITE_POSTERS_KEY = 'cinemascope_user_favorite_posters';

/**
 * Get all favorite posters map from localStorage
 * Format: { [movieId]: { posterUrl: string, updatedAt: string, isCustom?: boolean } }
 */
export function getAllUserFavoritePosters() {
  try {
    const raw = localStorage.getItem(FAVORITE_POSTERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Get user's saved favorite poster URL for a specific movie ID
 */
export function getUserFavoritePoster(movieId) {
  if (!movieId) return null;
  const cleanId = String(movieId).toLowerCase().trim();
  const all = getAllUserFavoritePosters();
  const entry = all[cleanId];
  if (!entry) return null;
  return typeof entry === 'string' ? entry : entry.posterUrl;
}

/**
 * Save user's favorite poster for a movie
 */
export function setUserFavoritePoster(movieId, posterUrl, { isCustom = false } = {}) {
  if (!movieId || !posterUrl) return false;
  const cleanId = String(movieId).toLowerCase().trim();
  const all = getAllUserFavoritePosters();
  all[cleanId] = {
    posterUrl: posterUrl.trim(),
    updatedAt: new Date().toISOString(),
    isCustom: !!isCustom,
  };
  try {
    localStorage.setItem(FAVORITE_POSTERS_KEY, JSON.stringify(all));
    // Dispatch custom event so components across the app update reactively
    window.dispatchEvent(new CustomEvent('cinemascope_fav_poster_changed', {
      detail: { movieId: cleanId, posterUrl: posterUrl.trim() }
    }));
    return true;
  } catch (e) {
    console.warn('Could not save favorite poster:', e);
    return false;
  }
}

/**
 * Remove user's favorite poster (reverts to official default)
 */
export function removeUserFavoritePoster(movieId) {
  if (!movieId) return false;
  const cleanId = String(movieId).toLowerCase().trim();
  const all = getAllUserFavoritePosters();
  if (all[cleanId]) {
    delete all[cleanId];
    try {
      localStorage.setItem(FAVORITE_POSTERS_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('cinemascope_fav_poster_changed', {
        detail: { movieId: cleanId, posterUrl: null }
      }));
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
 * Fetch all available alternative posters & backdrops for a movie
 * Combines existing movie posters, TMDB gallery, and custom user uploads
 */
export async function fetchAvailablePostersForMovie(movie) {
  if (!movie) return [];

  const candidates = [];
  const seenUrls = new Set();

  const addCandidate = (url, label, type = 'poster', isDefault = false) => {
    if (!url || typeof url !== 'string' || !url.trim()) return;
    const clean = url.trim();
    if (seenUrls.has(clean)) return;
    seenUrls.add(clean);
    candidates.push({
      id: `poster-${candidates.length}`,
      url: clean,
      label,
      type,
      isDefault,
    });
  };

  // 1. Current user favorite (if exists)
  const userFav = getUserFavoritePoster(movie.id || movie.tmdbId);
  if (userFav) {
    addCandidate(userFav, 'Your Favorite Poster', 'favorite');
  }

  // 2. Default official poster
  if (movie.posterUrl) {
    addCandidate(movie.posterUrl, 'Official Theatrical Poster', 'official', true);
  }

  // 3. Admin poster history or embedded posters list
  if (Array.isArray(movie.postersList)) {
    movie.postersList.forEach((p, idx) => {
      const u = typeof p === 'string' ? p : (p.posterUrl || p.file_path ? getTmdbImageUrl(p.file_path, 'w500') : null);
      if (u) addCandidate(u, `Alternative Poster ${idx + 1}`, 'variant');
    });
  }

  if (Array.isArray(movie.posterHistory)) {
    movie.posterHistory.forEach((p, idx) => {
      const u = typeof p === 'string' ? p : p.posterUrl;
      if (u) addCandidate(u, `Variant Cut ${idx + 1}`, 'variant');
    });
  }

  // 4. Backdrop as a wide / cinematic key-art option
  if (movie.backdropUrl) {
    addCandidate(movie.backdropUrl, 'Cinematic Key-Art (Backdrop)', 'backdrop');
  }

  // 5. Query TMDB image gallery in the background if we have a TMDB ID or clean slug
  try {
    const rawId = movie.tmdbId || movie.id;
    let targetTmdbId = null;

    if (rawId && /^\d+$/.test(String(rawId).replace(/^tmdb-/, ''))) {
      targetTmdbId = String(rawId).replace(/^tmdb-/, '');
    } else {
      // Search by title on TMDB
      const query = movie.title || movie.name;
      if (query) {
        const searchRes = await tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}&page=1`);
        if (searchRes?.results && searchRes.results.length > 0) {
          targetTmdbId = searchRes.results[0].id;
        }
      }
    }

    if (targetTmdbId) {
      const imagesData = await tmdbFetch(`/movie/${targetTmdbId}/images?include_image_language=en,te,ta,hi,null`);
      if (imagesData) {
        (imagesData.posters || []).slice(0, 10).forEach((p, idx) => {
          if (p.file_path) {
            const highRes = getTmdbImageUrl(p.file_path, 'original');
            const mediumRes = getTmdbImageUrl(p.file_path, 'w500');
            addCandidate(mediumRes, `Theatrical Cut ${idx + 1}`, 'tmdb');
          }
        });

        (imagesData.backdrops || []).slice(0, 4).forEach((b, idx) => {
          if (b.file_path) {
            const bUrl = getTmdbImageUrl(b.file_path, 'original');
            addCandidate(bUrl, `Cinematic Still ${idx + 1}`, 'backdrop');
          }
        });
      }
    }
  } catch (err) {
    // If offline or network error, gracefully use already collected posters
    console.warn('Could not fetch additional TMDB posters:', err);
  }

  return candidates;
}
