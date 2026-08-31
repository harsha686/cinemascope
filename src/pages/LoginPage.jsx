import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, Key, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const from = location.state?.from || '/';

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    // Match against user DB
    const foundUser = state.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!foundUser) {
      setError('No account found with this email. Please sign up first.');
      return;
    }

    dispatch({ type: 'SET_CURRENT_USER', payload: foundUser });
    navigate(from);
  };

  const handleQuickAdminLogin = () => {
    const adminUser = state.users.find(u => u.role === 'ADMIN') || {
      id: 'admin-1',
      email: 'admin@cinema.com',
      displayName: 'Cinema Admin',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'SET_CURRENT_USER', payload: adminUser });
    navigate('/admin');
  };

  const handleQuickUserLogin = () => {
    const demoUser = state.users.find(u => u.email === 'harsha@cinema.com') || state.users[0];
    dispatch({ type: 'SET_CURRENT_USER', payload: demoUser });
    navigate(from);
  };

  return (
    <div className="page-enter" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 32, borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-card)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--gold)' }}>
            <LogIn size={20} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text-primary)' }}>Welcome Back</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Log in to submit reviews, vote, and manage your activity
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 12, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="input"
                style={{ paddingLeft: 38 }}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                className="input"
                style={{ paddingLeft: 38 }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            Log In
          </button>
        </form>

        {/* Quick Demo Logins for Instant Evaluation */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-serif)', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.1em' }}>
            Quick Demo Shortcuts
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleQuickUserLogin} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
              Demo User (Harsha V.)
            </button>
            <button type="button" onClick={handleQuickAdminLogin} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
              <ShieldAlert size={12} /> Admin Login
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--gold)', fontWeight: 500 }}>
            Sign Up
          </Link>
        </div>

      </div>
    </div>
  );
}
