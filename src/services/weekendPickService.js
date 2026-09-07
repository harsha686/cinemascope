import { isSupabaseConfigured, supabaseService } from './supabase';

const ROUNDS_KEY = 'cinemascope_weekend_rounds';
const VOTES_KEY = 'cinemascope_weekend_votes';
const WINNERS_KEY = 'cinemascope_weekend_winners';
const USER_PREFS_KEY = 'cinemascope_user_weekend_prefs';

export const GENRE_OPTIONS = [
  { id: 'action', name: 'Action', emoji: '💥', icon: 'Flame', color: '#f97316' },
  { id: 'comedy', name: 'Comedy', emoji: '😂', icon: 'Smile', color: '#fbbf24' },
  { id: 'horror', name: 'Horror', emoji: '👻', icon: 'Ghost', color: '#ef4444' },
  { id: 'scifi', name: 'Sci-Fi', emoji: '🚀', icon: 'Zap', color: '#60a5fa' },
  { id: 'thriller', name: 'Thriller', emoji: '🔪', icon: 'Eye', color: '#a855f7' },
  { id: 'romance', name: 'Romance', emoji: '💖', icon: 'Heart', color: '#ec4899' },
  { id: 'animation', name: 'Animation', emoji: '🎨', icon: 'Sparkles', color: '#10b981' },
  { id: 'drama', name: 'Drama', emoji: '🎭', icon: 'Film', color: '#eab308' },
];

export const TIE_BREAKER_OPTIONS = [
  { id: 'highest_percentage', label: 'Highest Vote Percentage' },
  { id: 'engagement_score', label: 'Community Rating & Engagement' },
  { id: 'admin_resolution', label: 'Admin Manual Selection' },
];

// Helper storage functions
const loadStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
};

const saveStorage = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
};

