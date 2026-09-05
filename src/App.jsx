import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './AppContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import CityPage from './pages/CityPage';
import TheaterPage from './pages/TheaterPage';
import ScreenPage from './pages/ScreenPage';
import ComparePage from './pages/ComparePage';
import FormatsPage from './pages/FormatsPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import DiscoverPage from './pages/DiscoverPage';
import LibraryPage from './pages/LibraryPage';
import DiaryPage from './pages/DiaryPage';
import WatchlistPage from './pages/WatchlistPage';
import CollectionPage from './pages/CollectionPage';
import ProReviewerApplyPage from './pages/ProReviewerApplyPage';
import ProReviewerProfilePage from './pages/ProReviewerProfilePage';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1, paddingTop: 'var(--nav-height)' }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/movies" element={<MoviesPage />} />
              <Route path="/movie/:movieId" element={<MovieDetailPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/library/:section" element={<LibraryPage />} />
              <Route path="/diary" element={<DiaryPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/collection/:collectionId" element={<CollectionPage />} />
              <Route path="/city/:cityId" element={<CityPage />} />
              <Route path="/theater/:theaterId" element={<TheaterPage />} />
              <Route path="/theater/:theaterId/screen/:screenId" element={<ScreenPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/formats" element={<FormatsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/apply-professional" element={<ProReviewerApplyPage />} />
              <Route path="/reviewer/:userId" element={<ProReviewerProfilePage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </AppProvider>
  );
}
