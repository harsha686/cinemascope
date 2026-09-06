import { getSupabaseClient, isSupabaseConfigured, supabaseService } from './supabase';

const BASE_LIB_KEY = 'cinemascope_user_library';
const BASE_DIARY_KEY = 'cinemascope_diary';
const BASE_COLLECTIONS_KEY = 'cinemascope_collections';

/**
 * Resolves active user ID from explicit argument, or current logged-in user in localStorage,
 * or falls back to 'guest'.
 */
export function getActiveUserId(fallbackUserId) {
  if (typeof fallbackUserId === 'string' && fallbackUserId.trim()) {
    return fallbackUserId.trim();
  }
  if (fallbackUserId && typeof fallbackUserId === 'object' && fallbackUserId.id) {
    return String(fallbackUserId.id).trim();
  }
  try {
    const raw = localStorage.getItem('cinemascope_currentUser');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.id) return String(u.id).trim();
    }
  } catch (e) {
    // ignore
  }
  return 'guest';
}

/**
 * Migrates legacy unpartitioned library data to 'admin-1' if needed,
 * so the initial creator doesn't lose their data, while other users get fresh, empty libraries.
 */
function migrateLegacyDataIfNeeded(targetUserId) {
  try {
    const legacyLib = localStorage.getItem(BASE_LIB_KEY);
    if (legacyLib) {
      const adminLibKey = `${BASE_LIB_KEY}_admin-1`;
      if (!localStorage.getItem(adminLibKey)) {
        localStorage.setItem(adminLibKey, legacyLib);
      }
      localStorage.removeItem(BASE_LIB_KEY);
    }

    const legacyDiary = localStorage.getItem(BASE_DIARY_KEY);
    if (legacyDiary) {
      const adminDiaryKey = `${BASE_DIARY_KEY}_admin-1`;
      if (!localStorage.getItem(adminDiaryKey)) {
        localStorage.setItem(adminDiaryKey, legacyDiary);
      }
      localStorage.removeItem(BASE_DIARY_KEY);
    }

    const legacyCollections = localStorage.getItem(BASE_COLLECTIONS_KEY);
    if (legacyCollections) {
      const adminColKey = `${BASE_COLLECTIONS_KEY}_admin-1`;
      if (!localStorage.getItem(adminColKey)) {
        localStorage.setItem(adminColKey, legacyCollections);
      }
      localStorage.removeItem(BASE_COLLECTIONS_KEY);
    }
  } catch (e) {
    // ignore
  }
}

function getLibStorageKey(userId) {
  const uid = getActiveUserId(userId);
  migrateLegacyDataIfNeeded(uid);
  return `${BASE_LIB_KEY}_${uid}`;
}

function getDiaryStorageKey(userId) {
  const uid = getActiveUserId(userId);
  migrateLegacyDataIfNeeded(uid);
  return `${BASE_DIARY_KEY}_${uid}`;
}

function getCollectionsStorageKey(userId) {
  const uid = getActiveUserId(userId);
  migrateLegacyDataIfNeeded(uid);
  return `${BASE_COLLECTIONS_KEY}_${uid}`;
}

// Library state management (localStorage + optional Supabase)
export async function getLibrary(userId) {
  const key = getLibStorageKey(userId);
  return JSON.parse(localStorage.getItem(key) || '{}');
}

export async function saveLibrary(lib, userId) {
  const key = getLibStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(lib));
}

