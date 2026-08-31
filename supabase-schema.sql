-- ============================================================
-- CINEMASCOPE — SUPABASE DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor to set up tables
-- ============================================================

-- 1. MOVIES TABLE
CREATE TABLE IF NOT EXISTS public.movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_title TEXT,
  poster_url TEXT NOT NULL,
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

-- 2. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  movie_id TEXT REFERENCES public.movies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_display_name TEXT DEFAULT 'Anonymous',
  rating NUMERIC(3,1) NOT NULL,
  parameter_ratings JSONB DEFAULT '{}'::jsonb,
  review_text TEXT,
  status TEXT DEFAULT 'PUBLISHED',
  likes_count INT DEFAULT 0,
  report_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES: ALLOW PUBLIC READ & WRITE FOR DEMO / PRODUCTION
CREATE POLICY "Allow public read on movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on movies" ON public.movies FOR ALL USING (true);

CREATE POLICY "Allow public read on reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on reviews" ON public.reviews FOR ALL USING (true);
