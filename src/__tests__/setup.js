// Test setup file — runs before each test file
// @vitest-environment jsdom

// ─── Mock localStorage ────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] || null,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── Mock sessionStorage ──────────────────────────────────────────────────────
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// ─── Mock window.scrollTo ─────────────────────────────────────────────────────
window.scrollTo = () => {};

// ─── Mock import.meta.env ─────────────────────────────────────────────────────
// Vitest provides this automatically, but we can set test defaults here
if (!import.meta.env.VITE_SUPABASE_URL) {
  import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  import.meta.env.VITE_TMDB_API_KEY = 'test-tmdb-key';
  import.meta.env.VITE_ADMIN_EMAIL = 'admin@test.com';
}

// ─── Suppress console.error noise from expected test errors ──────────────────
const originalConsoleError = console.error;
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  console.error = originalConsoleError;
});
