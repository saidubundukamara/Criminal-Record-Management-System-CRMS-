/**
 * Service Worker Provider Component
 * 
 * Registers service worker and provides PWA functionality to the app.
 * Should be included in the root Providers component.
 */

"use client";

import { useEffect } from 'react';
import { useServiceWorker } from '@/lib/hooks/use-service-worker';

export function ServiceWorkerProvider() {
  const { status } = useServiceWorker();

  useEffect(() => {
    if (status.isRegistered) {
      console.log('[PWA] Service Worker active and ready');
      
      // Warn about dev caching
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '%c[PWA] Service Worker enabled in development mode\n' +
          '%cThis enables offline testing but caching may cause stale content.\n' +
          '%cTo clear: DevTools → Application → Clear storage → Clear site data',
          'color: orange; font-weight: bold;',
          'color: orange;',
          'color: #666;'
        );
      }
    }
  }, [status.isRegistered]);

  // This component doesn't render anything
  // It just handles service worker registration
  return null;
}
