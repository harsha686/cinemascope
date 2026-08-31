import React from 'react';
import { ExternalLink, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import YoutubeIcon from '../components/shared/YoutubeIcon';

export default function AboutPage() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <div style={{ padding: '60px 24px 40px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)' }}>About</span>
            <div style={{ height: 1, width: 30, background: 'var(--gold-dim)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 4vw, 40px)', color: 'var(--text-primary)', letterSpacing: '0.05em', marginBottom: 12 }}>
            About CinemaScope
          </h1>
          <p style={{ fontFamily: 'var(--font-italic)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.9 }}>
            An independent cinema-format visualization platform. We help moviegoers understand how the same film will appear on different cinema screens, formats, and projection systems.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '48px 24px', maxWidth: 780 }}>
        {/* Data sources */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 20 }}>
            Data Sources
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
            {[
              {
                icon: YoutubeIcon,
                title: 'TheatreBabu YouTube Channel',
                url: 'https://youtube.com/@theatrebabu9796',
                desc: 'Primary source for Visakhapatnam theater reviews. The channel covers technical specifications including projectors, sound systems, screen quality, and seating. Data labeled as "Reported".',
                confidence: 'reported',
              },
              {
                icon: Database,
                title: 'OpenStreetMap / Nominatim',
                url: 'https://openstreetmap.org',
                desc: 'Used for geographic theater discovery and location data. Free and open-source mapping platform.',
                confidence: 'verified',
              },
              {
                icon: Database,
                title: 'Demo & Estimated Data',
                desc: 'Some theaters have specifications estimated from publicly available information or constructed for demonstration. These are labeled as "Estimated".',
                confidence: 'estimated',
              },
            ].map((s, i) => {
              const Icon = s.icon;
              const badgeClass = { reported: 'badge-reported', verified: 'badge-verified', estimated: 'badge-estimated' }[s.confidence];
              return (
                <div key={i} style={{ background: 'var(--bg-card)', padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <Icon size={20} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>{s.title}</span>
                      <span className={`badge ${badgeClass}`}>{s.confidence}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--gold)', textDecoration: 'none', marginTop: 6, fontFamily: 'var(--font-serif)', letterSpacing: '0.08em' }}>
                        Visit Source <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data confidence legend */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 20 }}>
            Data Confidence Levels
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { badge: 'badge-verified', label: 'Verified', desc: 'Data confirmed from official theater sources, manufacturer specifications, or direct verification.' },
              { badge: 'badge-reported', label: 'Reported', desc: 'Data reported by reviewers, content creators (such as TheatreBabu), or credible third-party sources. May not be officially confirmed.' },
              { badge: 'badge-estimated', label: 'Estimated', desc: 'Data estimated based on typical specifications for similar theater types, chains, or configurations. Use as a guide only.' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', border: '1px solid var(--border-subtle)' }}>
                <span className={`badge ${c.badge}`} style={{ flexShrink: 0, marginTop: 2 }}>{c.label}</span>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Legal / disclaimer */}
        <div style={{ marginBottom: 48, padding: '20px 24px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <AlertCircle size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Important Disclaimer</h2>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 8 }}>
            CinemaScope is an <strong>independent, unofficial platform</strong>. We are not affiliated with PVR INOX, Cinepolis, AMB Cinemas, or any other cinema chain or manufacturer.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 8 }}>
            Theater specifications listed on this website are sourced from publicly available information, YouTube reviews, and community-reported data. They have <strong>not been officially verified</strong> by the theaters themselves unless explicitly stated.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            The video simulation uses <strong>Big Buck Bunny</strong>, a Creative Commons–licensed public domain short film. We do not distribute or use any copyrighted movie footage.
          </p>
        </div>

        {/* Tech stack */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
            Built With Open-Source Tools
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['React', 'Vite', 'React Router', 'Leaflet.js', 'OpenStreetMap', 'Lucide Icons', 'Inter Font', 'Cinzel Font', 'Big Buck Bunny (CC)'].map(t => (
              <span key={t} className="badge badge-dim">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
