import { isSupabaseConfigured, supabaseService } from './supabase';
import { discoverMovies, discoverTv, fetchTeluguTv } from './tmdbService';

const ROUNDS_KEY = 'cinemascope_weekend_rounds';
const VOTES_KEY = 'cinemascope_weekend_votes';
const WINNERS_KEY = 'cinemascope_weekend_winners';
const USER_PREFS_KEY = 'cinemascope_user_weekend_prefs';
const GENRES_KEY = 'cinemascope_weekend_genres';

export const DEFAULT_GENRE_OPTIONS = [
  { id: 'action', name: 'Action', emoji: '💥', icon: 'Flame', color: '#f97316' },
  { id: 'comedy', name: 'Comedy', emoji: '😂', icon: 'Smile', color: '#fbbf24' },
  { id: 'horror', name: 'Horror', emoji: '👻', icon: 'Ghost', color: '#ef4444' },
  { id: 'scifi', name: 'Sci-Fi', emoji: '🚀', icon: 'Zap', color: '#60a5fa' },
  { id: 'thriller', name: 'Thriller', emoji: '🔪', icon: 'Eye', color: '#a855f7' },
  { id: 'romance', name: 'Romance', emoji: '💖', icon: 'Heart', color: '#ec4899' },
  { id: 'animation', name: 'Animation', emoji: '🎨', icon: 'Sparkles', color: '#10b981' },
  { id: 'drama', name: 'Drama', emoji: '🎭', icon: 'Film', color: '#eab308' },
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

/**
 * Dispatch cross-component and window update events for weekend data modifications
 */
export function notifyWeekendUpdates() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cinemascope_round_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {}
}

const UPDATED_AT_KEY = 'cinemascope_weekend_updated_at';

let pushCloudTimeout = null;

/**
 * Push current weekend state (rounds, candidates, genres, winners, votes) to Supabase cloud
 * so it immediately synchronizes across all devices (Desktop, Mobile, Tablet)
 */
export function pushWeekendPickDataToCloud() {
  if (typeof window === 'undefined' || !isSupabaseConfigured()) return;
  if (pushCloudTimeout) clearTimeout(pushCloudTimeout);
  pushCloudTimeout = setTimeout(async () => {
    try {
      const now = new Date().toISOString();
      saveStorage(UPDATED_AT_KEY, now);
      const payload = {
        version: 1,
        updatedAt: now,
        rounds: loadStorage(ROUNDS_KEY, []),
        genres: loadStorage(GENRES_KEY, []),
        winners: loadStorage(WINNERS_KEY, []),
        votes: loadStorage(VOTES_KEY, []),
      };
      await supabaseService.saveWeekendPickData(payload);
    } catch (e) {
      console.warn('Could not push weekend pick data to cloud:', e);
    }
  }, 400);
}

/**
 * Fetch and synchronize weekend state from Supabase cloud into local device storage
 */
export async function syncWeekendPickDataFromCloud({ force = false } = {}) {
  if (typeof window === 'undefined' || !isSupabaseConfigured()) return false;
  try {
    const cloud = await supabaseService.getWeekendPickData();
    if (!cloud || !cloud.rounds || cloud.rounds.length === 0) {
      // Cloud is uninitialized; if we have local rounds/genres, initialize cloud
      const localRounds = loadStorage(ROUNDS_KEY, null);
      if (localRounds && localRounds.length > 0) {
        pushWeekendPickDataToCloud();
      }
      return false;
    }

    const localUpdatedAt = loadStorage(UPDATED_AT_KEY, '');
    // If local has edits newer than cloud, push local instead of overwriting unless forced
    if (!force && localUpdatedAt && cloud.updatedAt && new Date(localUpdatedAt) > new Date(cloud.updatedAt)) {
      pushWeekendPickDataToCloud();
      return false;
    }

    // Apply cloud data to local storage
    if (cloud.rounds && Array.isArray(cloud.rounds)) {
      saveStorage(ROUNDS_KEY, cloud.rounds);
    }
    if (cloud.genres && Array.isArray(cloud.genres)) {
      saveStorage(GENRES_KEY, cloud.genres);
      GENRE_OPTIONS.length = 0;
      GENRE_OPTIONS.push(...cloud.genres);
      try {
        window.dispatchEvent(new Event('cinemascope_genres_updated'));
      } catch (e) {}
    }
    if (cloud.winners && Array.isArray(cloud.winners)) {
      saveStorage(WINNERS_KEY, cloud.winners);
    }
    if (cloud.votes && Array.isArray(cloud.votes)) {
      saveStorage(VOTES_KEY, cloud.votes);
    }

    saveStorage(UPDATED_AT_KEY, cloud.updatedAt || new Date().toISOString());
    notifyWeekendUpdates();
    return true;
  } catch (e) {
    console.warn('Error syncing weekend pick data from cloud:', e);
    return false;
  }
}

// Auto-sync from cloud on initial script load in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncWeekendPickDataFromCloud();
  }, 200);
}

/**
 * Get dynamic list of genres
 */
export function getGenreOptions() {
  const loaded = loadStorage(GENRES_KEY, null);
  if (Array.isArray(loaded) && loaded.length > 0) {
    return loaded;
  }
  return [...DEFAULT_GENRE_OPTIONS];
}

/**
 * Global dynamic array reference for direct access
 */
export const GENRE_OPTIONS = getGenreOptions();

/**
 * Save genre options list
 */
export function saveGenreOptions(genres) {
  saveStorage(GENRES_KEY, genres);
  GENRE_OPTIONS.length = 0;
  GENRE_OPTIONS.push(...genres);
  try {
    window.dispatchEvent(new Event('cinemascope_genres_updated'));
  } catch (e) {}
  notifyWeekendUpdates();
  pushWeekendPickDataToCloud();
}

/**
 * Update a specific genre
 */
export function updateGenreOption(genreId, updates) {
  const current = getGenreOptions();
  const updated = current.map(g => {
    if (g.id === genreId) {
      return { ...g, ...updates };
    }
    return g;
  });
  saveGenreOptions(updated);

  // If name changed, also update any active round that contains this genre
  if (updates.name) {
    try {
      const rounds = loadStorage(ROUNDS_KEY, []);
      let modified = false;
      const updatedRounds = rounds.map(r => {
        if (r.genreRounds && r.genreRounds[genreId]) {
          modified = true;
          return {
            ...r,
            genreRounds: {
              ...r.genreRounds,
              [genreId]: {
                ...r.genreRounds[genreId],
                genreName: updates.name,
              },
            },
          };
        }
        return r;
      });
      if (modified) {
        saveStorage(ROUNDS_KEY, updatedRounds);
        notifyWeekendUpdates();
      }
    } catch (e) {
      console.warn('Could not sync genre name across rounds:', e);
    }
  }

  return updated;
}

/**
 * Add a new genre
 */
export function addGenreOption(genreData) {
  const current = getGenreOptions();
  const rawId = genreData.id || genreData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '');
  const id = rawId || `genre-${Date.now()}`;

  if (current.some(g => g.id === id)) {
    throw new Error(`A genre with ID "${id}" already exists.`);
  }

  const newGenre = {
    id,
    name: genreData.name.trim(),
    emoji: genreData.emoji || '🎬',
    icon: genreData.icon || 'Film',
    color: genreData.color || '#eab308',
  };

  const updated = [...current, newGenre];
  saveGenreOptions(updated);

  // Also add this genre to current rounds so it's immediately available to add candidates
  try {
    const rounds = loadStorage(ROUNDS_KEY, []);
    let modified = false;
    const updatedRounds = rounds.map(r => {
      if (r.genreRounds && !r.genreRounds[id]) {
        modified = true;
        return {
          ...r,
          genreRounds: {
            ...r.genreRounds,
            [id]: {
              genreId: id,
              genreName: newGenre.name,
              candidates: [],
            },
          },
        };
      }
      return r;
    });
    if (modified) {
      saveStorage(ROUNDS_KEY, updatedRounds);
      notifyWeekendUpdates();
    }
  } catch (e) {
    console.warn('Could not add genre to existing rounds:', e);
  }

  return newGenre;
}

/**
 * Delete a genre
 */
export function deleteGenreOption(genreId) {
  const current = getGenreOptions();
  const updated = current.filter(g => g.id !== genreId);
  saveGenreOptions(updated);
  return updated;
}

/**
 * Reset genres to default 8
 */
export function resetGenreOptionsToDefault() {
  saveGenreOptions(DEFAULT_GENRE_OPTIONS);
  return DEFAULT_GENRE_OPTIONS;
}

/**
 * Reorder genres
 */
export function reorderGenreOptions(newOrder) {
  saveGenreOptions(newOrder);
  return newOrder;
}

