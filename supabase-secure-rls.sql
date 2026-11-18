-- ============================================================
-- CinemaScope — SECURE RLS POLICIES (Phase 1 Security Fix)
-- ============================================================
-- PROBLEM: The original schema uses "USING (true)" policies which
-- allow ANY anonymous user to read AND write ALL data.
-- This file replaces those with appropriate role-based policies.
--
-- BEFORE RUNNING:
--   1. Enable Supabase Auth if not already enabled.
--   2. Ensure your app sends the Supabase auth JWT in requests.
--   3. Test thoroughly in a staging environment before production.
--
-- Note on CinemaScope's current architecture:
--   The app uses Supabase anon key from the client (a SPA/BaaS pattern).
--   The anon key is designed for client use WITH proper RLS policies.
--   These policies implement least-privilege access.
-- ============================================================

-- ─── Helper function: get current user ID from JWT ────────────────────────
-- (Already available as auth.uid() in Supabase)

-- ─── Helper function: check if current user is admin ─────────────────────
-- We store the admin email as a Supabase custom claim via a database function.
-- For now we use a simple check against the users table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::text
      AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- MOVIES TABLE — Read-public, write-admin-only
-- ============================================================
DROP POLICY IF EXISTS "Allow public all on movies" ON public.movies;
DROP POLICY IF EXISTS "movies_public_read" ON public.movies;
DROP POLICY IF EXISTS "movies_admin_write" ON public.movies;

-- Anyone (including unauthenticated) can read movies
CREATE POLICY "movies_public_read"
  ON public.movies FOR SELECT
  USING (true);

-- Only admin can insert/update/delete movies
CREATE POLICY "movies_admin_write"
  ON public.movies FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "movies_admin_update"
  ON public.movies FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "movies_admin_delete"
  ON public.movies FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- REVIEWS TABLE — Read-public, write-authenticated-owner + admin
-- ============================================================
DROP POLICY IF EXISTS "Allow public all on reviews" ON public.reviews;
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_owner_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_owner_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_owner_delete" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;

-- Anyone can read published reviews
CREATE POLICY "reviews_public_read"
  ON public.reviews FOR SELECT
  USING (status = 'PUBLISHED' OR auth.uid()::text = user_id OR public.is_admin());

-- Authenticated users can insert their own reviews
CREATE POLICY "reviews_owner_insert"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid()::text = user_id AND auth.role() = 'authenticated');

-- Users can update their own reviews; admin can update any
CREATE POLICY "reviews_owner_update"
  ON public.reviews FOR UPDATE
  USING (auth.uid()::text = user_id OR public.is_admin())
  WITH CHECK (auth.uid()::text = user_id OR public.is_admin());

-- Users can delete their own reviews; admin can delete any
CREATE POLICY "reviews_owner_delete"
  ON public.reviews FOR DELETE
  USING (auth.uid()::text = user_id OR public.is_admin());

-- ============================================================
-- USERS TABLE — Read-public (profiles), write-owner + admin
-- ============================================================
DROP POLICY IF EXISTS "Allow public all on users" ON public.users;

CREATE POLICY "users_public_read"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "users_owner_insert"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "users_owner_update"
  ON public.users FOR UPDATE
  USING (auth.uid()::text = id OR public.is_admin())
  WITH CHECK (auth.uid()::text = id OR public.is_admin());

CREATE POLICY "users_admin_delete"
  ON public.users FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- USER_MOVIES — Private to owner + admin
-- ============================================================
DROP POLICY IF EXISTS "Allow public all on user_movies" ON public.user_movies;

CREATE POLICY "user_movies_owner_all"
  ON public.user_movies FOR ALL
  USING (auth.uid()::text = user_id OR public.is_admin())
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================================
-- DIARY_ENTRIES — Private to owner + admin
-- ============================================================
DROP POLICY IF EXISTS "Allow public all on diary_entries" ON public.diary_entries;

CREATE POLICY "diary_owner_all"
  ON public.diary_entries FOR ALL
  USING (auth.uid()::text = user_id OR public.is_admin())
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================================
-- COLLECTIONS — Public collections readable; private ones owner-only
-- System collections (user_id='system') are readable by all, writable by admin only
-- ============================================================
DROP POLICY IF EXISTS "Allow public all on collections" ON public.collections;

CREATE POLICY "collections_public_read"
  ON public.collections FOR SELECT
  USING (
    visibility = 'public'
    OR auth.uid()::text = user_id
    OR public.is_admin()
  );

CREATE POLICY "collections_owner_insert"
  ON public.collections FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id
    OR (user_id = 'system' AND public.is_admin())
  );

CREATE POLICY "collections_owner_update"
  ON public.collections FOR UPDATE
  USING (
    auth.uid()::text = user_id
    OR (user_id = 'system' AND public.is_admin())
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid()::text = user_id
    OR (user_id = 'system' AND public.is_admin())
  );

CREATE POLICY "collections_owner_delete"
  ON public.collections FOR DELETE
  USING (auth.uid()::text = user_id OR public.is_admin());

-- ============================================================
-- THEATERS — Read-public, write-admin-only
-- ============================================================
DROP POLICY IF EXISTS "Allow public all on theaters" ON public.theaters;

CREATE POLICY "theaters_public_read"
  ON public.theaters FOR SELECT
  USING (true);

CREATE POLICY "theaters_admin_write"
  ON public.theaters FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "theaters_admin_update"
  ON public.theaters FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "theaters_admin_delete"
  ON public.theaters FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- CITIES — Read-public, write-admin-only
-- ============================================================
DROP POLICY IF EXISTS "Allow public all on cities" ON public.cities;

CREATE POLICY "cities_public_read"
  ON public.cities FOR SELECT
  USING (true);

CREATE POLICY "cities_admin_write"
  ON public.cities FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "cities_admin_update"
  ON public.cities FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "cities_admin_delete"
  ON public.cities FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- IMPORTANT: Set admin role for your user
-- Run after creating your Supabase account and logging in once:
-- ============================================================
-- UPDATE public.users SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
-- ============================================================
