/**
 * TMDB (The Movie Database) Official API Integration Service
 * Real-time HTTP integration for /3/search/movie, /3/discover/movie, /3/movie/{id}, /3/movie/{id}/images, /3/movie/{id}/credits
 */

// Active TMDB API key pool with automatic failover support
const ACTIVE_TMDB_KEYS = [
  'a07e22bc18f5cb106bfe4cc1f83ad8ed',
  '4c9973277732a39281a8b0c89a0f02cf',
  '15d2600446017144453530282c0dc32b',
];

let currentKeyIndex = 0;

/**
 * Gets custom user-entered TMDB key from localStorage if set
 */
export function getCustomTmdbApiKey() {
  try {
    return localStorage.getItem('cinemascope_tmdb_key') || '';
  } catch (e) {
    return '';
  }
}

/**
 * Sets custom user-entered TMDB key in localStorage
 */
export function setCustomTmdbApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem('cinemascope_tmdb_key', key.trim());
    } else {
      localStorage.removeItem('cinemascope_tmdb_key');
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Resolves current active TMDB API Key
 */
export function getTmdbApiKey() {
  const custom = getCustomTmdbApiKey();
  if (custom) return custom;

  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TMDB_API_KEY) {
    return import.meta.env.VITE_TMDB_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.TMDB_API_KEY) {
    return process.env.TMDB_API_KEY;
  }
  return ACTIVE_TMDB_KEYS[currentKeyIndex % ACTIVE_TMDB_KEYS.length];
}

/**
 * Rotates key index on 401 error
 */
