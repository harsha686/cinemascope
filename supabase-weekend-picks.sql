-- Weekend Pick & Community Voting Schema (v3)

CREATE TABLE IF NOT EXISTS weekend_voting_rounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  edition TEXT,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  voting_closes_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'ACTIVE', -- DRAFT, UPCOMING, ACTIVE, CLOSED, WINNER_DECLARED, ARCHIVED
  tie_breaker_rule TEXT DEFAULT 'highest_percentage',
  show_live_results BOOLEAN DEFAULT true,
  genre_rounds JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekend_votes (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL REFERENCES weekend_voting_rounds(id) ON DELETE CASCADE,
  genre_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  title_id TEXT NOT NULL,
  title TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'VALID',
  CONSTRAINT unique_user_round_genre UNIQUE (user_id, round_id, genre_id)
);

CREATE TABLE IF NOT EXISTS weekend_winners (
  id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  round_name TEXT,
  edition TEXT,
  genre_id TEXT NOT NULL,
  genre_name TEXT NOT NULL,
  title_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'MOVIE', -- MOVIE, SERIES
  release_year INT,
  poster_url TEXT,
  vote_count INT DEFAULT 0,
  vote_percentage NUMERIC(5,2) DEFAULT 0,
  total_genre_votes INT DEFAULT 0,
  community_score INT DEFAULT 0,
  declared_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE weekend_voting_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekend_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekend_winners ENABLE ROW LEVEL SECURITY;

-- Public read/write policies
CREATE POLICY "Public Read Voting Rounds" ON weekend_voting_rounds FOR SELECT USING (true);
CREATE POLICY "Public Write Voting Rounds" ON weekend_voting_rounds FOR ALL USING (true);

CREATE POLICY "Public Read Votes" ON weekend_votes FOR SELECT USING (true);
CREATE POLICY "Public Insert Votes" ON weekend_votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Winners" ON weekend_winners FOR SELECT USING (true);
CREATE POLICY "Public Write Winners" ON weekend_winners FOR ALL USING (true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_weekend_votes_user_round ON weekend_votes(user_id, round_id, genre_id);
CREATE INDEX IF NOT EXISTS idx_weekend_winners_genre ON weekend_winners(genre_id);
CREATE INDEX IF NOT EXISTS idx_weekend_winners_title ON weekend_winners(title_id);