export async function getMovieStatus(tmdbId, userId) {
  const cleanId = String(tmdbId || '').replace('tmdb-', '');
  const lib = await getLibrary(userId);
  const entry = lib[cleanId] || { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  return {
    ...entry,
    inWatchlist: !!entry.watchlist,
    isWatched: !!entry.watched,
    isFavorite: !!entry.favorite,
    rating: entry.rating || 0
  };
}

export async function toggleWatchlist(tmdbId, userIdOrMeta) {
  const cleanId = String(tmdbId || '').replace('tmdb-', '');
  const userId = getActiveUserId(userIdOrMeta);
  const lib = await getLibrary(userId);
  if (!lib[cleanId]) lib[cleanId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  lib[cleanId].watchlist = !lib[cleanId].watchlist;
  await saveLibrary(lib, userId);
  
  if (isSupabaseConfigured() && userId && userId !== 'guest') {
    supabaseService.upsertUserMovie({
      id: `${userId}_${cleanId}`,
      user_id: userId,
      tmdb_id: cleanId,
      in_watchlist: lib[cleanId].watchlist,
      is_watched: lib[cleanId].watched,
      is_favorite: lib[cleanId].favorite,
      personal_rating: lib[cleanId].rating,
      notes: lib[cleanId].notes,
      watch_count: lib[cleanId].watchCount,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  }

  return {
    ...lib[cleanId],
    inWatchlist: !!lib[cleanId].watchlist,
    isWatched: !!lib[cleanId].watched,
    isFavorite: !!lib[cleanId].favorite,
    rating: lib[cleanId].rating || 0
  };
}

export async function toggleWatched(tmdbId, userIdOrMeta) {
  const cleanId = String(tmdbId || '').replace('tmdb-', '');
  const userId = getActiveUserId(userIdOrMeta);
  const lib = await getLibrary(userId);
  if (!lib[cleanId]) lib[cleanId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  lib[cleanId].watched = !lib[cleanId].watched;
  if (lib[cleanId].watched) {
    lib[cleanId].watchCount = (lib[cleanId].watchCount || 0) + 1;
  }
  await saveLibrary(lib, userId);

  if (isSupabaseConfigured() && userId && userId !== 'guest') {
    supabaseService.upsertUserMovie({
      id: `${userId}_${cleanId}`,
      user_id: userId,
      tmdb_id: cleanId,
      in_watchlist: lib[cleanId].watchlist,
      is_watched: lib[cleanId].watched,
      is_favorite: lib[cleanId].favorite,
      personal_rating: lib[cleanId].rating,
      notes: lib[cleanId].notes,
      watch_count: lib[cleanId].watchCount,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  }

  return {
    ...lib[cleanId],
    inWatchlist: !!lib[cleanId].watchlist,
    isWatched: !!lib[cleanId].watched,
    isFavorite: !!lib[cleanId].favorite,
    rating: lib[cleanId].rating || 0
  };
}

export async function toggleFavorite(tmdbId, userIdOrMeta) {
  const cleanId = String(tmdbId || '').replace('tmdb-', '');
  const userId = getActiveUserId(userIdOrMeta);
  const lib = await getLibrary(userId);
  if (!lib[cleanId]) lib[cleanId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  lib[cleanId].favorite = !lib[cleanId].favorite;
  await saveLibrary(lib, userId);

  if (isSupabaseConfigured() && userId && userId !== 'guest') {
    supabaseService.upsertUserMovie({
      id: `${userId}_${cleanId}`,
      user_id: userId,
      tmdb_id: cleanId,
      in_watchlist: lib[cleanId].watchlist,
      is_watched: lib[cleanId].watched,
      is_favorite: lib[cleanId].favorite,
      personal_rating: lib[cleanId].rating,
      notes: lib[cleanId].notes,
      watch_count: lib[cleanId].watchCount,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  }

  return {
    ...lib[cleanId],
    inWatchlist: !!lib[cleanId].watchlist,
    isWatched: !!lib[cleanId].watched,
    isFavorite: !!lib[cleanId].favorite,
    rating: lib[cleanId].rating || 0
  };
}

export async function setPersonalRating(tmdbId, userIdOrMeta, rating) {
  const cleanId = String(tmdbId || '').replace('tmdb-', '');
  const userId = getActiveUserId(userIdOrMeta);
  const lib = await getLibrary(userId);
  if (!lib[cleanId]) lib[cleanId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  lib[cleanId].rating = rating;
  await saveLibrary(lib, userId);

  if (isSupabaseConfigured() && userId && userId !== 'guest') {
    supabaseService.upsertUserMovie({
      id: `${userId}_${cleanId}`,
      user_id: userId,
      tmdb_id: cleanId,
      in_watchlist: lib[cleanId].watchlist,
      is_watched: lib[cleanId].watched,
      is_favorite: lib[cleanId].favorite,
      personal_rating: lib[cleanId].rating,
      notes: lib[cleanId].notes,
      watch_count: lib[cleanId].watchCount,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  }

  return {
    ...lib[cleanId],
    inWatchlist: !!lib[cleanId].watchlist,
    isWatched: !!lib[cleanId].watched,
    isFavorite: !!lib[cleanId].favorite,
    rating: lib[cleanId].rating || 0
  };
}

export async function setNotes(tmdbId, userId, notes) {
  const cleanId = String(tmdbId || '').replace('tmdb-', '');
  const uid = getActiveUserId(userId);
  const lib = await getLibrary(uid);
  if (!lib[cleanId]) lib[cleanId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  lib[cleanId].notes = notes;
  await saveLibrary(lib, uid);

  if (isSupabaseConfigured() && uid && uid !== 'guest') {
    supabaseService.upsertUserMovie({
      id: `${uid}_${cleanId}`,
      user_id: uid,
      tmdb_id: cleanId,
      in_watchlist: lib[cleanId].watchlist,
      is_watched: lib[cleanId].watched,
      is_favorite: lib[cleanId].favorite,
      personal_rating: lib[cleanId].rating,
      notes: lib[cleanId].notes,
      watch_count: lib[cleanId].watchCount,
      updated_at: new Date().toISOString()
    }).catch(console.error);
  }
}

export async function getWatchlistMovies(userId) {
  const lib = await getLibrary(userId);
  return Object.keys(lib).filter(id => lib[id].watchlist).map(tmdbId => ({ tmdbId, ...lib[tmdbId] }));
}

export async function getWatchedMovies(userId) {
  const lib = await getLibrary(userId);
  return Object.keys(lib).filter(id => lib[id].watched).map(tmdbId => ({ tmdbId, ...lib[tmdbId] }));
}

export async function getFavoriteMovies(userId) {
  const lib = await getLibrary(userId);
  return Object.keys(lib).filter(id => lib[id].favorite).map(tmdbId => ({ tmdbId, ...lib[tmdbId] }));
}

export async function getLibraryStats(userId) {
  const lib = await getLibrary(userId);
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
export async function getDiary(userId) {
  const key = getDiaryStorageKey(userId);
  const raw = JSON.parse(localStorage.getItem(key) || '[]');
  const sanitized = raw.map(e => {
    let tmdb_id = e.tmdb_id || e.tmdbId;
    if (!tmdb_id && e['0'] !== undefined) {
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
  
  const valid = sanitized.filter(e => Boolean(e.tmdb_id || e.movie_title));
  if (valid.length !== raw.length) {
    localStorage.setItem(key, JSON.stringify(valid));
  }
  return valid.sort((a, b) => new Date(b.watched_on || b.created_at) - new Date(a.watched_on || a.created_at));
}

export async function saveDiary(entries, userId) {
  const key = getDiaryStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(entries));
}

export async function addDiaryEntry(entryOrTmdbId, maybeData, userIdOrMeta) {
  let entry = {};
  if (typeof entryOrTmdbId === 'string' && maybeData) {
    entry = {
      tmdb_id: entryOrTmdbId,
      ...maybeData
    };
  } else if (typeof entryOrTmdbId === 'object') {
    entry = { ...entryOrTmdbId };
  }

  const userId = getActiveUserId(userIdOrMeta || entry.user_id || entry.userId);
  const diary = await getDiary(userId);
  const id = `diary_${Date.now()}`;

  const normalizedEntry = {
    id,
    user_id: userId,
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
  await saveDiary(diary, userId);

  if (isSupabaseConfigured() && normalizedEntry.user_id && normalizedEntry.user_id !== 'guest') {
    supabaseService.addDiaryEntry(normalizedEntry).catch(console.error);
  }
  return normalizedEntry;
}

export async function deleteDiaryEntry(entryId, userId) {
  const uid = getActiveUserId(userId);
  let diary = await getDiary(uid);
  diary = diary.filter(e => e.id !== entryId);
  await saveDiary(diary, uid);

  if (isSupabaseConfigured()) {
    supabaseService.deleteDiaryEntry(entryId).catch(console.error);
  }
}

export async function getDiaryStats(userId) {
  const diary = await getDiary(userId);
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
export async function getCollections(userId) {
  const key = getCollectionsStorageKey(userId);
  return JSON.parse(localStorage.getItem(key) || '[]');
}

export async function saveCollections(cols, userId) {
  const key = getCollectionsStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(cols));
}

export async function createCollection(name, description, userId) {
  const uid = getActiveUserId(userId);
  const cols = await getCollections(uid);
  const newCol = {
    id: `col_${Date.now()}`,
    user_id: uid,
    name,
    description,
    movie_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    visibility: 'private'
  };
  cols.push(newCol);
  await saveCollections(cols, uid);
  return newCol;
}

export async function deleteCollection(collectionId, userId) {
  const uid = getActiveUserId(userId);
  let cols = await getCollections(uid);
  cols = cols.filter(c => c.id !== collectionId);
  await saveCollections(cols, uid);

  if (isSupabaseConfigured()) {
    supabaseService.deleteCollection(collectionId).catch(console.error);
  }
}

export async function renameCollection(collectionId, name, description, userId) {
  const uid = getActiveUserId(userId);
  const cols = await getCollections(uid);
  const col = cols.find(c => c.id === collectionId);
  if (col) {
    col.name = name;
    col.description = description;
    col.updated_at = new Date().toISOString();
    await saveCollections(cols, uid);

    if (isSupabaseConfigured() && col.user_id && col.user_id !== 'guest') {
      supabaseService.upsertCollection(col).catch(console.error);
    }
  }
}

export async function addMovieToCollection(collectionId, tmdbId, movieMeta, userId) {
  const uid = getActiveUserId(userId);
  const cleanId = String(tmdbId || '').replace('tmdb-', '');
  const cols = await getCollections(uid);
  const col = cols.find(c => c.id === collectionId);
  if (col) {
    if (!col.movie_ids) col.movie_ids = [];
    if (!col.movie_ids.includes(cleanId)) {
      col.movie_ids.push(cleanId);
      col.updated_at = new Date().toISOString();
      await saveCollections(cols, uid);

      if (isSupabaseConfigured() && col.user_id && col.user_id !== 'guest') {
        supabaseService.upsertCollection(col).catch(console.error);
      }
    }
  }
}

export async function removeMovieFromCollection(collectionId, tmdbId, userId) {
  const uid = getActiveUserId(userId);
  const cleanId = String(tmdbId || '').replace('tmdb-', '');
  const cols = await getCollections(uid);
  const col = cols.find(c => c.id === collectionId);
  if (col && col.movie_ids) {
    col.movie_ids = col.movie_ids.filter(id => id !== cleanId);
    col.updated_at = new Date().toISOString();
    await saveCollections(cols, uid);

    if (isSupabaseConfigured() && col.user_id && col.user_id !== 'guest') {
      supabaseService.upsertCollection(col).catch(console.error);
    }
  }
}

export async function getCollectionsForMovie(tmdbId, userId) {
  const cleanId = String(tmdbId || '').replace('tmdb-', '');
  const cols = await getCollections(userId);
  return cols.filter(c => c.movie_ids && c.movie_ids.includes(cleanId));
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
 */
export async function updateLibraryEntry(tmdbId, updates, userId) {
  const cleanId = String(tmdbId || '').replace('tmdb-', '');
  const uid = getActiveUserId(userId);
  const lib = await getLibrary(uid);
  if (!lib[cleanId]) lib[cleanId] = { watchlist: false, watched: false, favorite: false, rating: null, notes: '', watchCount: 0 };
  // Map DB-style field names to internal names
  if ('in_watchlist' in updates) lib[cleanId].watchlist = updates.in_watchlist;
  if ('is_watched' in updates) lib[cleanId].watched = updates.is_watched;
  if ('is_favorite' in updates) lib[cleanId].favorite = updates.is_favorite;
  if ('personal_rating' in updates) lib[cleanId].rating = updates.personal_rating;
  if ('notes' in updates) lib[cleanId].notes = updates.notes;
  if ('watchlist' in updates) lib[cleanId].watchlist = updates.watchlist;
  if ('watched' in updates) lib[cleanId].watched = updates.watched;
  if ('favorite' in updates) lib[cleanId].favorite = updates.favorite;
  await saveLibrary(lib, uid);
}