export const TIE_BREAKER_OPTIONS = [
  { id: 'highest_percentage', label: 'Highest Vote Percentage' },
  { id: 'engagement_score', label: 'Community Rating & Engagement' },
  { id: 'admin_resolution', label: 'Admin Manual Selection' },
];

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
            backdropUrl: 'https://image.tmdb.org/t/p/original/8h2FzT9O43c08B7Z2aYt2KjS7sF.jpg',
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
  notifyWeekendUpdates();
  pushWeekendPickDataToCloud();
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
 * Add a candidate movie or series to a specific genre in a round
 */
export function addCandidateToRound(roundId, genreId, movieData, user = null) {
  const rounds = getAllRounds();
  const round = rounds.find(r => r.id === roundId) || getActiveRound();
  if (!round) throw new Error('No active voting round found');

  const genres = getGenreOptions();
  const currentGenreObj = genres.find(g => g.id === genreId);
  const genreRound = round.genreRounds?.[genreId] || {
    genreId: genreId,
    genreName: currentGenreObj?.name || genreId,
    candidates: [],
  };

  const isSeries = !!(
    movieData.isTv ||
    movieData.mediaType === 'tv' ||
    movieData.type === 'SERIES'
  );

  const rawId = String(movieData.tmdbId || movieData.id || `custom-${Date.now()}`);
  const titleId = isSeries
    ? (rawId.startsWith('tv-') ? rawId : `tv-${rawId}`)
    : (rawId.startsWith('tmdb-') ? rawId.replace('tmdb-', '') : rawId);

  // Avoid duplicate candidates in the same genre
  const existingCandidates = genreRound.candidates || [];
  const candidateTitle = (movieData.title || movieData.name || '').trim();
  const alreadyExists = existingCandidates.some(c => 
    String(c.titleId).toLowerCase() === String(titleId).toLowerCase() ||
    c.title?.toLowerCase() === candidateTitle.toLowerCase()
  );

  if (alreadyExists) {
    throw new Error(`"${candidateTitle}" is already a candidate in this genre.`);
  }

  // Parse release year
  let releaseYear = 2024;
  if (movieData.releaseYear) {
    releaseYear = parseInt(movieData.releaseYear, 10) || 2024;
  } else if (movieData.releaseDate) {
    releaseYear = parseInt(String(movieData.releaseDate).split('-')[0], 10) || 2024;
  } else if (movieData.firstAirDate) {
    releaseYear = parseInt(String(movieData.firstAirDate).split('-')[0], 10) || 2024;
  }

  // Format rating (convert 10-scale to 5-scale if needed)
  let rating = 4.8;
  if (movieData.rating) {
    rating = Number(movieData.rating) > 5 ? Math.round((Number(movieData.rating) / 2) * 10) / 10 : Number(movieData.rating);
  } else if (movieData.voteAverage) {
    rating = Number(movieData.voteAverage) > 5
      ? Math.round((Number(movieData.voteAverage) / 2) * 10) / 10
      : Math.round(Number(movieData.voteAverage) * 10) / 10;
  }

  const newCandidate = {
    id: `cand-${genreId}-${Date.now()}`,
    titleId,
    title: candidateTitle,
    type: isSeries ? 'SERIES' : 'MOVIE',
    isTv: isSeries,
    releaseYear,
    rating,
    language: movieData.language || (movieData.originalLanguage === 'te' ? 'Telugu' : (movieData.originalLanguage === 'hi' ? 'Hindi' : 'English')),
    posterUrl: movieData.posterUrl || '',
    backdropUrl: movieData.backdropUrl || '',
    overview: movieData.overview || '',
    initialVoteSeed: 0,
    addedByUser: true,
    addedByUserId: user?.id || null,
    addedByUserName: user?.name || 'Community Member',
    addedAt: new Date().toISOString(),
  };

  const updatedCandidates = [...existingCandidates, newCandidate];
  const updatedGenreRounds = {
    ...(round.genreRounds || {}),
    [genreId]: {
      ...genreRound,
      candidates: updatedCandidates,
    }
  };

  const updatedRound = updateRound(round.id, { genreRounds: updatedGenreRounds });
  return { updatedRound, newCandidate };
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
  notifyWeekendUpdates();
  pushWeekendPickDataToCloud();
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
  notifyWeekendUpdates();
  pushWeekendPickDataToCloud();
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
  notifyWeekendUpdates();
  pushWeekendPickDataToCloud();
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
  notifyWeekendUpdates();
}

/**
 * Check if a title or ID corresponds to a TV series in universal catalog,
 * active voting rounds, or crowned winners.
 */
export function isWeekendSeries(titleIdOrTmdbId) {
  if (!titleIdOrTmdbId) return false;
  const clean = String(titleIdOrTmdbId).replace(/^tmdb-tv-/, '').replace(/^tmdb-/, '').replace(/^tv-/, '').toLowerCase().trim();
  if (!clean) return false;

  // 1. Check UNIVERSAL_TITLES catalog
  if (typeof UNIVERSAL_TITLES !== 'undefined' && Array.isArray(UNIVERSAL_TITLES)) {
    const uniMatch = UNIVERSAL_TITLES.find(t => {
      const tClean = String(t.titleId || t.id).replace(/^tmdb-tv-/, '').replace(/^tmdb-/, '').replace(/^tv-/, '').toLowerCase();
      return (tClean === clean || String(t.title || '').toLowerCase() === clean) && (t.type === 'SERIES' || t.isTv);
    });
    if (uniMatch) return true;
  }

  // 2. Check all rounds (active + historical)
  try {
    const rounds = getAllRounds();
    for (const r of rounds) {
      if (r && r.genreRounds) {
        for (const gr of Object.values(r.genreRounds)) {
          if (Array.isArray(gr.candidates)) {
            const cand = gr.candidates.find(c => {
              const cClean = String(c.titleId || c.id).replace(/^tmdb-tv-/, '').replace(/^tmdb-/, '').replace(/^tv-/, '').toLowerCase();
              return (cClean === clean || String(c.title || '').toLowerCase() === clean) && (c.type === 'SERIES' || c.isTv);
            });
            if (cand) return true;
          }
        }
      }
    }
  } catch (e) {}

  // 3. Check declared winners
  try {
    const winners = getAllWinners();
    const winMatch = winners.find(w => {
      const wClean = String(w.titleId).replace(/^tmdb-tv-/, '').replace(/^tmdb-/, '').replace(/^tv-/, '').toLowerCase();
      return (wClean === clean || String(w.title || '').toLowerCase() === clean) && (w.type === 'SERIES' || w.isTv);
    });
    if (winMatch) return true;
  } catch (e) {}

  return false;
}

/**
 * Helper to build the canonical route URL for any movie or TV series candidate/winner.
 * Preserves 'tmdb-tv-' prefix for TV shows so MovieDetailPage correctly fetches
 * TV series endpoint /3/tv/{id} rather than /3/movie/{id}.
 */
export function formatMediaDetailUrl(item) {
  if (!item) return '';
  const rawId = String(item.titleId || item.tmdbId || item.id || '').trim();
  if (!rawId) return '';

  const isTv = !!(
    item.isTv ||
    item.type === 'SERIES' ||
    item.mediaType === 'tv' ||
    rawId.startsWith('tv-') ||
    rawId.startsWith('tmdb-tv-') ||
    rawId.includes('-series') ||
    rawId.includes('-show') ||
    rawId.includes('-tv') ||
    isWeekendSeries(rawId) ||
    isWeekendSeries(item.title)
  );

  const cleanId = rawId
    .replace(/^tmdb-tv-/, '')
    .replace(/^tmdb-/, '')
    .replace(/^tv-/, '');

  if (!cleanId) return '';

  return isTv ? `tmdb-tv-${cleanId}` : `tmdb-${cleanId}`;
}

/**
 * Universal Catalog of Movies & Series for "Random Movie" Discovery (All Movies & Series)
 */
