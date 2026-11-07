import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Home } from 'lucide-react';

export default function AccountDeletedNoticeModal() {
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleNotice = (e) => {
      const msg = e?.detail?.message || 'Your account and personal data have been permanently deleted as requested. You have been signed out.';
      setNotice(msg);
    };

    window.addEventListener('cinemascope_account_deleted_notice', handleNotice);
    return () => {
      window.removeEventListener('cinemascope_account_deleted_notice', handleNotice);
    };
  }, []);

  if (!notice) return null;

  const handleClose = () => {
    setNotice(null);
    navigate('/', { replace: true });
    window.location.hash = '#/';
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(239, 68, 68, 0.45)',
        borderRadius: 10,
        maxWidth: 480,
        width: '100%',
        padding: '28px 24px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <CheckCircle size={28} />
        </div>

        <h3 style={{
          margin: '0 0 8px',
          fontFamily: 'var(--font-serif)',
          fontSize: 20,
          color: 'var(--text-primary)',
          letterSpacing: '0.01em',
        }}>
          Account Permanently Deleted
        </h3>

        <span style={{
          fontSize: 11,
          color: '#f87171',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
          marginBottom: 16,
        }}>
          Action Completed
        </span>

        <p style={{
          margin: '0 0 24px',
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: 400,
        }}>
          {notice}
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="btn btn-sm"
          style={{
            background: 'var(--gold)',
            color: '#000',
            fontWeight: 600,
            fontSize: 13,
            padding: '10px 22px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Home size={15} />
          <span>Return to Home</span>
        </button>
      </div>
    </div>
  );
}
