/**
 * Offline Fallback Page
 * 
 * Displayed when the user is offline and tries to navigate to a page
 * that is not cached by the service worker.
 * 
 * Pan-African Design: Clear messaging for low-connectivity environments
 */

import { Metadata } from 'next';
import { OfflineContent } from './offline-content';

export const metadata: Metadata = {
  title: 'Offline - CRMS',
  description: 'You are currently offline',
};

export default function OfflinePage() {
  return <OfflineContent />;
}
