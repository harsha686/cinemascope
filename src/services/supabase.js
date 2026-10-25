import { createClient } from '@supabase/supabase-js';

// Default connected Supabase Project
const DEFAULT_SUPABASE_URL = 'https://ioudwvkvtxlzmcqnrqlq.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdWR3dmt2dHhsem1jcW5ycWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODA0MjYsImV4cCI6MjEwMzc1NjQyNn0.7EnHtyNOFbQ8iyBTk6OGLB4yEbNhRC-qmc_P1rNc5vs';

// Read from env vars, localStorage custom config, or defaults
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const customUrl = localStorage.getItem('cinemascope_supabase_url') || '';
  const customKey = localStorage.getItem('cinemascope_supabase_key') || '';

  return {
    url: customUrl.trim() || envUrl.trim() || DEFAULT_SUPABASE_URL,
    key: customKey.trim() || envKey.trim() || DEFAULT_SUPABASE_KEY,
  };
};

let supabaseClient = null;
let supabaseClientUrl = null;

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  // Re-create client if URL changed (credentials updated)
  if (!supabaseClient || supabaseClientUrl !== url) {
    supabaseClient = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    supabaseClientUrl = url;
  }
  return supabaseClient;
};

export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http'));
};

export const setCustomSupabaseCredentials = (url, key) => {
  if (url) localStorage.setItem('cinemascope_supabase_url', url.trim());
  else localStorage.removeItem('cinemascope_supabase_url');

  if (key) localStorage.setItem('cinemascope_supabase_key', key.trim());
  else localStorage.removeItem('cinemascope_supabase_key');

  supabaseClient = null; // reset client
};

