-- ============================================================
-- CINEMASCOPE — MASTER SUPABASE SQL SCHEMA (v3)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- It safely creates all necessary tables, indexes, and RLS policies.
-- ============================================================

-- 1. MOVIES TABLE
CREATE TABLE IF NOT EXISTS public.movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  poster_url TEXT,
  poster_source TEXT DEFAULT 'TMDB',
  poster_source_type TEXT DEFAULT 'OFFICIAL',
  backdrop_url TEXT,
  language TEXT DEFAULT 'Telugu',
  runtime TEXT DEFAULT '2h 30m',
  release_date DATE,
  genres JSONB DEFAULT '[]'::jsonb,
  overview TEXT,
  cast_list JSONB DEFAULT '[]'::jsonb,
  director TEXT,
  certificate TEXT DEFAULT 'U/A',
  trailer_url TEXT,
  aspect_ratio TEXT DEFAULT '2.39:1',
  status TEXT DEFAULT 'CURRENTLY_SHOWING',
  cities JSONB DEFAULT '["visakhapatnam"]'::jsonb,
  theaters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REVIEWS TABLE (Supports Movies, Theaters, and Screens)
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  movie_id TEXT,
  theater_id TEXT,
  theater_name TEXT,
  screen_id TEXT,
  screen_name TEXT,
  target_type TEXT DEFAULT 'MOVIE',
  user_id TEXT NOT NULL,
  user_display_name TEXT DEFAULT 'Anonymous',
  rating NUMERIC(3,1) NOT NULL,
  parameter_ratings JSONB DEFAULT '{}'::jsonb,
  review_text TEXT,
  review_type TEXT DEFAULT 'USER',
  status TEXT DEFAULT 'PUBLISHED',
  likes_count INT DEFAULT 0,
  report_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  role TEXT DEFAULT 'USER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERSONAL LIBRARY: USER MOVIES (Watchlist, Watched, Favorites, Ratings)
CREATE TABLE IF NOT EXISTS public.user_movies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tmdb_id TEXT NOT NULL,
  in_watchlist BOOLEAN DEFAULT false,
  is_watched BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  personal_rating NUMERIC(3,1),
  notes TEXT,
  watch_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id)
);

-- 5. MOVIE DIARY ENTRIES
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tmdb_id TEXT NOT NULL,
  movie_title TEXT,
  poster_url TEXT,
  watched_on DATE DEFAULT CURRENT_DATE,
  personal_rating NUMERIC(3,1),
  review_text TEXT,
  is_rewatch BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COLLECTIONS & SHARED LISTS & SYSTEM STATES
CREATE TABLE IF NOT EXISTS public.collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'public',
  movie_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & SET PERMISSIVE POLICIES
-- ============================================================

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Safely apply public policies
DROP POLICY IF EXISTS "Allow public all on movies" ON public.movies;
DROP POLICY IF EXISTS "Allow public read on movies" ON public.movies;
DROP POLICY IF EXISTS "Allow public insert/update on movies" ON public.movies;
CREATE POLICY "Allow public all on movies" ON public.movies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public read on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public insert/update on reviews" ON public.reviews;
CREATE POLICY "Allow public all on reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on users" ON public.users;
CREATE POLICY "Allow public all on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on user_movies" ON public.user_movies;
CREATE POLICY "Allow public all on user_movies" ON public.user_movies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on diary_entries" ON public.diary_entries;
CREATE POLICY "Allow public all on diary_entries" ON public.diary_entries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on collections" ON public.collections;
CREATE POLICY "Allow public all on collections" ON public.collections FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON public.reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_theater_id ON public.reviews(theater_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON public.user_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON public.diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
