/**
 * Offline Content Component (Client)
 */

"use client";

import { WifiOff, Database, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function OfflineContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-blue-500 dark:bg-blue-600 rounded-full p-6">
              <WifiOff className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          No internet connection detected. Don&apos;t worry, CRMS works offline!
        </p>

        {/* Features Available Offline */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 text-left">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            What you can do offline:
          </h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>View cached cases, persons, and evidence</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Create new cases and persons (will sync later)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Add evidence to cases (photos stored locally)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Search local database</span>
            </li>
          </ul>
        </div>

        {/* Sync Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                Auto-sync enabled
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Your changes will automatically sync when you&apos;re back online.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>

        {/* Tip */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Tip:</strong> Install CRMS as an app for better offline performance
          </p>
        </div>
      </div>
    </div>
  );
}
