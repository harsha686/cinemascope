import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Key, User, CheckCircle2 } from 'lucide-react';
import { useApp } from '../AppContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');

    if (!displayName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Check if email already exists
    const existing = state.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      setError('An account with this email already exists. Please log in.');
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: email.trim(),
      displayName: displayName.trim(),
      role: 'USER',
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'REGISTER_USER', payload: newUser });
    setSuccessMsg(true);

    setTimeout(() => {
      navigate('/movies');
    }, 1800);
  };

  return (
    <div className="page-enter" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 440, width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: 32, borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-card)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--gold)' }}>
            <UserPlus size={20} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--text-primary)' }}>Create an Account</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Join the community to rate movies and write reviews
          </p>
        </div>

        {successMsg && (
          <div style={{ padding: '14px 16px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', color: '#4ade80', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} />
            <span>Account created! Redirecting to movies...</span>
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: 12, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>
              Display Name (Public)
            </label>
            <div style={{ position: 'relative' }}>
              <User size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: 38 }}
                placeholder="e.g. Harsha V."
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              This name will be shown publicly on your reviews.
            </span>
          </div>

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
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Your email will remain private and never exposed publicly.
            </span>
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
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-serif)', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Key size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                className="input"
                style={{ paddingLeft: 38 }}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            Create Account
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 500 }}>
            Log In
          </Link>
        </div>

      </div>
    </div>
  );
}
