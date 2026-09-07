import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Globe, Check, AlertCircle, ExternalLink, MessageSquare, Copy } from 'lucide-react';
import { generateOpenGraphMetadata, normalizeShareableContent, SOCIAL_CONTENT_TYPES } from '../services/socialSharingService';
import { useApp } from '../AppContext';

export default function SocialPreviewTestPage() {
  const { state } = useApp();
  const navigate = useNavigate();

  const [testType, setTestType] = useState(SOCIAL_CONTENT_TYPES.REVIEW);
  const [testTitle, setTestTitle] = useState('Interstellar');
  const [testRating, setTestRating] = useState(5);
  const [testQuote, setTestQuote] = useState('An awe-inspiring masterpiece of space and love.');
  const [testAuthor, setTestAuthor] = useState('Harsha');
  const [testPosterUrl, setTestPosterUrl] = useState('https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg');
  const [testBackdropUrl, setTestBackdropUrl] = useState('https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg');

  const normalized = normalizeShareableContent({
    type: testType,
    data: {
      title: testTitle,
      rating: testRating,
      reviewText: testQuote,
      userDisplayName: testAuthor,
      posterUrl: testPosterUrl,
      backdropUrl: testBackdropUrl,
    },
    user: state.currentUser,
  });

  const ogMeta = generateOpenGraphMetadata(normalized);

  return (
    <div className="page-enter" style={{ minHeight: '85vh', padding: '40px 24px 80px' }}>
      <div className="container" style={{ maxWidth: 960 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="badge badge-gold" style={{ fontSize: 10 }}>🛠️ DEVELOPER & ADMIN TOOLS</span>
            <span className="badge badge-dim" style={{ fontSize: 10 }}>Open Graph Inspector</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--text-primary)', margin: 0 }}>
            Social Sharing & OG Preview Debugger
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0' }}>
            Simulate how links and dynamic previews appear when shared on WhatsApp, X (Twitter), Discord, and Telegram.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 28, alignItems: 'start' }}>
          {/* Controls Column */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            padding: 20,
          }}>
            <h3 style={{ fontSize: 14, fontFamily: 'var(--font-serif)', color: 'var(--gold)', margin: '0 0 16px' }}>
              Test Content Settings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Content Type
                </label>
                <select
                  className="input"
                  value={testType}
                  onChange={e => setTestType(e.target.value)}
                  style={{ width: '100%', fontSize: 12 }}
                >
                  <option value={SOCIAL_CONTENT_TYPES.REVIEW}>User Review</option>
                  <option value={SOCIAL_CONTENT_TYPES.MOVIE}>Movie Page</option>
                  <option value={SOCIAL_CONTENT_TYPES.WEEKEND_WINNER}>Weekend Winner</option>
                  <option value={SOCIAL_CONTENT_TYPES.COLLECTION}>Collection / List</option>
                  <option value={SOCIAL_CONTENT_TYPES.USER_STATS}>User Stats</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Title
                </label>
                <input
                  className="input"
                  style={{ width: '100%', fontSize: 12 }}
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Author / Reviewer Name
                </label>
                <input
                  className="input"
                  style={{ width: '100%', fontSize: 12 }}
                  value={testAuthor}
                  onChange={e => setTestAuthor(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="input"
                  style={{ width: '100%', fontSize: 12 }}
                  value={testRating}
                  onChange={e => setTestRating(Number(e.target.value))}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Quote / Description
                </label>
                <textarea
                  className="input"
                  rows={3}
                  style={{ width: '100%', fontSize: 12, resize: 'none' }}
                  value={testQuote}
                  onChange={e => setTestQuote(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Social Platforms Previews */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 1. X (Twitter) Large Image Summary Card */}
            <div style={{
              background: '#000',
              border: '1px solid #2f3336',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #2f3336', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#71767b' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span style={{ fontWeight: 600, color: '#e7e9ea' }}>X (Twitter) Large Card Preview</span>
              </div>

              <div style={{ width: '100%', aspectRatio: '16/9', background: '#16181c', overflow: 'hidden' }}>
                <img
                  src={ogMeta.image}
                  alt="OG"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.src = '/demo-frame.jpg'; }}
                />
              </div>

              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 12, color: '#71767b', marginBottom: 2 }}>
                  cinemascope.app
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e7e9ea', marginBottom: 4 }}>
                  {ogMeta.title}
                </div>
                <div style={{ fontSize: 13, color: '#71767b', lineHeight: 1.4 }}>
                  {ogMeta.description}
                </div>
              </div>
            </div>

            {/* 2. WhatsApp / iMessage Rich Card Preview */}
            <div style={{
              background: '#111b21',
              border: '1px solid #222e35',
              borderRadius: 8,
              padding: 12,
              maxWidth: 420,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#8696a0', marginBottom: 8 }}>
                <MessageSquare size={13} color="#25d366" />
                <span>WhatsApp Link Card</span>
              </div>

              <div style={{
                background: '#202c33',
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid #2a3942',
              }}>
                <div style={{ width: '100%', height: 160, background: '#0b141a', overflow: 'hidden' }}>
                  <img
                    src={ogMeta.image}
                    alt="OG"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.src = '/demo-frame.jpg'; }}
                  />
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e9edef', marginBottom: 3 }}>
                    {ogMeta.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#8696a0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ogMeta.description}
                  </div>
                  <div style={{ fontSize: 10, color: '#00a884', marginTop: 4 }}>
                    cinemascope.app
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Generated Meta Tags Code Inspector */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>
                Generated HTML &lt;head&gt; Tags:
              </div>
              <pre style={{
                margin: 0,
                padding: 12,
                background: '#09090c',
                borderRadius: 4,
                fontSize: 11,
                color: '#38bdf8',
                overflowX: 'auto',
                lineHeight: 1.6,
              }}>
{`<meta property="og:title" content="${ogMeta.title}" />
<meta property="og:description" content="${ogMeta.description}" />
<meta property="og:image" content="${ogMeta.image}" />
<meta property="og:url" content="${ogMeta.url}" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="canonical" href="${ogMeta.url}" />`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
