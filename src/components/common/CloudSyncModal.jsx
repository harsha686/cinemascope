import React, { useState } from 'react';
import { RefreshCw, Database, Check, AlertCircle, ShieldCheck, Copy, X, UploadCloud, DownloadCloud, ExternalLink } from 'lucide-react';
import { useApp } from '../../AppContext';
import { isSupabaseConfigured, setCustomSupabaseCredentials, supabaseService, getSupabaseClient } from '../../services/supabase';

export default function CloudSyncModal({ isOpen, onClose }) {
  const { state, syncCloudData, isRefreshing, syncStatus, syncMessage, lastSyncedAt } = useApp();

  const [sbUrl, setSbUrl] = useState(localStorage.getItem('cinemascope_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [sbKey, setSbKey] = useState(localStorage.getItem('cinemascope_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const client = getSupabaseClient();
      if (!client) {
        setTestResult({ success: false, message: 'Supabase credentials are not configured.' });
        setTestingConnection(false);
        return;
      }
      const { data, error } = await client.from('movies').select('id').limit(1);
      if (error) {
        setTestResult({ success: false, message: `Connected to Supabase endpoint, but table query returned: ${error.message} (Run the SQL schema if tables do not exist yet)` });
      } else {
        setTestResult({ success: true, message: 'Connected successfully to Supabase database!' });
      }
    } catch (e) {
      setTestResult({ success: false, message: `Connection test failed: ${e.message}` });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveCredentials = () => {
    setCustomSupabaseCredentials(sbUrl, sbKey);
    setActionFeedback({ type: 'success', text: 'Credentials saved! You can now test connection or sync data.' });
    setTimeout(() => handleTestConnection(), 300);
  };

  const handleClearCredentials = () => {
    setCustomSupabaseCredentials('', '');
    setSbUrl('');
    setSbKey('');
    setTestResult(null);
    setActionFeedback({ type: 'info', text: 'Custom credentials cleared. Reverted to default configuration.' });
  };

  const handleTriggerSync = async (forcePush = false) => {
    setActionFeedback(null);
    const result = await syncCloudData({ forcePush });
    if (result && result.success) {
      setActionFeedback({
        type: 'success',
        text: `Sync completed successfully! (${state.movies?.length || 0} movies, ${state.reviews?.length || 0} reviews synced).`
      });
    } else {
      setActionFeedback({
        type: 'error',
        text: result?.error?.message || 'Sync failed. Please verify Supabase URL/Key and run SQL schema.'
      });
    }
  };

  const handleCopySql = () => {
    const sqlContent = `-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.movies (id TEXT PRIMARY KEY, title TEXT NOT NULL, original_title TEXT, poster_url TEXT, poster_source TEXT DEFAULT 'TMDB', poster_source_type TEXT DEFAULT 'OFFICIAL', backdrop_url TEXT, language TEXT DEFAULT 'Telugu', runtime TEXT DEFAULT '2h 30m', release_date DATE, genres JSONB DEFAULT '[]'::jsonb, overview TEXT, cast_list JSONB DEFAULT '[]'::jsonb, director TEXT, certificate TEXT DEFAULT 'U/A', trailer_url TEXT, aspect_ratio TEXT DEFAULT '2.39:1', status TEXT DEFAULT 'CURRENTLY_SHOWING', cities JSONB DEFAULT '["visakhapatnam"]'::jsonb, theaters JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.reviews (id TEXT PRIMARY KEY, movie_id TEXT, theater_id TEXT, theater_name TEXT, screen_id TEXT, screen_name TEXT, target_type TEXT DEFAULT 'MOVIE', user_id TEXT NOT NULL, user_display_name TEXT DEFAULT 'Anonymous', rating NUMERIC(3,1) NOT NULL, parameter_ratings JSONB DEFAULT '{}'::jsonb, review_text TEXT, review_type TEXT DEFAULT 'USER', status TEXT DEFAULT 'PUBLISHED', likes_count INT DEFAULT 0, report_count INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.users (id TEXT PRIMARY KEY, email TEXT UNIQUE, display_name TEXT, role TEXT DEFAULT 'USER', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.user_movies (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, tmdb_id TEXT NOT NULL, in_watchlist BOOLEAN DEFAULT false, is_watched BOOLEAN DEFAULT false, is_favorite BOOLEAN DEFAULT false, personal_rating NUMERIC(3,1), notes TEXT, watch_count INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, tmdb_id));
CREATE TABLE IF NOT EXISTS public.diary_entries (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, tmdb_id TEXT NOT NULL, movie_title TEXT, poster_url TEXT, watched_on DATE DEFAULT CURRENT_DATE, personal_rating NUMERIC(3,1), review_text TEXT, is_rewatch BOOLEAN DEFAULT false, tags JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.collections (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, visibility TEXT DEFAULT 'public', movie_ids JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public all movies" ON public.movies;
CREATE POLICY "Public all movies" ON public.movies FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public all reviews" ON public.reviews;
CREATE POLICY "Public all reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public all users" ON public.users;
CREATE POLICY "Public all users" ON public.users FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public all user_movies" ON public.user_movies;
CREATE POLICY "Public all user_movies" ON public.user_movies FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public all diary_entries" ON public.diary_entries;
CREATE POLICY "Public all diary_entries" ON public.diary_entries FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public all collections" ON public.collections;
CREATE POLICY "Public all collections" ON public.collections FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const configured = isSupabaseConfigured();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        maxWidth: 640,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 24,
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--gold-faint)',
              border: '1px solid var(--gold-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)'
            }}>
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--text-primary)', margin: 0 }}>
                Cloud Database Synchronization
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                Real-time 2-way sync with Supabase across all devices & browsers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Connection Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: configured ? 'rgba(74,222,128,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${configured ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)'}`,
          borderRadius: 6,
          marginBottom: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: configured ? '#4ade80' : '#f87171',
              boxShadow: configured ? '0 0 10px #4ade80' : 'none'
            }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: configured ? '#4ade80' : '#f87171' }}>
                {configured ? 'Cloud Connected (Supabase)' : 'Local Storage Only (Offline)'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {lastSyncedAt ? `Last Synced: ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Never synced yet in this session'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="btn btn-outline btn-sm"
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Test Result alert */}
        {testResult && (
          <div style={{
            padding: '10px 14px',
            marginBottom: 16,
            borderRadius: 4,
            fontSize: 12,
            background: testResult.success ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${testResult.success ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: testResult.success ? '#4ade80' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {testResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Feedback Alert */}
        {actionFeedback && (
          <div style={{
            padding: '10px 14px',
            marginBottom: 16,
            borderRadius: 4,
            fontSize: 12,
            background: actionFeedback.type === 'success' ? 'rgba(220,182,91,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${actionFeedback.type === 'success' ? 'var(--gold-dim)' : 'rgba(239,68,68,0.3)'}`,
            color: actionFeedback.type === 'success' ? 'var(--gold)' : '#f87171',
          }}>
            {actionFeedback.text}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => handleTriggerSync(false)}
            disabled={isRefreshing}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
            }}
          >
            <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshing ? 'Syncing Now...' : 'Sync Cloud Data (2-Way)'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerSync(true)}
            disabled={isRefreshing}
            className="btn btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
            }}
          >
            <UploadCloud size={15} />
            <span>Push Local to Cloud</span>
          </button>
        </div>

        {/* Local Storage Stats Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 20,
          background: 'rgba(0,0,0,0.3)',
          padding: 12,
          borderRadius: 6,
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>{state.movies?.length || 0}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Movies</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>{state.reviews?.length || 0}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reviews</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>{state.theatersList?.length || 0}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Theaters</div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>{state.users?.length || 0}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Users</div>
          </div>
        </div>

        {/* Supabase Custom Credentials Form */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginTop: 12 }}>
          <h4 style={{ fontSize: 12, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: 12 }}>
            Supabase Project Settings
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                Supabase Project URL
              </label>
              <input
                className="input"
                style={{ fontSize: 12, padding: '7px 12px' }}
                placeholder="https://your-project.supabase.co"
                value={sbUrl}
                onChange={e => setSbUrl(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                Anon Public API Key
              </label>
              <input
                type="password"
                className="input"
                style={{ fontSize: 12, padding: '7px 12px' }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={sbKey}
                onChange={e => setSbKey(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleSaveCredentials}
                className="btn btn-primary btn-sm"
                style={{ fontSize: 11 }}
              >
                Save & Connect
              </button>
              <button
                type="button"
                onClick={handleClearCredentials}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11 }}
              >
                Reset Default
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopySql}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
            >
              {copiedSql ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
              <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
