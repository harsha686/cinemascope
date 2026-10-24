import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CinemaScope caught unhandled component error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/#/';
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            color: 'var(--text-primary)',
            background: 'var(--bg-body, #080604)',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: 'linear-gradient(180deg, #181410 0%, #0d0a08 100%)',
              border: '1px solid rgba(220, 182, 91, 0.35)',
              borderRadius: 12,
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={24} color="#f87171" />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 8px',
                letterSpacing: '0.02em',
              }}
            >
              Something Went Wrong
            </h2>

            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 24px',
              }}
            >
              An unexpected display issue occurred in this section. The app prevented a blank screen and is ready to recover.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                }}
              >
                <RefreshCw size={14} />
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-outline btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                }}
              >
                <Home size={14} />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
