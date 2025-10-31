/**
 * Web Vitals Reporter Component
 *
 * Client-side component that initializes Web Vitals tracking.
 * Must be included in the root layout to track all pages.
 */

'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/performance/web-vitals';

export function WebVitalsReporter() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    // Note: userId will be associated with metrics when available via API
    initWebVitals();

    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals] Tracking initialized');
    }
  }, []);

  // This component renders nothing
  return null;
}
