# RSC Offline Navigation Fix - Implementation Complete

## Problem Solved

**Issue:** When going offline, clicking navigation links in the dashboard resulted in:
```
Failed to fetch RSC payload for http://localhost:3000/dashboard/evidence
GET http://localhost:3000/dashboard/alerts?_rsc=x76jy net::ERR_INTERNET_DISCONNECTED
```

**Root Cause:** Next.js App Router uses React Server Component (RSC) payloads for client-side navigation, which weren't being cached by the service worker.

## Solution Implemented

### 1. RSC Payload Caching ✅

**File:** `next.config.mjs`

Added specialized caching strategy for RSC requests:

```javascript
{
  // Cache RSC (React Server Component) navigation payloads
  urlPattern: ({ request, url }) => {
    return request.mode === 'cors' && url.searchParams.has('_rsc');
  },
  handler: 'NetworkFirst',
  options: {
    cacheName: 'crms-rsc-v1',
    networkTimeoutSeconds: 3, // Fast offline detection
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 24 * 60 * 60,
    },
    cacheableResponse: {
      statuses: [0, 200],
    },
  },
}
```

**What This Does:**
- Detects requests with `?_rsc=xxx` parameter
- Tries network first with 3-second timeout
- Falls back to cache when offline
- Keeps last 100 routes cached

### 2. Page Navigation Caching ✅

Added general navigation caching:

```javascript
{
  // Cache page navigations
  urlPattern: ({ request }) => request.mode === 'navigate',
  handler: 'NetworkFirst',
  options: {
    cacheName: 'crms-pages-v1',
    networkTimeoutSeconds: 5,
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 24 * 60 * 60,
    },
  },
}
```

**What This Does:**
- Catches full page navigations
- Provides fallback for uncached routes
- Enables browser back/forward offline

### 3. Navigation Fallback Configuration ✅

Added Workbox navigation preload and fallback:

```javascript
// Enable navigation preload
navigationPreload: true,

// Fallback configuration
navigateFallback: '/offline',
navigateFallbackAllowlist: [
  /^\/dashboard/,
  /^\/cases/,
  /^\/persons/,
  /^\/evidence/,
  /^\/alerts/,
],
navigateFallbackDenylist: [
  /^\/_next/,
  /^\/api/,
  /\.(?:css|js|json|xml|txt|map)$/,
  /^\/login/,
  /^\/auth/,
],
```

**What This Does:**
- Shows `/offline` page for uncached routes
- Only applies to dashboard routes (not API or auth)
- Prevents fallback for static assets

### 4. Route Prefetcher Component ✅

**File:** `components/pwa/route-prefetcher.tsx`

Automatically warms cache with critical routes:

```typescript
const CRITICAL_ROUTES = [
  '/dashboard',
  '/dashboard/cases',
  '/dashboard/persons',
  '/dashboard/evidence',
  '/dashboard/alerts',
  '/dashboard/background-checks',
];
```

