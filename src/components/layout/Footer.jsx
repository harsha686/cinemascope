import React from 'react';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';
import { useApp } from '../../AppContext';

export default function Footer() {
  const { state, allCities } = useApp();
  const currentUser = state?.currentUser;
  const activeCity = state?.selectedCity || allCities?.[0];

  const linkStyle = {
    fontSize: 12,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'color var(--transition-fast)',
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/discover', label: 'Discover' },
    { to: '/weekend', label: 'Weekend Pick' },
    { to: '/movies', label: 'Now Showing' },
    { to: `/city/${activeCity?.id || 'visakhapatnam'}`, label: `Theaters — ${activeCity?.name || 'Vizag'}` },
    { to: '/compare', label: 'Compare Screens' },
    { to: '/formats', label: 'Format Guide' },
    { to: '/about', label: 'About & Data' },
    ...(currentUser?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin Portal' }] : []),
  ];

  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      padding: '48px 0 32px',
      marginTop: 'auto',
    }}>
      <div className="container">
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48, marginBottom: 48 }}
          className="footer-grid"
        >
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Film size={16} color="var(--gold)" />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.2em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Cinema<span style={{ color: 'var(--gold)' }}>Scope</span>
              </span>
            </Link>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 260 }}>
              An independent cinema-format visualization platform. Compare screens, aspect ratios, and projection systems across theaters.
            </p>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Explore</p>
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                style={linkStyle}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Data Notice */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Data Notice</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              Theater specifications are compiled from public and community sources. Data marked as <span style={{ color: '#60a5fa' }}>Reported</span> or <span style={{ color: '#fbbf24' }}>Estimated</span> is not officially verified.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <span className="badge badge-reported">Reported</span>
              <span className="badge badge-estimated">Estimated</span>
              <span className="badge badge-verified">Verified</span>
            </div>
          </div>
        </div>

        <hr className="divider" />
        <div style={{ paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            © 2026 CinemaScope · Independent Platform · Not affiliated with any cinema chain
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Built with ♥ for cinema enthusiasts
          </p>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </footer>
  );
}
