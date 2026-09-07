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
    voteAverage: m.vote_average ? Math.round((m.vote_average / 2) * 10) / 10 : 0,
    voteAverage10: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
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
    voteAverage: m.vote_average ? Math.round((m.vote_average / 2) * 10) / 10 : 0,
    voteAverage10: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
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
  if (!tmdbId) throw new Error('Missing tmdbId');
  const strId = String(tmdbId).trim();
  if (strId.startsWith('tv-') || strId.startsWith('tmdb-tv-')) {
    const tvDetails = await fetchFullTmdbTvDetails(strId.replace(/^tmdb-/, '').replace(/^tv-/, ''));
    return { ...tvDetails, requestedId: strId };
  }

  const cleanId = strId.replace(/^tmdb-/, '');

  // If cleanId contains non-numeric slug characters (e.g. 'john-wick-4', 'oppenheimer', 'arcane-series')
  if (!/^\d+$/.test(cleanId)) {
    try {
      const isSeries = cleanId.includes('-series') || cleanId.includes('-show') || cleanId.includes('-tv');
      const searchQuery = cleanId
        .replace(/-series$/i, '')
        .replace(/-show$/i, '')
        .replace(/-tv$/i, '')
        .replace(/-/g, ' ')
        .trim();

      const searchRes = isSeries ? await searchTmdbTv(searchQuery) : await searchTmdbMovies(searchQuery);
      let topMatch = searchRes.results && searchRes.results[0];
      if (!topMatch && !isSeries) {
        // Try multi search as second attempt
        const multiRes = await searchTmdbMulti(searchQuery);
        topMatch = multiRes.results && multiRes.results[0];
      }

      if (topMatch) {
        let details;
        if (isSeries || topMatch.isTv || topMatch.mediaType === 'tv') {
          details = await fetchFullTmdbTvDetails(topMatch.tmdbId || topMatch.id);
        } else {
          details = await fetchFullTmdbMovieDetails(topMatch.tmdbId || topMatch.id);
        }
        if (details) {
          return {
            ...details,
            requestedId: strId,
            cleanId: cleanId,
          };
        }
      }
    } catch (slugErr) {
      console.warn(`Could not resolve slug "${cleanId}" via TMDB search:`, slugErr);
    }
  }

  try {
    const data = await tmdbFetch(`/movie/${cleanId}?append_to_response=credits,images,external_ids,watch/providers,release_dates`);

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

    // Extract OTT Streaming Providers & Watch Links
    // Prioritize India (IN), fallback to US or first available country
    const watchResults = data['watch/providers']?.results || {};
    const regionWatch = watchResults.IN || watchResults.US || Object.values(watchResults)[0] || null;

    const mapProvider = (p, type) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? getTmdbImageUrl(p.logo_path, 'w154') : '',
      type, // 'stream', 'rent', 'buy'
      priority: p.display_priority || 99,
    });

    const streamProviders = (regionWatch?.flatrate || []).map(p => mapProvider(p, 'stream'));
    const rentProviders = (regionWatch?.rent || []).map(p => mapProvider(p, 'rent'));
    const buyProviders = (regionWatch?.buy || []).map(p => mapProvider(p, 'buy'));

    // Combined unique platforms
    const platformMap = new Map();
    [...streamProviders, ...rentProviders, ...buyProviders].forEach(p => {
      if (!platformMap.has(p.name)) {
        platformMap.set(p.name, p);
      }
    });
    const ottPlatforms = Array.from(platformMap.values());

    // Extract OTT / Digital Release Date from release_dates (type 4 = Digital)
    const allReleaseDates = data.release_dates?.results || [];
    const inReleases = allReleaseDates.find(r => r.iso_3166_1 === 'IN')?.release_dates || [];
    const digitalIN = inReleases.find(rd => rd.type === 4 && rd.release_date);

    let rawOttDate = digitalIN?.release_date || null;
    if (!rawOttDate) {
      // Look across all countries for digital release
      const allDigital = allReleaseDates
        .flatMap(r => r.release_dates || [])
        .filter(rd => rd.type === 4 && rd.release_date)
        .sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
      if (allDigital.length > 0) {
        rawOttDate = allDigital[0].release_date;
      }
    }

    const ottReleaseDate = rawOttDate ? rawOttDate.split('T')[0] : '';
    const primaryPlatform = streamProviders[0]?.name || ottPlatforms[0]?.name || '';

    return {
      id: `tmdb-${data.id}`,
      tmdbId: data.id,
      requestedId: strId,
      cleanId: cleanId,
      isTv: false,
      mediaType: 'movie',
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
      voteAverage: data.vote_average ? Math.round((data.vote_average / 2) * 10) / 10 : 0,
      voteAverage10: data.vote_average ? Math.round(data.vote_average * 10) / 10 : 0,
      voteCount: data.vote_count || 0,
      postersList: postersList.length > 0 ? postersList : (data.poster_path ? [{ id: 'tmdb-img-0', posterUrl: getTmdbImageUrl(data.poster_path, 'w500') }] : []),
      // OTT & Streaming Fields
      ottReleaseDate,
      ottPlatforms,
      ottPlatform: primaryPlatform,
      ottWatchUrl: regionWatch?.link || '',
      ottStreamProviders: streamProviders,
      ottRentProviders: rentProviders,
      ottBuyProviders: buyProviders,
    };
  } catch (err) {
    // Attempt fallback to TV show details if movie request fails
    try {
      const tvDetails = await fetchFullTmdbTvDetails(cleanId);
      return {
        ...tvDetails,
        requestedId: strId,
        cleanId: cleanId,
      };
    } catch (tvErr) {
      throw err;
    }
  }
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
 * Discover movies with flexible filters
 * Params: { genreId, year, language, sortBy, page, with_origin_country, with_genres, with_original_language, region }
 */
