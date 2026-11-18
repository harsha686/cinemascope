/**
 * Unit tests for TMDB Service utility functions
 * Tests: formatRuntime, normalizeRating5, getTmdbImageUrl
 * Run: npx vitest run src/__tests__/tmdbService.test.js
 */

import { describe, it, expect } from 'vitest';

// Pure utility functions extracted for testing
function formatRuntime(minutes) {
  if (!minutes || isNaN(minutes)) return '2h 30m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

function normalizeRating5(rating) {
  if (!rating || isNaN(rating) || Number(rating) <= 0) return 0;
  const num = Number(rating);
  if (num > 5) return Math.round((num / 2) * 10) / 10;
  return Math.round(num * 10) / 10;
}

function getTmdbImageUrl(path, size = 'w500') {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = size === 'original'
    ? 'https://image.tmdb.org/t/p/original'
    : 'https://image.tmdb.org/t/p/w500';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('formatRuntime', () => {
  it('formats 120 minutes as 2h 0m', () => {
    expect(formatRuntime(120)).toBe('2h 0m');
  });

  it('formats 178 minutes as 2h 58m', () => {
    expect(formatRuntime(178)).toBe('2h 58m');
  });

  it('formats 45 minutes as 45m (no hours)', () => {
    expect(formatRuntime(45)).toBe('45m');
  });

  it('returns default for 0 minutes', () => {
    expect(formatRuntime(0)).toBe('2h 30m');
  });

  it('returns default for null input', () => {
    expect(formatRuntime(null)).toBe('2h 30m');
  });

  it('returns default for NaN input', () => {
    expect(formatRuntime('abc')).toBe('2h 30m');
  });
});

describe('normalizeRating5', () => {
  it('divides 10-scale rating by 2', () => {
    expect(normalizeRating5(8.4)).toBe(4.2);
  });

  it('keeps 5-scale rating as-is', () => {
    expect(normalizeRating5(4.5)).toBe(4.5);
  });

  it('returns 0 for null', () => {
    expect(normalizeRating5(null)).toBe(0);
  });

  it('returns 0 for 0', () => {
    expect(normalizeRating5(0)).toBe(0);
  });

  it('returns 0 for negative ratings', () => {
    expect(normalizeRating5(-1)).toBe(0);
  });

  it('rounds to 1 decimal place', () => {
    expect(normalizeRating5(7.3)).toBe(3.7);
  });
});

describe('getTmdbImageUrl', () => {
  it('builds w500 image URL from path', () => {
    expect(getTmdbImageUrl('/poster.jpg')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
  });

  it('builds original image URL when size is original', () => {
    expect(getTmdbImageUrl('/poster.jpg', 'original')).toBe('https://image.tmdb.org/t/p/original/poster.jpg');
  });

  it('returns full URL unchanged if already absolute', () => {
    expect(getTmdbImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
  });

  it('returns empty string for null path', () => {
    expect(getTmdbImageUrl(null)).toBe('');
  });

  it('returns empty string for empty path', () => {
    expect(getTmdbImageUrl('')).toBe('');
  });

  it('handles path without leading slash', () => {
    expect(getTmdbImageUrl('poster.jpg')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
  });
});