export const UNIVERSAL_TITLES = [
  // --- TELUGU TV SERIES (WEB SERIES) ---
  {
    id: 'dhootha',
    titleId: 'tv-200946',
    title: 'Dhootha',
    type: 'SERIES',
    genreId: 'thriller',
    genreName: 'Thriller / Mystery',
    releaseYear: 2023,
    rating: 4.9,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/jMegWqCj8z58na8RG8ytlPJ7gGm.jpg',
    overview: "Journalist Sagar's life turns thrilling as he unravels dark secrets behind newspaper clippings predicting tragedies. He becomes a murder suspect, racing against time.",
    tags: ['telugu', 'thriller', 'mystery', 'horror', 'hyped', 'edge', 'dark', 'adrenaline', 'suspense'],
  },
  {
    id: 'rana-naidu',
    titleId: 'tv-203202',
    title: 'Rana Naidu',
    type: 'SERIES',
    genreId: 'action',
    genreName: 'Action / Crime',
    releaseYear: 2023,
    rating: 4.7,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/4kUF7cO76W4vEx70KVfwmju6Vud.jpg',
    overview: "Rana Naidu can solve any problem in the city. But when his father is suddenly released from prison, the one mess he cannot handle may be his own family feud.",
    tags: ['telugu', 'action', 'crime', 'drama', 'hyped', 'adrenaline', 'edge'],
  },
  {
    id: 'save-the-tigers',
    titleId: 'tv-224744',
    title: 'Save the Tigers',
    type: 'SERIES',
    genreId: 'comedy',
    genreName: 'Comedy / Drama',
    releaseYear: 2023,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/5uyNd8UjItEU2M5W0YKULaxzWFm.jpg',
    overview: "Revolves around three frustrated husbands who meet by chance and how their hilarious rants over their marital problems set off a chain of chaotic events.",
    tags: ['telugu', 'comedy', 'drama', 'laugh', 'fun', 'lighthearted'],
  },
  {
    id: 'kumari-srimathi',
    titleId: 'tv-235819',
    title: 'Kumari Srimathi',
    type: 'SERIES',
    genreId: 'comedy',
    genreName: 'Comedy / Drama',
    releaseYear: 2023,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/2008kVjRqNpzeY9dsM9bEuoZ0o5.jpg',
    overview: "Srimathi is a 30-year-old unmarried woman with a dead-end job, a quirky dysfunctional family, and a gritty dream to open a restaurant to reclaim her ancestral home.",
    tags: ['telugu', 'comedy', 'drama', 'laugh', 'cozy', 'warm'],
  },
  {
    id: 'parampara',
    titleId: 'tv-153637',
    title: 'Parampara',
    type: 'SERIES',
    genreId: 'thriller',
    genreName: 'Crime / Drama',
    releaseYear: 2021,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/po8pqEdyWdJwzMnWsYJ10kuS4jC.jpg',
    overview: "When powerful, wily Naidu's ruthlessness becomes too much, his nephew, Gopi, steps up to challenge the family empire and avenge the injustice met to his father.",
    tags: ['telugu', 'crime', 'drama', 'thriller', 'action', 'hyped', 'edge'],
  },
  {
    id: 'recce',
    titleId: 'tv-203290',
    title: 'Recce',
    type: 'SERIES',
    genreId: 'thriller',
    genreName: 'Crime / Thriller',
    releaseYear: 2022,
    rating: 4.7,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/hJ1FzK3wyAz7XUgBghFtkIEArqI.jpg',
    overview: "Set in the backdrop of Anantapur in 1993, a dual murder takes place, setting off a series of unforeseen twists and investigations by a sharp young sub-inspector.",
    tags: ['telugu', 'thriller', 'crime', 'suspense', 'edge', 'dark', 'investigation'],
  },
  {
    id: 'gaalivaana',
    titleId: 'tv-195485',
    title: 'Gaalivaana',
    type: 'SERIES',
    genreId: 'thriller',
    genreName: 'Suspense / Thriller',
    releaseYear: 2022,
    rating: 4.7,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/5VPrBr7bH4Rb4h0piAc3QKiH0HU.jpg',
    overview: "After newlyweds Ajay and Geetha are brutally murdered, their families come together in grief. But shock strikes when the injured killer seeks shelter in their farmhouse.",
    tags: ['telugu', 'thriller', 'mystery', 'suspense', 'edge', 'dark'],
  },
  {
    id: 'kudi-yedamaithe',
    titleId: 'tv-129043',
    title: 'Kudi Yedamaithe',
    type: 'SERIES',
    genreId: 'scifi',
    genreName: 'Sci-Fi / Mind-Bending',
    releaseYear: 2021,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/uDZcipvkoyXV0AevyuJ6CUdgt3x.jpg',
    overview: "A food delivery guy and a female police inspector find themselves caught in a terrifying time loop involving a fatal accident and a crime they must unravel.",
    tags: ['telugu', 'scifi', 'mind-bending', 'mindblown', 'thriller', 'mystery', 'time loop', 'edge'],
  },
  {
    id: 'nine-hours',
    titleId: 'tv-202748',
    title: '9 Hours',
    type: 'SERIES',
    genreId: 'thriller',
    genreName: 'Action / Heist',
    releaseYear: 2022,
    rating: 4.6,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/4lqTfrlQWakAHbPbF5c84pl07Us.jpg',
    overview: "Three prisoners on the run attempt to rob three banks simultaneously in Hyderabad, sparking a high-stakes 9-hour countdown hostage thriller.",
    tags: ['telugu', 'thriller', 'action', 'heist', 'hyped', 'adrenaline', 'edge'],
  },
  {
    id: 'modern-love-hyderabad',
    titleId: 'tv-200882',
    title: 'Modern Love Hyderabad',
    type: 'SERIES',
    genreId: 'romance',
    genreName: 'Romance / Drama',
    releaseYear: 2022,
    rating: 4.7,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/t92IeHAebFvYzzw089lemtrqEio.jpg',
    overview: "A rich compilation of heartwarming love stories exploring varied relationships, family bonds, and the unique cultural pulse of Hyderabad.",
    tags: ['telugu', 'romance', 'drama', 'cozy', 'warm'],
  },
  {
    id: 'oka-chinna-family-story',
    titleId: 'tv-138179',
    title: 'Oka Chinna Family Story',
    type: 'SERIES',
    genreId: 'comedy',
    genreName: 'Comedy / Family',
    releaseYear: 2021,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/u1Tq2Qqb1oUJ6WSzVJqWk03LzEl.jpg',
    overview: "Mahesh and his mother embark on a comical journey to settle a hefty loan left by his late father, encountering oddball relatives along the way.",
    tags: ['telugu', 'comedy', 'laugh', 'family', 'fun'],
  },

  // --- TELUGU MOVIES (THRILLERS, MIND-BENDING, ACTION, COMEDY) ---
  {
    id: 'one-nenokkadine',
    titleId: '249772',
    title: '1: Nenokkadine',
    type: 'MOVIE',
    genreId: 'thriller',
    genreName: 'Psychological / Mind-Bending',
    releaseYear: 2014,
    rating: 4.9,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/dYpqpA7BsDHeyAGs9AAEPhZmbck.jpg',
    overview: "A rock musician suffering from schizophrenia and hallucinations sets out to avenge his parents' murder, struggling to discern illusion from reality.",
    tags: ['telugu', 'thriller', 'mind-bending', 'mindblown', 'psychological', 'action', 'hyped', 'edge'],
  },
  {
    id: 'hit-first-case',
    titleId: '887109',
    title: 'HIT: The First Case',
    type: 'MOVIE',
    genreId: 'thriller',
    genreName: 'Crime / Investigation',
    releaseYear: 2020,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/sKcbVK6QgxUjiHOE2xooRXTH0mz.jpg',
    overview: "Vikram, a cop haunted by severe PTSD and panic attacks, must put his trauma aside to crack the mysterious disappearance of a young woman.",
    tags: ['telugu', 'thriller', 'crime', 'suspense', 'edge', 'investigation', 'dark'],
  },
  {
    id: 'evaru',
    titleId: '607310',
    title: 'Evaru',
    type: 'MOVIE',
    genreId: 'thriller',
    genreName: 'Mystery / Thriller',
    releaseYear: 2019,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/kRxKI0ZuKTIp3BZJPHF9YoDYkaR.jpg',
    overview: "A corrupt sub-inspector is tasked with investigating a high-profile rape and murder case, uncovering dark secrets behind every fabricated confession.",
    tags: ['telugu', 'thriller', 'mystery', 'suspense', 'mind-bending', 'edge'],
  },
  {
    id: 'awe',
    titleId: '500723',
    title: 'Awe!',
    type: 'MOVIE',
    genreId: 'scifi',
    genreName: 'Mind-Bending / Psychological',
    releaseYear: 2018,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/98Dn1D22PWmgwkEx7UEVLtpAPmk.jpg',
    overview: "Multiple eccentric characters gather inside a restaurant, confronting complex issues like child abuse, mental trauma, and sexual identity with mind-bending revelations.",
    tags: ['telugu', 'scifi', 'mind-bending', 'mindblown', 'psychological', 'disturbing', 'mystery'],
  },
  {
    id: 'virupaksha',
    titleId: '1034590',
    title: 'Virupaksha',
    type: 'MOVIE',
    genreId: 'horror',
    genreName: 'Horror / Occult Thriller',
    releaseYear: 2023,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/fqMn4h9ctOyumII2nXDnm5mRTxQ.jpg',
    overview: "Mysterious, gruesome deaths terrorize a secluded village bound by an occult curse. A determined outsider races to unmask the supernatural puppet master.",
    tags: ['telugu', 'horror', 'mystery', 'thriller', 'spooky', 'edge', 'dark'],
  },
  {
    id: 'masooda',
    titleId: '1047902',
    title: 'Masooda',
    type: 'MOVIE',
    genreId: 'horror',
    genreName: 'Supernatural Horror',
    releaseYear: 2022,
    rating: 4.7,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8tteFyJbPxvVr57K1CjGhKbqEjY.jpg',
    overview: "A cowardly software engineer steps up to save his single-mother neighbor when her teenage daughter gets possessed by a bloodthirsty demonic spirit.",
    tags: ['telugu', 'horror', 'spooky', 'dark', 'disturbing', 'supernatural', 'edge'],
  },
  {
    id: 'agent-sai',
    titleId: '610482',
    title: 'Agent Sai Srinivasa Athreya',
    type: 'MOVIE',
    genreId: 'comedy',
    genreName: 'Comedy / Detective',
    releaseYear: 2019,
    rating: 4.9,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/jMVfhhWfHLawVp3kd55KBy3VBsW.jpg',
    overview: "A witty, fast-talking private detective in Nellore investigates an abandoned corpse by the railway tracks, uncovering a sinister nationwide conspiracy.",
    tags: ['telugu', 'comedy', 'thriller', 'mystery', 'laugh', 'edge', 'investigation'],
  },
  {
    id: 'mathu-vadalara',
    titleId: '657853',
    title: 'Mathu Vadalara',
    type: 'MOVIE',
    genreId: 'comedy',
    genreName: 'Comedy / Crime Thriller',
    releaseYear: 2019,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/lo0ALsfiSv5sxNBhCNh35AD1p0x.jpg',
    overview: "An underpaid delivery boy attempts a petty scam to make quick cash, only to wake up inside an apartment alongside an elderly woman's corpse.",
    tags: ['telugu', 'comedy', 'thriller', 'crime', 'laugh', 'edge', 'adrenaline'],
  },
  {
    id: 'dj-tillu',
    titleId: '937036',
    title: 'DJ Tillu',
    type: 'MOVIE',
    genreId: 'comedy',
    genreName: 'Comedy / Romance',
    releaseYear: 2022,
    rating: 4.7,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/2XKg3VhpFDXdAktwKvFMSuIneE3.jpg',
    overview: "A flamboyant local DJ who dreams big gets entangled in an eccentric murder cover-up after falling head over heels for a woman named Radhika.",
    tags: ['telugu', 'comedy', 'laugh', 'hyped', 'romance'],
  },
  {
    id: 'rrr',
    titleId: '579974',
    title: 'RRR',
    type: 'MOVIE',
    genreId: 'action',
    genreName: 'Action / Epic',
    releaseYear: 2022,
    rating: 4.9,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/wE0noFUqdCzxik90wuoGpH8USes.jpg',
    overview: 'A fearless revolutionary and an ambitious British police officer forge an unbreakable brotherhood before discovering their conflicting missions.',
    tags: ['telugu', 'action', 'hyped', 'adrenaline', 'epic', 'drama'],
  },
  {
    id: 'salaar',
    titleId: '940551',
    title: 'Salaar: Part 1 - Ceasefire',
    type: 'MOVIE',
    genreId: 'action',
    genreName: 'Action / Crime',
    releaseYear: 2023,
    rating: 4.7,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/mHQOO0K06c0Q1b9c7wV3gU6Z5M.jpg',
    overview: 'Set in the dystopian city-state of Khansaar, a hardened warrior unleashes pure mayhem to fulfill a promise to his royal childhood friend.',
    tags: ['telugu', 'action', 'hyped', 'adrenaline', 'dark', 'edge'],
  },
  {
    id: 'kalki-2898-ad',
    titleId: '1022789',
    title: 'Kalki 2898 AD',
    type: 'MOVIE',
    genreId: 'scifi',
    genreName: 'Sci-Fi / Epic',
    releaseYear: 2024,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/uY9HzY35e4d2J7jZfP6Q9n4z170.jpg',
    overview: 'In the dystopian future city of Kasi, an immortal warrior, a cynical bounty hunter, and rebels collide to protect the unborn savior of the world.',
    tags: ['telugu', 'scifi', 'mindblown', 'action', 'epic', 'hyped'],
  },
  {
    id: 'hi-nanna',
    titleId: '1072790',
    title: 'Hi Nanna',
    type: 'MOVIE',
    genreId: 'drama',
    genreName: 'Drama / Romance',
    releaseYear: 2023,
    rating: 4.8,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/5s1R5NnO3sU6Y3w0yP5s1R5NnO3.jpg',
    overview: 'A doting single father and his terminally ill 6-year-old daughter find their lives forever transformed when a mysterious, warm woman enters their world.',
    tags: ['telugu', 'drama', 'romance', 'cozy', 'warm', 'emotional'],
  },
  {
    id: 'jathi-ratnalu',
    titleId: '791373',
    title: 'Jathi Ratnalu',
    type: 'MOVIE',
    genreId: 'comedy',
    genreName: 'Comedy',
    releaseYear: 2021,
    rating: 4.7,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    overview: 'Three naive friends travel from Jogipet to Hyderabad looking for prestige, only to end up hilariously framed for an assassination attempt.',
    tags: ['telugu', 'comedy', 'laugh', 'fun'],
  },
  {
    id: 'mad',
    titleId: '1169707',
    title: 'Mad',
    type: 'MOVIE',
    genreId: 'comedy',
    genreName: 'Comedy / Youth',
    releaseYear: 2023,
    rating: 4.6,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/7aE0N6kR1YdK3P6v0P9x5M0Q.jpg',
    overview: 'Three engineering college freshers navigate campus hostel life, bitter rivalries, and hilariously chaotic romances.',
    tags: ['telugu', 'comedy', 'laugh', 'fun', 'youth'],
  },
  {
    id: 'sita-ramam',
    titleId: '956101',
    title: 'Sita Ramam',
    type: 'MOVIE',
    genreId: 'romance',
    genreName: 'Romance / Drama',
    releaseYear: 2022,
    rating: 4.9,
    language: 'Telugu',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    overview: 'An orphaned soldier serving in the snow-clad mountains of Kashmir receives letters from a mysterious girl claiming to be his wife, kindling a timeless love.',
    tags: ['telugu', 'romance', 'drama', 'cozy', 'warm', 'emotional'],
  },

  // --- PSYCHOLOGICAL, DISTURBING, & MIND-BENDING GEMS ---
  {
    id: 'dark-series',
    titleId: 'tv-70523',
    title: 'Dark',
    type: 'SERIES',
    genreId: 'scifi',
    genreName: 'Sci-Fi / Mind-Bending',
    releaseYear: 2017,
    rating: 5.0,
    language: 'German',
    posterUrl: 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
    overview: 'A missing child sets four families on a frantic hunt for answers as they unearth a mind-bending mystery spanning four interconnected generations.',
    tags: ['scifi', 'mind-bending', 'mindblown', 'mystery', 'dark', 'edge', 'time travel', 'puzzle'],
  },
  {
    id: 'severance-series',
    titleId: 'tv-95396',
    title: 'Severance',
    type: 'SERIES',
    genreId: 'scifi',
    genreName: 'Sci-Fi / Psychological',
    releaseYear: 2022,
    rating: 4.9,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/jtACkF0x7a3wzU0c7a3wzU0c7a3.jpg',
    overview: 'Mark leads a team of office workers whose memories have been surgically partitioned between their work and personal lives, slowly discovering horrifying conspiracies.',
    tags: ['scifi', 'mind-bending', 'mindblown', 'thriller', 'mystery', 'psychological', 'dark', 'edge'],
  },
  {
    id: 'mindhunter-series',
    titleId: 'tv-67744',
    title: 'Mindhunter',
    type: 'SERIES',
    genreId: 'thriller',
    genreName: 'Psychological / Disturbing',
    releaseYear: 2017,
    rating: 4.9,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/fbKE87mojpIETWepSbD5Qt741fp.jpg',
    overview: 'In the late 1970s, two FBI agents revolutionize criminal psychology by interviewing incarcerated serial killers to solve active murder investigations.',
    tags: ['thriller', 'crime', 'disturbing', 'psychological', 'edge', 'dark', 'investigation'],
  },
  {
    id: 'true-detective-series',
    titleId: 'tv-46648',
    title: 'True Detective',
    type: 'SERIES',
    genreId: 'thriller',
    genreName: 'Crime / Dark Thriller',
    releaseYear: 2014,
    rating: 5.0,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/cuV2O5ZyDLHSOWzg3nLVljp1ubw.jpg',
    overview: 'Louisiana detectives Rust Cohle and Martin Hart become consumed by a sinister ritual murder that reopens decades of personal obsession and dread.',
    tags: ['thriller', 'crime', 'disturbing', 'edge', 'dark', 'mystery', 'investigation'],
  },
  {
    id: 'black-mirror-series',
    titleId: 'tv-42009',
    title: 'Black Mirror',
    type: 'SERIES',
    genreId: 'scifi',
    genreName: 'Dystopian / Mind-Bending',
    releaseYear: 2011,
    rating: 4.9,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/seN6rRfN0I6n8iDXjlSMk1QjNcq.jpg',
    overview: 'An anthology series exploring a twisted, high-tech multiverse where humanity’s greatest innovations and darkest instincts collide.',
    tags: ['scifi', 'mind-bending', 'mindblown', 'disturbing', 'dark', 'dystopian'],
  },
  {
    id: 'oldboy',
    titleId: '670',
    title: 'Oldboy',
    type: 'MOVIE',
    genreId: 'thriller',
    genreName: 'Disturbing / Psychological',
    releaseYear: 2003,
    rating: 5.0,
    language: 'Korean',
    posterUrl: 'https://image.tmdb.org/t/p/w500/pWDtjs568ZfOTMbURQBYuT4Qxka.jpg',
    overview: 'After being mysteriously kidnapped and imprisoned for 15 years, a man is suddenly released with five days to identify his captor and learn the horrifying reason.',
    tags: ['thriller', 'disturbing', 'psychological', 'mind-bending', 'dark', 'korean', 'edge'],
  },
  {
    id: 'memories-of-murder',
    titleId: '11423',
    title: 'Memories of Murder',
    type: 'MOVIE',
    genreId: 'thriller',
    genreName: 'Crime / Investigation',
    releaseYear: 2003,
    rating: 4.9,
    language: 'Korean',
    posterUrl: 'https://image.tmdb.org/t/p/w500/jcgUjx1QcupGzjntTVlnQ15lHqy.jpg',
    overview: "In 1986 rural South Korea, two local detectives and a Seoul specialist struggle with brutal incompetence while trying to catch the nation's first recorded serial killer.",
    tags: ['thriller', 'crime', 'mystery', 'disturbing', 'investigation', 'korean', 'edge'],
  },
  {
    id: 'i-saw-the-devil',
    titleId: '49797',
    title: 'I Saw the Devil',
    type: 'MOVIE',
    genreId: 'thriller',
    genreName: 'Horror / Disturbing',
    releaseYear: 2010,
    rating: 4.8,
    language: 'Korean',
    posterUrl: 'https://image.tmdb.org/t/p/w500/zp5NrmYp80axIGiEiYPmm1CW6uH.jpg',
    overview: 'When his pregnant fiancée is savagely murdered by a psychopathic killer, a secret agent embarks on a relentless cat-and-mouse revenge vendetta.',
    tags: ['thriller', 'horror', 'disturbing', 'brutal', 'korean', 'edge', 'spooky', 'dark'],
  },
  {
    id: 'shutter-island',
    titleId: '11324',
    title: 'Shutter Island',
    type: 'MOVIE',
    genreId: 'thriller',
    genreName: 'Mystery / Mind-Bending',
    releaseYear: 2010,
    rating: 4.9,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/nrmXQ0zcZUL8jFLrakWc90IR8z9.jpg',
    overview: 'A US Marshal investigates the inexplicable disappearance of a patient from a fortress-like psychiatric asylum on a storm-swept island.',
    tags: ['thriller', 'mystery', 'mind-bending', 'mindblown', 'psychological', 'edge'],
  },
  {
    id: 'memento',
    titleId: '77',
    title: 'Memento',
    type: 'MOVIE',
    genreId: 'thriller',
    genreName: 'Mystery / Mind-Bending',
    releaseYear: 2000,
    rating: 4.9,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/nzlv62aC0octS5AklAiWpXLX9Z0.jpg',
    overview: "A man who sustains severe short-term memory loss uses tattoos, handwritten notes, and polaroids to track down the man who murdered his wife.",
    tags: ['thriller', 'mystery', 'mind-bending', 'mindblown', 'puzzle', 'edge'],
  },

  // --- POPULAR INDIAN & GLOBAL TV SERIES ---
  {
    id: 'panchayat-series',
    titleId: 'tv-101188',
    title: 'Panchayat',
    type: 'SERIES',
    genreId: 'comedy',
    genreName: 'Comedy / Drama',
    releaseYear: 2020,
    rating: 4.9,
    language: 'Hindi',
    posterUrl: 'https://image.tmdb.org/t/p/w500/q9n8J2a6V5l4K8f9.jpg',
    overview: 'An engineering graduate takes up a job as a secretary of a Gram Panchayat in a remote village in Uttar Pradesh, sparking wholesome daily laughs.',
    tags: ['hindi', 'comedy', 'drama', 'laugh', 'cozy', 'warm'],
  },
  {
    id: 'the-family-man',
    titleId: 'tv-93333',
    title: 'The Family Man',
    type: 'SERIES',
    genreId: 'action',
    genreName: 'Action / Thriller / Comedy',
    releaseYear: 2019,
    rating: 4.9,
    language: 'Hindi',
    posterUrl: 'https://image.tmdb.org/t/p/w500/4kUF7cO76W4vEx70KVfwmju6Vud.jpg',
    overview: 'A middle-class man secretly working as an intelligence officer for T.A.S.C. struggles to juggle high-stakes national security crises with family life.',
    tags: ['hindi', 'action', 'thriller', 'comedy', 'hyped', 'adrenaline', 'edge'],
  },
  {
    id: 'breaking-bad-series',
    titleId: 'tv-1396',
    title: 'Breaking Bad',
    type: 'SERIES',
    genreId: 'thriller',
    genreName: 'Crime / Drama',
    releaseYear: 2008,
    rating: 5.0,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    overview: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling crystal meth with a former student.',
    tags: ['thriller', 'crime', 'drama', 'hyped', 'edge', 'adrenaline'],
  },
  {
    id: 'the-boys-series',
    titleId: 'tv-76479',
    title: 'The Boys',
    type: 'SERIES',
    genreId: 'action',
    genreName: 'Action / Dark Comedy',
    releaseYear: 2019,
    rating: 4.8,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/7Ns6tO3aYjppI5LoNOFvj2q199.jpg',
    overview: 'A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers and corporate backing.',
    tags: ['action', 'scifi', 'hyped', 'adrenaline', 'disturbing', 'edge'],
  },
  {
    id: 'shogun-series',
    titleId: 'tv-126308',
    title: 'Shōgun',
    type: 'SERIES',
    genreId: 'action',
    genreName: 'Action / Historical Drama',
    releaseYear: 2024,
    rating: 4.9,
    language: 'Japanese',
    posterUrl: 'https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WNzG1AgYT.jpg',
    overview: 'When a mysterious European ship is found shipwrecked in a fishing village, lord Toranaga discovers secrets that could tip the balance of civil war in feudal Japan.',
    tags: ['action', 'drama', 'hyped', 'epic', 'edge'],
  },
  {
    id: 'attack-on-titan-series',
    titleId: 'tv-1429',
    title: 'Attack on Titan',
    type: 'SERIES',
    genreId: 'anime',
    genreName: 'Anime / Dark Fantasy',
    releaseYear: 2013,
    rating: 5.0,
    language: 'Japanese',
    posterUrl: 'https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg',
    overview: 'After his hometown is devastated and his mother killed, Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.',
    tags: ['anime', 'action', 'dark', 'hyped', 'adrenaline', 'mindblown', 'disturbing'],
  },
  {
    id: 'death-note-series',
    titleId: 'tv-13916',
    title: 'Death Note',
    type: 'SERIES',
    genreId: 'anime',
    genreName: 'Anime / Psychological Thriller',
    releaseYear: 2006,
    rating: 4.9,
    language: 'Japanese',
    posterUrl: 'https://image.tmdb.org/t/p/w500/iigTJJskR1vbhjj09lZ9.jpg',
    overview: 'An intelligent high school student discovers a supernatural notebook that grants him the lethal power to kill anyone whose name and face he knows.',
    tags: ['anime', 'thriller', 'mind-bending', 'mindblown', 'psychological', 'edge'],
  },
  {
    id: 'arcane-series',
    titleId: 'tv-94605',
    title: 'Arcane',
    type: 'SERIES',
    genreId: 'anime',
    genreName: 'Animation / Sci-Fi',
    releaseYear: 2021,
    rating: 5.0,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn397mlOhG8w1.jpg',
    overview: 'Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic champions and the power that tears them apart.',
    tags: ['animation', 'anime', 'scifi', 'action', 'hyped', 'adrenaline'],
  },

  // --- ACCLAIMED GLOBAL MOVIES ---
  {
    id: 'interstellar',
    titleId: '157336',
    title: 'Interstellar',
    type: 'MOVIE',
    genreId: 'scifi',
    genreName: 'Sci-Fi / Epic',
    releaseYear: 2014,
    rating: 4.9,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity’s survival as Earth faces agricultural collapse.',
    tags: ['scifi', 'mind-bending', 'mindblown', 'epic', 'emotional', 'cozy'],
  },
  {
    id: 'inception',
    titleId: '27205',
    title: 'Inception',
    type: 'MOVIE',
    genreId: 'scifi',
    genreName: 'Sci-Fi / Mind-Bending',
    releaseYear: 2010,
    rating: 4.9,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    overview: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.',
    tags: ['scifi', 'mind-bending', 'mindblown', 'thriller', 'action', 'hyped', 'edge'],
  },
  {
    id: 'oppenheimer',
    titleId: '872585',
    title: 'Oppenheimer',
    type: 'MOVIE',
    genreId: 'drama',
    genreName: 'Historical Drama / Thriller',
    releaseYear: 2023,
    rating: 4.9,
    language: 'English',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    tags: ['drama', 'thriller', 'mindblown', 'edge'],
  },
  {
    id: 'bramayugam',
    titleId: '1160164',
    title: 'Bramayugam',
    type: 'MOVIE',
    genreId: 'horror',
    genreName: 'Folk Horror',
    releaseYear: 2024,
    rating: 4.8,
    language: 'Malayalam',
    posterUrl: 'https://image.tmdb.org/t/p/w500/9k8f9k8f9k8f9k8f9k8f9k8f9.jpg',
    overview: 'A folk horror tale set in medieval Kerala following a court singer who stumbles into a sinister, decaying mansion ruled by a manipulative lord.',
    tags: ['horror', 'spooky', 'dark', 'disturbing', 'edge', 'malayalam'],
  },
  {
    id: 'tumbbad',
    titleId: '538858',
    title: 'Tumbbad',
    type: 'MOVIE',
    genreId: 'horror',
    genreName: 'Mythological Horror',
    releaseYear: 2018,
    rating: 4.9,
    language: 'Hindi',
    posterUrl: 'https://image.tmdb.org/t/p/w500/yrpPYK2z98gSFCU0XGDykEGv7zR.jpg',
    overview: 'A mythological horror story about a family who builds a shrine for Hastar, a greedy monster entity never to be worshipped.',
    tags: ['horror', 'spooky', 'dark', 'disturbing', 'edge', 'hindi'],
  },
  {
    id: 'maharaja',
    titleId: '1114513',
    title: 'Maharaja',
    type: 'MOVIE',
    genreId: 'thriller',
    genreName: 'Crime / Thriller',
    releaseYear: 2024,
    rating: 4.9,
    language: 'Tamil',
    posterUrl: 'https://image.tmdb.org/t/p/w500/7aE0N6kR1YdK3P6v0P9x5M0Q.jpg',
    overview: 'A quiet barber seeks vengeance after his home is burglarized, cryptically insisting to police that his beloved Lakshmi was stolen.',
    tags: ['tamil', 'thriller', 'crime', 'disturbing', 'edge', 'hyped'],
  },
];

