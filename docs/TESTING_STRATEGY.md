# TESTING_STRATEGY.md — Quality Assurance & Testing Architecture

## 1. Testing Philosophy & Levels

To prevent regressions while maintaining rapid development momentum, CinemaScope implements a multi-tiered testing strategy:

```mermaid
pyramid
    title Test Pyramid Strategy
    "End-to-End Tests (Playwright / User Journeys)" : 10
    "API & Integration Tests (PostgREST Contracts)" : 25
    "Unit Tests (Domain Logic, Reducers, Normalizers)" : 65
```

1. **Unit Testing (Vitest + JSDOM)**: Focuses on pure data-transformation algorithms, state reducers, sanitizers, and utility functions that operate without network access.
2. **Integration Testing**: Verifies multi-service orchestrations (e.g., verifying that like count tallies accurately combine stored votes and live notifications).
3. **Static Analysis & Linting (ESLint + TypeScript Types)**: Enforces syntax correctness, catches unhandled promises, and validates React hook dependency rules.

---

## 2. Test Execution Commands

```bash
# Run all unit test suites once
npm test

# Run tests in continuous watch mode during development
npm run test:watch

# Execute ESLint verification
npm run lint

# Execute production build verification
npm run build
```

---

## 3. Critical Test Targets

1. **`src/AppContext.jsx` Domain Helpers**:
   - `sanitizeReviews`: Verifies case-insensitive stripping of `(Admin)` labels to prevent identity spoofing.
   - `reconcileReviewLikes`: Validates accurate high-watermark calculation between persisted likes, helpful votes, and push notifications.
   - `deduplicateUsers`: Ensures user records with duplicate IDs or normalized display names merge cleanly without losing stats.
2. **`src/services/tmdbService.js` Calculations**:
   - `formatRuntime`: Validates boundary conversions (0 mins, 45 mins, 178 mins, NaN).
   - `normalizeRating5`: Tests 10-point to 5-star mathematical scaling and rounding.
   - `getTmdbImageUrl`: Validates URL generation across thumbnail (`w500`) and backdrop (`original`) sizes.
