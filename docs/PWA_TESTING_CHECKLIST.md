# PWA Testing Checklist

## Service Worker Registration - Implementation Complete ✅

This checklist helps verify that the service worker registration is working correctly.

## Quick Verification (Development Mode)

### 1. Dev Server Running
- [x] Server starts without errors: `npm run dev`
- [x] No console errors (except harmless "Failed to fetch" for performance API)
- [x] App loads at http://localhost:3000

### 2. Console Logs to Check

Open browser console and look for:

```
[Service Worker] Registration disabled in development
[Service Worker] Not supported - using fallback
[Background Sync] Initializing...
[Background Sync] Not supported - using interval-based fallback
[Storage] Starting monitoring (interval: 60000ms)
[Web Vitals] Tracking initialized
```

**Note:** Service worker is DISABLED in development by default to avoid caching issues.

### 3. Components Loaded

Check that these components render without errors:
- [ ] ServiceWorkerProvider (invisible)
- [ ] PWAComponents wrapper (invisible)
- [ ] InstallPrompt (may not show in dev mode)
- [ ] UpdateNotification (invisible until update available)
- [ ] StorageMonitor (invisible until storage low)

## Production Testing

### Prerequisites

1. Build the app:
```bash
npm run build
```

**Note:** Build currently has a pre-existing error (not caused by SW implementation). Once build issue is resolved, continue with:

2. Start production server:
```bash
npm start
```

3. Access at: http://localhost:3000

### Test Cases

#### ✅ Test 1: Service Worker Registration

**Steps:**
1. Open Chrome DevTools → Application tab → Service Workers
2. Verify SW is registered for scope "/"
3. Check status: "activated and is running"

**Expected:**
- Service worker shows as active
- Console log: `[Service Worker] Registered successfully`
- Console log: `[Background Sync] Initialization complete`

#### ✅ Test 2: Offline Fallback Page

**Steps:**
1. Navigate to http://localhost:3000/dashboard
2. DevTools → Network tab → Set "Offline"
3. Try to navigate to a non-cached route
4. OR directly visit: http://localhost:3000/offline

**Expected:**
- Sees friendly offline page
- "You're Offline" heading
- List of offline capabilities
- "Go to Dashboard" and "Try Again" buttons work

#### ✅ Test 3: PWA Install Prompt

**Steps:**
1. Use Chrome on mobile or desktop
2. Wait 3 seconds after page load
3. Look for install banner in bottom-right

**Expected:**
- Banner appears with "Install CRMS" message
- Lists benefits (offline, faster, home screen)
- "Install" button triggers browser prompt
- "Not Now" dismisses for 7 days

**Troubleshooting:**
- If no banner: Check console for `[PWA] Install prompt available`
- May not show if already installed or conditions not met
- Try incognito mode for clean test

#### ✅ Test 4: PWA Installation

**Steps:**
1. Chrome → Address bar → Install icon (⊕)
2. OR use install prompt banner
3. Click "Install"
4. Open installed app

**Expected:**
- App installs to home screen/app drawer
- Opens in standalone mode (no browser UI)
- Console: `[PWA] App installed`
- Icon and splash screen use manifest icons

**Verify:**
```javascript
// In console:
window.matchMedia('(display-mode: standalone)').matches
// Should return: true
```

#### ✅ Test 5: Offline Data Creation

**Steps:**
1. While online, visit a few pages
2. Go offline (Network tab → Offline)
3. Navigate to cached pages
4. Try to create a case or person

**Expected:**
- Cached pages load instantly
- Forms work normally
- Data saved to IndexedDB
- Added to sync queue
- No errors shown to user

**Verify in DevTools:**
- Application → IndexedDB → crms-db
- Check `syncQueue` table for pending items

#### ✅ Test 6: Background Sync

**Steps:**
1. Create data while offline (see Test 5)
2. Go back online (Network tab → Online)
3. Wait a few seconds

**Expected:**
- Console: `[Network] Online - triggering sync`
- Console: `[Background Sync] Registered: crms-sync`
- Data syncs automatically to server
- Sync queue emptied in IndexedDB

**Verify:**
```javascript
// In console:
navigator.serviceWorker.ready.then(reg => 
  reg.sync.getTags().then(tags => console.log('Sync tags:', tags))
);
```

#### ✅ Test 7: Update Notification

**Steps:**
1. With app running, make a code change
2. Rebuild and restart server
3. Refresh the page

**Expected:**
- Toast notification: "Update Available"
- "Update Now" button
- Clicking updates and reloads page
- Console: `[Service Worker] Update available`

#### ✅ Test 8: Storage Monitoring

**Steps:**
1. Open DevTools console
2. Artificially trigger low storage:

```javascript
// Simulate 85% storage usage
const event = new CustomEvent('storage-status', {
  detail: {
    type: 'low',
    estimate: {
      quota: 1000000000,
      usage: 850000000,
      usagePercent: 85,
      available: 150000000
    }
  }
});
window.dispatchEvent(event);
```

**Expected:**
- Yellow warning banner appears
- Shows storage percentage
- "Manage Storage" button
- Clicking shows cleanup dialog

#### ✅ Test 9: Critical Storage Warning

**Steps:**
1. Simulate 96% storage usage:

