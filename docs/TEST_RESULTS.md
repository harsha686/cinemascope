# TEST_RESULTS.md — Automated Verification & Test Run Logs

## 1. Test Execution Summary

- **Test Runner**: Vitest `v1.6.1`
- **Environment**: jsdom `v31.0.1`
- **Execution Date**: 2026-11-18
- **Total Test Suites**: 2
- **Passed Test Suites**: 2 (100%)
- **Total Tests**: 34
- **Passed Tests**: 34 (100%)
- **Failed Tests**: 0
- **Duration**: 2.17 seconds

---

## 2. Test Suite Breakdown

### 2.1 Suite: `src/__tests__/tmdbService.test.js` (18 Tests — PASSED)
- `formatRuntime`
  - ✓ formats 120 minutes as 2h 0m
  - ✓ formats 178 minutes as 2h 58m
  - ✓ formats 45 minutes as 45m (no hours)
  - ✓ returns default for 0 minutes
  - ✓ returns default for null input
  - ✓ returns default for NaN input
- `normalizeRating5`
  - ✓ divides 10-scale rating by 2 (8.4 -> 4.2)
  - ✓ keeps 5-scale rating as-is (4.5 -> 4.5)
  - ✓ returns 0 for null
  - ✓ returns 0 for 0
  - ✓ returns 0 for negative ratings
  - ✓ rounds to 1 decimal place (7.3 -> 3.7)
- `getTmdbImageUrl`
  - ✓ builds w500 image URL from path
  - ✓ builds original image URL when size is original
  - ✓ returns full URL unchanged if already absolute
  - ✓ returns empty string for null path
  - ✓ returns empty string for empty path
  - ✓ handles path without leading slash

### 2.2 Suite: `src/__tests__/AppContext.test.js` (16 Tests — PASSED)
- `sanitizeReviews`
  - ✓ removes (Admin) suffix from userDisplayName
  - ✓ handles empty array
  - ✓ handles non-array input gracefully
  - ✓ handles reviews without userDisplayName
  - ✓ handles case-insensitive (admin) removal
- `reconcileReviewLikes`
  - ✓ updates likesCount from helpfulVotes when votes > current count
  - ✓ does not decrease likesCount below the stored value
  - ✓ handles empty votes array
  - ✓ handles reviews without likesCount
  - ✓ returns empty array for non-array input
- `deduplicateUsers`
  - ✓ removes duplicate users by ID
  - ✓ removes duplicate users by displayName
  - ✓ keeps unique users
  - ✓ filters out users without id
  - ✓ handles empty array
  - ✓ handles non-array input

---

## 3. Production Build Verification

- **Command**: `npm run build` (`vite build`)
- **Status**: **SUCCESS (0 errors)**
- **Transform**: 1,973 modules transformed
- **Output Bundles Generated**:
  - `dist/index.html` (1.97 kB)
  - `dist/assets/index-DHHUJIIt.css` (18.96 kB)
  - `dist/assets/vendor-react-6Np7t1oQ.js` (178.91 kB)
  - `dist/assets/vendor-supabase-BZZf6AWP.js` (211.52 kB)
  - `dist/assets/vendor-icons-BbTd3GMd.js` (40.70 kB)
  - `dist/assets/vendor-image-CNNBFdHy.js` (13.40 kB)
  - `dist/assets/AdminDashboard-DbUlnsL0.js` (180.48 kB — lazy-loaded)
  - `dist/assets/MovieDetailPage-Dgkwqg39.js` (70.75 kB — lazy-loaded)
  - 22 additional lazy-loaded route chunks
