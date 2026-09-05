import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import theaterDB from './data/theaters.json';
import initialMovies from './data/movies.json';
import initialReviews from './data/reviews.json';
import initialUsers from './data/users.json';
import { supabaseService, isSupabaseConfigured } from './services/supabase';

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
  currentUser: sanitizedCurrentUser, // null or User object
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

    case 'REGISTER_USER':
      const updatedUsers = [...state.users, action.payload];
      newState = { ...state, users: updatedUsers, currentUser: action.payload };
      saveStorage('cinemascope_users', updatedUsers);
      saveStorage('cinemascope_currentUser', action.payload);
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

    case 'ADD_CITY':
      const newCities = [...state.citiesList.filter(c => c.id !== action.payload.id), action.payload];
      newState = { ...state, citiesList: newCities };
      saveStorage('cinemascope_cities', newCities);
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

  // Sync from Supabase on load if configured
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const fetchRemoteData = async () => {
      try {
        const [remoteMovies, remoteReviews] = await Promise.all([
          supabaseService.getMovies(),
          supabaseService.getReviews(),
        ]);

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
          dispatch({ type: 'SET_MOVIES', payload: formatted });
        }

        if (remoteReviews && remoteReviews.length > 0) {
          dispatch({ type: 'SET_REVIEWS', payload: remoteReviews });
        }
      } catch (e) {
        console.warn('Supabase remote sync skipped:', e);
      }
    };

    fetchRemoteData();
  }, []);

  // Derived data helpers for Movies & Reviews
  const getMovie = useCallback((movieId) => {
    return state.movies.find(m => m.id === movieId) || null;
  }, [state.movies]);

  const isMovieMatch = useCallback((r, movieId) => {
    if (!r || !movieId) return false;
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
    return theaterDB.theaters.filter(t => t.cityId === cityId);
  }, []);

  const getTheater = useCallback((theaterId) => {
    return theaterDB.theaters.find(t => t.id === theaterId) || null;
  }, []);

  const getScreen = useCallback((theaterId, screenId) => {
    const theater = theaterDB.theaters.find(t => t.id === theaterId);
    if (!theater) return null;
    return theater.screens.find(s => s.id === screenId) || null;
  }, []);

  const getCity = useCallback((cityId) => {
    return state.citiesList.find(c => c.id === cityId) || theaterDB.cities.find(c => c.id === cityId) || null;
  }, [state.citiesList]);

  const allCities = state.citiesList;
  const allTheaters = theaterDB.theaters;

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
      getCityMovies,
      allCities,
      allTheaters,
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