```javascript
const event = new CustomEvent('storage-status', {
  detail: {
    type: 'critical',
    estimate: {
      quota: 1000000000,
      usage: 960000000,
      usagePercent: 96,
      available: 40000000
    }
  }
});
window.dispatchEvent(event);
```

**Expected:**
- Modal dialog appears immediately
- Red "Critical" warning
- Storage breakdown shown
- "Clean Up Storage" button (not dismissible)

#### ✅ Test 10: Caching Performance

**Steps:**
1. Visit dashboard (cold cache)
2. Note load time in Network tab
3. Refresh page (warm cache)
4. Compare load times

**Expected:**
- First load: Normal speed
- Cached load: 90%+ faster
- Service worker intercepts requests
- Assets loaded from cache

**Verify in DevTools:**
- Network tab → Size column shows "ServiceWorker" or "(disk cache)"

## Browser Compatibility

### ✅ Chrome/Edge (Recommended)
- [ ] Service Worker: Full support
- [ ] Background Sync: Full support
- [ ] Periodic Sync: Full support
- [ ] Install Prompt: Full support

### ⚠️ Firefox
- [ ] Service Worker: Supported
- [ ] Background Sync: Not supported (falls back)
- [ ] Periodic Sync: Not supported
- [ ] Install Prompt: Limited

### ⚠️ Safari
- [ ] Service Worker: Supported (iOS 11.3+)
- [ ] Background Sync: Not supported
- [ ] Periodic Sync: Not supported
- [ ] Install Prompt: iOS only, limited

## Mobile Testing

### Android (Chrome)
- [ ] Install prompt appears
- [ ] Installs to home screen
- [ ] Opens in standalone mode
- [ ] Splash screen shows
- [ ] Offline works correctly
- [ ] Background sync works

### iOS (Safari)
- [ ] Add to Home Screen works
- [ ] Splash screen shows
- [ ] Opens in standalone mode
- [ ] Basic caching works
- [ ] No background sync (expected)

## Lighthouse PWA Audit

### Run Lighthouse
1. DevTools → Lighthouse tab
2. Select "Progressive Web App"
3. Click "Analyze page load"

### Target Scores
- [ ] PWA Score: 90+ / 100
- [ ] Installable: Yes
- [ ] Service Worker: Registered
- [ ] Offline Support: Yes
- [ ] Fast and reliable: Yes

### Common Issues
- ❌ "No matching service worker": Check SW registration
- ❌ "Offline page unavailable": Verify /offline exists
- ❌ "Not installable": Check manifest.json validity

## Known Issues

### 1. Build Error (Pre-existing)
**Issue:** `TypeError: Cannot read properties of null (reading 'useContext')`
**Status:** Exists before SW implementation, unrelated
**Impact:** Cannot test production build until resolved
**Workaround:** Test in development with `NEXT_PUBLIC_ENABLE_SW=true`

### 2. Performance API (Development)
**Issue:** "Failed to fetch" in console for /api/performance
**Status:** Expected - API endpoint not implemented yet
**Impact:** Harmless, metrics queued locally
**Fix:** Errors now silent in development

### 3. Install Prompt Not Showing
**Issue:** Banner doesn't appear
**Reasons:**
- Already installed
- Conditions not met (HTTPS, manifest, SW)
- User dismissed recently (7 day cooldown)
- Browser doesn't support (Firefox, Safari)
**Workaround:** Test in Chrome incognito

## Environment Variables

### Enable SW in Development
```bash
NEXT_PUBLIC_ENABLE_SW=true npm run dev
```

**Caution:** May cause caching issues during development. Use for testing only.

### Disable PWA Completely
In `next.config.mjs`:
```javascript
disable: true, // Disables PWA entirely
```

## Debugging Tips

### Clear All Data
```javascript
// In console:
// 1. Unregister service worker
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(reg => reg.unregister()));

// 2. Clear IndexedDB
indexedDB.deleteDatabase('crms-db');

// 3. Clear localStorage
localStorage.clear();
sessionStorage.clear();

// 4. Clear caches
caches.keys().then(keys => 
  Promise.all(keys.map(key => caches.delete(key)))
);
```

### Check SW Status
```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('SW State:', reg.active?.state);
  console.log('SW Scope:', reg.scope);
  console.log('Update available:', reg.waiting !== null);
});
```

### Force SW Update
```javascript
navigator.serviceWorker.ready.then(reg => reg.update());
```

### Check Background Sync
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.sync.getTags().then(tags => console.log('Sync tags:', tags));
});
```

## Success Criteria

All of the following should work:

- ✅ Service worker registers in production
- ✅ Offline page accessible
- ✅ App installable as PWA
- ✅ Offline data creation works
- ✅ Background sync triggers on reconnect
- ✅ Update notifications shown
- ✅ Storage warnings appear when low
- ✅ No console errors (except known issues)
- ✅ Lighthouse PWA score 90+

## Next Steps

Once verified:
1. Fix pre-existing build error
2. Test production build
3. Implement /api/performance endpoint
4. Add push notifications
5. Deploy to staging for real-world testing

## Support

**Issues?** Check:
1. Browser console for errors
2. DevTools → Application tab → Service Workers
3. Network tab for request interception
4. This checklist for known issues

**Still stuck?** Review:
- `docs/SERVICE_WORKER_REGISTRATION.md` - Full documentation
- `lib/hooks/use-service-worker.ts` - Hook implementation
- `next.config.mjs` - PWA configuration
