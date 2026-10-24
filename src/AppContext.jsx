import React, { createContext, useContext, useReducer, useEffect, useCallback, useState, useRef } from 'react';
import theaterDB from './data/theaters.json';
import initialMovies from './data/movies.json';
import initialReviews from './data/reviews.json';
import initialUsers from './data/users.json';
import { supabaseService, isSupabaseConfigured, getSupabaseClient } from './services/supabase';
import { syncWeekendPickDataFromCloud, pushWeekendPickDataToCloud, deleteUserVotes } from './services/weekendPickService';
import { syncUserLibraryWithCloud, syncUserPublicStats, syncAllCommunityUserStats, wipeUserLibraryData } from './services/movieLibraryService';
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

export function sanitizeReviews(reviewsList) {
  if (!Array.isArray(reviewsList)) return [];
  return reviewsList.map(r => {
    if (r && r.userDisplayName && r.userDisplayName.includes('(Admin)')) {
      return {
        ...r,
        userDisplayName: r.userDisplayName.replace(/\s*\(Admin\)/gi, '').trim()
      };
    }
    return r;
  });
}

export function deduplicateUsers(usersList) {
  if (!Array.isArray(usersList)) return [];
  const seenIds = new Set();
  const seenNames = new Map();

  const result = [];
  for (const rawUser of usersList) {
    if (!rawUser || !rawUser.id) continue;
    const user = {
      ...rawUser,
      displayName: (rawUser.displayName || '').replace(/\s*\(Admin\)/gi, '').trim() || rawUser.displayName,
    };
    if (user.id === 'admin-1' || user.email === 'harshavardhanmellof41@gmail.com') {
      user.displayName = 'Harshavardhan';
    }
    const id = String(user.id).trim();
    const email = user.email && user.email !== '—' ? user.email.trim().toLowerCase() : null;
    const name = (user.displayName || '').trim().toLowerCase();

    if (seenIds.has(id)) {
      // Merge stats into existing entry if duplicate ID
      const existing = result.find(r => String(r.id).trim() === id);
      if (existing && user.stats) {
        const exWatched = existing.stats?.watchedCount || existing.stats?.totalWatched || 0;
        const uWatched = user.stats.watchedCount || user.stats.totalWatched || 0;
        const exScore = existing.stats?.cinemaScore || existing.stats?.points || 0;
        const uScore = user.stats.cinemaScore || user.stats.points || 0;
        const exVotes = existing.stats?.voteCount || existing.stats?.totalVotes || 0;
        const uVotes = user.stats.voteCount || user.stats.totalVotes || 0;
        existing.stats = {
          ...(existing.stats || {}),
          ...(user.stats || {}),
          watchedCount: Math.max(exWatched, uWatched),
          totalWatched: Math.max(exWatched, uWatched),
          voteCount: Math.max(exVotes, uVotes),
          totalVotes: Math.max(exVotes, uVotes),
          reviewCount: Math.max(existing.stats?.reviewCount || 0, user.stats?.reviewCount || 0),
          cinemaScore: Math.max(exScore, uScore),
          points: Math.max(exScore, uScore),
        };
      }
      continue;
    }

    // Check duplicate by exact DisplayName if both represent the same user
    if (name && seenNames.has(name)) {
      const existing = seenNames.get(name);
      if (existing) {
        if (!existing.avatarUrl && user.avatarUrl) existing.avatarUrl = user.avatarUrl;
        if (!existing.email && email) existing.email = email;
        const exWatched = existing.stats?.watchedCount || existing.stats?.totalWatched || 0;
        const uWatched = user.stats?.watchedCount || user.stats?.totalWatched || 0;
        const exScore = existing.stats?.cinemaScore || existing.stats?.points || 0;
        const uScore = user.stats?.cinemaScore || user.stats?.points || 0;
        const exVotes = existing.stats?.voteCount || existing.stats?.totalVotes || 0;
        const uVotes = user.stats?.voteCount || user.stats?.totalVotes || 0;
        existing.stats = {
          ...(existing.stats || {}),
          ...(user.stats || {}),
          watchedCount: Math.max(exWatched, uWatched),
          totalWatched: Math.max(exWatched, uWatched),
          voteCount: Math.max(exVotes, uVotes),
          totalVotes: Math.max(exVotes, uVotes),
          reviewCount: Math.max(existing.stats?.reviewCount || 0, user.stats?.reviewCount || 0),
          cinemaScore: Math.max(exScore, uScore),
          points: Math.max(exScore, uScore),
        };
        continue;
      }
    }

    seenIds.add(id);
    if (name) seenNames.set(name, user);
    result.push({ ...user });
  }
  return result;
}