export async function discoverMovies({ 
  genreId, 
  year, 
  language, 
  sortBy = 'popularity.desc', 
  page = 1, 
  with_origin_country, 
  with_genres, 
  with_original_language,
  region
} = {}) {
  let endpoint = `/discover/movie?sort_by=${sortBy}&page=${page}&include_adult=false`;
  const genres = with_genres || genreId;
  const lang = with_original_language || language;
  
  if (genres) endpoint += `&with_genres=${genres}`;
  if (year) endpoint += `&primary_release_year=${year}`;
  if (lang) endpoint += `&with_original_language=${lang}`;
  if (with_origin_country) endpoint += `&with_origin_country=${with_origin_country}`;
  if (region) endpoint += `&region=${region}`;

  const data = await tmdbFetch(endpoint);
  return normalizeResults(data);
}

/**
 * Fetch Telugu Cinema Movies (Tollywood)
 */
export async function fetchTeluguMovies(page = 1) {
  const data = await tmdbFetch(`/discover/movie?with_original_language=te&sort_by=popularity.desc&page=${page}&include_adult=false`);
  return normalizeResults(data);
}

/**
 * Fetch Horror Movies (Genre ID: 27)
 */
export async function fetchHorrorMovies(page = 1) {
  const data = await tmdbFetch(`/discover/movie?with_genres=27&sort_by=popularity.desc&page=${page}&include_adult=false`);
  return normalizeResults(data);
}

/**
 * Fetch Crime & Suspense Thrillers (Genre IDs: 80=Crime, 53=Thriller, 9648=Mystery)
 */
export async function fetchCrimeSuspenseMovies(page = 1) {
  const data = await tmdbFetch(`/discover/movie?with_genres=80,53,9648&sort_by=popularity.desc&page=${page}&include_adult=false`);
  return normalizeResults(data);
}

/**
 * Fetch Action Movies (Genre ID: 28)
 */