/**
 * Helper: Smart genre matching across ID, name, language, anime, and tags
 */
export function matchesGenreHelper(item, targetGenre, genreOptions = []) {
  if (!targetGenre || targetGenre === 'all') return true;

  const gId = String(targetGenre).toLowerCase().trim();
  const genreObj = genreOptions.find(g => g.id?.toLowerCase() === gId || g.name?.toLowerCase() === gId);
  const gName = (genreObj?.name || gId).toLowerCase().trim();

  const itemGenreId = String(item.genreId || '').toLowerCase().trim();
  const itemGenreName = String(item.genreName || '').toLowerCase().trim();
  const itemLang = String(item.language || '').toLowerCase().trim();
  const itemTitle = String(item.title || '').toLowerCase();
  const itemOverview = String(item.overview || '').toLowerCase();
  const itemTags = Array.isArray(item.tags) ? item.tags.map(t => String(t).toLowerCase()) : [];

  // 1. Direct ID or Name match
  if (itemGenreId === gId || itemGenreName === gName) return true;
  if (itemGenreName.includes(gName) || gName.includes(itemGenreName)) return true;
  if (itemTags.includes(gId) || itemTags.includes(gName)) return true;

  // 2. Language-based genre (e.g. 'telugu', 'hindi', 'tamil', 'malayalam', 'korean', 'japanese', 'english')
  if (itemLang === gId || itemLang === gName) return true;
  if (gId === 'telugu' || gName.includes('telugu')) {
    if (itemLang.includes('telugu')) return true;
    if (itemGenreId === 'telugu' || itemGenreName.includes('telugu')) return true;
    if (itemTags.includes('telugu')) return true;
  }
  if (gId === 'hindi' || gName.includes('hindi')) {
    if (itemLang.includes('hindi')) return true;
    if (itemGenreId === 'hindi' || itemGenreName.includes('hindi')) return true;
    if (itemTags.includes('hindi')) return true;
  }
  if (gId === 'tamil' || gName.includes('tamil')) {
    if (itemLang.includes('tamil')) return true;
    if (itemGenreId === 'tamil' || itemGenreName.includes('tamil')) return true;
    if (itemTags.includes('tamil')) return true;
  }
  if (gId === 'korean' || gName.includes('korean')) {
    if (itemLang.includes('korean') || itemTags.includes('korean')) return true;
  }
  if (gId === 'japanese' || gName.includes('japanese')) {
    if (itemLang.includes('japanese') || itemTags.includes('japanese')) return true;
  }

  // 3. Anime
  if (gId === 'anime' || gName.includes('anime')) {
    if (itemGenreId === 'anime' || itemGenreName.includes('anime')) return true;
    if (itemTags.includes('anime')) return true;
    if ((itemGenreId === 'animation' || itemGenreName.includes('anim')) && itemLang.includes('japan')) return true;
  }

  // 4. Disturbing / Psychological
  if (gId.includes('disturb') || gName.includes('disturb')) {
    if (itemTags.some(t => t.includes('disturb') || t.includes('psychological') || t.includes('brutal'))) return true;
    if (itemOverview.includes('disturbing') || itemOverview.includes('chilling') || itemOverview.includes('brutal') || itemOverview.includes('sinister') || itemOverview.includes('serial killer')) return true;
    if (itemGenreName.includes('disturb') || itemGenreName.includes('psychological')) return true;
  }

  // 5. Mind-Bending / Sci-Fi
  if (gId.includes('mind') || gName.includes('mind')) {
    if (itemTags.some(t => t.includes('mind') || t.includes('twist') || t.includes('puzzle') || t.includes('reality'))) return true;
    if (itemOverview.includes('mind-bending') || itemOverview.includes('reality') || itemOverview.includes('twist') || itemOverview.includes('time loop') || itemOverview.includes('multiverse') || itemOverview.includes('timeline')) return true;
    if (itemGenreId === 'scifi' || itemGenreName.includes('sci')) return true;
  }

  // 6. Thriller / Suspense / Crime
  if (gId.includes('thrill') || gId.includes('suspense') || gId.includes('crime')) {
    if (itemGenreId === 'thriller' || itemGenreName.includes('thrill') || itemGenreName.includes('suspense') || itemGenreName.includes('crime') || itemGenreName.includes('mystery')) return true;
    if (itemTags.some(t => t.includes('thrill') || t.includes('suspense') || t.includes('crime') || t.includes('investigation'))) return true;
  }

  // 7. Action
  if (gId.includes('action')) {
    if (itemGenreId === 'action' || itemGenreName.includes('action') || itemGenreName.includes('adventure')) return true;
    if (itemTags.some(t => t.includes('action') || t.includes('adventure') || t.includes('heist'))) return true;
  }

  // 8. Comedy
  if (gId.includes('comedy')) {
    if (itemGenreId === 'comedy' || itemGenreName.includes('comedy')) return true;
    if (itemTags.includes('comedy')) return true;
  }

  // 9. Horror
  if (gId.includes('horror')) {
    if (itemGenreId === 'horror' || itemGenreName.includes('horror')) return true;
    if (itemTags.includes('horror')) return true;
  }

  // 10. Sci-Fi
  if (gId.includes('sci')) {
    if (itemGenreId === 'scifi' || itemGenreName.includes('sci')) return true;
    if (itemTags.includes('scifi')) return true;
  }

  // 11. Romance
  if (gId.includes('romance') || gId.includes('love')) {
    if (itemGenreId === 'romance' || itemGenreName.includes('romance') || itemGenreName.includes('love')) return true;
    if (itemTags.includes('romance')) return true;
  }

  return false;
}

