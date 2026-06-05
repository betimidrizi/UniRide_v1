import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: { retry: 0 }
  }
});

const root = createRoot(document.getElementById('root')!);

function SessionCacheBoundary() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const sessionKey = userId === null ? 'anonymous' : `user:${userId}`;
  const previousSessionKey = useRef(sessionKey);

  useEffect(() => {
    if (previousSessionKey.current === sessionKey) return;
    previousSessionKey.current = sessionKey;
    qc.cancelQueries();
    qc.clear();
  }, [qc, sessionKey]);

  return null;
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SessionCacheBoundary />
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgba(15, 12, 36, 0.92)',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(16px)',
              fontSize: '14px'
            },
            success: { iconTheme: { primary: '#22d3ee', secondary: '#0b0820' } },
            error: { iconTheme: { primary: '#fb7185', secondary: '#0b0820' } }
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
