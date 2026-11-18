import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './AppContext';
import Navbar from './components/layout/Navbar';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { SkeletonBlock } from './components/common/SkeletonLoader';

// ─── Lazy-loaded route components ─────────────────────────────────────────────
// Each page is code-split into its own chunk, dramatically reducing initial bundle
// size and improving Time-to-Interactive (TTI) for first-time visitors.
const HomePage                    = lazy(() => import('./pages/HomePage'));
const MoviesPage                  = lazy(() => import('./pages/MoviesPage'));
const MovieDetailPage             = lazy(() => import('./pages/MovieDetailPage'));
const CityPage                    = lazy(() => import('./pages/CityPage'));
const TheaterPage                 = lazy(() => import('./pages/TheaterPage'));
const ScreenPage                  = lazy(() => import('./pages/ScreenPage'));
const ComparePage                 = lazy(() => import('./pages/ComparePage'));
const FormatsPage                 = lazy(() => import('./pages/FormatsPage'));
const AboutPage                   = lazy(() => import('./pages/AboutPage'));
const LoginPage                   = lazy(() => import('./pages/LoginPage'));
const SignupPage                  = lazy(() => import('./pages/SignupPage'));
const ProfilePage                 = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard              = lazy(() => import('./pages/AdminDashboard'));
const DiscoverPage                = lazy(() => import('./pages/DiscoverPage'));
const LibraryPage                 = lazy(() => import('./pages/LibraryPage'));
const DiaryPage                   = lazy(() => import('./pages/DiaryPage'));
const WatchlistPage               = lazy(() => import('./pages/WatchlistPage'));
const CollectionPage              = lazy(() => import('./pages/CollectionPage'));
const ProReviewerApplyPage        = lazy(() => import('./pages/ProReviewerApplyPage'));
const ProReviewerProfilePage      = lazy(() => import('./pages/ProReviewerProfilePage'));
const WeekendPickPage             = lazy(() => import('./pages/WeekendPickPage'));
const WeekendWinnersArchivePage   = lazy(() => import('./pages/WeekendWinnersArchivePage'));
const PublicReviewPage            = lazy(() => import('./pages/PublicReviewPage'));
const LeaderboardPage             = lazy(() => import('./pages/LeaderboardPage'));
const UserSearchPage              = lazy(() => import('./pages/UserSearchPage'));

// ─── Global modals (kept eager — they may render on any page) ─────────────────
import OttReleasePopupModal       from './components/movies/OttReleasePopupModal';
import AccountDeletedNoticeModal  from './components/shared/AccountDeletedNoticeModal';

// ─── Route-level loading fallback ─────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <SkeletonBlock width="100%" height="320px" borderRadius="12px" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    try {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (e) {}
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <ScrollToTop />
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1, paddingTop: 'var(--nav-height)' }}>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/"                              element={<HomePage />} />
                    <Route path="/weekend"                      element={<WeekendPickPage />} />
                    <Route path="/weekend-winners"              element={<WeekendWinnersArchivePage />} />
                    <Route path="/discover"                     element={<DiscoverPage />} />
                    <Route path="/movies"                       element={<MoviesPage />} />
                    <Route path="/movie/:movieId"               element={<MovieDetailPage />} />
                    <Route path="/library"                      element={<LibraryPage />} />
                    <Route path="/library/:section"             element={<LibraryPage />} />
                    <Route path="/diary"                        element={<DiaryPage />} />
                    <Route path="/watchlist"                    element={<WatchlistPage />} />
                    <Route path="/collection/:collectionId"     element={<CollectionPage />} />
                    <Route path="/city/:cityId"                 element={<CityPage />} />
                    <Route path="/theater/:theaterId"           element={<TheaterPage />} />
                    <Route path="/theater/:theaterId/screen/:screenId" element={<ScreenPage />} />
                    <Route path="/compare"                      element={<ComparePage />} />
                    <Route path="/formats"                      element={<FormatsPage />} />
                    <Route path="/about"                        element={<AboutPage />} />
                    <Route path="/login"                        element={<LoginPage />} />
                    <Route path="/signup"                       element={<SignupPage />} />
                    <Route path="/profile"                      element={<ProfilePage />} />
                    <Route path="/profile/:userId"              element={<ProfilePage />} />
                    <Route path="/admin"                        element={<AdminDashboard />} />
                    <Route path="/admin/*"                      element={<AdminDashboard />} />
                    <Route path="/apply-professional"           element={<ProReviewerApplyPage />} />
                    <Route path="/reviewer/:userId"             element={<ProReviewerProfilePage />} />
                    <Route path="/review/:reviewId"             element={<PublicReviewPage />} />
                    <Route path="/leaderboard"                  element={<LeaderboardPage />} />
                    <Route path="/users"                        element={<UserSearchPage />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
            <MobileBottomNav />
            <OttReleasePopupModal />
            <AccountDeletedNoticeModal />
          </div>
        </HashRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