/**
 * Helper: Smart mood affinity matching
 */
export function matchesMoodHelper(item, mood) {
  if (!mood || mood === 'any') return true;

  const itemGenreId = String(item.genreId || '').toLowerCase();
  const itemGenreName = String(item.genreName || '').toLowerCase();
  const itemOverview = String(item.overview || '').toLowerCase();
  const itemTags = Array.isArray(item.tags) ? item.tags.map(t => String(t).toLowerCase()) : [];

  switch (mood) {
    case 'hyped': // Adrenaline / High Energy
      return itemGenreId === 'action' ||
        itemGenreName.includes('action') ||
        itemTags.some(t => ['action', 'hyped', 'adrenaline', 'thriller', 'heist'].includes(t)) ||
        itemOverview.includes('action') || itemOverview.includes('warrior') || itemOverview.includes('heist') || itemOverview.includes('thrilling');
    case 'laugh': // Need a Good Laugh
      return itemGenreId === 'comedy' ||
        itemGenreName.includes('comedy') ||
        itemTags.some(t => ['comedy', 'laugh', 'fun', 'hilarious'].includes(t)) ||
        itemOverview.includes('hilarious') || itemOverview.includes('comedy') || itemOverview.includes('funny');
    case 'spooky': // Dark & Chilling
      return itemGenreId === 'horror' ||
        itemGenreName.includes('horror') ||
        itemTags.some(t => ['horror', 'spooky', 'dark', 'supernatural', 'creepy'].includes(t)) ||
        itemOverview.includes('horror') || itemOverview.includes('possession') || itemOverview.includes('curse') || itemOverview.includes('haunting');
    case 'mindblown': // Mind-Bending & Epic
      return itemGenreId === 'scifi' ||
        itemGenreName.includes('sci') ||
        itemGenreName.includes('mind') ||
        itemTags.some(t => ['scifi', 'mind-bending', 'mindblown', 'puzzle', 'reality', 'twist'].includes(t)) ||
        itemOverview.includes('mind-bending') || itemOverview.includes('timeline') || itemOverview.includes('reality') || itemOverview.includes('wormhole');
    case 'edge': // Edge of My Seat
      return itemGenreId === 'thriller' ||
        itemGenreName.includes('thrill') ||
        itemGenreName.includes('crime') ||
        itemGenreName.includes('mystery') ||
        itemTags.some(t => ['thriller', 'crime', 'mystery', 'edge', 'suspense', 'investigation'].includes(t)) ||
        itemOverview.includes('murder') || itemOverview.includes('investigate') || itemOverview.includes('twist') || itemOverview.includes('conspiracy');
    case 'cozy': // Warm & Emotional
      return itemGenreId === 'romance' ||
        itemGenreId === 'drama' ||
        itemGenreName.includes('romance') ||
        itemGenreName.includes('drama') ||
        itemTags.some(t => ['romance', 'drama', 'cozy', 'warm', 'emotional'].includes(t)) ||
        itemOverview.includes('love') || itemOverview.includes('family') || itemOverview.includes('relationship') || itemOverview.includes('friendship');
    default:
      return true;
  }
}

