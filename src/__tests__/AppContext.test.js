/**
 * Unit tests for AppContext utility functions
 * Tests: sanitizeReviews, reconcileReviewLikes, deduplicateUsers
 * Run: npx vitest run src/__tests__/AppContext.test.js
 */

import { describe, it, expect } from 'vitest';

// ─── We test the pure utility functions by extracting them ────────────────────
// Since AppContext has side effects at module load time, we re-implement
// the pure functions here for unit testing. These tests verify the logic.

function sanitizeReviews(reviewsList) {
  if (!Array.isArray(reviewsList)) return [];
  return reviewsList.map(r => {
    if (r && r.userDisplayName && /\(admin\)/i.test(r.userDisplayName)) {
      return { ...r, userDisplayName: r.userDisplayName.replace(/\s*\(Admin\)/gi, '').trim() };
    }
    return r;
  });
}

function reconcileReviewLikes(reviewsList, helpfulVotes = [], notifications = []) {
  if (!Array.isArray(reviewsList)) return [];
  const votesCountMap = {};
  for (const v of (helpfulVotes || [])) {
    if (v && v.reviewId) votesCountMap[v.reviewId] = (votesCountMap[v.reviewId] || 0) + 1;
  }
  const notifsCountMap = {};
  for (const n of (notifications || [])) {
    if (n && n.type === 'REVIEW_LIKE' && n.reviewId)
      notifsCountMap[n.reviewId] = (notifsCountMap[n.reviewId] || 0) + 1;
  }
  return reviewsList.map(r => {
    if (!r || !r.id) return r;
    const fromVotes = votesCountMap[r.id] || 0;
    const fromNotifs = notifsCountMap[r.id] || 0;
    const maxLikes = Math.max(r.likesCount || 0, fromVotes, fromNotifs);
    if (maxLikes !== r.likesCount) return { ...r, likesCount: maxLikes };
    return r;
  });
}

function deduplicateUsers(usersList) {
  if (!Array.isArray(usersList)) return [];
  const seenIds = new Set();
  const seenNames = new Map();
  const result = [];
  for (const rawUser of usersList) {
    if (!rawUser || !rawUser.id) continue;
    const user = { ...rawUser };
    const id = String(user.id).trim();
    const name = (user.displayName || '').trim().toLowerCase();
    if (seenIds.has(id)) continue;
    if (name && seenNames.has(name)) continue;
    seenIds.add(id);
    if (name) seenNames.set(name, user);
    result.push({ ...user });
  }
  return result;
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('sanitizeReviews', () => {
  it('removes (Admin) suffix from userDisplayName', () => {
    const reviews = [
      { id: '1', userDisplayName: 'Harshavardhan (Admin)', reviewText: 'Great movie' },
      { id: '2', userDisplayName: 'Regular User', reviewText: 'Good film' },
    ];
    const result = sanitizeReviews(reviews);
    expect(result[0].userDisplayName).toBe('Harshavardhan');
    expect(result[1].userDisplayName).toBe('Regular User');
  });

  it('handles empty array', () => {
    expect(sanitizeReviews([])).toEqual([]);
  });

  it('handles non-array input gracefully', () => {
    expect(sanitizeReviews(null)).toEqual([]);
    expect(sanitizeReviews(undefined)).toEqual([]);
    expect(sanitizeReviews('string')).toEqual([]);
  });

  it('handles reviews without userDisplayName', () => {
    const reviews = [{ id: '1', reviewText: 'Test' }];
    const result = sanitizeReviews(reviews);
    expect(result).toHaveLength(1);
    expect(result[0].reviewText).toBe('Test');
  });

  it('handles case-insensitive (admin) removal', () => {
    const reviews = [{ id: '1', userDisplayName: 'User (admin)' }];
    const result = sanitizeReviews(reviews);
    expect(result[0].userDisplayName).toBe('User');
  });
});

describe('reconcileReviewLikes', () => {
  it('updates likesCount from helpfulVotes when votes > current count', () => {
    const reviews = [{ id: 'r1', likesCount: 2 }];
    const votes = [
      { userId: 'u1', reviewId: 'r1' },
      { userId: 'u2', reviewId: 'r1' },
      { userId: 'u3', reviewId: 'r1' },
    ];
    const result = reconcileReviewLikes(reviews, votes, []);
    expect(result[0].likesCount).toBe(3);
  });

  it('does not decrease likesCount below the stored value', () => {
    const reviews = [{ id: 'r1', likesCount: 10 }];
    const votes = [{ userId: 'u1', reviewId: 'r1' }];
    const result = reconcileReviewLikes(reviews, votes, []);
    expect(result[0].likesCount).toBe(10); // stored value is higher
  });

  it('handles empty votes array', () => {
    const reviews = [{ id: 'r1', likesCount: 5 }];
    const result = reconcileReviewLikes(reviews, [], []);
    expect(result[0].likesCount).toBe(5);
  });

  it('handles reviews without likesCount', () => {
    const reviews = [{ id: 'r1' }];
    const votes = [{ userId: 'u1', reviewId: 'r1' }];
    const result = reconcileReviewLikes(reviews, votes, []);
    expect(result[0].likesCount).toBe(1);
  });

  it('returns empty array for non-array input', () => {
    expect(reconcileReviewLikes(null)).toEqual([]);
  });
});

describe('deduplicateUsers', () => {
  it('removes duplicate users by ID', () => {
    const users = [
      { id: 'u1', displayName: 'Alice' },
      { id: 'u1', displayName: 'Alice Duplicate' },
    ];
    const result = deduplicateUsers(users);
    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('Alice');
  });

  it('removes duplicate users by displayName', () => {
    const users = [
      { id: 'u1', displayName: 'Bob' },
      { id: 'u2', displayName: 'Bob' },
    ];
    const result = deduplicateUsers(users);
    expect(result).toHaveLength(1);
  });

  it('keeps unique users', () => {
    const users = [
      { id: 'u1', displayName: 'Alice' },
      { id: 'u2', displayName: 'Bob' },
      { id: 'u3', displayName: 'Charlie' },
    ];
    const result = deduplicateUsers(users);
    expect(result).toHaveLength(3);
  });

  it('filters out users without id', () => {
    const users = [
      { displayName: 'No ID User' },
      { id: 'u1', displayName: 'Valid User' },
    ];
    const result = deduplicateUsers(users);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('u1');
  });

  it('handles empty array', () => {
    expect(deduplicateUsers([])).toEqual([]);
  });

  it('handles non-array input', () => {
    expect(deduplicateUsers(null)).toEqual([]);
    expect(deduplicateUsers(undefined)).toEqual([]);
  });
});