const rawUsers = loadStorage('cinemascope_users', initialUsers);
const processedUsers = (Array.isArray(rawUsers) ? rawUsers : initialUsers).map(u => {
  if (u.role === 'ADMIN' || u.id === 'admin-1' || u.email === 'admin@cinema.com') {
    return { ...u, email: 'harshavardhanmellof41@gmail.com', displayName: 'Harshavardhan', role: 'ADMIN' };
  }
  return u;
});
if (!processedUsers.some(u => u.email === 'harshavardhanmellof41@gmail.com')) {
  processedUsers.push({
    id: 'admin-1',
    email: 'harshavardhanmellof41@gmail.com',
    displayName: 'Harshavardhan',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
  });
}
const sanitizedUsers = deduplicateUsers(processedUsers);
saveStorage('cinemascope_users', sanitizedUsers);

const loadedCurrentUser = loadStorage('cinemascope_currentUser', null);
let sanitizedCurrentUser = loadedCurrentUser;
if (loadedCurrentUser && (loadedCurrentUser.role === 'ADMIN' || loadedCurrentUser.email === 'admin@cinema.com')) {
  sanitizedCurrentUser = {
    ...loadedCurrentUser,
    email: 'harshavardhanmellof41@gmail.com',
    displayName: 'Harshavardhan',
    role: 'ADMIN'
  };
  saveStorage('cinemascope_currentUser', sanitizedCurrentUser);
}

const rawReviews = loadStorage('cinemascope_reviews', initialReviews);
const sanitizedReviews = sanitizeReviews(Array.isArray(rawReviews) ? rawReviews : initialReviews);
saveStorage('cinemascope_reviews', sanitizedReviews);