/**
 * Helper: Smart language matching
 */
/**
 * Helper: Resolve TMDB ISO Language Code
 */
export function getTmdbLanguageCode(langKey) {
  if (!langKey || langKey === 'all') return null;
  const key = String(langKey).toLowerCase().trim();
  if (key === 'te' || key === 'telugu') return 'te';
  if (key === 'hi' || key === 'hindi') return 'hi';
  if (key === 'ta' || key === 'tamil') return 'ta';
  if (key === 'ml' || key === 'malayalam') return 'ml';
  if (key === 'kn' || key === 'kannada') return 'kn';
  if (key === 'en' || key === 'english') return 'en';
  if (key === 'ko' || key === 'korean') return 'ko';
  if (key === 'ja' || key === 'japanese') return 'ja';
  return key;
}

/**
 * Helper: Resolve TMDB Genre ID(s)
 */
export function getTmdbGenreId(genreKey, isTv = false) {
  if (!genreKey || genreKey === 'all') return null;
  const key = String(genreKey).toLowerCase().trim();

  if (isTv) {
    if (key.includes('action')) return '10759';
    if (key.includes('comedy')) return '35';
    if (key.includes('sci')) return '10765';
    if (key.includes('mind')) return '10765,9648';
    if (key.includes('thrill') || key.includes('suspense')) return '80,9648';
    if (key.includes('disturb')) return '80,9648';
    if (key.includes('horror')) return '9648,10765';
    if (key.includes('drama')) return '18';
    if (key.includes('anim')) return '16';
    if (key.includes('crime')) return '80';
    if (key.includes('mystery')) return '9648';
    if (key.includes('romance') || key.includes('love')) return '10766,18';
    return null;
  }

  // Movies
  if (key.includes('action')) return '28';
  if (key.includes('comedy')) return '35';
  if (key.includes('horror')) return '27';
  if (key.includes('mind')) return '878,9648';
  if (key.includes('disturb')) return '27,53,80';
  if (key.includes('suspense') || key.includes('thrill')) return '53,9648';
  if (key.includes('sci')) return '878';
  if (key.includes('drama')) return '18';
  if (key.includes('romance') || key.includes('love')) return '10749';
  if (key.includes('anim')) return '16';
  if (key.includes('crime')) return '80';
  if (key.includes('mystery')) return '9648';
  if (key.includes('adventur')) return '12';
  if (key.includes('fantasy')) return '14';
  return null;
}

