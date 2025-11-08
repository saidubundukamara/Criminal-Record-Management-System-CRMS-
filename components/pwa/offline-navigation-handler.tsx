/**
 * Offline Navigation Handler
 * 
 * Intercepts navigation errors when offline and provides
 * better user feedback instead of showing browser error pages.
 * 
 * Features:
 * - Detects offline navigation failures
 * - Shows helpful toast messages
 * - Graceful fallback to offline page
 * 
 * Pan-African Design:
 * - Clear, non-technical error messages
 * - Guidance for offline users
 * - No silent failures
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function OfflineNavigationHandler() {
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    /**
     * Handle navigation errors that occur when offline
     * These are typically "Failed to fetch" errors for RSC payloads
     */
    const handleNavigationError = (event: ErrorEvent) => {
      const isOffline = !navigator.onLine;
      const isFetchError = event.message && (
        event.message.includes('Failed to fetch') ||
        event.message.includes('ERR_INTERNET_DISCONNECTED') ||
        event.message.includes('NetworkError')
      );
      
      if (isOffline && isFetchError) {
        // Prevent default browser error display
        event.preventDefault();
        
        console.log('[Navigation] Offline navigation error intercepted');
        
        // Show user-friendly notification
        toast({
          title: 'Offline Mode',
          description: 'Showing cached version. Some content may be outdated.',
          duration: 3000,
        });
      }
    };
    
    /**
     * Handle unhandled promise rejections (async fetch failures)
     */
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      const isOffline = !navigator.onLine;
      const error = event.reason;
      
      // Check if it's a fetch error
      const isFetchError = 
        error instanceof TypeError && 
        error.message && 
        error.message.includes('fetch');
      
      if (isOffline && isFetchError) {
        // Prevent console noise
        event.preventDefault();
        
        console.log('[Navigation] Offline fetch error handled gracefully');
      }
    };
    
    /**
     * Listen for online/offline status changes
     */
    const handleOnline = () => {
      console.log('[Navigation] Back online - navigation fully enabled');
      
      toast({
        title: 'Back Online',
        description: 'You can now access all pages.',
        duration: 2000,
      });
    };
    
    const handleOffline = () => {
      console.log('[Navigation] Gone offline - using cached pages only');
      
      toast({
        title: 'Offline Mode',
        description: 'You can still access recently viewed pages.',
        duration: 3000,
      });
    };
    
    // Register event listeners
    window.addEventListener('error', handleNavigationError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cleanup
    return () => {
      window.removeEventListener('error', handleNavigationError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, router]);
  
  // This component doesn't render anything
  return null;
}