const rawMovies = loadStorage('cinemascope_movies', initialMovies);
const sanitizedMovies = (Array.isArray(rawMovies) ? rawMovies : initialMovies).map(m => {
  const initMatch = initialMovies.find(im => im.id === m.id);
  return {
    ...initMatch,
    ...m,
    ottPlatform: m.ottPlatform || initMatch?.ottPlatform || '',
    ottReleaseDate: m.ottReleaseDate || initMatch?.ottReleaseDate || '',
    ottUrl: m.ottUrl || initMatch?.ottUrl || '',
  };
});
saveStorage('cinemascope_movies', sanitizedMovies);

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
  movies: sanitizedMovies,
  reviews: sanitizedReviews,
  users: sanitizedUsers,
  reports: loadStorage('cinemascope_reports', []),
  helpfulVotes: loadStorage('cinemascope_helpful_votes', []),
  citiesList: sanitizedCities,
  theatersList: sanitizedTheaters,
  currentUser: sanitizedCurrentUser, // null or User object
  professionalApplications: loadStorage('cinemascope_pro_applications', DEFAULT_PRO_APPLICATIONS),
  notifications: loadStorage('cinemascope_notifications', []),
  deletionRequests: loadStorage('cinemascope_deletion_requests', []),
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

    case 'SET_USERS': {
      const cleanUsers = deduplicateUsers(action.payload);
      newState = { ...state, users: cleanUsers };
      saveStorage('cinemascope_users', cleanUsers);
      return newState;
    }

    case 'DELETE_USER': {
      const target = typeof action.payload === 'object' && action.payload !== null
        ? action.payload
        : { id: action.payload };
      const targetId = target.id;
      const normEmail = (target.email && target.email !== '—') ? target.email.toLowerCase().trim() : null;
      const normName = (target.displayName || '').trim().toLowerCase();

      const isMatch = (uId, uEmail, uName) => {
        if (targetId && uId && uId === targetId) return true;
        if (normEmail && uEmail && uEmail !== '—' && uEmail.toLowerCase().trim() === normEmail) return true;
        if (normName && uName && uName.trim().toLowerCase() === normName) return true;
        return false;
      };

      const remainingUsers = (state.users || []).filter(u => !isMatch(u.id, u.email, u.displayName));
      const remainingReviews = (state.reviews || []).filter(r => !isMatch(r.userId, r.userEmail, r.userDisplayName));
      const remainingRequests = (state.deletionRequests || []).filter(r => !isMatch(r.userId, r.userEmail, r.userDisplayName));

      const isCurrent = state.currentUser && isMatch(state.currentUser.id, state.currentUser.email, state.currentUser.displayName);

      newState = {
        ...state,
        users: remainingUsers,
        reviews: remainingReviews,
        deletionRequests: remainingRequests,
        currentUser: isCurrent ? null : state.currentUser,
      };

      saveStorage('cinemascope_users', remainingUsers);
      saveStorage('cinemascope_reviews', remainingReviews);
      saveStorage('cinemascope_deletion_requests', remainingRequests);
      if (isCurrent) {
        saveStorage('cinemascope_currentUser', null);
      }
      return newState;
    }

    case 'UPDATE_USER_STATS': {
      const { userId, stats } = action.payload;
      const updatedUsers = state.users.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            stats: { ...(u.stats || {}), ...stats },
          };
        }
        return u;
      });
      newState = { ...state, users: updatedUsers };
      saveStorage('cinemascope_users', updatedUsers);
      return newState;
    }

    case 'REGISTER_USER': {
      const normName = (action.payload?.displayName || '').trim().toLowerCase();
      const existingUser = state.users.find(u =>
        u.id === action.payload?.id ||
        (action.payload?.email && action.payload.email !== '—' && u.email?.toLowerCase() === action.payload.email?.toLowerCase()) ||
        (normName && (u.displayName || '').trim().toLowerCase() === normName)
      );

      const userToRegister = {
        ...(existingUser || {}),
        ...action.payload,
        role: action.payload?.email?.toLowerCase() === 'harshavardhanmellof41@gmail.com' ? 'ADMIN' : (action.payload?.role || existingUser?.role || 'USER'),
        stats: {
          ...(existingUser?.stats || {}),
          ...(action.payload?.stats || {}),
        }
      };

      const filtered = state.users.filter(u =>
        u.id !== userToRegister.id &&
        (!userToRegister.email || userToRegister.email === '—' || u.email?.toLowerCase() !== userToRegister.email?.toLowerCase()) &&
        (!normName || (u.displayName || '').trim().toLowerCase() !== normName)
      );
      const updatedUsers = deduplicateUsers([...filtered, userToRegister]);
      newState = { ...state, users: updatedUsers, currentUser: userToRegister };
      saveStorage('cinemascope_users', updatedUsers);
      saveStorage('cinemascope_currentUser', userToRegister);
      if (isSupabaseConfigured()) supabaseService.saveUser(userToRegister);
      syncUserLibraryWithCloud(userToRegister.id).catch(() => {});
      syncUserPublicStats(userToRegister.id).catch(() => {});
      return newState;
    }

    case 'LOGOUT': {
      newState = { ...state, currentUser: null };
      saveStorage('cinemascope_currentUser', null);
      try {
        const sbClient = getSupabaseClient();
        if (sbClient) sbClient.auth.signOut().catch(() => {});
      } catch (e) {
        // ignore
      }
      return newState;
    }

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
      const sanitizedPayload = sanitizeReviews(action.payload);
      newState = { ...state, reviews: sanitizedPayload };
      saveStorage('cinemascope_reviews', sanitizedPayload);
      return newState;

    case 'ADD_REVIEW':
      const newReviews = [action.payload, ...state.reviews];
      newState = { ...state, reviews: newReviews };
      saveStorage('cinemascope_reviews', newReviews);
      if (isSupabaseConfigured()) supabaseService.saveReview(action.payload);
      if (action.payload?.userId) syncUserPublicStats(action.payload.userId).catch(() => {});
      return newState;

    case 'UPDATE_REVIEW':
      const updatedRev = state.reviews.map(r => r.id === action.payload.id ? { ...r, ...action.payload, updatedAt: new Date().toISOString() } : r);
      newState = { ...state, reviews: updatedRev };
      saveStorage('cinemascope_reviews', updatedRev);
      if (isSupabaseConfigured()) {
        const targetR = updatedRev.find(r => r.id === action.payload.id);
        if (targetR) supabaseService.saveReview(targetR);
      }
      if (action.payload?.userId) syncUserPublicStats(action.payload.userId).catch(() => {});
      return newState;

    case 'DELETE_REVIEW':
      const targetToDelete = state.reviews.find(r => r.id === action.payload);
      const remainingRev = state.reviews.filter(r => r.id !== action.payload);
      newState = { ...state, reviews: remainingRev };
      saveStorage('cinemascope_reviews', remainingRev);
      if (isSupabaseConfigured()) supabaseService.deleteReview(action.payload);
      if (targetToDelete?.userId) syncUserPublicStats(targetToDelete.userId).catch(() => {});
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
      let updatedNotifs = Array.isArray(state.notifications) ? [...state.notifications] : [];

      const targetReview = state.reviews.find(r => r.id === reviewId);
      const authorId = targetReview?.userId || action.payload.reviewAuthorId;

      if (existing) {
        updatedVotes = state.helpfulVotes.filter(v => !(v.userId === userId && v.reviewId === reviewId));
        updatedRevs = state.reviews.map(r => r.id === reviewId ? { ...r, likesCount: Math.max(0, (r.likesCount || 0) - 1) } : r);
        // Remove like notification from this user on this review if unliked
        updatedNotifs = updatedNotifs.filter(n => !(n.actorId === userId && n.reviewId === reviewId));
      } else {
        updatedVotes = [...state.helpfulVotes, { userId, reviewId, createdAt: new Date().toISOString() }];
        updatedRevs = state.reviews.map(r => r.id === reviewId ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r);

        // Notify the author if someone else liked their review
        if (authorId && authorId !== userId) {
          const actorUser = state.currentUser || (state.users || []).find(u => u.id === userId);
          const actorName = action.payload.actorName || actorUser?.displayName || 'A cinema lover';
          const targetTitle = targetReview?.movieTitle || targetReview?.theaterName || action.payload.targetTitle || 'your review';
          const targetType = (targetReview?.theaterId || action.payload.targetType === 'THEATER') ? 'THEATER' : 'MOVIE';
          const targetId = targetReview?.movieId || targetReview?.theaterId || action.payload.targetId || '';
          const reviewSnippet = (targetReview?.reviewText || action.payload.reviewSnippet || '').slice(0, 80);

          const newNotif = {
            id: `notif-like-${userId}-${reviewId}-${Date.now()}`,
            recipientId: authorId,
            actorId: userId,
            actorName: actorName,
            actorAvatar: actorUser?.avatarUrl || '',
            type: 'REVIEW_LIKE',
            reviewId: reviewId,
            targetType: targetType,
            targetId: targetId,
            targetTitle: targetTitle,
            reviewSnippet: reviewSnippet,
            isRead: false,
            createdAt: new Date().toISOString(),
          };

          // Remove any prior like notification for this specific user/review pair, then prepend latest
          updatedNotifs = [newNotif, ...updatedNotifs.filter(n => !(n.actorId === userId && n.reviewId === reviewId))];
        }
      }

      newState = { ...state, helpfulVotes: updatedVotes, reviews: updatedRevs, notifications: updatedNotifs };
      saveStorage('cinemascope_helpful_votes', updatedVotes);
      saveStorage('cinemascope_reviews', updatedRevs);
      saveStorage('cinemascope_notifications', updatedNotifs);
      if (isSupabaseConfigured()) {
        supabaseService.saveNotificationsData(updatedNotifs).catch(console.warn);
      }
      return newState;
    }

    // --- NOTIFICATION ACTIONS ---
    case 'MARK_NOTIFICATION_READ': {
      const notifId = action.payload;
      const updated = (state.notifications || []).map(n => n.id === notifId ? { ...n, isRead: true } : n);
      newState = { ...state, notifications: updated };
      saveStorage('cinemascope_notifications', updated);
      if (isSupabaseConfigured()) supabaseService.saveNotificationsData(updated).catch(console.warn);
      return newState;
    }

    case 'MARK_ALL_NOTIFICATIONS_READ': {
      const recipientId = action.payload;
      const updated = (state.notifications || []).map(n =>
        (!recipientId || n.recipientId === recipientId) ? { ...n, isRead: true } : n
      );
      newState = { ...state, notifications: updated };
      saveStorage('cinemascope_notifications', updated);
      if (isSupabaseConfigured()) supabaseService.saveNotificationsData(updated).catch(console.warn);
      return newState;
    }

    case 'CLEAR_NOTIFICATIONS': {
      const recipientId = action.payload;
      const updated = recipientId ? (state.notifications || []).filter(n => n.recipientId !== recipientId) : [];
      newState = { ...state, notifications: updated };
      saveStorage('cinemascope_notifications', updated);
      if (isSupabaseConfigured()) supabaseService.saveNotificationsData(updated).catch(console.warn);
      return newState;
    }

    case 'SET_NOTIFICATIONS': {
      newState = { ...state, notifications: action.payload };
      saveStorage('cinemascope_notifications', action.payload);
      return newState;
    }

    // --- DELETION REQUEST ACTIONS ---
    case 'SET_DELETION_REQUESTS': {
      newState = { ...state, deletionRequests: action.payload };
      saveStorage('cinemascope_deletion_requests', action.payload);
      return newState;
    }

    case 'SUBMIT_DELETION_REQUEST': {
      const existing = (state.deletionRequests || []).filter(r => r.userId !== action.payload.userId);
      const updated = [action.payload, ...existing];
      newState = { ...state, deletionRequests: updated };
      saveStorage('cinemascope_deletion_requests', updated);
      if (isSupabaseConfigured()) supabaseService.saveDeletionRequestsData(updated).catch(console.warn);
      return newState;
    }

    case 'UPDATE_DELETION_REQUEST': {
      const updated = (state.deletionRequests || []).map(r =>
        (r.id === action.payload.id || r.userId === action.payload.userId) ? { ...r, ...action.payload } : r
      );
      newState = { ...state, deletionRequests: updated };
      saveStorage('cinemascope_deletion_requests', updated);
      if (isSupabaseConfigured()) supabaseService.saveDeletionRequestsData(updated).catch(console.warn);
      return newState;
    }

    case 'CANCEL_DELETION_REQUEST': {
      const targetId = action.payload?.id || action.payload?.userId || action.payload;
      const updated = (state.deletionRequests || []).filter(r => r.id !== targetId && r.userId !== targetId);
      newState = { ...state, deletionRequests: updated };
      saveStorage('cinemascope_deletion_requests', updated);
      if (isSupabaseConfigured()) supabaseService.saveDeletionRequestsData(updated).catch(console.warn);
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
      if (isSupabaseConfigured()) {
        supabaseService.saveProApplicationsData(updatedApps).catch(console.warn);
      }
      return newState;
    }

    case 'UPDATE_PRO_APPLICATION': {
      const updatedProApps = state.professionalApplications.map(a =>
        a.id === action.payload.id ? { ...a, ...action.payload } : a
      );
      newState = { ...state, professionalApplications: updatedProApps };
      saveStorage('cinemascope_pro_applications', updatedProApps);
      if (isSupabaseConfigured()) {
        supabaseService.saveProApplicationsData(updatedProApps).catch(console.warn);
      }
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
        if (currentState.professionalApplications?.length > 0) {
          await supabaseService.saveProApplicationsData(currentState.professionalApplications).catch(console.warn);
        }
        if (currentState.notifications?.length > 0) {
          await supabaseService.saveNotificationsData(currentState.notifications).catch(console.warn);
        }
        pushWeekendPickDataToCloud();
      }

      const [remoteMovies, remoteReviews, remoteUsers, remoteTheaters, remoteCities, , remoteProApps, remoteNotifs, remoteDeletionReqs] = await Promise.all([
        supabaseService.getMovies(),
        supabaseService.getReviews(),
        supabaseService.getUsers(),
        supabaseService.getTheatersData(),
        supabaseService.getCitiesData(),
        syncWeekendPickDataFromCloud({ force: forcePush }),
        supabaseService.getProApplicationsData(),
        supabaseService.getNotificationsData(),
        supabaseService.getDeletionRequestsData(),
      ]);

      let moviesCount = 0;
      let reviewsCount = 0;

      if (remoteMovies && remoteMovies.length > 0) {
        const formatted = remoteMovies.map(m => {
          const initMatch = initialMovies.find(im => im.id === m.id);
          return {
            id: m.id,
            title: m.title,
            originalTitle: m.original_title || m.title,
            posterUrl: m.poster_url || initMatch?.posterUrl,
            posterSource: m.poster_source || initMatch?.posterSource,
            posterSourceType: m.poster_source_type || initMatch?.posterSourceType,
            backdropUrl: m.backdrop_url || initMatch?.backdropUrl,
            language: m.language || initMatch?.language,
            runtime: m.runtime || initMatch?.runtime,
            releaseDate: m.release_date || initMatch?.releaseDate,
            genres: m.genres || initMatch?.genres || [],
            overview: m.overview || initMatch?.overview,
            cast: m.cast_list || initMatch?.cast || [],
            director: m.director || initMatch?.director,
            certificate: m.certificate || initMatch?.certificate,
            trailerUrl: m.trailer_url || initMatch?.trailerUrl,
            aspectRatio: m.aspect_ratio || initMatch?.aspectRatio,
            status: m.status || initMatch?.status,
            cities: m.cities || initMatch?.cities || ['visakhapatnam'],
            theaters: m.theaters || initMatch?.theaters || [],
            ottPlatform: m.ott_platform || m.ottPlatform || initMatch?.ottPlatform || '',
            ottReleaseDate: m.ott_release_date || m.ottReleaseDate || initMatch?.ottReleaseDate || '',
            ottUrl: m.ott_url || m.ottUrl || initMatch?.ottUrl || '',
            ottPlatforms: m.ott_platforms || m.ottPlatforms || initMatch?.ottPlatforms || [],
            ottWatchUrl: m.ott_watch_url || m.ottWatchUrl || initMatch?.ottWatchUrl || '',
          };
        });
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
        const currentLocalUsers = loadStorage('cinemascope_users', initialUsers);
        const mergedUsers = deduplicateUsers([
          ...remoteUsers,
          ...(Array.isArray(currentLocalUsers) ? currentLocalUsers : [])
        ]);
        dispatch({ type: 'SET_USERS', payload: mergedUsers });
        // Only push back to cloud if there are local-only users not in cloud yet
        const remoteIds = new Set(remoteUsers.map(u => String(u.id)));
        const hasNewLocalUsers = (Array.isArray(currentLocalUsers) ? currentLocalUsers : []).some(
          lu => lu?.id && !remoteIds.has(String(lu.id))
        );
        if (hasNewLocalUsers) {
          supabaseService.saveUsersData(mergedUsers).catch(console.warn);
        }
      } else if (currentState.users?.length > 0) {
        // Cloud has no users yet — seed it with current deduplicated local users
        const cleanUsers = deduplicateUsers(currentState.users);
        dispatch({ type: 'SET_USERS', payload: cleanUsers });
        supabaseService.saveUsersData(cleanUsers).catch(console.warn);
      }

      if (remoteReviews && remoteReviews.length > 0) {
        // Remote is source of truth. Keep local-only entries (not in remote) for offline support,
        // but remote always wins for any matching ID.
        const remoteMap = new Map(remoteReviews.map(r => [r.id, r]));
        const currentLocal = loadStorage('cinemascope_reviews', initialReviews);
        const localOnlyEntries = (Array.isArray(currentLocal) ? currentLocal : []).filter(
          loc => !remoteMap.has(loc.id)
        );
        const mergedList = sanitizeReviews([...remoteReviews, ...localOnlyEntries]);
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

      // Pro Reviewer Applications Synchronization across all devices
      const currentLocalProApps = currentState.professionalApplications || [];
      if (remoteProApps && Array.isArray(remoteProApps) && remoteProApps.length > 0) {
        const remoteAppMap = new Map(remoteProApps.map(a => [a.userId, a]));
        let hasLocalAppChanges = false;
        const mergedProApps = [...remoteProApps];
        currentLocalProApps.forEach(loc => {
          if (!remoteAppMap.has(loc.userId)) {
            mergedProApps.push(loc);
            hasLocalAppChanges = true;
          }
        });
        dispatch({ type: 'SET_PRO_APPLICATIONS', payload: mergedProApps });
        if (hasLocalAppChanges) {
          supabaseService.saveProApplicationsData(mergedProApps).catch(console.warn);
        }
      } else if (currentLocalProApps.length > 0) {
        supabaseService.saveProApplicationsData(currentLocalProApps).catch(console.warn);
      }

      // Notifications Synchronization across all devices
      const currentLocalNotifs = currentState.notifications || loadStorage('cinemascope_notifications', []);
      if (remoteNotifs && Array.isArray(remoteNotifs) && remoteNotifs.length > 0) {
        const remoteMap = new Map(remoteNotifs.map(n => [n.id, n]));
        let hasLocalNotifChanges = false;
        const mergedNotifs = [...remoteNotifs];
        currentLocalNotifs.forEach(loc => {
          if (!remoteMap.has(loc.id)) {
            mergedNotifs.push(loc);
            hasLocalNotifChanges = true;
          }
        });
        mergedNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        dispatch({ type: 'SET_NOTIFICATIONS', payload: mergedNotifs });
        if (hasLocalNotifChanges) {
          supabaseService.saveNotificationsData(mergedNotifs).catch(console.warn);
        }
      } else if (currentLocalNotifs.length > 0) {
        supabaseService.saveNotificationsData(currentLocalNotifs).catch(console.warn);
      }

      // Deletion Requests Synchronization
      const currentLocalDeletionReqs = currentState.deletionRequests || loadStorage('cinemascope_deletion_requests', []);
      if (remoteDeletionReqs && Array.isArray(remoteDeletionReqs) && remoteDeletionReqs.length > 0) {
        const remoteReqMap = new Map(remoteDeletionReqs.map(r => [r.id || r.userId, r]));
        let hasLocalReqChanges = false;
        const mergedReqs = [...remoteDeletionReqs];
        currentLocalDeletionReqs.forEach(loc => {
          const key = loc.id || loc.userId;
          if (!remoteReqMap.has(key)) {
            mergedReqs.push(loc);
            hasLocalReqChanges = true;
          }
        });
        dispatch({ type: 'SET_DELETION_REQUESTS', payload: mergedReqs });
        if (hasLocalReqChanges) {
          supabaseService.saveDeletionRequestsData(mergedReqs).catch(console.warn);
        }
      } else if (currentLocalDeletionReqs.length > 0) {
        supabaseService.saveDeletionRequestsData(currentLocalDeletionReqs).catch(console.warn);
      }

      // Sync personal movie library + community stats in parallel to reduce latency
      await Promise.all([
        currentState.currentUser?.id
          ? syncUserLibraryWithCloud(currentState.currentUser.id).catch(console.warn)
          : Promise.resolve(),
        currentState.currentUser?.id
          ? syncUserPublicStats(currentState.currentUser.id).catch(console.warn)
          : Promise.resolve(),
        syncAllCommunityUserStats().then(updatedUsers => {
          if (updatedUsers && updatedUsers.length > 0) {
            dispatch({ type: 'SET_USERS', payload: updatedUsers });
          }
        }).catch(console.warn),
      ]);

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

  // Run initial cloud sync once on load
  useEffect(() => {
    refreshData();

    const handleProAppsUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        dispatch({ type: 'SET_PRO_APPLICATIONS', payload: e.detail });
      }
    };
    const handleStatsUpdate = (e) => {
      if (e?.detail?.userId && e?.detail?.stats) {
        dispatch({ type: 'UPDATE_USER_STATS', payload: e.detail });
      }
    };
    window.addEventListener('cinemascope_pro_applications_updated', handleProAppsUpdate);
    window.addEventListener('cinemascope_user_stats_updated', handleStatsUpdate);

    // Cross-tab automatic sync (same browser, multiple tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'cinemascope_notifications' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            dispatch({ type: 'SET_NOTIFICATIONS', payload: parsed });
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Auto-sync when user switches back to the tab/app
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        supabaseService.getNotificationsData().then((remoteNotifs) => {
          if (remoteNotifs && Array.isArray(remoteNotifs)) {
            dispatch({ type: 'SET_NOTIFICATIONS', payload: remoteNotifs });
          }
        }).catch(() => {});
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // Background interval auto-poll every 15 seconds
    const intervalTimer = setInterval(() => {
      supabaseService.getNotificationsData().then((remoteNotifs) => {
        if (remoteNotifs && Array.isArray(remoteNotifs)) {
          dispatch({ type: 'SET_NOTIFICATIONS', payload: remoteNotifs });
        }
      }).catch(() => {});
    }, 15000);

    return () => {
      window.removeEventListener('cinemascope_pro_applications_updated', handleProAppsUpdate);
      window.removeEventListener('cinemascope_user_stats_updated', handleStatsUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      clearInterval(intervalTimer);
    };
  }, []);

  // Supabase Real-Time Channel for instant notification delivery across all devices
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('system_notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collections',
          filter: 'id=eq.system_notifications_data',
        },
        (payload) => {
          if (payload.new && payload.new.description) {
            try {
              const remoteNotifs = JSON.parse(payload.new.description);
              if (Array.isArray(remoteNotifs)) {
                dispatch({ type: 'SET_NOTIFICATIONS', payload: remoteNotifs });
              }
            } catch (err) {
              console.warn('Realtime parse notifications error:', err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Supabase Real-Time Channel for instant review visibility across all devices
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const reviewsChannel = supabase
      .channel('reviews_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        async () => {
          // A review was inserted/updated/deleted — re-fetch all reviews
          try {
            const remoteReviews = await supabaseService.getReviews();
            if (remoteReviews && remoteReviews.length > 0) {
              const currentLocal = loadStorage('cinemascope_reviews', []);
              const remoteMap = new Map(remoteReviews.map(r => [r.id, r]));
              const localOnlyEntries = (Array.isArray(currentLocal) ? currentLocal : []).filter(
                loc => !remoteMap.has(loc.id)
              );
              const merged = sanitizeReviews([...remoteReviews, ...localOnlyEntries]);
              dispatch({ type: 'SET_REVIEWS', payload: merged });
            }
          } catch (err) {
            console.warn('Realtime reviews fetch error:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reviewsChannel);
    };
  }, []);

  // Supabase Real-Time Channel for leaderboard/community stats updates
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const statsChannel = supabase
      .channel('community_stats_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collections',
          filter: 'id=eq.system_users_data',
        },
        (payload) => {
          if (payload.new && payload.new.description) {
            try {
              const updatedUsers = JSON.parse(payload.new.description);
              if (Array.isArray(updatedUsers) && updatedUsers.length > 0) {
                dispatch({ type: 'SET_USERS', payload: updatedUsers });
              }
            } catch (err) {
              console.warn('Realtime community stats parse error:', err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statsChannel);
    };
  }, []);

  // Supabase Auth listener for Google OAuth sign-in / sign-up
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const handleSbUser = (sbUser) => {
      if (!sbUser || !sbUser.email) return;

      const email = sbUser.email;
      const currentUsers = stateRef.current?.users || [];
      const existingUser = currentUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());

      const displayName =
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        existingUser?.displayName ||
        email.split('@')[0] ||
        'User';

      const avatarUrl =
        sbUser.user_metadata?.avatar_url ||
        sbUser.user_metadata?.picture ||
        existingUser?.avatarUrl ||
        null;

      const isAdminEmail = email.toLowerCase() === 'harshavardhanmellof41@gmail.com';
      const role = isAdminEmail ? 'ADMIN' : (existingUser?.role || 'USER');

      const userObj = {
        id: existingUser?.id || sbUser.id,
        email: email,
        displayName: displayName,
        role: role,
        avatarUrl: avatarUrl,
        authProvider: 'google',
        createdAt: existingUser?.createdAt || sbUser.created_at || new Date().toISOString(),
      };

      const current = stateRef.current?.currentUser;
      if (!current || current.email?.toLowerCase() !== email.toLowerCase() || current.avatarUrl !== avatarUrl) {
        dispatch({ type: 'REGISTER_USER', payload: userObj });
      }

      // Automatically sync user library, watchlist, favorites, diary, and collections with Supabase
      syncUserLibraryWithCloud(userObj.id).catch(console.warn);
    };

    // Check existing active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSbUser(session.user);
      }
    }).catch(console.warn);

    // Subscribe to live auth changes (OAuth redirects return)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          handleSbUser(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        const current = stateRef.current?.currentUser;
        if (current?.authProvider === 'google') {
          dispatch({ type: 'LOGOUT' });
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
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

  const deleteUserAccount = useCallback(async (userOrId, options = {}) => {
    const target = typeof userOrId === 'object' && userOrId !== null
      ? userOrId
      : { id: userOrId, email: options.email, displayName: options.displayName };

    const targetId = target.id;
    const targetEmail = target.email;
    const targetName = target.displayName;

    // 1. Dispatch local state wipe immediately
    dispatch({
      type: 'DELETE_USER',
      payload: { id: targetId, email: targetEmail, displayName: targetName },
    });

    // 2. Wipe local library and weekend votes
    if (targetId) {
      await wipeUserLibraryData(targetId).catch(console.warn);
      deleteUserVotes(targetId, targetEmail);
    }

    // 3. Wipe remote Supabase data (users, reviews, library, diary, collections, votes)
    if (isSupabaseConfigured()) {
      await supabaseService.deleteUserAccount(targetId, targetEmail, targetName).catch(console.warn);
    }

    // 4. If current logged-in user, sign out
    const isCurrent = stateRef.current?.currentUser && (
      (targetId && stateRef.current.currentUser.id === targetId) ||
      (targetEmail && stateRef.current.currentUser.email && stateRef.current.currentUser.email.toLowerCase() === targetEmail.toLowerCase())
    );

    if (isCurrent) {
      try {
        const sbClient = getSupabaseClient();
        if (sbClient) await sbClient.auth.signOut().catch(() => {});
      } catch (_) {}
    }

    // 5. Broadcast custom event
    try {
      window.dispatchEvent(new CustomEvent('cinemascope_user_deleted', {
        detail: { id: targetId, email: targetEmail, displayName: targetName }
      }));
    } catch (_) {}

    return true;
  }, []);

  const submitDeletionRequest = useCallback(async ({ userId, userEmail, userDisplayName, reason }) => {
    if (!userId) return false;
    const req = {
      id: `del-req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      userEmail: userEmail || '—',
      userDisplayName: userDisplayName || 'Cinema User',
      reason: (reason || '').trim(),
      status: 'PENDING',
      adminNote: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'SUBMIT_DELETION_REQUEST', payload: req });

    // Send admin notification
    const adminNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      recipientId: 'admin',
      type: 'ACCOUNT_DELETION_REQUEST',
      title: 'New Account Deletion Request',
      message: `${userDisplayName || 'User'} (${userEmail}) requested account deletion: "${(reason || '').slice(0, 80)}${(reason || '').length > 80 ? '...' : ''}"`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    dispatch({ type: 'SET_NOTIFICATIONS', payload: [adminNotif, ...(stateRef.current?.notifications || [])] });
    if (isSupabaseConfigured()) {
      supabaseService.saveNotificationsData([adminNotif, ...(stateRef.current?.notifications || [])]).catch(console.warn);
    }

    return true;
  }, []);

  const cancelDeletionRequest = useCallback(async (userId) => {
    if (!userId) return false;
    dispatch({ type: 'CANCEL_DELETION_REQUEST', payload: userId });
    return true;
  }, []);

  const rejectDeletionRequest = useCallback(async (requestId, adminNote = '') => {
    const existingReq = (stateRef.current?.deletionRequests || []).find(r => r.id === requestId);
    if (!existingReq) return false;

    const updatedReq = {
      ...existingReq,
      status: 'REJECTED',
      adminNote: (adminNote || '').trim(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'UPDATE_DELETION_REQUEST', payload: updatedReq });

    // Notify user that request was reviewed & declined
    if (existingReq.userId) {
      const userNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        recipientId: existingReq.userId,
        type: 'DELETION_REQUEST_REJECTED',
        title: 'Account Deletion Request Update',
        message: adminNote
          ? `Your account deletion request was reviewed and declined by admin: "${adminNote}"`
          : 'Your account deletion request was reviewed and declined by admin. Your account remains active.',
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      const updatedNotifs = [userNotif, ...(stateRef.current?.notifications || [])];
      dispatch({ type: 'SET_NOTIFICATIONS', payload: updatedNotifs });
      if (isSupabaseConfigured()) {
        supabaseService.saveNotificationsData(updatedNotifs).catch(console.warn);
      }
    }

    return true;
  }, []);

  const approveDeletionRequest = useCallback(async (requestId, userOrId, options = {}) => {
    // 1. Permanently delete the user account
    await deleteUserAccount(userOrId, options);

    // 2. Remove the request
    dispatch({ type: 'CANCEL_DELETION_REQUEST', payload: requestId });

    return true;
  }, [deleteUserAccount]);

  const getUserDeletionRequest = useCallback((userId) => {
    if (!userId) return null;
    return (state.deletionRequests || []).find(r => r.userId === userId) || null;
  }, [state.deletionRequests]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      currentUser: state.currentUser,
      deleteUserAccount,
      deletionRequests: state.deletionRequests || [],
      submitDeletionRequest,
      cancelDeletionRequest,
      rejectDeletionRequest,
      approveDeletionRequest,
      getUserDeletionRequest,
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
      // Notifications
      getUserNotifications: (userId) => {
        if (!userId) return [];
        return (state.notifications || []).filter(n => n.recipientId === userId);
      },
      getUnreadNotificationsCount: (userId) => {
        if (!userId) return 0;
        return (state.notifications || []).filter(n => n.recipientId === userId && !n.isRead).length;
      },
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
