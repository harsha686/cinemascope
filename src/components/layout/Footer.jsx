import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ExternalLink } from 'lucide-react';
import YoutubeIcon from '../shared/YoutubeIcon';
import { useApp } from '../../AppContext';

export default function Footer() {
  const { state } = useApp();
  const currentUser = state?.currentUser;

  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      padding: '48px 0 32px',
      marginTop: 'auto',
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48, marginBottom: 48 }}
          className="footer-grid">
          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Film size={16} color="var(--gold)" />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.2em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Cinema<span style={{ color: 'var(--gold)' }}>Scope</span>
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 260 }}>
              An independent cinema-format visualization platform. Compare screens, aspect ratios, and projection systems across theaters.
            </p>
            <a
              href="https://youtube.com/@theatrebabu9796"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-serif)', letterSpacing: '0.1em' }}
            >
              <YoutubeIcon size={14} />
              Data: TheatreBabu
              <ExternalLink size={10} />
            </a>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Explore</p>
            {[
              { to: '/', label: 'Home' },
              { to: '/movies', label: 'Movies' },
              { to: '/city/visakhapatnam', label: 'Visakhapatnam' },
              { to: '/compare', label: 'Compare Screens' },
              { to: '/formats', label: 'Format Guide' },
              { to: '/about', label: 'About & Data' },
              ...(currentUser?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin Portal' }] : []),
            ].map(l => (
              <Link key={l.to} to={l.to} style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
              >{l.label}</Link>
            ))}
          </div>

          {/* Data Notice */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Data Notice</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              Theater specifications sourced from TheatreBabu YouTube reviews. Data marked as <span style={{ color: '#60a5fa' }}>Reported</span> or <span style={{ color: '#fbbf24' }}>Estimated</span> is not officially verified.
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
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', letterSpacing: '0.1em' }}>
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