// INITIAL SEED DATA
const getSeedRounds = () => {
  // Active round: Opens Sunday 9:00 PM, Closes Friday 11:00 PM
  const activeRound = {
    id: 'round-2026-w36',
    name: 'Weekend Pick — Weekly Edition',
    edition: 'Week 36 · September 2026',
    description: 'Vote for this weekend\'s top picks across all 8 blockbuster genres! Polling runs Sunday 9:00 PM to Friday 11:00 PM.',
    startDate: '2026-08-30T21:00:00.000Z',
    endDate: '2026-09-04T23:00:00.000Z',
    votingClosesAt: '2026-09-04T23:00:00.000Z',
    status: 'ACTIVE', // DRAFT | UPCOMING | ACTIVE | CLOSED | WINNER_DECLARED | ARCHIVED
    tieBreakerRule: 'highest_percentage',
    showLiveResults: true,
    genreRounds: {
      action: {
        genreId: 'action',
        genreName: 'Action',
        candidates: [
          {
            id: 'cand-act-1',
            titleId: 'john-wick-4',
            title: 'John Wick: Chapter 4',
            type: 'MOVIE',
            releaseYear: 2023,
            rating: 4.8,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg',
            overview: 'With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table.',
            initialVoteSeed: 1420,
          },
          {
            id: 'cand-act-2',
            titleId: 'mad-max-fury-road',
            title: 'Mad Max: Fury Road',
            type: 'MOVIE',
            releaseYear: 2015,
            rating: 4.9,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/nlCHUW2Y9XWbuEUQauCBgnY8ymF.jpg',
            overview: 'An apocalyptic story set in the furthest reaches of our planet, in a stark desert landscape.',
            initialVoteSeed: 1180,
          },
          {
            id: 'cand-act-3',
            titleId: 'salaar-part-1-ceasefire',
            title: 'Salaar: Part 1 – Ceasefire',
            type: 'MOVIE',
            releaseYear: 2023,
            rating: 4.6,
            language: 'Telugu',
            posterUrl: 'https://image.tmdb.org/t/p/w500/mHQOO0K06c0Q1b9c7wV3gU6Z5M.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
            overview: 'A gang leader makes a promise to a dying friend and takes on other criminal gangs.',
            initialVoteSeed: 1310,
          },
          {
            id: 'cand-act-4',
            titleId: 'reacher-series',
            title: 'Reacher',
            type: 'SERIES',
            releaseYear: 2022,
            rating: 4.7,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/jrtNc941g2q32M45wXo7W0k68.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/jW6Fm9M2N0kXo7W0k68.jpg',
            overview: 'Jack Reacher, a veteran military police investigator, enters civilian life when he is falsely accused of murder.',
            initialVoteSeed: 980,
          }
        ]
      },
      scifi: {
        genreId: 'scifi',
        genreName: 'Sci-Fi',
        candidates: [
          {
            id: 'cand-sci-1',
            titleId: 'interstellar',
            title: 'Interstellar',
            type: 'MOVIE',
            releaseYear: 2014,
            rating: 4.9,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
            overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
            initialVoteSeed: 2190,
          },
          {
            id: 'cand-sci-2',
            titleId: 'dune-part-two',
            title: 'Dune: Part Two',
            type: 'MOVIE',
            releaseYear: 2024,
            rating: 4.9,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520v4r.jpg',
            overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators.',
            initialVoteSeed: 1840,
          },
          {
            id: 'cand-sci-3',
            titleId: 'severance-series',
            title: 'Severance',
            type: 'SERIES',
            releaseYear: 2022,
            rating: 4.8,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/p4p84KjM2N0kXo7W0k68.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/p4p84KjM2N0kXo7W0k68.jpg',
            overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
            initialVoteSeed: 1120,
          },
          {
            id: 'cand-sci-4',
            titleId: 'kalki-2898-ad',
            title: 'Kalki 2898 AD',
            type: 'MOVIE',
            releaseYear: 2024,
            rating: 4.5,
            language: 'Telugu',
            posterUrl: 'https://image.tmdb.org/t/p/w500/9k8K06c0Q1b9c7wV3gU6Z5M.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/9k8K06c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'A modern avatar of Vishnu descends to protect the world from evil forces in a dystopian world.',
            initialVoteSeed: 1460,
          }
        ]
      },
      horror: {
        genreId: 'horror',
        genreName: 'Horror',
        candidates: [
          {
            id: 'cand-hor-1',
            titleId: 'the-conjuring',
            title: 'The Conjuring',
            type: 'MOVIE',
            releaseYear: 2013,
            rating: 4.6,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/6v6206c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence.',
            initialVoteSeed: 1620,
          },
          {
            id: 'cand-hor-2',
            titleId: 'hereditary',
            title: 'Hereditary',
            type: 'MOVIE',
            releaseYear: 2018,
            rating: 4.7,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/p9fmuz2Oj3vxEJ52qAic6B117h7.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/p9fmuz2Oj3vxEJ52qAic6B117h7.jpg',
            overview: 'When Ellen passes away, her daughter\'s family begins to unravel cryptic and increasingly terrifying secrets.',
            initialVoteSeed: 1390,
          },
          {
            id: 'cand-hor-3',
            titleId: 'tumbbad',
            title: 'Tumbbad',
            type: 'MOVIE',
            releaseYear: 2018,
            rating: 4.8,
            language: 'Hindi',
            posterUrl: 'https://image.tmdb.org/t/p/w500/4c4K06c0Q1b9c7wV3gU6Z5M.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/4c4K06c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'A mythological story about a goddess who created the entire universe and the greed that follows.',
            initialVoteSeed: 1810,
          },
          {
            id: 'cand-hor-4',
            titleId: 'the-haunting-of-hill-house',
            title: 'The Haunting of Hill House',
            type: 'SERIES',
            releaseYear: 2018,
            rating: 4.8,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8g8K06c0Q1b9c7wV3gU6Z5M.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/8g8K06c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'Flashing between past and present, a fractured family confronts haunting memories of their old home.',
            initialVoteSeed: 1250,
          }
        ]
      },
      comedy: {
        genreId: 'comedy',
        genreName: 'Comedy',
        candidates: [
          {
            id: 'cand-com-1',
            titleId: '3-idiots',
            title: '3 Idiots',
            type: 'MOVIE',
            releaseYear: 2009,
            rating: 4.9,
            language: 'Hindi',
            posterUrl: 'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z89ew.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/u78K06c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'Two friends search for their long-lost companion who inspired them to think differently.',
            initialVoteSeed: 2410,
          },
          {
            id: 'cand-com-2',
            titleId: 'jathi-ratnalu',
            title: 'Jathi Ratnalu',
            type: 'MOVIE',
            releaseYear: 2021,
            rating: 4.7,
            language: 'Telugu',
            posterUrl: 'https://image.tmdb.org/t/p/w500/2v2K06c0Q1b9c7wV3gU6Z5M.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/2v2K06c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'Three happy-go-lucky young men find themselves trapped in a high-profile political conspiracy.',
            initialVoteSeed: 1950,
          },
          {
            id: 'cand-com-3',
            titleId: 'ted-lasso-series',
            title: 'Ted Lasso',
            type: 'SERIES',
            releaseYear: 2020,
            rating: 4.8,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/3k3K06c0Q1b9c7wV3gU6Z5M.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/3k3K06c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'An American football coach is hired to manage a British soccer team in England.',
            initialVoteSeed: 1370,
          },
          {
            id: 'cand-com-4',
            titleId: 'superbad',
            title: 'Superbad',
            type: 'MOVIE',
            releaseYear: 2007,
            rating: 4.5,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/ek8e89Ue5Esm2a5x0z2x89ew.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/ek8e89Ue5Esm2a5x0z2x89ew.jpg',
            overview: 'Two co-dependent high school seniors are forced to deal with separation anxiety.',
            initialVoteSeed: 1110,
          }
        ]
      },
      thriller: {
        genreId: 'thriller',
        genreName: 'Thriller',
        candidates: [
          {
            id: 'cand-thr-1',
            titleId: 'shutter-island',
            title: 'Shutter Island',
            type: 'MOVIE',
            releaseYear: 2010,
            rating: 4.8,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/kve20tXwUZpu4GUX8l6X7Z0k68.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/kve20tXwUZpu4GUX8l6X7Z0k68.jpg',
            overview: 'A U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane.',
            initialVoteSeed: 1730,
          },
          {
            id: 'cand-thr-2',
            titleId: 'drishyam',
            title: 'Drishyam',
            type: 'MOVIE',
            releaseYear: 2013,
            rating: 4.9,
            language: 'Malayalam / Hindi',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7a7K06c0Q1b9c7wV3gU6Z5M.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/7a7K06c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'A man goes to extreme lengths to save his family from punishment after they commit an accidental crime.',
            initialVoteSeed: 1890,
          },
          {
            id: 'cand-thr-3',
            titleId: 'mindhunter-series',
            title: 'Mindhunter',
            type: 'SERIES',
            releaseYear: 2017,
            rating: 4.8,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/5b5K06c0Q1b9c7wV3gU6Z5M.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/5b5K06c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'In the late 1970s, two FBI agents expand criminal science by delving into the psychology of murder.',
            initialVoteSeed: 1420,
          }
        ]
      },
      romance: {
        genreId: 'romance',
        genreName: 'Romance',
        candidates: [
          {
            id: 'cand-rom-1',
            titleId: 'la-la-land',
            title: 'La La Land',
            type: 'MOVIE',
            releaseYear: 2016,
            rating: 4.7,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkVJt0Rf0.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/qJeU7706c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
            initialVoteSeed: 1650,
          },
          {
            id: 'cand-rom-2',
            titleId: 'sita-ramam',
            title: 'Sita Ramam',
            type: 'MOVIE',
            releaseYear: 2022,
            rating: 4.9,
            language: 'Telugu',
            posterUrl: 'https://image.tmdb.org/t/p/w500/1s1K06c0Q1b9c7wV3gU6Z5M.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/1s1K06c0Q1b9c7wV3gU6Z5M.jpg',
            overview: 'An orphaned soldier\'s life changes after he receives a letter from a girl named Sita.',
            initialVoteSeed: 1980,
          }
        ]
      },
      animation: {
        genreId: 'animation',
        genreName: 'Animation',
        candidates: [
          {
            id: 'cand-ani-1',
            titleId: 'spider-man-across-the-spider-verse',
            title: 'Spider-Man: Across the Spider-Verse',
            type: 'MOVIE',
            releaseYear: 2023,
            rating: 4.9,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704wGF.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/8Vt6mWEReuy4Of61Lnj5Xj704wGF.jpg',
            overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
            initialVoteSeed: 2210,
          },
          {
            id: 'cand-ani-2',
            titleId: 'arcane-series',
            title: 'Arcane',
            type: 'SERIES',
            releaseYear: 2021,
            rating: 4.9,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/fqldf2t8798ew0z2x89ew.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/fqldf2t8798ew0z2x89ew.jpg',
            overview: 'Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions.',
            initialVoteSeed: 2080,
          }
        ]
      },
      drama: {
        genreId: 'drama',
        genreName: 'Drama',
        candidates: [
          {
            id: 'cand-dra-1',
            titleId: 'oppenheimer',
            title: 'Oppenheimer',
            type: 'MOVIE',
            releaseYear: 2023,
            rating: 4.8,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/rM5yQ9Ue5Esm2a5x0z2x89ew.jpg',
            overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
            initialVoteSeed: 2150,
          },
          {
            id: 'cand-dra-2',
            titleId: 'succession-series',
            title: 'Succession',
            type: 'SERIES',
            releaseYear: 2018,
            rating: 4.9,
            language: 'English',
            posterUrl: 'https://image.tmdb.org/t/p/w500/7F8e89Ue5Esm2a5x0z2x89ew.jpg',
            backdropUrl: 'https://image.tmdb.org/t/p/original/7F8e89Ue5Esm2a5x0z2x89ew.jpg',
            overview: 'The Roy family is known for controlling the biggest media and entertainment company in the world.',
            initialVoteSeed: 1720,
          }
        ]
      }
    }
  };

  // Past Historical Round 1 (August 2026)
  const pastRound1 = {
    id: 'round-2026-w35',
    name: 'Weekend Pick — August 30–31, 2026',
    edition: 'Week 35 · August 2026',
    description: 'Community winners crowned for the final weekend of August 2026.',
    startDate: '2026-08-25T00:00:00.000Z',
    endDate: '2026-08-31T23:59:59.000Z',
    votingClosesAt: '2026-08-31T22:00:00.000Z',
    status: 'ARCHIVED',
    tieBreakerRule: 'highest_percentage',
    showLiveResults: false,
    genreRounds: {
      action: {
        genreId: 'action',
        genreName: 'Action',
        candidates: [
          { id: 'p1-act-1', titleId: 'top-gun-maverick', title: 'Top Gun: Maverick', type: 'MOVIE', releaseYear: 2022, rating: 4.8, posterUrl: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17pmH.jpg' },
          { id: 'p1-act-2', titleId: 'avatar-the-way-of-water', title: 'Avatar: The Way of Water', type: 'MOVIE', releaseYear: 2022, rating: 4.6, posterUrl: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg' }
        ]
      },
      horror: {
        genreId: 'horror',
        genreName: 'Horror',
        candidates: [
          { id: 'p1-hor-1', titleId: 'a-quiet-place', title: 'A Quiet Place: Day One', type: 'MOVIE', releaseYear: 2024, rating: 4.5, posterUrl: 'https://image.tmdb.org/t/p/w500/yrpPYK2z98gSFCU0XGDykEGv7zR.jpg' }
        ]
      },
      scifi: {
        genreId: 'scifi',
        genreName: 'Sci-Fi',
        candidates: [
          { id: 'p1-sci-1', titleId: 'the-matrix', title: 'The Matrix', type: 'MOVIE', releaseYear: 1999, rating: 4.9, posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' }
        ]
      }
    }
  };

  return [activeRound];
};

const getSeedWinners = () => [];

// ==================== SERVICE API ====================

/**
 * Get all rounds
 */
export function getAllRounds() {
  return loadStorage(ROUNDS_KEY, getSeedRounds());
}

/**
 * Save rounds to storage
 */
export function saveRounds(rounds) {
  saveStorage(ROUNDS_KEY, rounds);
}

/**
 * Get the current active voting round
 */
export function getActiveRound() {
  const rounds = getAllRounds();
  const active = rounds.find(r => r.status === 'ACTIVE' || r.status === 'WINNER_DECLARED');
  return active || rounds[0] || null;
}

/**
 * Get a round by ID
 */
export function getRoundById(roundId) {
  const rounds = getAllRounds();
  return rounds.find(r => r.id === roundId) || null;
}

/**
 * Create a new voting round
 */
export function createRound(roundData) {
  const rounds = getAllRounds();
  const newRound = {
    id: roundData.id || `round-${Date.now()}`,
    name: roundData.name || `Weekend Pick — ${new Date().toLocaleDateString()}`,
    edition: roundData.edition || 'Weekly Edition',
    description: roundData.description || 'Community weekend picks',
    startDate: roundData.startDate || new Date().toISOString(),
    endDate: roundData.endDate || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    votingClosesAt: roundData.votingClosesAt || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: roundData.status || 'DRAFT',
    tieBreakerRule: roundData.tieBreakerRule || 'highest_percentage',
    showLiveResults: roundData.showLiveResults !== undefined ? roundData.showLiveResults : true,
    genreRounds: roundData.genreRounds || {},
    createdAt: new Date().toISOString(),
  };

  // If new round is set to ACTIVE, ensure others are marked CLOSED or ARCHIVED
  let updated = [newRound, ...rounds];
  if (newRound.status === 'ACTIVE') {
    updated = updated.map(r => r.id === newRound.id ? r : (r.status === 'ACTIVE' ? { ...r, status: 'CLOSED' } : r));
  }

  saveRounds(updated);
  return newRound;
}

/**
 * Update an existing round
 */
export function updateRound(roundId, updates) {
  const rounds = getAllRounds();
  const updated = rounds.map(r => {
    if (r.id === roundId) {
      return { ...r, ...updates, updatedAt: new Date().toISOString() };
    }
    // If activating this round, deactivate others
    if (updates.status === 'ACTIVE' && r.id !== roundId && r.status === 'ACTIVE') {
      return { ...r, status: 'CLOSED' };
    }
    return r;
  });
  saveRounds(updated);
  return updated.find(r => r.id === roundId) || null;
}

/**
 * Delete a round
 */
export function deleteRound(roundId) {
  const rounds = getAllRounds();
  const filtered = rounds.filter(r => r.id !== roundId);
  saveRounds(filtered);
  return filtered;
}

/**
 * Get all votes from storage
 */
export function getAllVotes() {
  return loadStorage(VOTES_KEY, []);
}

/**
 * Save votes to storage
 */
export function saveVotes(votes) {
  saveStorage(VOTES_KEY, votes);
}

/**
 * Check if a user has already voted in a specific genre in a round
 */
export function hasUserVotedInGenre(userId, roundId, genreId) {
  if (!userId || !roundId || !genreId) return false;
  const votes = getAllVotes();
  return votes.some(v => v.userId === userId && v.roundId === roundId && v.genreId === genreId && v.status === 'VALID');
}

/**
 * Get the user's vote in a specific genre and round
 */
export function getUserVoteInGenre(userId, roundId, genreId) {
  if (!userId || !roundId || !genreId) return null;
  const votes = getAllVotes();
  return votes.find(v => v.userId === userId && v.roundId === roundId && v.genreId === genreId && v.status === 'VALID') || null;
}

/**
 * Get all votes by a user
 */
export function getUserVotes(userId, roundId = null) {
  if (!userId) return [];
  const votes = getAllVotes();
  return votes.filter(v => v.userId === userId && (!roundId || v.roundId === roundId));
}

/**
 * Check if a user has voted in all active genres for a round
 */
export function hasUserVotedInAllGenres(userId, roundId) {
  if (!userId || !roundId) return false;
  const round = getRoundById(roundId);
  if (!round || !round.genreRounds) return false;
  const allGenreKeys = Object.keys(round.genreRounds);
  if (allGenreKeys.length === 0) return false;
  const userVotes = getUserVotes(userId, roundId);
  const votedGenres = new Set(userVotes.map(v => v.genreId));
  return allGenreKeys.every(gKey => votedGenres.has(gKey));
}

/**
 * Get the count of genres voted by the user for a round
 */
export function getUserVotedGenresCount(userId, roundId) {
  if (!userId || !roundId) return { votedCount: 0, totalGenres: 8, remainingCount: 8, isComplete: false };
  const round = getRoundById(roundId);
  const totalGenres = round?.genreRounds ? Object.keys(round.genreRounds).length : GENRE_OPTIONS.length;
  const userVotes = getUserVotes(userId, roundId);
  const votedGenres = new Set(userVotes.map(v => v.genreId));
  const votedCount = votedGenres.size;
  return {
    votedCount,
    totalGenres,
    remainingCount: Math.max(0, totalGenres - votedCount),
    isComplete: totalGenres > 0 && votedCount >= totalGenres,
  };
}

/**
 * SUBMIT VOTE
 * Enforces strictly 1 vote per user per genre per round
 */
export function submitVote({ roundId, genreId, candidateId, titleId, title, userId, userEmail }) {
  if (!userId) {
    throw new Error('You must be logged in to cast your Weekend Pick vote.');
  }

  const round = getRoundById(roundId);
  if (!round) {
    throw new Error('Voting round not found.');
  }

  if (round.status !== 'ACTIVE') {
    throw new Error('Voting is currently closed for this round.');
  }

  const existingVote = getUserVoteInGenre(userId, roundId, genreId);
  if (existingVote) {
    throw new Error(`You have already voted for "${existingVote.title || 'a candidate'}" in the ${genreId.toUpperCase()} genre for this weekend round.`);
  }

  const newVote = {
    id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    roundId,
    genreId,
    candidateId,
    titleId,
    title,
    userId,
    userEmail: userEmail || '',
    createdAt: new Date().toISOString(),
    status: 'VALID',
  };

  const votes = getAllVotes();
  const updatedVotes = [newVote, ...votes];
  saveVotes(updatedVotes);

  // Optional Supabase sync
  if (isSupabaseConfigured()) {
    try {
      supabaseService.insertWeekendVote?.(newVote);
    } catch (e) {
      console.warn('Supabase vote sync skipped:', e);
    }
  }

  return newVote;
}

/**
 * Calculate live / final results for a genre round
 */
export function calculateGenreResults(roundId, genreId) {
  const round = getRoundById(roundId);
  if (!round || !round.genreRounds || !round.genreRounds[genreId]) {
    return { candidates: [], totalVotes: 0, leadingCandidate: null, hasTie: false };
  }

  const genreRound = round.genreRounds[genreId];
  const candidates = genreRound.candidates || [];
  const allVotes = getAllVotes().filter(v => v.roundId === roundId && v.genreId === genreId && v.status === 'VALID');

  // Compute vote counts per candidate (combining seed votes + actual user votes)
  const candidateScores = candidates.map(cand => {
    const userVoteCount = allVotes.filter(v => v.candidateId === cand.id || v.titleId === cand.titleId).length;
    const seedVotes = cand.initialVoteSeed || 0;
    const totalVotes = userVoteCount + seedVotes;
    return {
      ...cand,
      userVotes: userVoteCount,
      seedVotes,
      totalVotes,
    };
  });

  const grandTotal = candidateScores.reduce((sum, c) => sum + c.totalVotes, 0);

  // Add percentage and sort descending
  const ranked = candidateScores.map(c => ({
    ...c,
    votePercentage: grandTotal > 0 ? Math.round((c.totalVotes / grandTotal) * 1000) / 10 : 0,
  })).sort((a, b) => b.totalVotes - a.totalVotes);

  const topScore = ranked[0]?.totalVotes || 0;
  const topCandidates = ranked.filter(c => c.totalVotes === topScore && topScore > 0);
  const hasTie = topCandidates.length > 1;

  return {
    genreId,
    genreName: genreRound.genreName || genreId,
    candidates: ranked,
    totalVotes: grandTotal,
    leadingCandidate: ranked[0] || null,
    hasTie,
    tiedCandidates: hasTie ? topCandidates : [],
  };
}

/**
 * Get all historical declared winners
 */
export function getAllWinners() {
  return loadStorage(WINNERS_KEY, getSeedWinners());
}

/**
 * Save winners list
 */
export function saveWinners(winners) {
  saveStorage(WINNERS_KEY, winners);
}

/**
 * Declare winners for a round
 */
export function declareWinnersForRound(roundId, tieBreakerOption = 'highest_percentage') {
  const round = getRoundById(roundId);
  if (!round) throw new Error('Round not found');

  const declaredWinners = [];
  const activeGenres = Object.keys(round.genreRounds || {});

  activeGenres.forEach(genreId => {
    const results = calculateGenreResults(roundId, genreId);
    let winningCandidate = results.leadingCandidate;

    if (results.hasTie) {
      if (tieBreakerOption === 'highest_percentage' || tieBreakerOption === 'engagement_score') {
        // Break tie by rating or first candidate
        winningCandidate = results.tiedCandidates.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
      }
    }

    if (winningCandidate) {
      const winnerObj = {
        roundId: round.id,
        roundName: round.name,
        edition: round.edition,
        genreId,
        genreName: results.genreName,
        titleId: winningCandidate.titleId,
        title: winningCandidate.title,
        type: winningCandidate.type || 'MOVIE',
        releaseYear: winningCandidate.releaseYear || '',
        posterUrl: winningCandidate.posterUrl || '',
        voteCount: winningCandidate.totalVotes,
        votePercentage: winningCandidate.votePercentage,
        totalGenreVotes: results.totalVotes,
        communityScore: Math.round((winningCandidate.rating || 4.5) * 20),
        declaredAt: new Date().toISOString(),
      };
      declaredWinners.push(winnerObj);
    }
  });

  const existingWinners = getAllWinners().filter(w => w.roundId !== roundId);
  const updatedWinners = [...declaredWinners, ...existingWinners];
  saveWinners(updatedWinners);

  // Update round status to WINNER_DECLARED
  updateRound(roundId, { status: 'WINNER_DECLARED' });

  return declaredWinners;
}

/**
 * Reset polling for a specific round (clears all user votes, removes declared winners, sets round to ACTIVE)
 */
export function resetRoundPolling(roundId, resetSeeds = false) {
  if (!roundId) return false;

  // 1. Remove all user votes for this round
  const allVotes = getAllVotes();
  const remainingVotes = allVotes.filter(v => v.roundId !== roundId);
  saveVotes(remainingVotes);

  // 2. Remove any declared winners for this round
  const allWinners = getAllWinners();
  const remainingWinners = allWinners.filter(w => w.roundId !== roundId);
  saveWinners(remainingWinners);

  // 3. Reset seed baseline votes on candidates if requested
  const round = getRoundById(roundId);
  if (round) {
    const updatedGenreRounds = JSON.parse(JSON.stringify(round.genreRounds || {}));
    if (resetSeeds) {
      Object.keys(updatedGenreRounds).forEach(gId => {
        if (updatedGenreRounds[gId]?.candidates) {
          updatedGenreRounds[gId].candidates = updatedGenreRounds[gId].candidates.map(c => ({
            ...c,
            initialVoteSeed: 0
          }));
        }
      });
    }

    // Set round status back to ACTIVE
    updateRound(roundId, {
      status: 'ACTIVE',
      genreRounds: updatedGenreRounds,
    });
  }

  // Trigger storage sync event
  try {
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}

  return true;
}

/**
 * Reset votes for a specific genre in a round
 */
export function resetGenrePolling(roundId, genreId) {
  if (!roundId || !genreId) return false;

  const allVotes = getAllVotes();
  const remainingVotes = allVotes.filter(v => !(v.roundId === roundId && v.genreId === genreId));
  saveVotes(remainingVotes);

  const allWinners = getAllWinners();
  const remainingWinners = allWinners.filter(w => !(w.roundId === roundId && w.genreId === genreId));
  saveWinners(remainingWinners);

  try {
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}

  return true;
}

/**
 * Factory reset all weekend pick data back to default seed state
 */
export function factoryResetWeekendData() {
  saveStorage(ROUNDS_KEY, getSeedRounds());
  saveStorage(VOTES_KEY, []);
  saveStorage(WINNERS_KEY, getSeedWinners());
  try {
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}
  return true;
}

/**
 * Get the latest winner for a specific genre
 */
export function getWinnerForGenre(genreId, roundId = null) {
  const winners = getAllWinners();
  if (roundId) {
    return winners.find(w => w.genreId === genreId && w.roundId === roundId) || null;
  }
  // Return most recent winner for that genre
  return winners.find(w => w.genreId === genreId) || null;
}

/**
 * Check if a movie/series title is a past or current winner
 */
export function getMovieWinningHistory(titleIdOrTmdbId) {
  if (!titleIdOrTmdbId) return [];
  const rawId = String(titleIdOrTmdbId).toLowerCase().replace('tmdb-', '');
  const winners = getAllWinners();
  return winners.filter(w => {
    const wRaw = String(w.titleId).toLowerCase().replace('tmdb-', '');
    return wRaw === rawId || w.title.toLowerCase().includes(rawId);
  });
}

/**
 * User Preferred Weekend Genre
 */
export function getUserPreferredGenre(userId) {
  if (!userId) return 'action';
  const prefs = loadStorage(USER_PREFS_KEY, {});
  return prefs[userId]?.preferredGenre || 'action';
}

export function setUserPreferredGenre(userId, genreId) {
  if (!userId) return;
  const prefs = loadStorage(USER_PREFS_KEY, {});
  prefs[userId] = {
    ...prefs[userId],
    preferredGenre: genreId,
    updatedAt: new Date().toISOString(),
  };
  saveStorage(USER_PREFS_KEY, prefs);
}

/**
 * "Pick My Weekend" Mood / Surprise generator
 */
export function pickMyWeekendRecommendation({ genreId = null, mood = 'any', type = 'ANY' } = {}) {
  const seedWinners = getSeedWinners();
  const winners = getAllWinners();
  const activeRound = getActiveRound();

  let pool = winners && winners.length > 0 ? [...winners] : [...seedWinners];

  // Include candidates from active round purely as candidate options
  if (activeRound && activeRound.genreRounds) {
    Object.keys(activeRound.genreRounds).forEach(gId => {
      const res = calculateGenreResults(activeRound.id, gId);
      if (res.candidates && res.candidates.length > 0) {
        res.candidates.forEach(cand => {
          pool.push({
            roundId: activeRound.id,
            roundName: activeRound.name,
            genreId: gId,
            genreName: res.genreName,
            titleId: cand.titleId,
            title: cand.title,
            type: cand.type || 'MOVIE',
            releaseYear: cand.releaseYear,
            posterUrl: cand.posterUrl,
            backdropUrl: cand.backdropUrl,
            overview: cand.overview,
            communityScore: Math.round((cand.rating || 4.7) * 20),
          });
        });
      }
    });
  }

  // Filter by genre
  if (genreId && genreId !== 'surprise') {
    const genreFiltered = pool.filter(p => p.genreId === genreId);
    if (genreFiltered.length > 0) pool = genreFiltered;
  }

  // Filter by type
  if (type && type !== 'ANY') {
    const typeFiltered = pool.filter(p => p.type === type);
    if (typeFiltered.length > 0) pool = typeFiltered;
  }

  if (pool.length === 0) {
    pool = [...seedWinners];
  }

  const selected = pool[Math.floor(Math.random() * pool.length)] || seedWinners[0];
  return selected;
}

/**
 * Live Admin Analytics & Anti-Fraud stats
 */
export function getLiveAdminAnalytics(roundId) {
  const round = getRoundById(roundId);
  const allVotes = getAllVotes().filter(v => !roundId || v.roundId === roundId);

  const totalVotes = allVotes.length;
  const uniqueVoters = new Set(allVotes.map(v => v.userId)).size;

  // Anomaly detection: check rapid voting or duplicate user emails
  const userVoteCounts = {};
  allVotes.forEach(v => {
    userVoteCounts[v.userId] = (userVoteCounts[v.userId] || 0) + 1;
  });

  const maxVotesPerUser = round && round.genreRounds ? Object.keys(round.genreRounds).length : 8;
  const suspiciousVoters = Object.entries(userVoteCounts).filter(([, count]) => count > maxVotesPerUser);

  const votesByGenre = {};
  allVotes.forEach(v => {
    votesByGenre[v.genreId] = (votesByGenre[v.genreId] || 0) + 1;
  });

  return {
    totalVotes,
    uniqueVoters,
    suspiciousVotesCount: suspiciousVoters.length,
    suspiciousVoters,
    votesByGenre,
    status: round?.status || 'UNKNOWN',
  };
}

/**
 * User Voting Activity Stats for Profile
 */
export function getUserVotingStats(userId) {
  if (!userId) return { totalVotes: 0, winnersVotedFor: 0, genresParticipated: [] };
  const votes = getUserVotes(userId);
  const allWinners = getAllWinners();

  let winnersVotedCount = 0;
  const genres = new Set();

  votes.forEach(v => {
    genres.add(v.genreId);
    const won = allWinners.some(w => w.roundId === v.roundId && (w.titleId === v.titleId || w.title === v.title));
    if (won) winnersVotedCount++;
  });

  return {
    totalVotes: votes.length,
    winnersVotedFor: winnersVotedCount,
    genresParticipated: Array.from(genres),
  };
}

/**
 * Filter Historical Archive Winners
 */
export function getHistoricalWinners({ genreId = 'all', year = 'all', type = 'all', query = '' } = {}) {
  let winners = getAllWinners();

  if (genreId && genreId !== 'all') {
    winners = winners.filter(w => w.genreId === genreId);
  }

  if (year && year !== 'all') {
    winners = winners.filter(w => {
      const declaredYear = w.declaredAt ? new Date(w.declaredAt).getFullYear().toString() : '';
      const releaseYear = w.releaseYear ? String(w.releaseYear) : '';
      return declaredYear === year || releaseYear === year || (w.roundName && w.roundName.includes(year));
    });
  }

  if (type && type !== 'all') {
    winners = winners.filter(w => w.type === type);
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    winners = winners.filter(w =>
      w.title.toLowerCase().includes(q) ||
      (w.genreName && w.genreName.toLowerCase().includes(q)) ||
      (w.roundName && w.roundName.toLowerCase().includes(q))
    );
  }

  return winners;
}
