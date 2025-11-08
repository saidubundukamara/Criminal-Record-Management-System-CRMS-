/**
 * PWA Components Wrapper
 * 
 * Wraps all PWA-related client components in a single boundary
 * to prevent SSR hydration issues.
 */

"use client";

import dynamic from 'next/dynamic';

// Dynamically import PWA components with no SSR
const InstallPrompt = dynamic(
  () => import('./install-prompt').then((mod) => ({ default: mod.InstallPrompt })),
  { ssr: false }
);

const UpdateNotification = dynamic(
  () => import('./update-notification').then((mod) => ({ default: mod.UpdateNotification })),
  { ssr: false }
);

const StorageMonitor = dynamic(
  () => import('./storage-monitor').then((mod) => ({ default: mod.StorageMonitor })),
  { ssr: false }
);

export function PWAComponents() {
  return (
    <>
      <InstallPrompt />
      <UpdateNotification />
      <StorageMonitor />
    </>
  );
}
