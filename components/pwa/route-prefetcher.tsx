/**
 * Route Prefetcher Component
 * 
 * Warms the service worker cache with critical dashboard routes
 * to ensure offline navigation works smoothly.
 * 
 * This prefetches:
 * - HTML pages (full page content)
 * - RSC payloads (for client-side navigation)
 * 
 * Pan-African Design:
 * - Low-priority fetching (doesn't block user interactions)
 * - Delayed start (waits for initial page load)
 * - Only when online (respects data saver mode)
 */

'use client';

import { useEffect } from 'react';
import { useServiceWorker } from '@/lib/hooks/use-service-worker';

// Critical routes to prefetch for offline availability
const CRITICAL_ROUTES = [
  '/dashboard',
  '/dashboard/cases',
  '/dashboard/persons',
  '/dashboard/evidence',
  '/dashboard/alerts',
  '/dashboard/background-checks',
];

export function RoutePrefetcher() {
  const { status } = useServiceWorker();
  
  useEffect(() => {
    // Only prefetch if service worker is registered and online
    if (!status.isRegistered || !navigator.onLine) {
      return;
    }
    
    // Check for data saver mode (respect user's bandwidth preferences)
    const connection = (navigator as any).connection;
    if (connection?.saveData) {
      console.log('[Prefetch] Data saver enabled, skipping prefetch');
      return;
    }
    
    const prefetchRoutes = async () => {
      console.log('[Prefetch] Starting cache warming...');
      
      let successCount = 0;
      let failCount = 0;
      
      for (const route of CRITICAL_ROUTES) {
        try {
          // Prefetch HTML page (for full page loads)
          await fetch(route, {
            credentials: 'include',
            priority: 'low' as any, // Low priority to not block user requests
            cache: 'default', // Use browser cache if available
          });
          
          // Prefetch RSC payload (for Link navigation)
          // Note: In production, this would have proper _rsc parameter
          await fetch(`${route}?_rsc=${Date.now()}`, {
            credentials: 'include',
            priority: 'low' as any,
            headers: {
              'RSC': '1',
              'Next-Router-Prefetch': '1',
            },
            cache: 'default',
          });
          
          successCount++;
          console.log(`[Prefetch] ✓ ${route}`);
        } catch (error) {
          failCount++;
          // Silently fail - prefetch is enhancement, not critical
          console.log(`[Prefetch] ✗ ${route}:`, error instanceof Error ? error.message : 'Failed');
        }
      }
      
      console.log(`[Prefetch] Complete: ${successCount} successful, ${failCount} failed`);
      
      // Notify user if running in dev mode
      if (process.env.NODE_ENV === 'development' && successCount > 0) {
        console.log(
          '%c[Prefetch] Cache warmed!',
          'color: green; font-weight: bold;',
          'You can now test offline navigation.'
        );
      }
    };
    
    // Delay prefetch to avoid blocking initial page load
    // Wait 5 seconds for user to settle in
    const timer = setTimeout(prefetchRoutes, 5000);
    
    return () => clearTimeout(timer);
  }, [status.isRegistered]);
  
  // This component doesn't render anything
  return null;
}
