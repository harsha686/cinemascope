CREATE TABLE IF NOT EXISTS user_movies (
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

CREATE TABLE IF NOT EXISTS diary_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tmdb_id TEXT NOT NULL,
  movie_title TEXT,
  poster_url TEXT,
  watched_on DATE DEFAULT CURRENT_DATE,
  personal_rating NUMERIC(3,1),
  review_text TEXT,
  is_rewatch BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'private',
  movie_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Policies for user_movies
CREATE POLICY "Public select for user_movies" ON user_movies FOR SELECT USING (true);
CREATE POLICY "Public insert for user_movies" ON user_movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update for user_movies" ON user_movies FOR UPDATE USING (true);
CREATE POLICY "Public delete for user_movies" ON user_movies FOR DELETE USING (true);

-- Policies for diary_entries
CREATE POLICY "Public select for diary_entries" ON diary_entries FOR SELECT USING (true);
CREATE POLICY "Public insert for diary_entries" ON diary_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update for diary_entries" ON diary_entries FOR UPDATE USING (true);
CREATE POLICY "Public delete for diary_entries" ON diary_entries FOR DELETE USING (true);

-- Policies for collections
CREATE POLICY "Public select for collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Public insert for collections" ON collections FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update for collections" ON collections FOR UPDATE USING (true);
CREATE POLICY "Public delete for collections" ON collections FOR DELETE USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON user_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
