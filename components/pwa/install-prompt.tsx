/**
 * PWA Install Prompt Component
 * 
 * Shows a banner prompting users to install CRMS as a PWA.
 * Appears on mobile devices when the app is not yet installed.
 * 
 * Pan-African Design:
 * - Clear, simple messaging
 * - Easy to dismiss
 * - Remembers user preference
 */

"use client";

import { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall, useIsPWA } from '@/lib/hooks/use-service-worker';

const DISMISSED_KEY = 'crms-pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
  const { canInstall, promptInstall } = usePWAInstall();
  const isPWA = useIsPWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isPWA) {
      // Already installed, don't show prompt
      return;
    }

    // Check if user dismissed the prompt recently
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const now = Date.now();
      
      if (now - dismissedTime < DISMISS_DURATION) {
        // Still within dismiss period
        return;
      }
    }

    // Show prompt if install is available
    if (canInstall) {
      // Delay showing the prompt to avoid disrupting initial experience
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [canInstall, isPWA]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    
    if (accepted) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    // Remember dismissal
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4 pr-6">
          {/* Icon */}
          <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
            <Smartphone className="w-6 h-6 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Install CRMS
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Install CRMS as an app for better offline performance and quick access.
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
              >
                Not Now
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Works offline</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Faster loading</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Add to home screen</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