/**
 * Helper: Strict language matching
 */
export function matchesLanguageHelper(item, language) {
  if (!language || language === 'all') return true;
  const targetCode = getTmdbLanguageCode(language);
  if (!targetCode) return true;

  const itemLang = String(item.language || item.originalLanguage || item.original_language || '').toLowerCase().trim();
  const itemTags = Array.isArray(item.tags) ? item.tags.map(t => String(t).toLowerCase()) : [];

  const langNames = {
    te: 'telugu',
    hi: 'hindi',
    ta: 'tamil',
    ml: 'malayalam',
    kn: 'kannada',
    en: 'english',
    ko: 'korean',
    ja: 'japanese',
  };

  const targetName = langNames[targetCode] || targetCode;

  if (itemLang === targetCode || itemLang === targetName) return true;
  if (itemLang.includes(targetName) || itemLang.includes(targetCode)) return true;
  if (itemTags.includes(targetCode) || itemTags.includes(targetName)) return true;

  return false;
}

/**
 * Pick a random title from ALL movies & series according to user specifications (Synchronous)
 */
export function getRandomTitleFromAll({
  appMovies = [],
  language = 'all',
  genreId = 'all',
  type = 'ANY', // 'ANY' | 'MOVIE' | 'SERIES'
  mood = 'any',
  excludeIds = [],
} = {}) {
  const excludeSet = new Set(
    (Array.isArray(excludeIds) ? excludeIds : []).map(id => String(id).toLowerCase().replace(/^tmdb-/, ''))
  );

  let pool = [...UNIVERSAL_TITLES];
  const existingIds = new Set(pool.map(p => String(p.titleId || p.id).toLowerCase()));

  // Incorporate candidates from all active and archived rounds
  try {
    const rounds = getAllRounds();
    if (Array.isArray(rounds)) {
      rounds.forEach(r => {
        if (r.genreRounds && typeof r.genreRounds === 'object') {
          Object.entries(r.genreRounds).forEach(([gKey, gr]) => {
            if (gr.candidates && Array.isArray(gr.candidates)) {
              gr.candidates.forEach(c => {
                const cId = String(c.titleId || c.id || '').toLowerCase();
                if (cId && !existingIds.has(cId)) {
                  existingIds.add(cId);
                  pool.push({
                    id: c.id || c.titleId,
                    titleId: c.titleId || c.id,
                    title: c.title,
                    type: String(c.type || 'MOVIE').toUpperCase() === 'SERIES' ? 'SERIES' : 'MOVIE',
                    genreId: gKey,
                    genreName: gr.genreName || gKey,
                    releaseYear: c.releaseYear || 2024,
                    rating: c.rating || 4.8,
                    language: c.language || '',
                    posterUrl: c.posterUrl,
                    backdropUrl: c.backdropUrl,
                    overview: c.overview || '',
                    tags: [gKey, String(c.language || '').toLowerCase()],
                  });
                }
              });
            }
          });
        }
      });
    }
  } catch (err) {
    console.warn('Could not incorporate round candidates into discovery pool:', err);
  }

  // Merge in app movies
  if (Array.isArray(appMovies) && appMovies.length > 0) {
    appMovies.forEach(m => {
      const idKey = String(m.id || m.tmdbId || '').toLowerCase();
      if (idKey && !existingIds.has(idKey)) {
        existingIds.add(idKey);
        const rawGenre = Array.isArray(m.genres) ? m.genres[0] : (m.genre || 'Action');
        const gLower = String(rawGenre).toLowerCase();
        let gId = 'action';
        if (gLower.includes('sci')) gId = 'scifi';
        else if (gLower.includes('dram')) gId = 'drama';
        else if (gLower.includes('horr')) gId = 'horror';
        else if (gLower.includes('comed')) gId = 'comedy';
        else if (gLower.includes('anim')) gId = 'anime';
        else if (gLower.includes('thril') || gLower.includes('crim')) gId = 'thriller';
        else if (gLower.includes('rom')) gId = 'romance';

        pool.push({
          id: m.id,
          titleId: m.id,
          title: m.title,
          type: m.isTv || m.type === 'SERIES' ? 'SERIES' : 'MOVIE',
          genreId: gId,
          genreName: rawGenre,
          releaseYear: m.releaseDate ? parseInt(m.releaseDate.split('-')[0], 10) : 2024,
          rating: 4.8,
          language: m.language || (m.original_language ? m.original_language.toUpperCase() : ''),
          posterUrl: m.posterUrl,
          backdropUrl: m.backdropUrl,
          overview: m.overview || '',
          tags: [gId, String(m.language || '').toLowerCase()],
        });
      }
    });
  }

  // 4. Strict Type Filtering
  if (type && type !== 'ANY') {
    const normalizedType = String(type).toUpperCase();
    pool = pool.filter(p => String(p.type).toUpperCase() === normalizedType);
  }

  // 4b. Strict Language Filtering
  if (language && language !== 'all') {
    pool = pool.filter(p => matchesLanguageHelper(p, language));
  }

  // 4c. Strict Genre Filtering
  const genreOptions = getGenreOptions();
  if (genreId && genreId !== 'all') {
    pool = pool.filter(p => matchesGenreHelper(p, genreId, genreOptions));
  }

  // 4d. Strict Exclude Seen Titles
  if (excludeSet.size > 0) {
    const unseenPool = pool.filter(p => {
      const pId = String(p.titleId || p.id).toLowerCase().replace(/^(tmdb-)?(tv-)?/, '');
      return !excludeSet.has(pId) && !excludeSet.has(`tmdb-${pId}`) && !excludeSet.has(`tv-${pId}`) && !excludeSet.has(String(p.id).toLowerCase());
    });
    if (unseenPool.length > 0) {
      pool = unseenPool;
    }
  }

  if (pool.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Async title discovery with real-time TMDB dynamic discover across thousands of titles
 * Ensures unique titles on every roll with zero repeated movies in a session.
 */
export async function getRandomTitleFromAllAsync({
  appMovies = [],
  language = 'all',
  genreId = 'all',
  type = 'ANY', // 'ANY' | 'MOVIE' | 'SERIES'
  mood = 'any',
  excludeIds = [],
} = {}) {
  const excludeSet = new Set(
    (Array.isArray(excludeIds) ? excludeIds : []).map(id => String(id).toLowerCase().replace(/^(tmdb-)?(tv-)?/, ''))
  );

  const targetType = String(type || 'ANY').toUpperCase();
  const tmdbLang = getTmdbLanguageCode(language);
  const genreOptions = getGenreOptions();

  const getLanguageLabel = (rawLang) => {
    const code = String(rawLang || '').toLowerCase();
    const map = {
      te: 'Telugu',
      hi: 'Hindi',
      ta: 'Tamil',
      ml: 'Malayalam',
      kn: 'Kannada',
      en: 'English',
      ko: 'Korean',
      ja: 'Japanese',
    };
    return map[code] || (rawLang ? String(rawLang).toUpperCase() : (tmdbLang ? (map[tmdbLang] || 'Cinema') : 'Featured'));
  };

  // 1. Gather local matching titles that have NOT been seen yet
  const localCandidates = [];
  try {
    const localMatch = getRandomTitleFromAll({ appMovies, language, genreId, type, mood, excludeIds });
    if (localMatch) {
      localCandidates.push(localMatch);
    }
  } catch (e) {}

  // 2. Query live TMDB Discover with randomized pages for vast catalog & deep variety
  try {
    const isTv = targetType === 'SERIES' || (targetType === 'ANY' && Math.random() < 0.35);
    const tmdbGenre = getTmdbGenreId(genreId, isTv);

    // Pick random page between 1 and 8 (for regional languages with fewer pages, 1 to 4)
    const maxPage = ['te', 'ta', 'ml', 'kn'].includes(tmdbLang) ? 4 : 8;
    const randomPage = Math.floor(Math.random() * maxPage) + 1;

    let items = [];

    if (isTv) {
      let tvData;
      if (tmdbLang === 'te' && !tmdbGenre) {
        tvData = await fetchTeluguTv(randomPage);
      } else {
        tvData = await discoverTv({
          with_original_language: tmdbLang,
          with_genres: tmdbGenre,
          sortBy: 'popularity.desc',
          page: randomPage,
        });
      }

      if (!tvData?.results?.length && randomPage > 1) {
        tvData = await discoverTv({
          with_original_language: tmdbLang,
          with_genres: tmdbGenre,
          sortBy: 'popularity.desc',
          page: 1,
        });
      }

      if (tvData?.results?.length) {
        items = tvData.results.map(r => ({
          id: `tv-${r.tmdbId || r.id}`,
          titleId: `tv-${r.tmdbId || r.id}`,
          title: r.title,
          type: 'SERIES',
          genreId: String(genreId || 'series').toLowerCase(),
          genreName: genreId !== 'all' ? (genreOptions.find(g => g.id === genreId)?.name || genreId) : 'TV Series',
          releaseYear: r.releaseYear || (r.firstAirDate ? parseInt(r.firstAirDate.split('-')[0], 10) : 2024),
          rating: r.voteAverage ? Math.round(r.voteAverage * 10) / 10 : 4.8,
          language: getLanguageLabel(r.language),
          posterUrl: r.posterUrl,
          backdropUrl: r.backdropUrl,
          overview: r.overview || 'Recommended TV series discovered matching your format and genre preferences.',
          tags: ['series', String(r.language || '').toLowerCase()],
        }));
      }
    } else {
      // MOVIE
      let movieData = await discoverMovies({
        with_original_language: tmdbLang,
        with_genres: tmdbGenre,
        sortBy: 'popularity.desc',
        page: randomPage,
      });

      if (!movieData?.results?.length && randomPage > 1) {
        movieData = await discoverMovies({
          with_original_language: tmdbLang,
          with_genres: tmdbGenre,
          sortBy: 'popularity.desc',
          page: 1,
        });
      }

      if (movieData?.results?.length) {
        items = movieData.results.map(r => ({
          id: `tmdb-${r.tmdbId || r.id}`,
          titleId: `tmdb-${r.tmdbId || r.id}`,
          title: r.title,
          type: 'MOVIE',
          genreId: String(genreId || 'movie').toLowerCase(),
          genreName: genreId !== 'all' ? (genreOptions.find(g => g.id === genreId)?.name || genreId) : 'Movie',
          releaseYear: r.releaseYear || (r.releaseDate ? parseInt(r.releaseDate.split('-')[0], 10) : 2024),
          rating: r.voteAverage ? Math.round(r.voteAverage * 10) / 10 : 4.8,
          language: getLanguageLabel(r.language),
          posterUrl: r.posterUrl,
          backdropUrl: r.backdropUrl,
          overview: r.overview || 'Recommended movie discovered matching your format and genre preferences.',
          tags: ['movie', String(r.language || '').toLowerCase()],
        }));
      }
    }

    // Strictly filter out any title that was already seen in this session
    const unseenTmdb = items.filter(item => {
      const rawId = String(item.titleId || item.id).toLowerCase().replace(/^(tmdb-)?(tv-)?/, '');
      return !excludeSet.has(rawId) && !excludeSet.has(String(item.id).toLowerCase()) && !excludeSet.has(String(item.titleId).toLowerCase());
    });

    const allCandidates = [...unseenTmdb, ...localCandidates];

    if (allCandidates.length > 0) {
      const pick = allCandidates[Math.floor(Math.random() * allCandidates.length)];
      return pick;
    }

    // If all items on randomPage were seen, try page 1 for unseen items
    if (items.length > 0 && randomPage > 1) {
      const page1Data = isTv
        ? await discoverTv({ with_original_language: tmdbLang, with_genres: tmdbGenre, page: 1 })
        : await discoverMovies({ with_original_language: tmdbLang, with_genres: tmdbGenre, page: 1 });
      const p1Items = (page1Data?.results || []).map(r => ({
        id: isTv ? `tv-${r.tmdbId || r.id}` : `tmdb-${r.tmdbId || r.id}`,
        titleId: isTv ? `tv-${r.tmdbId || r.id}` : `tmdb-${r.tmdbId || r.id}`,
        title: r.title,
        type: isTv ? 'SERIES' : 'MOVIE',
        genreId: String(genreId || 'all').toLowerCase(),
        genreName: genreId !== 'all' ? (genreOptions.find(g => g.id === genreId)?.name || genreId) : (isTv ? 'TV Series' : 'Movie'),
        releaseYear: r.releaseYear || 2024,
        rating: r.voteAverage ? Math.round(r.voteAverage * 10) / 10 : 4.8,
        language: getLanguageLabel(r.language),
        posterUrl: r.posterUrl,
        backdropUrl: r.backdropUrl,
        overview: r.overview || '',
        tags: [isTv ? 'series' : 'movie'],
      }));

      const unseenP1 = p1Items.filter(item => {
        const rawId = String(item.titleId || item.id).toLowerCase().replace(/^(tmdb-)?(tv-)?/, '');
        return !excludeSet.has(rawId) && !excludeSet.has(String(item.id).toLowerCase());
      });

      if (unseenP1.length > 0) {
        return unseenP1[Math.floor(Math.random() * unseenP1.length)];
      }
    }
  } catch (err) {
    console.warn('Live TMDB discovery failed, falling back to local pool:', err);
  }

  // 3. Fallback to local pool if TMDB had no network or failed
  if (localCandidates.length > 0) {
    return localCandidates[Math.floor(Math.random() * localCandidates.length)];
  }

  const finalLocal = getRandomTitleFromAll({ appMovies, language, genreId, type, mood, excludeIds });
  if (finalLocal) return finalLocal;

  return null;
}

/**
 * Legacy wrapper
 */
export function pickMyWeekendRecommendation(params = {}) {
  return getRandomTitleFromAll(params);
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
