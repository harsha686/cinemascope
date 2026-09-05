import { getSupabaseClient, isSupabaseConfigured, supabaseService } from './supabase';

const LIB_KEY = 'cinemascope_user_library';
const DIARY_KEY = 'cinemascope_diary';
const COLLECTIONS_KEY = 'cinemascope_collections';

// Library state management (localStorage + optional Supabase)
export async function getLibrary() {
  return JSON.parse(localStorage.getItem(LIB_KEY) || '{}');
}

export async function saveLibrary(lib) {
  localStorage.setItem(LIB_KEY, JSON.stringify(lib));
}

export async function getMovieStatus(tmdbId) {
  const lib = await getLibrary();
  const entry = lib[tmdbId] || { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  return {
    ...entry,
    inWatchlist: !!entry.watchlist,
    isWatched: !!entry.watched,
    isFavorite: !!entry.favorite,
    rating: entry.rating || 0
  };
}

export async function toggleWatchlist(tmdbId, userIdOrMeta) {
  const lib = await getLibrary();
  if (!lib[tmdbId]) lib[tmdbId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  lib[tmdbId].watchlist = !lib[tmdbId].watchlist;
  await saveLibrary(lib);
  
  const userId = typeof userIdOrMeta === 'string' ? userIdOrMeta : userIdOrMeta?.id;
  if (isSupabaseConfigured() && userId) {
    supabaseService.upsertUserMovie({
      id: `${userId}_${tmdbId}`,
      user_id: userId,
      tmdb_id: tmdbId,
      in_watchlist: lib[tmdbId].watchlist,
      is_watched: lib[tmdbId].watched,
      is_favorite: lib[tmdbId].favorite,
      personal_rating: lib[tmdbId].rating,
      notes: lib[tmdbId].notes,
      watch_count: lib[tmdbId].watchCount,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  }

  return {
    ...lib[tmdbId],
    inWatchlist: !!lib[tmdbId].watchlist,
    isWatched: !!lib[tmdbId].watched,
    isFavorite: !!lib[tmdbId].favorite,
    rating: lib[tmdbId].rating || 0
  };
}

export async function toggleWatched(tmdbId, userIdOrMeta) {
  const lib = await getLibrary();
  if (!lib[tmdbId]) lib[tmdbId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  lib[tmdbId].watched = !lib[tmdbId].watched;
  if (lib[tmdbId].watched) {
    lib[tmdbId].watchCount = (lib[tmdbId].watchCount || 0) + 1;
  }
  await saveLibrary(lib);

  const userId = typeof userIdOrMeta === 'string' ? userIdOrMeta : userIdOrMeta?.id;
  if (isSupabaseConfigured() && userId) {
    supabaseService.upsertUserMovie({
      id: `${userId}_${tmdbId}`,
      user_id: userId,
      tmdb_id: tmdbId,
      in_watchlist: lib[tmdbId].watchlist,
      is_watched: lib[tmdbId].watched,
      is_favorite: lib[tmdbId].favorite,
      personal_rating: lib[tmdbId].rating,
      notes: lib[tmdbId].notes,
      watch_count: lib[tmdbId].watchCount,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  }

  return {
    ...lib[tmdbId],
    inWatchlist: !!lib[tmdbId].watchlist,
    isWatched: !!lib[tmdbId].watched,
    isFavorite: !!lib[tmdbId].favorite,
    rating: lib[tmdbId].rating || 0
  };
}

export async function toggleFavorite(tmdbId, userIdOrMeta) {
  const lib = await getLibrary();
  if (!lib[tmdbId]) lib[tmdbId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  lib[tmdbId].favorite = !lib[tmdbId].favorite;
  await saveLibrary(lib);

  const userId = typeof userIdOrMeta === 'string' ? userIdOrMeta : userIdOrMeta?.id;
  if (isSupabaseConfigured() && userId) {
    supabaseService.upsertUserMovie({
      id: `${userId}_${tmdbId}`,
      user_id: userId,
      tmdb_id: tmdbId,
      in_watchlist: lib[tmdbId].watchlist,
      is_watched: lib[tmdbId].watched,
      is_favorite: lib[tmdbId].favorite,
      personal_rating: lib[tmdbId].rating,
      notes: lib[tmdbId].notes,
      watch_count: lib[tmdbId].watchCount,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  }

  return {
    ...lib[tmdbId],
    inWatchlist: !!lib[tmdbId].watchlist,
    isWatched: !!lib[tmdbId].watched,
    isFavorite: !!lib[tmdbId].favorite,
    rating: lib[tmdbId].rating || 0
  };
}

export async function setPersonalRating(tmdbId, userIdOrMeta, rating) {
  const lib = await getLibrary();
  if (!lib[tmdbId]) lib[tmdbId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  lib[tmdbId].rating = rating;
  await saveLibrary(lib);

  const userId = typeof userIdOrMeta === 'string' ? userIdOrMeta : userIdOrMeta?.id;
  if (isSupabaseConfigured() && userId) {
    supabaseService.upsertUserMovie({
      id: `${userId}_${tmdbId}`,
      user_id: userId,
      tmdb_id: tmdbId,
      in_watchlist: lib[tmdbId].watchlist,
      is_watched: lib[tmdbId].watched,
      is_favorite: lib[tmdbId].favorite,
      personal_rating: lib[tmdbId].rating,
      notes: lib[tmdbId].notes,
      watch_count: lib[tmdbId].watchCount,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  }

  return {
    ...lib[tmdbId],
    inWatchlist: !!lib[tmdbId].watchlist,
    isWatched: !!lib[tmdbId].watched,
    isFavorite: !!lib[tmdbId].favorite,
    rating: lib[tmdbId].rating || 0
  };
}

export async function setNotes(tmdbId, userId, notes) {
  const lib = await getLibrary();
  if (!lib[tmdbId]) lib[tmdbId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  lib[tmdbId].notes = notes;
  await saveLibrary(lib);

  if (isSupabaseConfigured() && userId) {
    supabaseService.upsertUserMovie({
      id: `${userId}_${tmdbId}`,
      user_id: userId,
      tmdb_id: tmdbId,
      in_watchlist: lib[tmdbId].watchlist,
      is_watched: lib[tmdbId].watched,
      is_favorite: lib[tmdbId].favorite,
      personal_rating: lib[tmdbId].rating,
      notes: lib[tmdbId].notes,
      watch_count: lib[tmdbId].watchCount,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  }
}

export async function getWatchlistMovies() {
  const lib = await getLibrary();
  return Object.keys(lib).filter(id => lib[id].watchlist).map(tmdbId => ({ tmdbId, ...lib[tmdbId] }));
}

export async function getWatchedMovies() {
  const lib = await getLibrary();
  return Object.keys(lib).filter(id => lib[id].watched).map(tmdbId => ({ tmdbId, ...lib[tmdbId] }));
}

export async function getFavoriteMovies() {
  const lib = await getLibrary();
  return Object.keys(lib).filter(id => lib[id].favorite).map(tmdbId => ({ tmdbId, ...lib[tmdbId] }));
}

export async function getLibraryStats() {
  const lib = await getLibrary();
  let totalWatchlist = 0, totalWatched = 0, totalFavorites = 0, totalRated = 0, sumRating = 0;
  for (const key in lib) {
    const movie = lib[key];
    if (movie.watchlist) totalWatchlist++;
    if (movie.watched) totalWatched++;
    if (movie.favorite) totalFavorites++;
    if (movie.rating !== null && movie.rating !== undefined) {
      totalRated++;
      sumRating += parseFloat(movie.rating);
    }
  }
  return {
    totalWatchlist,
    totalWatched,
    totalFavorites,
    totalRated,
    avgRating: totalRated > 0 ? (sumRating / totalRated).toFixed(1) : 0
  };
}

// Diary
export async function getDiary() {
  const raw = JSON.parse(localStorage.getItem(DIARY_KEY) || '[]');
  const sanitized = raw.map(e => {
    let tmdb_id = e.tmdb_id || e.tmdbId;
    if (!tmdb_id && e['0'] !== undefined) {
      // Auto-recover tmdb_id if saved from spread string
      const keys = Object.keys(e).filter(k => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b));
      if (keys.length > 0) {
        tmdb_id = keys.map(k => e[k]).join('');
      }
    }
    return {
      ...e,
      tmdb_id: tmdb_id || '',
      movie_title: e.movie_title || e.title || e.movieMeta?.title || '',
      poster_url: e.poster_url || e.posterUrl || e.movieMeta?.posterUrl || '',
      watched_on: e.watched_on || e.dateWatched || e.created_at || new Date().toISOString().split('T')[0],
      personal_rating: e.personal_rating !== undefined ? e.personal_rating : (e.rating || null),
      review_text: e.review_text || e.review || '',
      is_rewatch: !!(e.is_rewatch || e.isRewatch),
      tags: e.tags || []
    };
  });
  
  // Filter out any ghost entries that have no movie identifier and no title
  const valid = sanitized.filter(e => Boolean(e.tmdb_id || e.movie_title));
  if (valid.length !== raw.length) {
    localStorage.setItem(DIARY_KEY, JSON.stringify(valid));
  }
  return valid.sort((a, b) => new Date(b.watched_on || b.created_at) - new Date(a.watched_on || a.created_at));
}

export async function saveDiary(entries) {
  localStorage.setItem(DIARY_KEY, JSON.stringify(entries));
}

export async function addDiaryEntry(entryOrTmdbId, maybeData) {
  const diary = await getDiary();
  const id = `diary_${Date.now()}`;
  
  let entry = {};
  if (typeof entryOrTmdbId === 'string' && maybeData) {
    entry = {
      tmdb_id: entryOrTmdbId,
      ...maybeData
    };
  } else if (typeof entryOrTmdbId === 'object') {
    entry = { ...entryOrTmdbId };
  }

  const normalizedEntry = {
    id,
    user_id: entry.user_id || entry.userId || '',
    tmdb_id: entry.tmdb_id || entry.tmdbId || '',
    movie_title: entry.movie_title || entry.title || entry.movieMeta?.title || '',
    poster_url: entry.poster_url || entry.posterUrl || entry.movieMeta?.posterUrl || '',
    watched_on: entry.watched_on || entry.dateWatched || new Date().toISOString().split('T')[0],
    personal_rating: entry.personal_rating !== undefined ? entry.personal_rating : (entry.rating || null),
    review_text: entry.review_text || entry.review || '',
    is_rewatch: !!(entry.is_rewatch || entry.isRewatch),
    tags: Array.isArray(entry.tags) ? entry.tags : (typeof entry.tags === 'string' ? entry.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    created_at: new Date().toISOString()
  };

  diary.push(normalizedEntry);
  await saveDiary(diary);

  if (isSupabaseConfigured() && normalizedEntry.user_id) {
    supabaseService.addDiaryEntry(normalizedEntry).catch(console.error);
  }
  return normalizedEntry;
}

export async function deleteDiaryEntry(entryId) {
  let diary = await getDiary();
  diary = diary.filter(e => e.id !== entryId);
  await saveDiary(diary);

  if (isSupabaseConfigured()) {
    supabaseService.deleteDiaryEntry(entryId).catch(console.error);
  }
}

export async function getDiaryStats() {
  const diary = await getDiary();
  let rewatches = 0, thisMonthCount = 0, thisYearCount = 0;
  const now = new Date();
  
  for (const entry of diary) {
    if (entry.is_rewatch) rewatches++;
    const watchedDate = new Date(entry.watched_on || entry.created_at);
    if (watchedDate.getFullYear() === now.getFullYear()) {
      thisYearCount++;
      if (watchedDate.getMonth() === now.getMonth()) {
        thisMonthCount++;
      }
    }
  }
  return { totalEntries: diary.length, rewatches, thisMonthCount, thisYearCount };
}

// Collections
export async function getCollections() {
  return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]');
}

export async function saveCollections(cols) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols));
}

export async function createCollection(name, description) {
  const cols = await getCollections();
  const newCol = {
    id: `col_${Date.now()}`,
    name,
    description,
    movie_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    visibility: 'private'
  };
  cols.push(newCol);
  await saveCollections(cols);
  return newCol;
}

export async function deleteCollection(collectionId) {
  let cols = await getCollections();
  cols = cols.filter(c => c.id !== collectionId);
  await saveCollections(cols);

  if (isSupabaseConfigured()) {
    supabaseService.deleteCollection(collectionId).catch(console.error);
  }
}

export async function renameCollection(collectionId, name, description) {
  const cols = await getCollections();
  const col = cols.find(c => c.id === collectionId);
  if (col) {
    col.name = name;
    col.description = description;
    col.updated_at = new Date().toISOString();
    await saveCollections(cols);

    if (isSupabaseConfigured() && col.user_id) {
      supabaseService.upsertCollection(col).catch(console.error);
    }
  }
}

export async function addMovieToCollection(collectionId, tmdbId, movieMeta) {
  const cols = await getCollections();
  const col = cols.find(c => c.id === collectionId);
  if (col) {
    if (!col.movie_ids) col.movie_ids = [];
    if (!col.movie_ids.includes(tmdbId)) {
      col.movie_ids.push(tmdbId);
      col.updated_at = new Date().toISOString();
      await saveCollections(cols);

      if (isSupabaseConfigured() && col.user_id) {
        supabaseService.upsertCollection(col).catch(console.error);
      }
    }
  }
}

export async function removeMovieFromCollection(collectionId, tmdbId) {
  const cols = await getCollections();
  const col = cols.find(c => c.id === collectionId);
  if (col && col.movie_ids) {
    col.movie_ids = col.movie_ids.filter(id => id !== tmdbId);
    col.updated_at = new Date().toISOString();
    await saveCollections(cols);

    if (isSupabaseConfigured() && col.user_id) {
      supabaseService.upsertCollection(col).catch(console.error);
    }
  }
}

export async function getCollectionsForMovie(tmdbId) {
  const cols = await getCollections();
  return cols.filter(c => c.movie_ids && c.movie_ids.includes(tmdbId));
}

// ── Alias / backward-compat exports used by generated pages ──────────────────

/** Alias for getDiary() */
export const getDiaryEntries = getDiary;

/** Alias for deleteDiaryEntry() */
export const removeDiaryEntry = deleteDiaryEntry;

/** Alias for renameCollection() */
export const updateCollection = renameCollection;

/**
 * Update a library entry's fields (watchlist, watched, favorite, etc.)
 * Accepts field names used by the DB schema (in_watchlist, is_watched, etc.)
 * OR the internal names (watchlist, watched, favorite).
 */
export async function updateLibraryEntry(tmdbId, updates) {
  const lib = await getLibrary();
  if (!lib[tmdbId]) lib[tmdbId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  // Map DB-style field names to internal names
  if ('in_watchlist' in updates) lib[tmdbId].watchlist = updates.in_watchlist;
  if ('is_watched' in updates) lib[tmdbId].watched = updates.is_watched;
  if ('is_favorite' in updates) lib[tmdbId].favorite = updates.is_favorite;
  if ('personal_rating' in updates) lib[tmdbId].rating = updates.personal_rating;
  if ('notes' in updates) lib[tmdbId].notes = updates.notes;
  if ('watchlist' in updates) lib[tmdbId].watchlist = updates.watchlist;
  if ('watched' in updates) lib[tmdbId].watched = updates.watched;
  if ('favorite' in updates) lib[tmdbId].favorite = updates.favorite;
  await saveLibrary(lib);
}