export const signInWithGoogle = async (redirectTo) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured.') };
  }

  const callbackUrl = redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/movies` : undefined);

  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
};

export const signOutUser = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
};

// ============================================================
// DATA SYNC SERVICES
// ============================================================

export const supabaseService = {
  // Movies
  async getDeletedMovieIds() {
    const supabase = getSupabaseClient();
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('description')
        .eq('id', 'system_deleted_movies')
        .maybeSingle();
      if (error || !data?.description) return [];
      const parsed = JSON.parse(data.description);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  async recordDeletedMovieId(id) {
    if (!id) return false;
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      const current = await this.getDeletedMovieIds();
      if (!current.includes(id)) {
        current.push(id);
        await supabase.from('collections').upsert({
          id: 'system_deleted_movies',
          user_id: 'system',
          name: 'deleted_movies_blacklist',
          description: JSON.stringify(current),
          visibility: 'public',
          movie_ids: [],
          updated_at: new Date().toISOString(),
        });
      }
      return true;
    } catch (e) {
      console.warn('recordDeletedMovieId error:', e);
      return false;
    }
  },

  async getMovies() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const [moviesRes, deletedIds] = await Promise.all([
      supabase.from('movies').select('*').order('created_at', { ascending: false }),
      this.getDeletedMovieIds().catch(() => []),
    ]);
    if (moviesRes.error) {
      console.warn('Supabase fetch movies error:', moviesRes.error);
      return null;
    }
    const deletedSet = new Set(deletedIds || []);
    return (moviesRes.data || []).filter(m => {
      if (!m || !m.id) return false;
      if (deletedSet.has(m.id)) return false;
      // Skip empty auto-stubs with no director, no overview, and no theaters
      if (m.status === 'ARCHIVED' && (!m.director || m.director.trim() === '') && (!m.theaters || m.theaters.length === 0)) {
        return false;
      }
      return true;
    });
  },

  async saveMovie(movie) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error } = await supabase.from('movies').upsert({
      id: movie.id,
      title: movie.title,
      original_title: movie.originalTitle || movie.title,
      poster_url: movie.posterUrl,
      poster_source: movie.posterSource,
      poster_source_type: movie.posterSourceType || 'OFFICIAL',
      backdrop_url: movie.backdropUrl,
      language: movie.language,
      runtime: movie.runtime,
      release_date: movie.releaseDate,
      genres: movie.genres,
      overview: movie.overview,
      cast_list: movie.cast,
      director: movie.director,
      certificate: movie.certificate,
      trailer_url: movie.trailerUrl,
      aspect_ratio: movie.aspectRatio,
      status: movie.status,
      cities: movie.cities,
      theaters: movie.theaters || [],
      updated_at: new Date().toISOString(),
    });
    if (error) console.error('Supabase saveMovie error:', error);
    return !error;
  },

  async deleteMovie(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    try {
      // 1. Record in persistent blacklist first
      await this.recordDeletedMovieId(id);

      // 2. Disassociate reviews pointing to this movie so FK constraint does not fail
      await supabase.from('reviews').update({ movie_id: null }).eq('movie_id', id);

      // 3. Delete from movies table
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (error) console.warn('Supabase deleteMovie error:', error);
      return !error;
    } catch (e) {
      console.warn('deleteMovie error:', e);
      return false;
    }
  },

  // Reviews
  async getReviews() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch reviews error:', error);
      return null;
    }
    return data.map(r => {
      const paramRatings = r.parameter_ratings || {};
      const resolvedMovieId = r.movie_id || paramRatings.originalMovieId || (paramRatings.tmdbId ? `tmdb-${paramRatings.tmdbId}` : null);
      const isTheater = r.target_type === 'THEATER' || !!r.theater_id || !!paramRatings.theaterId || (r.movie_id && String(r.movie_id).startsWith('theater-'));
      return {
        id: r.id,
        movieId: isTheater ? null : resolvedMovieId,
        tmdbId: paramRatings.tmdbId || (resolvedMovieId ? String(resolvedMovieId).replace(/^tmdb-/, '') : null),
        movieTitle: paramRatings.originalMovieTitle || r.movie_title || null,
        posterUrl: paramRatings.posterUrl || null,
        theaterId: paramRatings.theaterId || r.theater_id || (r.movie_id && String(r.movie_id).startsWith('theater-') ? String(r.movie_id).replace(/^theater-/, '') : null),
        theaterName: paramRatings.theaterName || r.theater_name || null,
        screenId: paramRatings.screenId || r.screen_id || null,
        screenName: paramRatings.screenName || r.screen_name || null,
        targetType: isTheater ? 'THEATER' : 'MOVIE',
        userId: r.user_id,
        userDisplayName: r.user_display_name,
        rating: r.rating,
        parameterRatings: paramRatings,
        reviewText: r.review_text,
        reviewType: paramRatings.reviewType || (r.is_pro ? 'PROFESSIONAL' : 'USER'),
        status: r.status || 'PUBLISHED',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        likesCount: r.likes_count || 0,
        reportCount: r.report_count || 0,
      };
    });
  },

  async saveReview(review) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const isTheater = review.targetType === 'THEATER' || !!review.theaterId;
    const rawTmdbId = review.tmdbId || (review.movieId ? String(review.movieId).replace(/^tmdb-/, '') : null);
    const paramRatings = {
      ...(review.parameterRatings || {}),
      reviewType: review.reviewType || 'USER',
      ...(review.theaterId ? {
        theaterId: review.theaterId,
        theaterName: review.theaterName || null,
        screenId: review.screenId || null,
        screenName: review.screenName || null,
        targetType: 'THEATER',
      } : {}),
      ...(review.movieId ? {
        originalMovieId: review.movieId,
        originalMovieTitle: review.movieTitle || null,
        posterUrl: review.posterUrl || null,
        tmdbId: rawTmdbId,
      } : {}),
    };
    const payload = {
      id: review.id,
      movie_id: isTheater ? null : (review.movieId || null),
      user_id: review.userId,
      user_display_name: review.userDisplayName,
      rating: review.rating,
      parameter_ratings: paramRatings,
      review_text: review.reviewText || '',
      status: review.status || 'PUBLISHED',
      likes_count: review.likesCount || 0,
      report_count: review.reportCount || 0,
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabase.from('reviews').upsert(payload);
    
    // If foreign key constraint failed on movie_id (e.g. deleted movie or external TMDB movie),
    // fallback immediately to movie_id = null so the review is NEVER lost and no unwanted movie stubs are created
    if (error && (error.message?.includes('foreign key') || error.message?.includes('reviews_movie_id_fkey') || error.code === '23503')) {
      payload.movie_id = null;
      const retryNull = await supabase.from('reviews').upsert(payload);
      error = retryNull.error;
    }

    if (error) {
      // If review_type column does not exist on remote schema, retry without it
      if (error.message && error.message.includes('review_type')) {
        delete payload.review_type;
        const { error: retryErr } = await supabase.from('reviews').upsert(payload);
        if (retryErr) console.warn('Supabase saveReview retry error:', retryErr);
        return !retryErr;
      }
      console.warn('Supabase saveReview error:', error);
      return false;
    }
    return true;
  },

  async deleteReview(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    return !error;
  },

  async updateReviewLikes(reviewId, likesCount) {
    const supabase = getSupabaseClient();
    if (!supabase || !reviewId) return false;
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          likes_count: Math.max(0, Number(likesCount) || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);
      if (error) {
        console.warn('Supabase updateReviewLikes error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase updateReviewLikes error:', e);
      return false;
    }
  },

  // Users — reads from system_users_data collection (cross-device sync layer)
  // Falls back to public.users table if it exists (created via SQL editor)
  async getUsers() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      // Primary: read from system_users_data collection (always available)
      const { data: colData, error: colErr } = await supabase
        .from('collections')
        .select('*')
        .eq('id', 'system_users_data')
        .maybeSingle();

      if (!colErr && colData && colData.description) {
        const parsed = JSON.parse(colData.description);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Deduplicate by ID and DisplayName
          const seen = new Set();
          return parsed.filter(u => {
            if (!u || !u.id) return false;
            const normName = (u.displayName || '').trim().toLowerCase();
            const key = normName ? `name:${normName}` : `id:${u.id}`;
            if (seen.has(key) || seen.has(`id:${u.id}`)) return false;
            seen.add(key);
            seen.add(`id:${u.id}`);
            return true;
          });
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  // Save the full users list to system_users_data collection
  async saveUsersData(usersList) {
    const supabase = getSupabaseClient();
    if (!supabase || !usersList) return false;
    try {
      const { error } = await supabase.from('collections').upsert({
        id: 'system_users_data',
        user_id: 'system',
        name: 'users_state',
        description: JSON.stringify(usersList),
        visibility: 'public',
        movie_ids: [],
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase saveUsersData error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveUsersData error:', e);
      return false;
    }
  },

  // Append a single new user to the cloud list atomically
  async appendUserToCloudList(user) {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return false;
    try {
      // Fetch current list
      const { data: colData } = await supabase
        .from('collections')
        .select('description')
        .eq('id', 'system_users_data')
        .maybeSingle();

      let currentList = [];
      if (colData && colData.description) {
        try { currentList = JSON.parse(colData.description); } catch (_) {}
      }
      if (!Array.isArray(currentList)) currentList = [];

      const normUserEmail = (user.email && user.email !== '—') ? user.email.toLowerCase().trim() : null;
      const normUserName = (user.displayName || '').trim().toLowerCase();

      // Deduplicate by id, email, and display name
      const existsIndex = currentList.findIndex(u =>
        u.id === user.id ||
        (normUserEmail && u.email && u.email !== '—' && u.email.toLowerCase().trim() === normUserEmail) ||
        (normUserName && u.displayName && u.displayName.trim().toLowerCase() === normUserName)
      );

      if (existsIndex >= 0) {
        // Update in place preserving existing stats or merging newer ones
        const existing = currentList[existsIndex];
        currentList[existsIndex] = {
          ...existing,
          ...user,
          stats: { ...(existing.stats || {}), ...(user.stats || {}) },
        };
        return this.saveUsersData(currentList);
      }

      return this.saveUsersData([...currentList, user]);
    } catch (e) {
      console.warn('appendUserToCloudList error:', e);
      return false;
    }
  },

  async saveUser(user) {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return false;
    // Append to the cross-device system_users_data collection
    return await this.appendUserToCloudList(user).catch(console.warn);
  },

  // Delete user account and associated personal data across Supabase
  async deleteUserAccount(userId, userEmail, displayName) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      // 1. Remove from system_users_data collection (community directory)
      const { data: colData } = await supabase
        .from('collections')
        .select('description')
        .eq('id', 'system_users_data')
        .maybeSingle();

      if (colData && colData.description) {
        try {
          const currentList = JSON.parse(colData.description);
          if (Array.isArray(currentList)) {
            const normEmail = (userEmail && userEmail !== '—') ? userEmail.toLowerCase().trim() : null;
            const normName = (displayName || '').trim().toLowerCase();

            const filteredList = currentList.filter(u => {
              if (u.id && userId && u.id === userId) return false;
              if (normEmail && u.email && u.email !== '—' && u.email.toLowerCase().trim() === normEmail) return false;
              if (normName && u.displayName && u.displayName.trim().toLowerCase() === normName) return false;
              return true;
            });

            await this.saveUsersData(filteredList);
          }
        } catch (e) {
          console.warn('Error filtering system_users_data during deleteUserAccount:', e);
        }
      }


      // 3. Remove reviews written by this user
      if (userId) {
        await supabase.from('reviews').delete().eq('user_id', userId).catch(() => {});
      }
      if (userEmail && userEmail !== '—') {
        await supabase.from('reviews').delete().eq('user_email', userEmail).catch(() => {});
      }
      if (displayName) {
        await supabase.from('reviews').delete().eq('user_display_name', displayName).catch(() => {});
      }

      // 4. Remove user_movies (watchlist, watched, favorites, ratings)
      if (userId) {
        await supabase.from('user_movies').delete().eq('user_id', userId).catch(() => {});
      }

      // 5. Remove diary_entries
      if (userId) {
        await supabase.from('diary_entries').delete().eq('user_id', userId).catch(() => {});
      }

      // 6. Remove user collections (preserve system collections like system_users_data)
      if (userId) {
        await supabase.from('collections').delete().eq('user_id', userId).neq('id', 'system_users_data').catch(() => {});
      }

      // 7. Remove weekend_votes
      if (userId) {
        await supabase.from('weekend_votes').delete().eq('user_id', userId).catch(() => {});
      }
      if (userEmail && userEmail !== '—') {
        await supabase.from('weekend_votes').delete().eq('user_email', userEmail).catch(() => {});
      }

      // 8. Remove pro_applications
      if (userId) {
        await supabase.from('professional_applications').delete().eq('user_id', userId).catch(() => {});
        await supabase.from('pro_applications').delete().eq('user_id', userId).catch(() => {});
      }

      return true;
    } catch (e) {
      console.warn('Supabase deleteUserAccount error:', e);
      return false;
    }
  },

  // User Movies
  async upsertUserMovie(record) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error } = await supabase.from('user_movies').upsert(record);
    if (error) console.error('Supabase upsertUserMovie error:', error);
    return !error;
  },
  async deleteUserMovie(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error } = await supabase.from('user_movies').delete().eq('id', id);
    return !error;
  },
  async getUserMovies(userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('user_movies').select('*').eq('user_id', userId);
    if (error) {
      console.warn('Supabase getUserMovies error:', error);
      return null;
    }
    return data;
  },

  // Diary
  async addDiaryEntry(entry) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error } = await supabase.from('diary_entries').insert(entry);
    if (error) console.error('Supabase addDiaryEntry error:', error);
    return !error;
  },
  async deleteDiaryEntry(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error } = await supabase.from('diary_entries').delete().eq('id', id);
    return !error;
  },
  async getUserDiary(userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('diary_entries').select('*').eq('user_id', userId).order('watched_on', { ascending: false });
    if (error) {
      console.warn('Supabase getUserDiary error:', error);
      return null;
    }
    return data;
  },

  // Collections
  async upsertCollection(collection) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error } = await supabase.from('collections').upsert(collection);
    if (error) console.error('Supabase upsertCollection error:', error);
    return !error;
  },
  async deleteCollection(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const { error } = await supabase.from('collections').delete().eq('id', id);
    return !error;
  },
  async getUserCollections(userId) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('collections').select('*').eq('user_id', userId);
    if (error) {
      console.warn('Supabase getUserCollections error:', error);
      return null;
    }
    return data;
  },
  async getCollectionById(id) {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('collections').select('*').eq('id', id).maybeSingle();
    if (error) {
      console.warn('Supabase getCollectionById error:', error);
      return null;
    }
    return data;
  },

  // Weekend Pick Cloud Sync across all devices (Desktop, Mobile, Tablet)
  async getWeekendPickData() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', 'system_weekend_pick_data')
        .maybeSingle();

      if (error || !data || !data.description) return null;
      return JSON.parse(data.description);
    } catch (e) {
      console.warn('Supabase getWeekendPickData error:', e);
      return null;
    }
  },

  async saveWeekendPickData(payload) {
    const supabase = getSupabaseClient();
    if (!supabase || !payload) return false;
    try {
      const { error } = await supabase.from('collections').upsert({
        id: 'system_weekend_pick_data',
        user_id: 'system',
        name: 'weekend_state',
        description: JSON.stringify(payload),
        visibility: 'public',
        movie_ids: [],
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase saveWeekendPickData error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveWeekendPickData error:', e);
      return false;
    }
  },

  // Theaters & Screens Cloud Sync across all devices (Desktop, Mobile, Tablet)
  async getTheatersData() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', 'system_theaters_data')
        .maybeSingle();

      if (error || !data || !data.description) return null;
      return JSON.parse(data.description);
    } catch (e) {
      console.warn('Supabase getTheatersData error:', e);
      return null;
    }
  },

  async saveTheatersData(theatersList) {
    const supabase = getSupabaseClient();
    if (!supabase || !theatersList) return false;
    try {
      const { error } = await supabase.from('collections').upsert({
        id: 'system_theaters_data',
        user_id: 'system',
        name: 'theaters_state',
        description: JSON.stringify(theatersList),
        visibility: 'public',
        movie_ids: [],
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase saveTheatersData error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveTheatersData error:', e);
      return false;
    }
  },

  // Cities Cloud Sync across all devices
  async getCitiesData() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', 'system_cities_data')
        .maybeSingle();

      if (error || !data || !data.description) return null;
      return JSON.parse(data.description);
    } catch (e) {
      console.warn('Supabase getCitiesData error:', e);
      return null;
    }
  },

  async saveCitiesData(citiesList) {
    const supabase = getSupabaseClient();
    if (!supabase || !citiesList) return false;
    try {
      const { error } = await supabase.from('collections').upsert({
        id: 'system_cities_data',
        user_id: 'system',
        name: 'cities_state',
        description: JSON.stringify(citiesList),
        visibility: 'public',
        movie_ids: [],
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase saveCitiesData error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveCitiesData error:', e);
      return false;
    }
  },

  // Professional Reviewer Applications Cloud Sync across all devices
  async getProApplicationsData() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', 'system_pro_applications_data')
        .maybeSingle();

      if (error || !data || !data.description) return null;
      return JSON.parse(data.description);
    } catch (e) {
      console.warn('Supabase getProApplicationsData error:', e);
      return null;
    }
  },

  async saveProApplicationsData(appsList) {
    const supabase = getSupabaseClient();
    if (!supabase || !appsList) return false;
    try {
      const { error } = await supabase.from('collections').upsert({
        id: 'system_pro_applications_data',
        user_id: 'system',
        name: 'pro_applications_state',
        description: JSON.stringify(appsList),
        visibility: 'public',
        movie_ids: [],
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase saveProApplicationsData error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveProApplicationsData error:', e);
      return false;
    }
  },

  async appendProApplicationToCloud(app) {
    const supabase = getSupabaseClient();
    if (!supabase || !app) return false;
    try {
      const { data: colData } = await supabase
        .from('collections')
        .select('description')
        .eq('id', 'system_pro_applications_data')
        .maybeSingle();

      let currentList = [];
      if (colData && colData.description) {
        try { currentList = JSON.parse(colData.description); } catch (_) {}
      }
      if (!Array.isArray(currentList)) currentList = [];

      const idx = currentList.findIndex(a => a.userId === app.userId || a.id === app.id);
      if (idx >= 0) {
        currentList[idx] = { ...currentList[idx], ...app };
      } else {
        currentList.push(app);
      }
      return this.saveProApplicationsData(currentList);
    } catch (e) {
      console.warn('appendProApplicationToCloud error:', e);
      return false;
    }
  },

  // Notifications Cloud Sync across all devices
  async getNotificationsData() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', 'system_notifications_data')
        .maybeSingle();

      if (error || !data || !data.description) return null;
      const parsed = JSON.parse(data.description);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Supabase getNotificationsData error:', e);
      return null;
    }
  },

  async saveNotificationsData(notificationsList) {
    const supabase = getSupabaseClient();
    if (!supabase || !notificationsList) return false;
    try {
      const trimmed = Array.isArray(notificationsList) ? notificationsList.slice(0, 150) : [];
      const { error } = await supabase.from('collections').upsert({
        id: 'system_notifications_data',
        user_id: 'system',
        name: 'notifications_state',
        description: JSON.stringify(trimmed),
        visibility: 'public',
        movie_ids: [],
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase saveNotificationsData error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveNotificationsData error:', e);
      return false;
    }
  },

  async getHelpfulVotesData() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', 'system_helpful_votes_data')
        .maybeSingle();

      if (error || !data || !data.description) return null;
      const parsed = JSON.parse(data.description);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Supabase getHelpfulVotesData error:', e);
      return null;
    }
  },

  async saveHelpfulVotesData(votesList) {
    const supabase = getSupabaseClient();
    if (!supabase || !votesList) return false;
    try {
      const trimmed = Array.isArray(votesList) ? votesList.slice(0, 500) : [];
      const { error } = await supabase.from('collections').upsert({
        id: 'system_helpful_votes_data',
        user_id: 'system',
        name: 'helpful_votes_state',
        description: JSON.stringify(trimmed),
        visibility: 'public',
        movie_ids: [],
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase saveHelpfulVotesData error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveHelpfulVotesData error:', e);
      return false;
    }
  },

  // Account Deletion Requests Cloud Sync
  async getDeletionRequestsData() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', 'system_deletion_requests')
        .maybeSingle();

      if (error || !data || !data.description) return null;
      const parsed = JSON.parse(data.description);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Supabase getDeletionRequestsData error:', e);
      return null;
    }
  },

  async saveDeletionRequestsData(requestsList) {
    const supabase = getSupabaseClient();
    if (!supabase || !requestsList) return false;
    try {
      const { error } = await supabase.from('collections').upsert({
        id: 'system_deletion_requests',
        user_id: 'system',
        name: 'deletion_requests_state',
        description: JSON.stringify(requestsList),
        visibility: 'public',
        movie_ids: [],
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase saveDeletionRequestsData error:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveDeletionRequestsData error:', e);
      return false;
    }
  },
};
