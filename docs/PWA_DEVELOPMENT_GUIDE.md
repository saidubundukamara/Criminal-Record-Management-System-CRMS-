# PWA Development Guide

## Quick Start

### Regular Development (Default)
```bash
npm run dev
```
- Service Worker: **DISABLED**
- Offline: **NOT WORKING**
- Caching: **NONE**
- Hot Reload: **FAST**
- **Use for:** Normal development

### PWA Testing Mode (Requires Build First)
```bash
# Step 1: Build with PWA enabled
ENABLE_PWA_DEV=true npm run build

# Step 2: Start production server
npm start

# Now visit http://localhost:3000
```
- Service Worker: **ENABLED**
- Offline: **WORKING**
- Caching: **AGGRESSIVE**
- Hot Reload: **NONE** (production mode)
- **Use for:** Testing offline features

**Important:** Service workers are only generated during **build time**, not in development mode. This is a Next.js/Workbox limitation.

## Why Two Modes?

### Problem with PWA in Development

When the service worker is enabled, it aggressively caches:
- HTML pages
- JavaScript bundles
- CSS files
- API responses
- Images and fonts

This is **great for users** (fast, offline-capable) but **terrible for developers**:
- Code changes don't show up (cached)
- Need to manually clear cache constantly
- Slows down hot reload
- Confusing debugging experience

### Solution: Separate Modes

**Default (`npm run dev`):**
- No service worker
- Fast iteration
- Instant code updates
- Use 95% of the time

**PWA Mode (`npm run dev:pwa`):**
- Full service worker
- Test offline functionality
- Test PWA installation
- Use only when needed

## When to Use Each Mode

### Use Regular Dev (`npm run dev`) For:
- ✅ Building features
- ✅ Fixing bugs
- ✅ Styling components
- ✅ Writing tests
- ✅ API development
- ✅ Database changes

### Use PWA Mode (`npm run dev:pwa`) For:
- ✅ Testing offline functionality
- ✅ Testing service worker registration
- ✅ Testing caching strategies
- ✅ Testing PWA installation
- ✅ Testing background sync
- ✅ Debugging offline issues

## How to Use PWA Mode

### Step 1: Start PWA Dev Server
```bash
npm run dev:pwa
```

You'll see a warning in console:
```
[PWA] Service Worker enabled in development mode
This enables offline testing but caching may cause stale content.
To clear: DevTools → Application → Clear storage → Clear site data
```

### Step 2: Verify Service Worker Registered

Open DevTools → Console:
```
[Service Worker] Starting registration...
[Service Worker] Registered successfully
[Background Sync] Initialization complete
[PWA] Service Worker active and ready
```

### Step 3: Test Offline

1. Visit some pages (they get cached)
2. DevTools → Network tab → Set "Offline"
3. Navigate around - should still work!
4. Create data - saved to IndexedDB
5. Go back online - data syncs automatically

### Step 4: Clear Cache When Needed

**If you see stale content:**

**Option 1: DevTools UI**
1. Open DevTools → Application tab
2. Left sidebar → "Clear storage"
3. Click "Clear site data"
4. Refresh page (Cmd+R)

**Option 2: Console Command**
```javascript
// In browser console (copy-paste):
(async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  console.log('✓ Caches cleared! Refresh page.');
})();
```

**Option 3: Hard Refresh**
- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + Shift + R`

## Common Issues & Solutions

### Issue 1: Code Changes Don't Appear

**Symptoms:**
- Made changes but old code still runs
- Console logs missing
- Styles not updating

**Solution:**
```bash
# In DevTools console:
# Check if SW is caching:
navigator.serviceWorker.getRegistrations().then(r => console.log(r));

# Clear cache:
caches.keys().then(k => Promise.all(k.map(c => caches.delete(c))));

# Then hard refresh (Cmd+Shift+R)
```

### Issue 2: Service Worker Won't Update

**Symptoms:**
- SW shows "waiting to activate"
- Old SW still active

**Solution:**
```javascript
// Force update
navigator.serviceWorker.ready.then(reg => {
  reg.update().then(() => {
    console.log('SW updated, refresh page');
    location.reload();
  });
});
```

### Issue 3: Offline Mode Not Working

**Symptoms:**
- Network offline but pages don't load
- Seeing generic browser error page

**Checklist:**
- [ ] Using `npm run dev:pwa` (not regular `npm run dev`)
- [ ] Service worker registered (check console)
- [ ] Pages visited while online (to cache them)
- [ ] Check DevTools → Application → Cache Storage

### Issue 4: Getting "Failed to Fetch" Errors

**Symptoms:**
- Console errors about failed API calls
- Mostly performance metrics

**Explanation:**
This is expected! The `/api/performance` endpoint doesn't exist yet. Metrics are queued locally.

**To silence:**
Already fixed - errors are silent in development.

## Production Testing

Once the build error is fixed:

### Build & Test
```bash
# Build production version
npm run build

# Start production server
npm start

# Visit http://localhost:3000
# Test full PWA functionality
```

### Production Behavior
- Service worker: **Always enabled**
- Caching: **Intelligent** (different strategies per resource)
- Offline: **Fully working**
- Updates: **Automatic** (with notification)
- Performance: **Optimized**

## Development Workflow Examples

### Example 1: Building a New Feature

```bash
# 1. Start regular dev
npm run dev