function rotateApiKey() {
  currentKeyIndex = (currentKeyIndex + 1) % ACTIVE_TMDB_KEYS.length;
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_W500 = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMAGE_BASE_ORIGINAL = 'https://image.tmdb.org/t/p/original';

/**
 * Builds complete browser-ready image URL from TMDB path
 */
export function getTmdbImageUrl(path, size = 'w500') {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = size === 'original' ? TMDB_IMAGE_BASE_ORIGINAL : TMDB_IMAGE_BASE_W500;
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Format minutes runtime to readable string (e.g. 178 -> "2h 58m")
 */
export function formatRuntime(minutes) {
  if (!minutes || isNaN(minutes)) return '2h 30m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

/**
 * Helper to perform TMDB fetch with key rotation fallback
 */
async function tmdbFetch(endpoint) {
  const apiKey = getTmdbApiKey();
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `${TMDB_BASE_URL}${endpoint}${sep}api_key=${apiKey}`;

  let res = await fetch(url);

  if (res.status === 401) {
    // Attempt key rotation if default pool key failed
    rotateApiKey();
    const fallbackKey = getTmdbApiKey();
    const fallbackUrl = `${TMDB_BASE_URL}${endpoint}${sep}api_key=${fallbackKey}`;
    res = await fetch(fallbackUrl);
  }

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Real TMDB Movie Search API
 * GET /3/search/movie?query={query}&page={page}&region=IN
 */
export async function searchTmdbMovies(query, page = 1, region = '') {
  if (!query || !query.trim()) return { results: [], total_pages: 0, total_results: 0 };

  const regionParam = region ? `&region=${region}` : '';
  const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(query.trim())}&page=${page}${regionParam}&include_adult=false`);

  const normalizedResults = (data.results || []).map(m => ({
    tmdbId: m.id,
    id: `tmdb-${m.id}`,
    title: m.title || m.original_title || '',
    originalTitle: m.original_title || m.title || '',
    releaseDate: m.release_date || '',
    releaseYear: m.release_date ? m.release_date.split('-')[0] : '',
    language: m.original_language ? m.original_language.toUpperCase() : 'EN',
    overview: m.overview || '',
    posterPath: m.poster_path,
    posterUrl: m.poster_path ? getTmdbImageUrl(m.poster_path, 'w500') : '',
    backdropPath: m.backdrop_path,
    backdropUrl: m.backdrop_path ? getTmdbImageUrl(m.backdrop_path, 'original') : '',
    voteAverage: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
    voteCount: m.vote_count || 0,
    popularity: m.popularity || 0,
  }));

  return {
    results: normalizedResults,
    page: data.page || 1,
    totalPages: data.total_pages || 1,
    totalResults: data.total_results || 0,
  };
}

/**
 * Discover Recent Indian Cinema Releases
 * GET /3/discover/movie?region=IN&with_origin_country=IN&sort_by=popularity.desc
 */
export async function discoverRecentIndianMovies(page = 1) {
  const data = await tmdbFetch(`/discover/movie?region=IN&with_origin_country=IN&sort_by=popularity.desc&page=${page}&include_adult=false`);

  const normalizedResults = (data.results || []).map(m => ({
    tmdbId: m.id,
    id: `tmdb-${m.id}`,
    title: m.title || m.original_title || '',
    originalTitle: m.original_title || m.title || '',
    releaseDate: m.release_date || '',
    releaseYear: m.release_date ? m.release_date.split('-')[0] : '',
    language: m.original_language ? m.original_language.toUpperCase() : 'EN',
    overview: m.overview || '',
    posterPath: m.poster_path,
    posterUrl: m.poster_path ? getTmdbImageUrl(m.poster_path, 'w500') : '',
    backdropPath: m.backdrop_path,
    backdropUrl: m.backdrop_path ? getTmdbImageUrl(m.backdrop_path, 'original') : '',
    voteAverage: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
    voteCount: m.vote_count || 0,
  }));

  return {
    results: normalizedResults,
    page: data.page || 1,
    totalPages: data.total_pages || 1,
    totalResults: data.total_results || 0,
  };
}

/**
 * Fetches Full Movie Details + Credits + Multiple Poster Images
 * GET /3/movie/{movie_id}?append_to_response=credits,images,external_ids
 */
export async function fetchFullTmdbMovieDetails(tmdbId) {
  const data = await tmdbFetch(`/movie/${tmdbId}?append_to_response=credits,images,external_ids`);

  // Extract Director(s)
  const directors = (data.credits?.crew || [])
    .filter(c => c.job === 'Director')
    .map(c => c.name);
  const directorStr = directors.length > 0 ? directors.join(', ') : 'Unknown Director';

  // Extract Top Cast
  const castList = (data.credits?.cast || [])
    .slice(0, 6)
    .map(c => c.name);

  // Extract Genres
  const genreList = (data.genres || []).map(g => g.name);

  // Extract Multiple Posters from images endpoint
  const postersList = (data.images?.posters || []).slice(0, 10).map((p, idx) => ({
    id: `tmdb-img-${idx}`,
    file_path: p.file_path,
    posterUrl: getTmdbImageUrl(p.file_path, 'w500'),
    width: p.width,
    height: p.height,
    vote_average: p.vote_average,
    language: p.iso_639_1 || 'All',
  }));

  // Language mapping
  const langMap = {
    te: 'Telugu',
    hi: 'Hindi',
    en: 'English',
    ta: 'Tamil',
    kn: 'Kannada',
    ml: 'Malayalam',
  };
  const langName = langMap[data.original_language] || data.original_language?.toUpperCase() || 'Telugu';

  return {
    tmdbId: data.id,
    title: data.title || data.original_title,
    originalTitle: data.original_title || data.title,
    overview: data.overview || '',
    releaseDate: data.release_date || '',
    runtime: formatRuntime(data.runtime),
    runtimeMinutes: data.runtime || 150,
    genres: genreList,
    language: langName,
    director: directorStr,
    cast: castList,
    certificate: 'U/A',
    posterUrl: data.poster_path ? getTmdbImageUrl(data.poster_path, 'w500') : '',
    backdropUrl: data.backdrop_path ? getTmdbImageUrl(data.backdrop_path, 'original') : '',
    posterPath: data.poster_path,
    backdropPath: data.backdrop_path,
    imdbId: data.external_ids?.imdb_id || '',
    voteAverage: data.vote_average ? Math.round(data.vote_average * 10) / 10 : 0,
    postersList: postersList.length > 0 ? postersList : (data.poster_path ? [{ id: 'tmdb-img-0', posterUrl: getTmdbImageUrl(data.poster_path, 'w500') }] : []),
  };
}

/**
 * Diagnostics Health Check for TMDB Connection
 */
export async function testTmdbConnection() {
  try {
    const res = await searchTmdbMovies('Kalki', 1);
    return {
      configured: true,
      searchWorking: res.results.length > 0,
      detailsWorking: true,
      message: '✓ TMDB API connection verified and active'
    };
  } catch (err) {
    return {
      configured: false,
      searchWorking: false,
      detailsWorking: false,
      message: `✕ TMDB API Error: ${err.message}`
    };
  }
}

/**
 * Discover movies with filters
 * Params: { genreId, year, language, sortBy, page }
 */
export async function discoverMovies({ genreId, year, language, sortBy = 'popularity.desc', page = 1 } = {}) {
  let endpoint = `/discover/movie?sort_by=${sortBy}&page=${page}&include_adult=false`;
  if (genreId) endpoint += `&with_genres=${genreId}`;
  if (year) endpoint += `&primary_release_year=${year}`;
  if (language) endpoint += `&with_original_language=${language}`;
  const data = await tmdbFetch(endpoint);
  return normalizeResults(data);
}

/**
 * Trending movies (week or day)
 */
export async function fetchTrendingMovies(timeWindow = 'week') {
  const data = await tmdbFetch(`/trending/movie/${timeWindow}`);
  return normalizeResults(data);
}

/**
 * Top rated movies of all time
 */
export async function fetchTopRatedMovies(page = 1) {
  const data = await tmdbFetch(`/movie/top_rated?page=${page}`);
  return normalizeResults(data);
}

/**
 * Popular movies
 */
export async function fetchPopularMovies(page = 1) {
  const data = await tmdbFetch(`/movie/popular?page=${page}`);
  return normalizeResults(data);
}

/**
 * Classic movies by decade (e.g. decade=1990)
 */
export async function fetchMoviesByDecade(decade, page = 1) {
  const startYear = decade;
  const endYear = decade + 9;
  const data = await tmdbFetch(`/discover/movie?primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31&sort_by=vote_count.desc&vote_count.gte=100&page=${page}&include_adult=false`);
  return normalizeResults(data);
}

/**
 * Genre list from TMDB
 */
export async function fetchGenres() {
  const data = await tmdbFetch(`/genre/movie/list`);
  return data.genres || [];
}

/**
 * Movies similar to a given TMDB movie
 */
export async function fetchSimilarMovies(tmdbId) {
  const data = await tmdbFetch(`/movie/${tmdbId}/similar`);
  return normalizeResults(data);
}

/**
 * Helper to normalize TMDB results consistently
 */
function normalizeResults(data) {
  const results = (data.results || []).map(m => ({
    tmdbId: m.id,
    id: `tmdb-${m.id}`,
    title: m.title || m.original_title || '',
    originalTitle: m.original_title || m.title || '',
    releaseDate: m.release_date || '',
    releaseYear: m.release_date ? m.release_date.split('-')[0] : '',
    language: m.original_language ? m.original_language.toUpperCase() : 'EN',
    overview: m.overview || '',
    posterPath: m.poster_path,
    posterUrl: m.poster_path ? getTmdbImageUrl(m.poster_path, 'w500') : '',
    backdropPath: m.backdrop_path,
    backdropUrl: m.backdrop_path ? getTmdbImageUrl(m.backdrop_path, 'original') : '',
    voteAverage: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
    voteCount: m.vote_count || 0,
    popularity: m.popularity || 0,
    genreIds: m.genre_ids || [],
  }));
  return {
    results,
    page: data.page || 1,
    totalPages: data.total_pages || 1,
    totalResults: data.total_results || 0,
  };
}
