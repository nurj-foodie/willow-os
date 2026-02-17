import { StrictMode, Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Log auth redirect for debugging
const url = new URL(window.location.href);
if (url.searchParams.has('code') || url.hash.includes('access_token')) {
  console.log('[Willow] Auth redirect detected:', {
    hasCode: url.searchParams.has('code'),
    hasHash: url.hash.includes('access_token'),
    origin: url.origin,
    pathname: url.pathname
  });
}

// Global error boundary to prevent blank screens
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Willow] App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h2 style={{ color: '#e74c3c' }}>Something went wrong</h2>
          <p style={{ color: '#666', marginTop: '12px' }}>{this.state.error}</p>
          <button
            onClick={() => { window.location.href = window.location.origin; }}
            style={{
              marginTop: '20px', padding: '12px 24px', background: '#333',
              color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
