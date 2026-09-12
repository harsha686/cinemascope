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

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(url, key);
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

// ============================================================
// DATA SYNC SERVICES
// ============================================================

export const supabaseService = {
  // Movies
  async getMovies() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch movies error:', error);
      return null;
    }
    return data;
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
    const { error } = await supabase.from('movies').delete().eq('id', id);
    return !error;
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
    return data.map(r => ({
      id: r.id,
      movieId: r.movie_id,
      theaterId: r.theater_id || r.parameter_ratings?.theaterId || (r.movie_id?.startsWith('theater-') ? r.movie_id.replace('theater-', '') : null),
      theaterName: r.theater_name || r.parameter_ratings?.theaterName || null,
      screenId: r.screen_id || r.parameter_ratings?.screenId || null,
      screenName: r.screen_name || r.parameter_ratings?.screenName || null,
      targetType: r.target_type || (r.theater_id || r.parameter_ratings?.theaterId || r.movie_id?.startsWith('theater-') ? 'THEATER' : 'MOVIE'),
      userId: r.user_id,
      userDisplayName: r.user_display_name,
      rating: r.rating,
      parameterRatings: r.parameter_ratings || {},
      reviewText: r.review_text,
      reviewType: r.review_type || r.reviewType || (r.is_pro ? 'PROFESSIONAL' : undefined),
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      likesCount: r.likes_count || 0,
      reportCount: r.report_count || 0,
    }));
  },

  async saveReview(review) {
    const supabase = getSupabaseClient();
    if (!supabase) return false;
    const paramRatings = {
      ...(review.parameterRatings || {}),
      ...(review.theaterId ? {
        theaterId: review.theaterId,
        theaterName: review.theaterName || null,
        screenId: review.screenId || null,
        screenName: review.screenName || null,
        targetType: 'THEATER',
      } : {}),
    };
    const payload = {
      id: review.id,
      movie_id: review.movieId || (review.theaterId ? `theater-${review.theaterId}` : null),
      user_id: review.userId,
      user_display_name: review.userDisplayName,
      rating: review.rating,
      parameter_ratings: paramRatings,
      review_text: review.reviewText,
      status: review.status || 'PUBLISHED',
      likes_count: review.likesCount || 0,
      report_count: review.reportCount || 0,
      updated_at: new Date().toISOString(),
    };
    if (review.reviewType) {
      payload.review_type = review.reviewType;
    }
    let { error } = await supabase.from('reviews').upsert(payload);
    
    // If foreign key constraint failed on movie_id (e.g. TMDB movie), ensure a minimal movie record exists first
    if (error && (error.message?.includes('foreign key') || error.message?.includes('reviews_movie_id_fkey') || error.code === '23503')) {
      try {
        await supabase.from('movies').upsert({
          id: review.movieId,
          title: review.movieTitle || review.movieId,
          poster_url: review.posterUrl || '',
          status: 'CURRENTLY_SHOWING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        const retryResult = await supabase.from('reviews').upsert(payload);
        error = retryResult.error;
      } catch (e) {
        console.warn('Auto movie stub creation failed:', e);
      }
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

  // Users
  async getUsers() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) {
        return null;
      }
      return (data || []).map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.display_name || u.displayName || u.email?.split('@')[0] || 'User',
        role: u.role || 'USER',
        createdAt: u.created_at || u.createdAt || new Date().toISOString(),
      }));
    } catch (e) {
      return null;
    }
  },

  async saveUser(user) {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return false;
    try {
      const payload = {
        id: user.id,
        email: user.email,
        display_name: user.displayName,
        role: user.role || 'USER',
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('users').upsert(payload);
      if (error) {
        console.warn('Supabase saveUser warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
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
};