# 2. Build feature
# - Write code
# - Test in browser
# - Fast hot reload

# 3. Feature done, now test offline
npm run dev:pwa

# 4. Test offline functionality
# - Visit pages
# - Go offline
# - Verify it works

# 5. Done testing, back to regular dev
# Ctrl+C to stop
npm run dev
```

### Example 2: Fixing Offline Bug

```bash
# 1. Start with PWA mode
npm run dev:pwa

# 2. Reproduce bug offline
# - Network → Offline
# - Trigger the issue

# 3. Make changes
# - Edit code
# - CLEAR CACHE (important!)
# - Refresh to test

# 4. Bug fixed
# - Test thoroughly offline
# - Commit changes
```

### Example 3: Testing Background Sync

```bash
# 1. Start PWA mode
npm run dev:pwa

# 2. Go offline
# - Create some cases/persons
# - Data saved to IndexedDB

# 3. Go online
# - Network → Online
# - Watch console: "[Network] Online - triggering sync"
# - Data syncs automatically

# 4. Verify in DB
# - Check Prisma Studio
# - Confirm data synced
```

## Console Commands Cheatsheet

```javascript
// Check if service worker is registered
await navigator.serviceWorker.getRegistrations()

// Check SW state
navigator.serviceWorker.ready.then(reg => 
  console.log('SW State:', reg.active?.state)
)

// List all caches
await caches.keys()

// Clear specific cache
await caches.delete('crms-api-v1')

// Clear ALL caches
const keys = await caches.keys();
await Promise.all(keys.map(k => caches.delete(k)));

// Check IndexedDB
// Open DevTools → Application → IndexedDB → crms-db

// Check sync queue
// IndexedDB → crms-db → syncQueue

// Force SW update
navigator.serviceWorker.ready.then(r => r.update())

// Check if running as PWA
window.matchMedia('(display-mode: standalone)').matches

// Check network status
navigator.onLine

// Trigger background sync
navigator.serviceWorker.ready.then(reg =>
  reg.sync.register('crms-sync')
)
```

## Understanding the Warning

When you run `npm run dev:pwa`, you'll see:

```
[PWA] Service Worker enabled in development mode
This enables offline testing but caching may cause stale content.
To clear: DevTools → Application → Clear storage → Clear site data
```

**This is intentional!** It's reminding you that:
1. Caching is active (unlike regular dev mode)
2. You may need to clear cache to see changes
3. This is for testing only, not normal development

## Best Practices

### DO ✅
- Use regular `npm run dev` for normal work
- Use `npm run dev:pwa` only for offline testing
- Clear cache when switching between modes
- Test offline features before committing
- Document PWA-related changes

### DON'T ❌
- Leave PWA mode on during regular development
- Forget to clear cache after changes
- Skip offline testing for offline features
- Commit without testing sync functionality
- Ignore the cache warning

## Architecture Reference

### How It Works

```
npm run dev:pwa
    ↓
Sets ENABLE_PWA_DEV=true
    ↓
next.config.mjs checks flag
    ↓
Enables @ducanh2912/next-pwa
    ↓
Generates public/sw.js
    ↓
ServiceWorkerProvider registers SW
    ↓
useServiceWorker() hook activates
    ↓
Service worker installs
    ↓
Precaches app shell
    ↓
Intercepts network requests
    ↓
Serves from cache when offline
```

### Files Modified

- `package.json` - Added `dev:pwa` script
- `next.config.mjs` - Conditional PWA enable
- `components/pwa/service-worker-provider.tsx` - Dev warning
- `lib/hooks/use-service-worker.ts` - Cache utilities

## Troubleshooting

### "Service Worker Registration disabled in development"

**Cause:** Using regular `npm run dev`

**Solution:** Use `npm run dev:pwa`

### Service Worker Registered But Not Working

**Checklist:**
1. Check scope: Should be `/`
2. Check state: Should be "activated"
3. Check caches: Should have entries
4. Check errors: Look in console

**Debug:**
```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('Scope:', reg.scope);
  console.log('State:', reg.active?.state);
  console.log('Script URL:', reg.active?.scriptURL);
});
```

### Pages Not Caching

**Possible reasons:**
1. SW not installed yet (visit page once)
2. Cache strategy is NetworkFirst (tries network first)
3. Route excluded from caching
4. Request failed (status not 200)

**Check cache contents:**
```
DevTools → Application → Cache Storage
```

### Background Sync Not Triggering

**Requirements:**
- Service worker registered
- Browser supports Sync API (Chrome/Edge)
- Online when registered

**Test:**
```javascript
// Register sync manually
navigator.serviceWorker.ready.then(reg =>
  reg.sync.register('crms-sync').then(() =>
    console.log('Sync registered')
  )
);
```

## Next Steps

1. **Master regular dev workflow** - Use `npm run dev` daily
2. **Learn PWA testing** - Practice with `npm run dev:pwa`
3. **Fix build error** - Test production PWA
4. **Deploy** - Experience real offline usage

## Support

**Questions?**
- Review: `docs/SERVICE_WORKER_REGISTRATION.md`
- Check: `docs/PWA_TESTING_CHECKLIST.md`
- Debug: Browser DevTools → Application tab

**Still stuck?**
- Clear all data and start fresh
- Try incognito mode for clean state
- Check browser console for errors