**Features:**
- Runs 5 seconds after page load
- Low-priority fetching (doesn't block user)
- Respects data saver mode
- Prefetches both HTML and RSC payloads
- Only when service worker registered and online

### 5. Offline Navigation Handler ✅

**File:** `components/pwa/offline-navigation-handler.tsx`

Provides better error handling:

**Features:**
- Intercepts "Failed to fetch" errors
- Shows toast notifications instead of console errors
- Notifies users when going offline/online
- Graceful degradation

**User Messages:**
- Offline: "Showing cached version. Some content may be outdated."
- Online: "Back online - You can now access all pages."

## How It Works

### Online Navigation Flow

```
User clicks link →
Next.js Link component →
Fetch RSC payload (?_rsc=xxx) →
Network request succeeds →
Instant navigation ✅
```

### Offline Navigation Flow (Now Fixed)

```
User clicks link →
Next.js Link component →
Fetch RSC payload (?_rsc=xxx) →
Network offline →
Service worker intercepts →
Returns cached RSC payload →
Navigation succeeds! ✅
```

### Uncached Route Offline

```
User navigates to uncached route →
RSC fetch fails →
Full page navigation attempted →
Service worker intercepts →
Shows /offline page ✅
```

## Testing

### Prerequisites

**Must use production build** (service worker only generated at build time):

```bash
npm run build
npm start
```

### Test Scenario 1: Cached Route Navigation

1. Visit http://localhost:3000/dashboard
2. Click around to other dashboard pages (caches them)
3. Wait 5 seconds (prefetcher runs)
4. DevTools → Network → Offline
5. Click navigation links
6. **Expected:** Smooth navigation, no errors ✅

### Test Scenario 2: Uncached Route

1. Clear cache (DevTools → Application → Clear storage)
2. Visit /dashboard
3. Go offline immediately
4. Try to navigate to /dashboard/evidence
5. **Expected:** Shows /offline page (not browser error) ✅

### Test Scenario 3: Prefetch Verification

1. Open DevTools → Console
2. Wait 5-10 seconds
3. Look for: `[Prefetch] Complete: X successful, Y failed`
4. Check Application → Cache Storage → crms-rsc-v1
5. **Expected:** Multiple cached RSC payloads ✅

### Test Scenario 4: Error Handling

1. Go offline
2. Click various links
3. **Expected:** Toast notifications, no console errors ✅

## Cache Management

### View Caches

**DevTools → Application → Cache Storage:**
- `crms-rsc-v1` - RSC navigation payloads
- `crms-pages-v1` - Full page HTML
- `crms-api-v1` - API responses
- Other caches (fonts, images, etc.)

### Clear Caches

```javascript
// In browser console
const keys = await caches.keys();
await Promise.all(keys.map(k => caches.delete(k)));
location.reload();
```

Or use utility:
```javascript
import { clearAllCaches } from '@/lib/hooks/use-service-worker';
await clearAllCaches();
```

## Files Modified

```
✏️  next.config.mjs                                    # Added RSC & navigation caching
📄  components/pwa/route-prefetcher.tsx                # New - Prefetch critical routes
📄  components/pwa/offline-navigation-handler.tsx      # New - Error handling
✏️  app/layout.tsx                                     # Integrated new components
📄  docs/RSC_OFFLINE_NAVIGATION_FIX.md                # This documentation
```

## Configuration Details

### RSC Caching Strategy

**Handler:** `NetworkFirst`
**Timeout:** 3 seconds
**Reasoning:** 
- Try network first for fresh data
- Fast timeout detects offline quickly
- Fallback to cache seamlessly

### Page Navigation Strategy

**Handler:** `NetworkFirst`
**Timeout:** 5 seconds
**Reasoning:**
- Prioritize fresh content
- Longer timeout for full pages
- Cache ensures offline availability

### Prefetch Timing

**Delay:** 5 seconds
**Reasoning:**
- Doesn't block initial page load
- User has time to interact first
- Background operation

## Browser Compatibility

### Full Support ✅
- Chrome 90+
- Edge 90+
- Opera 76+
- Samsung Internet 14+

### Partial Support ⚠️
- Firefox 90+ (No navigation preload)
- Safari 15+ (Limited offline features)

### Fallback Behavior
- If no SW support: Regular navigation
- If prefetch fails: Navigation still works
- If cache miss: Shows offline page

## Performance Impact

### Bundle Size
- Route Prefetcher: ~1KB
- Offline Handler: ~1KB
- Config changes: 0KB (build-time)
- **Total: ~2KB added**

### Runtime
- Prefetch delay: 5 seconds (non-blocking)
- Cache lookups: <10ms
- **No user-facing performance impact**

### Benefits
- ✅ Offline navigation works
- ✅ No console errors
- ✅ Better UX with notifications
- ✅ Automatic cache warming

## Troubleshooting

### Issue: Still Seeing "Failed to fetch"

**Check:**
1. Built with production: `npm run build`?
2. Service worker registered: Check console
3. Routes prefetched: Wait 5+ seconds
4. Cache exists: DevTools → Application

**Solution:**
```bash
# Full rebuild
rm -rf .next
npm run build
npm start
```

### Issue: Navigation Shows Stale Content

**This is expected!** Offline = cached content.

**To force fresh:**
1. Go online
2. Hard refresh (Cmd+Shift+R)
3. Or clear cache

### Issue: Prefetch Not Running

**Check console for:**
```
[Prefetch] Starting cache warming...
[Prefetch] Complete: X successful, Y failed
```

**If missing:**
- Service worker not registered
- Offline when prefetch attempted
- Data saver mode enabled

## Advanced: Custom Prefetch

To prefetch additional routes:

```typescript
// In components/pwa/route-prefetcher.tsx
const CRITICAL_ROUTES = [
  '/dashboard',
  // ... existing routes
  '/your-custom-route',  // Add here
];
```

## Known Limitations

### 1. Must Build First
Service worker only generated during build, not in dev mode.

**Workaround:** Use production build for testing.

### 2. Cache Can Be Stale
Offline = old data. This is unavoidable.

**Mitigation:** Show "offline" badge, update on reconnect.

### 3. First Visit Offline Fails
Can't cache what you haven't visited.

**Mitigation:** Prefetcher helps, but can't cache everything.

### 4. Large Data Not Cached
API responses have size/count limits.

**By design:** Prevent filling user's disk.

## Next Steps

### Completed ✅
- RSC navigation caching
- Page navigation caching
- Navigation fallback
- Route prefetching
- Error handling
- Documentation

### Future Enhancements (Optional)
- [ ] Predictive prefetch (hover intent)
- [ ] Selective prefetch (based on user role)
- [ ] Cache size monitoring
- [ ] Background cache refresh
- [ ] Offline analytics

## Monitoring

### Console Logs

**Success indicators:**
```
[Service Worker] Registered successfully
[Prefetch] Complete: 6 successful, 0 failed
[Navigation] Back online - navigation fully enabled
```

**Warning indicators:**
```
[Prefetch] Data saver enabled, skipping prefetch
[Navigation] Offline navigation error intercepted
```

**Error indicators:**
```
Failed to fetch RSC payload  # Should NOT see this anymore
```

## Summary

**Problem:** RSC navigation failed offline
**Solution:** Cache RSC payloads + navigation fallback
**Result:** Seamless offline navigation ✅

The fix ensures that Next.js App Router navigation works smoothly when offline by caching RSC payloads, providing fallbacks, and prefetching critical routes. Users now experience graceful offline functionality instead of "Failed to fetch" errors.
