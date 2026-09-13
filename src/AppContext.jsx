import React, { createContext, useContext, useReducer, useEffect, useCallback, useState, useRef } from 'react';
import theaterDB from './data/theaters.json';
import initialMovies from './data/movies.json';
import initialReviews from './data/reviews.json';
import initialUsers from './data/users.json';
import { supabaseService, isSupabaseConfigured } from './services/supabase';
import { syncWeekendPickDataFromCloud, pushWeekendPickDataToCloud } from './services/weekendPickService';
import { syncUserLibraryWithCloud } from './services/movieLibraryService';
import { DEFAULT_PRO_APPLICATIONS, getUserApplication as getProAppFromService } from './services/proReviewerService';

const AppContext = createContext(null);

// LocalStorage helpers
const loadStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage`, e);
    return fallback;
  }
};

const saveStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
};

const loadedCities = loadStorage('cinemascope_cities', theaterDB.cities);
const sanitizedCities = (Array.isArray(loadedCities) ? loadedCities : theaterDB.cities).filter(
  c => c.id !== 'bangalore' && c.name?.toLowerCase() !== 'bangalore'
);
// Ensure cleaned list is updated in storage
saveStorage('cinemascope_cities', sanitizedCities);

const loadedTheaters = loadStorage('cinemascope_theaters', theaterDB.theaters);
const sanitizedTheaters = Array.isArray(loadedTheaters) && loadedTheaters.length > 0 ? loadedTheaters : theaterDB.theaters;
saveStorage('cinemascope_theaters', sanitizedTheaters);

const rawUsers = loadStorage('cinemascope_users', initialUsers);
const sanitizedUsers = (Array.isArray(rawUsers) ? rawUsers : initialUsers).map(u => {
  if (u.role === 'ADMIN' || u.id === 'admin-1' || u.email === 'admin@cinema.com') {
    return { ...u, email: 'harshavardhanmellof41@gmail.com', displayName: 'Harshavardhan (Admin)', role: 'ADMIN' };
  }
  return u;
});
if (!sanitizedUsers.some(u => u.email === 'harshavardhanmellof41@gmail.com')) {
  sanitizedUsers.push({
    id: 'admin-1',
    email: 'harshavardhanmellof41@gmail.com',
    displayName: 'Harshavardhan (Admin)',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
  });
}
saveStorage('cinemascope_users', sanitizedUsers);

const loadedCurrentUser = loadStorage('cinemascope_currentUser', null);
let sanitizedCurrentUser = loadedCurrentUser;
if (loadedCurrentUser && (loadedCurrentUser.role === 'ADMIN' || loadedCurrentUser.email === 'admin@cinema.com')) {
  sanitizedCurrentUser = {
    ...loadedCurrentUser,
    email: 'harshavardhanmellof41@gmail.com',
    displayName: 'Harshavardhan (Admin)',
    role: 'ADMIN'
  };
  saveStorage('cinemascope_currentUser', sanitizedCurrentUser);
}

const initialState = {
  selectedCity: null,
  selectedTheater: null,
  selectedScreen: null,
  selectedFormat: null,
  comparisonA: null,
  comparisonB: null,
  simulationMode: 'fit',
  locationPermission: 'unknown',
  searchQuery: '',
  theaterFilters: ['all'],
  isExperienceMode: false,
  userLocation: null,
  // Persistent data state
  movies: loadStorage('cinemascope_movies', initialMovies),
  reviews: loadStorage('cinemascope_reviews', initialReviews),
  users: sanitizedUsers,
  reports: loadStorage('cinemascope_reports', []),
  helpfulVotes: loadStorage('cinemascope_helpful_votes', []),
  citiesList: sanitizedCities,
  theatersList: sanitizedTheaters,
  currentUser: sanitizedCurrentUser, // null or User object
  professionalApplications: loadStorage('cinemascope_pro_applications', DEFAULT_PRO_APPLICATIONS),
};

function reducer(state, action) {
  let newState;
  switch (action.type) {
    case 'SET_CITY':
      return { ...state, selectedCity: action.payload, selectedTheater: null, selectedScreen: null };
    case 'SET_THEATER':
      return { ...state, selectedTheater: action.payload, selectedScreen: null };
    case 'SET_SCREEN':
      return { ...state, selectedScreen: action.payload };
    case 'SET_FORMAT':
      return { ...state, selectedFormat: action.payload };
    case 'SET_SIMULATION_MODE':
      return { ...state, simulationMode: action.payload };
    case 'SET_COMPARISON_A':
      return { ...state, comparisonA: action.payload };
    case 'SET_COMPARISON_B':
      return { ...state, comparisonB: action.payload };
    case 'SET_LOCATION_PERMISSION':
      return { ...state, locationPermission: action.payload };
    case 'SET_USER_LOCATION':
      return { ...state, userLocation: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILTERS':
      return { ...state, theaterFilters: action.payload };
    case 'TOGGLE_EXPERIENCE':
      return { ...state, isExperienceMode: !state.isExperienceMode };
    case 'CLEAR_COMPARISON':
      return { ...state, comparisonA: null, comparisonB: null };

    // --- AUTH ACTIONS ---
    case 'SET_CURRENT_USER':
      newState = { ...state, currentUser: action.payload };
      saveStorage('cinemascope_currentUser', action.payload);
      return newState;

    case 'SET_USERS':
      newState = { ...state, users: action.payload };
      saveStorage('cinemascope_users', action.payload);
      return newState;

    case 'REGISTER_USER':
      const updatedUsers = [
        ...state.users.filter(u => u.id !== action.payload.id && u.email?.toLowerCase() !== action.payload.email?.toLowerCase()),
        action.payload
      ];
      newState = { ...state, users: updatedUsers, currentUser: action.payload };
      saveStorage('cinemascope_users', updatedUsers);
      saveStorage('cinemascope_currentUser', action.payload);
      if (isSupabaseConfigured()) supabaseService.saveUser(action.payload);
      return newState;

    case 'LOGOUT':
      newState = { ...state, currentUser: null };
      saveStorage('cinemascope_currentUser', null);
      return newState;

    // --- MOVIE ACTIONS (ADMIN) ---
    case 'SET_MOVIES':
      newState = { ...state, movies: action.payload };
      saveStorage('cinemascope_movies', action.payload);
      return newState;

    case 'ADD_MOVIE':
      const newMovies = [action.payload, ...state.movies];
      newState = { ...state, movies: newMovies };
      saveStorage('cinemascope_movies', newMovies);
      if (isSupabaseConfigured()) supabaseService.saveMovie(action.payload);
      return newState;

    case 'UPDATE_MOVIE':
      const modifiedMovies = state.movies.map(m => m.id === action.payload.id ? { ...m, ...action.payload } : m);
      newState = { ...state, movies: modifiedMovies };
      saveStorage('cinemascope_movies', modifiedMovies);
      if (isSupabaseConfigured()) {
        const updatedM = modifiedMovies.find(m => m.id === action.payload.id);
        if (updatedM) supabaseService.saveMovie(updatedM);
      }
      return newState;

    case 'DELETE_MOVIE':
      const remainingMovies = state.movies.filter(m => m.id !== action.payload);
      newState = { ...state, movies: remainingMovies };
      saveStorage('cinemascope_movies', remainingMovies);
      if (isSupabaseConfigured()) supabaseService.deleteMovie(action.payload);
      return newState;

    // --- REVIEW ACTIONS ---
    case 'SET_REVIEWS':
      newState = { ...state, reviews: action.payload };
      saveStorage('cinemascope_reviews', action.payload);
      return newState;

    case 'ADD_REVIEW':
      const newReviews = [action.payload, ...state.reviews];
      newState = { ...state, reviews: newReviews };
      saveStorage('cinemascope_reviews', newReviews);
      if (isSupabaseConfigured()) supabaseService.saveReview(action.payload);
      return newState;

    case 'UPDATE_REVIEW':
      const updatedRev = state.reviews.map(r => r.id === action.payload.id ? { ...r, ...action.payload, updatedAt: new Date().toISOString() } : r);
      newState = { ...state, reviews: updatedRev };
      saveStorage('cinemascope_reviews', updatedRev);
      if (isSupabaseConfigured()) {
        const targetR = updatedRev.find(r => r.id === action.payload.id);
        if (targetR) supabaseService.saveReview(targetR);
      }
      return newState;

    case 'DELETE_REVIEW':
      const remainingRev = state.reviews.filter(r => r.id !== action.payload);
      newState = { ...state, reviews: remainingRev };
      saveStorage('cinemascope_reviews', remainingRev);
      if (isSupabaseConfigured()) supabaseService.deleteReview(action.payload);
      return newState;

    case 'MODERATE_REVIEW':
      const modRev = state.reviews.map(r => r.id === action.payload.id ? { ...r, status: action.payload.status } : r);
      newState = { ...state, reviews: modRev };
      saveStorage('cinemascope_reviews', modRev);
      return newState;

    case 'REPORT_REVIEW':
      const newReports = [...state.reports, action.payload];
      // Increment report count on review
      const revWithReport = state.reviews.map(r => r.id === action.payload.reviewId ? { ...r, reportCount: (r.reportCount || 0) + 1 } : r);
      newState = { ...state, reports: newReports, reviews: revWithReport };
      saveStorage('cinemascope_reports', newReports);
      saveStorage('cinemascope_reviews', revWithReport);
      return newState;

    case 'TOGGLE_HELPFUL_VOTE': {
      const { userId, reviewId } = action.payload;
      const existing = state.helpfulVotes.find(v => v.userId === userId && v.reviewId === reviewId);
      let updatedVotes, updatedRevs;
      if (existing) {
        updatedVotes = state.helpfulVotes.filter(v => !(v.userId === userId && v.reviewId === reviewId));
        updatedRevs = state.reviews.map(r => r.id === reviewId ? { ...r, likesCount: Math.max(0, (r.likesCount || 0) - 1) } : r);
      } else {
        updatedVotes = [...state.helpfulVotes, { userId, reviewId, createdAt: new Date().toISOString() }];
        updatedRevs = state.reviews.map(r => r.id === reviewId ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r);
      }
      newState = { ...state, helpfulVotes: updatedVotes, reviews: updatedRevs };
      saveStorage('cinemascope_helpful_votes', updatedVotes);
      saveStorage('cinemascope_reviews', updatedRevs);
      return newState;
    }

    case 'SET_CITIES':
      newState = { ...state, citiesList: action.payload };
      saveStorage('cinemascope_cities', action.payload);
      return newState;

    case 'ADD_CITY':
      const newCities = [...state.citiesList.filter(c => c.id !== action.payload.id), action.payload];
      newState = { ...state, citiesList: newCities };
      saveStorage('cinemascope_cities', newCities);
      if (isSupabaseConfigured()) supabaseService.saveCitiesData(newCities).catch(console.warn);
      return newState;

    case 'DELETE_CITY': {
      const cityId = action.payload;
      const filteredCities = state.citiesList.filter(
        c => c.id !== cityId && c.name?.toLowerCase() !== cityId.toLowerCase()
      );
      newState = { ...state, citiesList: filteredCities };
      if (state.selectedCity === cityId) {
        newState.selectedCity = 'visakhapatnam';
      }
      saveStorage('cinemascope_cities', filteredCities);
      if (isSupabaseConfigured()) supabaseService.saveCitiesData(filteredCities).catch(console.warn);
      return newState;
    }

    // --- THEATER ACTIONS (ADMIN) ---
    case 'SET_THEATERS': {
      newState = { ...state, theatersList: action.payload };
      if (state.selectedTheater) {
        const matching = action.payload.find(t => t.id === state.selectedTheater.id);
        if (matching) newState.selectedTheater = matching;
      }
      saveStorage('cinemascope_theaters', action.payload);
      return newState;
    }

    case 'ADD_THEATER': {
      const newTheaters = [action.payload, ...state.theatersList.filter(t => t.id !== action.payload.id)];
      newState = { ...state, theatersList: newTheaters };
      saveStorage('cinemascope_theaters', newTheaters);
      if (isSupabaseConfigured()) supabaseService.saveTheatersData(newTheaters).catch(console.warn);
      return newState;
    }

    case 'UPDATE_THEATER': {
      const exists = state.theatersList.some(t => t.id === action.payload.id);
      const updatedTheaters = exists
        ? state.theatersList.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t)
        : [action.payload, ...state.theatersList];
      newState = { ...state, theatersList: updatedTheaters };
      if (state.selectedTheater && state.selectedTheater.id === action.payload.id) {
        newState.selectedTheater = { ...state.selectedTheater, ...action.payload };
      }
      saveStorage('cinemascope_theaters', updatedTheaters);
      if (isSupabaseConfigured()) supabaseService.saveTheatersData(updatedTheaters).catch(console.warn);
      return newState;
    }

    case 'DELETE_THEATER': {
      const remainingTheaters = state.theatersList.filter(t => t.id !== action.payload);
      newState = { ...state, theatersList: remainingTheaters };
      if (state.selectedTheater && state.selectedTheater.id === action.payload) {
        newState.selectedTheater = null;
        newState.selectedScreen = null;
      }
      saveStorage('cinemascope_theaters', remainingTheaters);
      if (isSupabaseConfigured()) supabaseService.saveTheatersData(remainingTheaters).catch(console.warn);
      return newState;
    }

    // --- PRO REVIEWER APPLICATION ACTIONS ---
    case 'SET_PRO_APPLICATIONS':
      newState = { ...state, professionalApplications: action.payload };
      saveStorage('cinemascope_pro_applications', action.payload);
      return newState;

    case 'SUBMIT_PRO_APPLICATION': {
      const existingIdx = state.professionalApplications.findIndex(a => a.userId === action.payload.userId);
      let updatedApps;
      if (existingIdx >= 0) {
        updatedApps = state.professionalApplications.map((a, i) => i === existingIdx ? action.payload : a);
      } else {
        updatedApps = [action.payload, ...state.professionalApplications];
      }
      newState = { ...state, professionalApplications: updatedApps };
      saveStorage('cinemascope_pro_applications', updatedApps);
      return newState;
    }

    case 'UPDATE_PRO_APPLICATION': {
      const updatedProApps = state.professionalApplications.map(a =>
        a.id === action.payload.id ? { ...a, ...action.payload } : a
      );
      newState = { ...state, professionalApplications: updatedProApps };
      saveStorage('cinemascope_pro_applications', updatedProApps);
      return newState;
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Sync state to localStorage whenever modified
  useEffect(() => {
    saveStorage('cinemascope_movies', state.movies);
  }, [state.movies]);

  useEffect(() => {
    saveStorage('cinemascope_reviews', state.reviews);
  }, [state.reviews]);

  useEffect(() => {
    saveStorage('cinemascope_users', state.users);
  }, [state.users]);

  useEffect(() => {
    saveStorage('cinemascope_theaters', state.theatersList);
  }, [state.theatersList]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState(() => loadStorage('cinemascope_last_synced_at', null));

  // Keep a stable ref to current state to prevent dependency churn and re-render loops
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync from Supabase on load or when manually requested
  const syncCloudData = useCallback(async ({ forcePush = false, quiet = false } = {}) => {
    if (!isSupabaseConfigured()) {
      return { success: false, reason: 'unconfigured' };
    }

    setIsRefreshing(true);
    if (!quiet) setSyncStatus('syncing');

    const currentState = stateRef.current;

    try {
      // If forcePush requested, push current local movies and reviews first
      if (forcePush) {
        for (const m of (currentState.movies || [])) {
          await supabaseService.saveMovie(m).catch(console.warn);
        }
        for (const r of (currentState.reviews || [])) {
          if (r.status === 'PUBLISHED') {
            await supabaseService.saveReview(r).catch(console.warn);
          }
        }
        if (currentState.theatersList?.length > 0) {
          await supabaseService.saveTheatersData(currentState.theatersList).catch(console.warn);
        }
        if (currentState.citiesList?.length > 0) {
          await supabaseService.saveCitiesData(currentState.citiesList).catch(console.warn);
        }
        pushWeekendPickDataToCloud();
      }

      const [remoteMovies, remoteReviews, remoteUsers, remoteTheaters, remoteCities] = await Promise.all([
        supabaseService.getMovies(),
        supabaseService.getReviews(),
        supabaseService.getUsers(),
        supabaseService.getTheatersData(),
        supabaseService.getCitiesData(),
        syncWeekendPickDataFromCloud({ force: forcePush }),
      ]);

      let moviesCount = 0;
      let reviewsCount = 0;

      if (remoteMovies && remoteMovies.length > 0) {
        const formatted = remoteMovies.map(m => ({
          id: m.id,
          title: m.title,
          originalTitle: m.original_title || m.title,
          posterUrl: m.poster_url,
          posterSource: m.poster_source,
          posterSourceType: m.poster_source_type,
          backdropUrl: m.backdrop_url,
          language: m.language,
          runtime: m.runtime,
          releaseDate: m.release_date,
          genres: m.genres || [],
          overview: m.overview,
          cast: m.cast_list || [],
          director: m.director,
          certificate: m.certificate,
          trailerUrl: m.trailer_url,
          aspectRatio: m.aspect_ratio,
          status: m.status,
          cities: m.cities || ['visakhapatnam'],
          theaters: m.theaters || [],
        }));
        moviesCount = formatted.length;
        dispatch({ type: 'SET_MOVIES', payload: formatted });
      } else if (currentState.movies && currentState.movies.length > 0) {
        // Supabase has no movies; auto-seed remote database with local movies!
        for (const m of currentState.movies) {
          supabaseService.saveMovie(m).catch(console.warn);
        }
      }

      if (remoteUsers && remoteUsers.length > 0) {
        // Remote wins for matching users; keep local-only users for offline accounts
        const remoteUserMap = new Map(remoteUsers.map(u => [u.email ? u.email.toLowerCase() : u.id, u]));
        const currentLocalUsers = loadStorage('cinemascope_users', initialUsers);
        const localOnlyUsers = (Array.isArray(currentLocalUsers) ? currentLocalUsers : []).filter(u => {
          const key = u.email ? u.email.toLowerCase() : u.id;
          return !remoteUserMap.has(key);
        });
        const mergedUsers = [...remoteUsers, ...localOnlyUsers];
        dispatch({ type: 'SET_USERS', payload: mergedUsers });
      }

      if (remoteReviews && remoteReviews.length > 0) {
        // Remote is source of truth. Keep local-only entries (not in remote) for offline support,
        // but remote always wins for any matching ID.
        const remoteMap = new Map(remoteReviews.map(r => [r.id, r]));
        const currentLocal = loadStorage('cinemascope_reviews', initialReviews);
        const localOnlyEntries = (Array.isArray(currentLocal) ? currentLocal : []).filter(
          loc => !remoteMap.has(loc.id)
        );
        const mergedList = [...remoteReviews, ...localOnlyEntries];
        reviewsCount = mergedList.length;
        dispatch({ type: 'SET_REVIEWS', payload: mergedList });
      }

      // Theaters Synchronization across all devices (Desktop, Mobile, Tablet)
      const currentLocalTheaters = currentState.theatersList || [];
      if (remoteTheaters && Array.isArray(remoteTheaters) && remoteTheaters.length > 0) {
        const remoteMap = new Map(remoteTheaters.map(t => [t.id, t]));
        let hasLocalChanges = false;

        // Use local theater if it has more screens or details, otherwise remote
        const mergedTheaters = remoteTheaters.map(rem => {
          const loc = currentLocalTheaters.find(t => t.id === rem.id);
          if (loc && (loc.screens?.length || 0) > (rem.screens?.length || 0)) {
            hasLocalChanges = true;
            return loc;
          }
          return rem;
        });

        // Add any theaters created on local that aren't yet in remote
        currentLocalTheaters.forEach(loc => {
          if (!remoteMap.has(loc.id)) {
            mergedTheaters.push(loc);
            hasLocalChanges = true;
          }
        });

        dispatch({ type: 'SET_THEATERS', payload: mergedTheaters });
        if (hasLocalChanges) {
          supabaseService.saveTheatersData(mergedTheaters).catch(console.warn);
        }
      } else if (currentLocalTheaters.length > 0) {
        // Remote has no theaters yet: auto-seed Supabase with local theaters (all 12 from desktop)
        dispatch({ type: 'SET_THEATERS', payload: currentLocalTheaters });
        supabaseService.saveTheatersData(currentLocalTheaters).catch(console.warn);
      }

      // Cities Synchronization
      const currentLocalCities = currentState.citiesList || [];
      if (remoteCities && Array.isArray(remoteCities) && remoteCities.length > 0) {
        const remoteCityMap = new Map(remoteCities.map(c => [c.id, c]));
        let hasCityChanges = false;
        const mergedCities = [...remoteCities];
        currentLocalCities.forEach(loc => {
          if (!remoteCityMap.has(loc.id)) {
            mergedCities.push(loc);
            hasCityChanges = true;
          }
        });
        dispatch({ type: 'SET_CITIES', payload: mergedCities });
        if (hasCityChanges) {
          supabaseService.saveCitiesData(mergedCities).catch(console.warn);
        }
      } else if (currentLocalCities.length > 0) {
        supabaseService.saveCitiesData(currentLocalCities).catch(console.warn);
      }

      // Sync personal movie library if a user is logged in
      if (currentState.currentUser && currentState.currentUser.id) {
        await syncUserLibraryWithCloud(currentState.currentUser.id).catch(console.warn);
      }

      const now = new Date().toISOString();
      setLastSyncedAt(now);
      saveStorage('cinemascope_last_synced_at', now);
      setSyncStatus('success');
      setSyncMessage('Cloud synchronized successfully.');
      return { success: true, timestamp: now, moviesCount, reviewsCount, theatersCount: (currentState.theatersList?.length || 0), citiesCount: (currentState.citiesList?.length || 0) };
    } catch (e) {
      console.warn('Supabase remote sync skipped or failed:', e);
      setSyncStatus('error');
      setSyncMessage(e?.message || 'Sync failed.');
      return { success: false, error: e };
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    return syncCloudData({ quiet: true });
  }, [syncCloudData]);

  // Run initial cloud sync once on app load
  useEffect(() => {
    refreshData();
  }, []);

  // Derived data helpers for Movies & Reviews
  const getMovie = useCallback((movieId) => {
    return state.movies.find(m => m.id === movieId) || null;
  }, [state.movies]);

  const isMovieMatch = useCallback((r, movieId) => {
    if (!r || !movieId) return false;
    if (r.theaterId && !r.movieId) return false;
    if (r.movieId === movieId) return true;
    const targetRaw = String(movieId).replace('tmdb-', '');
    const rMovieRaw = r.movieId ? String(r.movieId).replace('tmdb-', '') : null;
    const rTmdbRaw = r.tmdbId ? String(r.tmdbId) : null;
    return (rMovieRaw && rMovieRaw === targetRaw) || (rTmdbRaw && rTmdbRaw === targetRaw);
  }, []);

  const getMovieReviews = useCallback((movieId) => {
    return state.reviews.filter(r => isMovieMatch(r, movieId) && r.status === 'PUBLISHED');
  }, [state.reviews, isMovieMatch]);

  const getMovieRating = useCallback((movieId) => {
    const published = state.reviews.filter(r => isMovieMatch(r, movieId) && r.status === 'PUBLISHED');
    if (published.length === 0) return { average: 0, count: 0 };
    const sum = published.reduce((acc, r) => {
      // Support both new parameterRatings format and old flat rating
      const score = r.rating || 0;
      return acc + score;
    }, 0);
    const avg = Math.round((sum / published.length) * 10) / 10;
    return { average: avg, count: published.length };
  }, [state.reviews, isMovieMatch]);

  const getRatingDistribution = useCallback((movieId) => {
    const published = state.reviews.filter(r => isMovieMatch(r, movieId) && r.status === 'PUBLISHED');
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const total = published.length;
    if (total === 0) return { counts, percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, total: 0 };

    published.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
    });

    const percentages = {
      5: Math.round((counts[5] / total) * 100),
      4: Math.round((counts[4] / total) * 100),
      3: Math.round((counts[3] / total) * 100),
      2: Math.round((counts[2] / total) * 100),
      1: Math.round((counts[1] / total) * 100),
    };

    return { counts, percentages, total };
  }, [state.reviews, isMovieMatch]);

  const getUserReviewForMovie = useCallback((userId, movieId) => {
    if (!userId || !movieId) return null;
    return state.reviews.find(r => r.userId === userId && isMovieMatch(r, movieId) && r.status !== 'REMOVED') || null;
  }, [state.reviews, isMovieMatch]);

  const getCityMovies = useCallback((cityId, statusFilter = 'CURRENTLY_SHOWING') => {
    return state.movies.filter(m => {
      const matchCity = !cityId || (m.cities && m.cities.includes(cityId));
      const matchStatus = !statusFilter || m.status === statusFilter;
      return matchCity && matchStatus;
    });
  }, [state.movies]);

  // Derived data helpers for Theaters
  const getCityTheaters = useCallback((cityId) => {
    return state.theatersList.filter(t => t.cityId === cityId);
  }, [state.theatersList]);

  const getTheater = useCallback((theaterId) => {
    return state.theatersList.find(t => t.id === theaterId) || null;
  }, [state.theatersList]);

  const getScreen = useCallback((theaterId, screenId) => {
    const theater = state.theatersList.find(t => t.id === theaterId);
    if (!theater) return null;
    return (theater.screens || []).find(s => s.id === screenId) || null;
  }, [state.theatersList]);

  const getCity = useCallback((cityId) => {
    return state.citiesList.find(c => c.id === cityId) || theaterDB.cities.find(c => c.id === cityId) || null;
  }, [state.citiesList]);

  const allCities = state.citiesList;
  const allTheaters = state.theatersList;

  // Pro reviewer helpers
  const getUserApplication = useCallback((userId) => {
    const fromState = state.professionalApplications.find(a => a.userId === userId);
    if (fromState) return fromState;
    return getProAppFromService(userId);
  }, [state.professionalApplications]);

  const isVerifiedPro = useCallback((userId) => {
    const app = getUserApplication(userId);
    return !!(app && app.status === 'APPROVED');
  }, [getUserApplication]);

  // Separate review lists by type
  const isProfessionalReview = useCallback((r) => {
    if (!r) return false;
    if (r.theaterId) return false; // Theaters never have critic/professional reviews
    if (r.reviewType === 'PROFESSIONAL') return true;
    if (r.reviewType === 'USER') return false;
    // Fallback: If reviewType is not explicitly tagged, check if the author is a verified pro
    return isVerifiedPro(r.userId);
  }, [isVerifiedPro]);

  const getMovieUserReviews = useCallback((movieId) => {
    return state.reviews.filter(r =>
      isMovieMatch(r, movieId) &&
      r.status === 'PUBLISHED' &&
      !isProfessionalReview(r)
    );
  }, [state.reviews, isMovieMatch, isProfessionalReview]);

  const getMovieProfessionalReviews = useCallback((movieId) => {
    return state.reviews.filter(r =>
      isMovieMatch(r, movieId) &&
      r.status === 'PUBLISHED' &&
      isProfessionalReview(r)
    );
  }, [state.reviews, isMovieMatch, isProfessionalReview]);

  const getProfessionalRating = useCallback((movieId) => {
    const proRevs = state.reviews.filter(r =>
      isMovieMatch(r, movieId) &&
      r.status === 'PUBLISHED' &&
      isProfessionalReview(r)
    );
    if (proRevs.length === 0) return { average: 0, count: 0 };
    const sum = proRevs.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { average: Math.round((sum / proRevs.length) * 10) / 10, count: proRevs.length };
  }, [state.reviews, isMovieMatch, isProfessionalReview]);

  const getTheaterReviews = useCallback((theaterId) => {
    return state.reviews.filter(r => r.theaterId === theaterId && r.status === 'PUBLISHED');
  }, [state.reviews]);

  const getTheaterUserReviews = useCallback((theaterId) => {
    return state.reviews.filter(r => r.theaterId === theaterId && r.status === 'PUBLISHED');
  }, [state.reviews]);

  const getTheaterProfessionalReviews = useCallback(() => {
    return [];
  }, []);

  const getTheaterRating = useCallback((theaterId) => {
    const published = state.reviews.filter(r => r.theaterId === theaterId && r.status === 'PUBLISHED');
    if (published.length === 0) return { average: 0, count: 0 };
    const sum = published.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = Math.round((sum / published.length) * 10) / 10;
    return { average: avg, count: published.length };
  }, [state.reviews]);

  const getTheaterProfessionalRating = useCallback(() => {
    return { average: 0, count: 0 };
  }, []);

  const getTheaterRatingDistribution = useCallback((theaterId) => {
    const published = state.reviews.filter(r => r.theaterId === theaterId && r.status === 'PUBLISHED');
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const total = published.length;
    if (total === 0) return { counts, percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, total: 0 };

    published.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
    });

    const percentages = {
      5: Math.round((counts[5] / total) * 100),
      4: Math.round((counts[4] / total) * 100),
      3: Math.round((counts[3] / total) * 100),
      2: Math.round((counts[2] / total) * 100),
      1: Math.round((counts[1] / total) * 100),
    };

    return { counts, percentages, total };
  }, [state.reviews]);

  const getUserReviewForTheater = useCallback((userId, theaterId) => {
    if (!userId || !theaterId) return null;
    return state.reviews.find(r => r.userId === userId && r.theaterId === theaterId && r.status !== 'REMOVED') || null;
  }, [state.reviews]);

  const getScreenReviews = useCallback((theaterId, screenId) => {
    return state.reviews.filter(r => r.theaterId === theaterId && r.screenId === screenId && r.status === 'PUBLISHED');
  }, [state.reviews]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      currentUser: state.currentUser,
      getCityTheaters,
      getTheater,
      getScreen,
      getCity,
      getMovie,
      getMovieReviews,
      getMovieRating,
      getRatingDistribution,
      getUserReviewForMovie,
      // Theater reviews
      getTheaterReviews,
      getTheaterUserReviews,
      getTheaterProfessionalReviews,
      getTheaterRating,
      getTheaterProfessionalRating,
      getTheaterRatingDistribution,
      getUserReviewForTheater,
      getScreenReviews,
      getCityMovies,
      allCities,
      allTheaters,
      // Pro reviewer
      getUserApplication,
      isVerifiedPro,
      getMovieUserReviews,
      getMovieProfessionalReviews,
      getProfessionalRating,
      // Global Sync / Refresh
      refreshData,
      syncCloudData,
      isRefreshing,
      syncStatus,
      syncMessage,
      lastSyncedAt,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
