'use client';

import { Component, useEffect, type ReactNode } from 'react';
import { dirOf, useI18nStore } from '@/shared/i18n';

// Global error boundary: reload the surface after 5s rather than showing a
// stack trace on a 75″ screen (spec §3, kiosk hardening).
class ReloadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    setTimeout(() => window.location.reload(), 5_000);
  }

  render() {
    if (this.state.failed) return <div className="fixed inset-0 bg-night" />;
    return this.props.children;
  }
}

export function AppProviders({ children }: { children: ReactNode }) {
  const mock = process.env.NEXT_PUBLIC_API_MODE === 'mock';
  const lang = useI18nStore((s) => s.lang);

  // dir and lang switched together on <html>, never per-component
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirOf(lang);
  }, [lang]);

  // Kiosk hardening: no context menu, no pull-to-refresh surprises
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', stop);
    return () => document.removeEventListener('contextmenu', stop);
  }, []);

  // Mock mode: start MSW in the background — never block the UI. Static surfaces
  // (home, booth) render immediately; API routes retry once the worker is up.
  useEffect(() => {
    if (!mock) return;
    void import('@/mocks/browser')
      .then(({ startMocks }) => startMocks())
      .catch((err: unknown) => {
        console.error('[MSW] Mock worker failed to start', err);
      });
  }, [mock]);

  return <ReloadBoundary>{children}</ReloadBoundary>;
}