export async function fetchActionMovies(page = 1) {
  const data = await tmdbFetch(`/discover/movie?with_genres=28&sort_by=popularity.desc&page=${page}&include_adult=false`);
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
    voteAverage: m.vote_average ? Math.round((m.vote_average / 2) * 10) / 10 : 0,
    voteAverage10: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
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

/**
 * Universal helper to normalize any movie rating to a 5-star scale.
 * If rating > 5, it is assumed to be on a 10-point scale (e.g. from TMDB) and divided by 2.
 */
export function normalizeRating5(rating) {
  if (!rating || isNaN(rating) || Number(rating) <= 0) return 0;
  const num = Number(rating);
  if (num > 5) {
    return Math.round((num / 2) * 10) / 10;
  }
  return Math.round(num * 10) / 10;
}

/**
 * Normalizes TMDB TV Show results consistently
 */
export function normalizeTvResults(data) {
  const results = (data.results || []).map(m => ({
    tmdbId: m.id,
    id: `tmdb-tv-${m.id}`,
    isTv: true,
    mediaType: 'tv',
    title: m.name || m.original_name || '',
    originalTitle: m.original_name || m.name || '',
    releaseDate: m.first_air_date || '',
    releaseYear: m.first_air_date ? m.first_air_date.split('-')[0] : '',
    language: m.original_language ? m.original_language.toUpperCase() : 'EN',
    overview: m.overview || '',
    posterPath: m.poster_path,
    posterUrl: m.poster_path ? getTmdbImageUrl(m.poster_path, 'w500') : '',
    backdropPath: m.backdrop_path,
    backdropUrl: m.backdrop_path ? getTmdbImageUrl(m.backdrop_path, 'original') : '',
    voteAverage: m.vote_average ? Math.round((m.vote_average / 2) * 10) / 10 : 0,
    voteAverage10: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
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

/**
 * Normalizes Multi-Search results (movies and TV shows)
 */
export function normalizeMultiResults(data) {
  const results = (data.results || [])
    .filter(m => m.media_type === 'movie' || m.media_type === 'tv')
    .map(m => {
      const isTv = m.media_type === 'tv';
      return {
        tmdbId: m.id,
        id: isTv ? `tmdb-tv-${m.id}` : `tmdb-${m.id}`,
        isTv,
        mediaType: isTv ? 'tv' : 'movie',
        title: isTv ? (m.name || m.original_name || '') : (m.title || m.original_title || ''),
        originalTitle: isTv ? (m.original_name || m.name || '') : (m.original_title || m.title || ''),
        releaseDate: isTv ? (m.first_air_date || '') : (m.release_date || ''),
        releaseYear: isTv
          ? (m.first_air_date ? m.first_air_date.split('-')[0] : '')
          : (m.release_date ? m.release_date.split('-')[0] : ''),
        language: m.original_language ? m.original_language.toUpperCase() : 'EN',
        overview: m.overview || '',
        posterPath: m.poster_path,
        posterUrl: m.poster_path ? getTmdbImageUrl(m.poster_path, 'w500') : '',
        backdropPath: m.backdrop_path,
        backdropUrl: m.backdrop_path ? getTmdbImageUrl(m.backdrop_path, 'original') : '',
        voteAverage: m.vote_average ? Math.round((m.vote_average / 2) * 10) / 10 : 0,
        voteAverage10: m.vote_average ? Math.round(m.vote_average * 10) / 10 : 0,
        voteCount: m.vote_count || 0,
        popularity: m.popularity || 0,
        genreIds: m.genre_ids || [],
      };
    });
  return {
    results,
    page: data.page || 1,
    totalPages: data.total_pages || 1,
    totalResults: data.total_results || 0,
  };
}

/**
 * Full details for TV Shows / Web Series
 * GET /3/tv/{id}?append_to_response=credits,images,external_ids,watch/providers
 */
export async function fetchFullTmdbTvDetails(tmdbId) {
  const cleanId = String(tmdbId).replace(/^(tmdb-)?(tv-)?/, '');
  const data = await tmdbFetch(`/tv/${cleanId}?append_to_response=credits,images,external_ids,watch/providers,content_ratings`);

  // Extract Creator / Showrunner / Executive Producers
  const creators = (data.created_by || []).map(c => c.name);
  const execProducers = (data.credits?.crew || [])
    .filter(c => c.job === 'Executive Producer' || c.job === 'Director')
    .slice(0, 3)
    .map(c => c.name);
  const creatorStr = creators.length > 0 
    ? creators.join(', ') 
    : (execProducers.length > 0 ? execProducers.join(', ') : 'Various Showrunners');

  // Extract Top Cast
  const castList = (data.credits?.cast || []).slice(0, 6).map(c => c.name);

  // Extract Genres
  const genreList = (data.genres || []).map(g => g.name);

  // Posters
  const postersList = (data.images?.posters || []).slice(0, 10).map((p, idx) => ({
    id: `tmdb-img-${idx}`,
    file_path: p.file_path,
    posterUrl: getTmdbImageUrl(p.file_path, 'w500'),
    width: p.width,
    height: p.height,
    vote_average: p.vote_average,
    language: p.iso_639_1 || 'All',
  }));

  // Networks & Production
  const networks = (data.networks || []).map(n => n.name).join(', ') || 
                   (data.production_companies || []).slice(0, 2).map(c => c.name).join(', ') || 'Original Series';

  // Format seasons & episodes
  const seasonsCount = data.number_of_seasons || 1;
  const episodesCount = data.number_of_episodes || 0;
  const seasonsText = `${seasonsCount} Season${seasonsCount > 1 ? 's' : ''}${episodesCount > 0 ? ` · ${episodesCount} Episodes` : ''}`;

  // Language mapping
  const langMap = {
    te: 'Telugu',
    hi: 'Hindi',
    en: 'English',
    ta: 'Tamil',
    kn: 'Kannada',
    ml: 'Malayalam',
    ko: 'Korean',
    ja: 'Japanese',
  };
  const langName = langMap[data.original_language] || data.original_language?.toUpperCase() || 'Telugu';

  // Watch Providers (India, fallback to US / first)
  const watchResults = data['watch/providers']?.results || {};
  const regionWatch = watchResults.IN || watchResults.US || Object.values(watchResults)[0] || null;

  const mapProvider = (p, type) => ({
    id: p.provider_id,
    name: p.provider_name,
    logoUrl: p.logo_path ? getTmdbImageUrl(p.logo_path, 'w154') : '',
    type,
    priority: p.display_priority || 99,
  });

  const streamProviders = (regionWatch?.flatrate || []).map(p => mapProvider(p, 'stream'));
  const rentProviders = (regionWatch?.rent || []).map(p => mapProvider(p, 'rent'));
  const buyProviders = (regionWatch?.buy || []).map(p => mapProvider(p, 'buy'));

  const platformMap = new Map();
  [...streamProviders, ...rentProviders, ...buyProviders].forEach(p => {
    if (!platformMap.has(p.name)) platformMap.set(p.name, p);
  });
  const ottPlatforms = Array.from(platformMap.values());
  const primaryPlatform = streamProviders[0]?.name || ottPlatforms[0]?.name || networks || '';

  return {
    id: `tmdb-tv-${data.id}`,
    tmdbId: data.id,
    requestedId: String(tmdbId),
    cleanId: cleanId,
    isTv: true,
    mediaType: 'tv',
    title: data.name || data.original_name,
    originalTitle: data.original_name || data.name,
    overview: data.overview || '',
    releaseDate: data.first_air_date || '',
    firstAirDate: data.first_air_date || '',
    lastAirDate: data.last_air_date || '',
    status: data.status || 'Series',
    runtime: seasonsText,
    runtimeMinutes: (data.episode_run_time && data.episode_run_time[0]) || 45,
    numberOfSeasons: seasonsCount,
    numberOfEpisodes: episodesCount,
    genres: genreList,
    language: langName,
    director: creatorStr,
    network: networks,
    cast: castList,
    certificate: 'U/A',
    posterUrl: data.poster_path ? getTmdbImageUrl(data.poster_path, 'w500') : '',
    backdropUrl: data.backdrop_path ? getTmdbImageUrl(data.backdrop_path, 'original') : '',
    posterPath: data.poster_path,
    backdropPath: data.backdrop_path,
    imdbId: data.external_ids?.imdb_id || '',
    voteAverage: data.vote_average ? Math.round((data.vote_average / 2) * 10) / 10 : 0,
    voteAverage10: data.vote_average ? Math.round(data.vote_average * 10) / 10 : 0,
    voteCount: data.vote_count || 0,
    postersList: postersList.length > 0 ? postersList : (data.poster_path ? [{ id: 'tmdb-img-0', posterUrl: getTmdbImageUrl(data.poster_path, 'w500') }] : []),
    ottReleaseDate: data.first_air_date || '',
    ottPlatforms,
    ottPlatform: primaryPlatform,
    ottWatchUrl: regionWatch?.link || '',
    ottStreamProviders: streamProviders,
    ottRentProviders: rentProviders,
    ottBuyProviders: buyProviders,
  };
}

/**
 * Search TMDB TV Shows
 */
export async function searchTmdbTv(query, page = 1) {
  if (!query || !query.trim()) return { results: [], total_pages: 0, total_results: 0 };
  const data = await tmdbFetch(`/search/tv?query=${encodeURIComponent(query.trim())}&page=${page}&include_adult=false`);
  return normalizeTvResults(data);
}

/**
 * Search TMDB for both Movies and TV Shows (Multi-Search)
 */
export async function searchTmdbMulti(query, page = 1) {
  if (!query || !query.trim()) return { results: [], total_pages: 0, total_results: 0 };
  const data = await tmdbFetch(`/search/multi?query=${encodeURIComponent(query.trim())}&page=${page}&include_adult=false`);
  return normalizeMultiResults(data);
}

/**
 * Trending TV Shows (week or day)
 */
export async function fetchTrendingTv(timeWindow = 'week') {
  const data = await tmdbFetch(`/trending/tv/${timeWindow}`);
  return normalizeTvResults(data);
}

/**
 * Top Rated TV Shows
 */
export async function fetchTopRatedTv(page = 1) {
  const data = await tmdbFetch(`/tv/top_rated?page=${page}`);
  return normalizeTvResults(data);
}

/**
 * Popular TV Shows
 */
export async function fetchPopularTv(page = 1) {
  const data = await tmdbFetch(`/tv/popular?page=${page}`);
  return normalizeTvResults(data);
}

/**
 * Indian Web Series & TV
 */
export async function discoverRecentIndianTv(page = 1) {
  const data = await tmdbFetch(`/discover/tv?with_origin_country=IN&sort_by=popularity.desc&page=${page}&include_adult=false`);
  return normalizeTvResults(data);
}

/**
 * Telugu Web Series & TV
 */
export async function fetchTeluguTv(page = 1) {
  const data = await tmdbFetch(`/discover/tv?with_original_language=te&sort_by=popularity.desc&page=${page}&include_adult=false`);
  return normalizeTvResults(data);
}

/**
 * Crime & Suspense TV Series (Genre 80=Crime, 9648=Mystery)
 */
export async function fetchCrimeSuspenseTv(page = 1) {
  const data = await tmdbFetch(`/discover/tv?with_genres=80,9648&sort_by=popularity.desc&page=${page}&include_adult=false`);
  return normalizeTvResults(data);
}

/**
 * Sci-Fi & Fantasy TV Series (Genre 10765=Sci-Fi & Fantasy)
 */
export async function fetchSciFiFantasyTv(page = 1) {
  const data = await tmdbFetch(`/discover/tv?with_genres=10765&sort_by=popularity.desc&page=${page}&include_adult=false`);
  return normalizeTvResults(data);
}

/**
 * Discover TV Shows with flexible filters
 */
export async function discoverTv({
  genreId,
  year,
  language,
  sortBy = 'popularity.desc',
  page = 1,
  with_origin_country,
  with_genres,
  with_original_language,
} = {}) {
  let endpoint = `/discover/tv?sort_by=${sortBy}&page=${page}&include_adult=false`;
  const genres = with_genres || genreId;
  const lang = with_original_language || language;

  if (genres) endpoint += `&with_genres=${genres}`;
  if (year) endpoint += `&first_air_date_year=${year}`;
  if (lang) endpoint += `&with_original_language=${lang}`;
  if (with_origin_country) endpoint += `&with_origin_country=${with_origin_country}`;

  const data = await tmdbFetch(endpoint);
  return normalizeTvResults(data);
}

/**
 * TV Genres list from TMDB
 */
export async function fetchTvGenres() {
  const data = await tmdbFetch(`/genre/tv/list`);
  return data.genres || [];
}


