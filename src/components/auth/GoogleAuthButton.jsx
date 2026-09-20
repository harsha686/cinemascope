import React, { useState } from 'react';
import { HelpCircle, Copy, Check, ChevronDown, ChevronUp, AlertCircle, ExternalLink } from 'lucide-react';
import { signInWithGoogle } from '../../services/supabase';

const SUPABASE_PROJECT_URL = 'https://ioudwvkvtxlzmcqnrqlq.supabase.co';
const SUPABASE_CALLBACK_URL = `${SUPABASE_PROJECT_URL}/auth/v1/callback`;

export default function GoogleAuthButton({
  mode = 'signin', // 'signin' | 'signup'
  redirectTo,
  onError,
}) {
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const buttonText = mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';

  const handleGoogleClick = async () => {
    if (onError) onError('');
    setLoading(true);

    try {
      const redirectTarget = redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/movies` : undefined);
      const { error } = await signInWithGoogle(redirectTarget);

      if (error) {
        console.warn('Google OAuth error:', error);
        const errMsg = error.message || 'Unable to connect to Google authentication.';
        if (onError) onError(errMsg);

        // If provider not enabled or invalid client id, open helpful setup guide
        if (
          errMsg.toLowerCase().includes('provider') ||
          errMsg.toLowerCase().includes('not enabled') ||
          errMsg.toLowerCase().includes('unsupported')
        ) {
          setShowGuide(true);
        }
        setLoading(false);
      }
      // Note: On success, Supabase initiates browser redirect to accounts.google.com
    } catch (err) {
      console.error('Google OAuth unexpected error:', err);
      const msg = err?.message || 'Unexpected error initiating Google Sign-In.';
      if (onError) onError(msg);
      setLoading(false);
    }
  };

  const handleCopyCallbackUrl = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(SUPABASE_CALLBACK_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Google Button */}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading}
        className="btn"
        aria-label={buttonText}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '11px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-neutral)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.75 : 1,
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
            e.currentTarget.style.borderColor = 'var(--gold-dim)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'var(--border-neutral)';
          }
        }}
      >
        {loading ? (
          <div
            style={{
              width: 18,
              height: 18,
              border: '2px solid rgba(255,255,255,0.2)',
              borderTopColor: 'var(--gold)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.58H1.25a11.96 11.96 0 0 0 0 10.84l4.03-3.1z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
            />
          </svg>
        )}
        <span>{loading ? 'Connecting to Google...' : buttonText}</span>
      </button>

      {/* Setup Instructions / Helper Banner */}
      <div style={{ marginTop: 8 }}>
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            margin: '0 auto',
            padding: '2px 6px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <HelpCircle size={12} />
          <span>Need help with Google Sign-in setup?</span>
          {showGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showGuide && (
          <div
            style={{
              marginTop: 10,
              padding: 14,
              background: 'rgba(218, 165, 32, 0.05)',
              border: '1px solid rgba(218, 165, 32, 0.25)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={13} />
              <span>What is needed to activate Google Sign-In:</span>
            </div>
            <ol style={{ paddingLeft: 18, margin: '6px 0 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>
                <strong>Google Cloud Console:</strong> Create an <em>OAuth 2.0 Client ID</em> (Web application).
              </li>
              <li>
                <strong>Authorized Redirect URI:</strong> Copy & paste this exact callback URL into your Google Cloud OAuth credentials:
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '5px 8px',
                    borderRadius: 4,
                    marginTop: 4,
                    fontFamily: 'monospace',
                    fontSize: 10,
                    wordBreak: 'break-all',
                    color: 'var(--gold-bright, #ffd700)',
                  }}
                >
                  <span>{SUPABASE_CALLBACK_URL}</span>
                  <button
                    type="button"
                    onClick={handleCopyCallbackUrl}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copied ? '#4ade80' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      flexShrink: 0,
                    }}
                    title="Copy URL"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span style={{ fontSize: 10 }}>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </li>
              <li>
                <strong>Supabase Dashboard:</strong> Go to <code>Authentication &gt; Providers &gt; Google</code>, turn it ON, and paste your <em>Client ID</em> and <em>Client Secret</em>.
              </li>
            </ol>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
              >
                Google Cloud Console <ExternalLink size={10} />
              </a>
              <a
                href="https://supabase.com/dashboard/project/ioudwvkvtxlzmcqnrqlq/auth/providers"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
              >
                Supabase Auth Providers <ExternalLink size={10} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
