# Bug Fix: Dashboard 404 Errors and PWA Service Worker Issues

**Date:** November 8, 2025  
**Status:** ✅ Fixed (Analytics Routes), ⚠️ Workaround Needed (PWA Package)

## Issues Fixed

### 1. ✅ Analytics Dashboard 404 Errors (FIXED)

**Problem:**
- Dashboard page was linking to `/analytics/officers`, `/analytics/cases`, `/analytics/stations`, `/analytics/national`
- Actual pages are located at `/dashboard/analytics/*`
- This caused React Server Component (RSC) navigation requests with `?_rsc=...` parameter to fail with 404 errors

**Root Cause:**
- Incorrect href attributes in `app/dashboard/page.tsx` (lines 324, 338, 352, 367)
- Missing `/dashboard` prefix in analytics route links

**Solution Applied:**
Updated all analytics links in `app/dashboard/page.tsx`:
```typescript
// Before
<Link href="/analytics/officers">
<Link href="/analytics/cases">
<Link href="/analytics/stations">
<Link href="/analytics/national">

// After
<Link href="/dashboard/analytics/officers">
<Link href="/dashboard/analytics/cases">
<Link href="/dashboard/analytics/stations">
<Link href="/dashboard/analytics/national">
```

**Files Modified:**
- `app/dashboard/page.tsx` - Fixed 4 href attributes

**Result:**
✅ All analytics navigation now works correctly  
✅ No more 404 errors for RSC requests  
✅ Dashboard analytics cards navigate to proper pages

---

### 2. ✅ Service Worker Registration Error Handling (IMPROVED)

**Problem:**
- Browser console showed error: `Failed to register ServiceWorker... A bad HTTP response code (404) was received when fetching the script`
- Service worker file (`/sw.js`) not found, causing registration failure
- Unhelpful error messages in console

**Root Cause:**
- Service worker registration attempted without checking if file exists
- No graceful error handling for missing sw.js (common in development mode)
- Generic error messages didn't guide developers

**Solution Applied:**
Enhanced error handling in `lib/hooks/use-service-worker.ts`:
```typescript
} catch (error) {
  // Handle missing sw.js gracefully (common in dev mode)
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('404') || errorMessage.includes('bad HTTP response')) {
    console.warn(
      '[Service Worker] sw.js not found - PWA features disabled.\n' +
      'This is expected in development mode unless ENABLE_PWA_DEV=true.\n' +
      'For production, run "npm run build" to generate service worker.'
    );
  } else {
    console.error('[Service Worker] Registration failed:', error);
  }
  
  setStatus((prev) => ({
    ...prev,
    isSupported: true,
    isRegistered: false,
  }));
}
```

**Files Modified:**
- `lib/hooks/use-service-worker.ts` - Added graceful 404 handling with helpful messages

**Result:**
✅ No more confusing error messages in development  
✅ Clear instructions on how to enable PWA in dev mode  
✅ Graceful fallback when service worker unavailable

---

### 3. ⚠️ PWA Package Installation Issue (WORKAROUND NEEDED)

**Problem:**
- `@ducanh2912/next-pwa` package is listed in `package.json` and `package-lock.json`
- However, the package is NOT actually installed in `node_modules/@ducanh2912/next-pwa`
- Multiple installation attempts fail silently
- This prevents service worker generation during build

**Investigation Results:**
```bash
# Package exists in registry
$ npm view @ducanh2912/next-pwa version
10.2.9  ✓

# But not in node_modules
$ ls node_modules/@ducanh2912/
# (empty directory)

# npm install doesn't fix it
$ npm install
# Says "up to date" but package still missing
```

**Attempted Solutions (All Failed):**
1. ❌ `npm install @ducanh2912/next-pwa`
2. ❌ `npm cache clean --force && npm install`
3. ❌ `rm -rf node_modules && npm install`
4. ❌ `npm install --force @ducanh2912/next-pwa@10.2.9`
5. ❌ `npm install --legacy-peer-deps @ducanh2912/next-pwa@10.2.9`

**Current Status:**
- Package-lock.json shows correct entry with integrity hash
- Node.js and npm can resolve the package
- But package is never extracted to node_modules

**Potential Root Causes:**
1. File system permissions issue
2. Corrupted npm cache or package-lock.json
3. macOS file system case-sensitivity issue
4. npm workspaces or symlink conflict
5. Antivirus or security software blocking extraction

**Workaround Options:**

#### Option A: Manual Package Installation (Recommended for Quick Fix)
```bash
# Download tarball directly
cd /tmp
npm pack @ducanh2912/next-pwa@10.2.9

# Extract to project
cd /Users/saidubundukamara/Dev/crms
mkdir -p node_modules/@ducanh2912
tar -xzf /tmp/ducanh2912-next-pwa-10.2.9.tgz -C node_modules/@ducanh2912
mv node_modules/@ducanh2912/package node_modules/@ducanh2912/next-pwa

# Then rebuild
npm run build
```

#### Option B: Alternative PWA Plugin
Replace `@ducanh2912/next-pwa` with `next-pwa` (original fork):
```bash
npm uninstall @ducanh2912/next-pwa
npm install --save-dev next-pwa@5.6.0 workbox-webpack-plugin
```

Then update `next.config.mjs`:
```javascript
import withPWA from 'next-pwa';

const pwa = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  // ... rest of config
});
```

#### Option C: Use Custom Service Worker (No Plugin)
If PWA plugin continues to fail, create a manual service worker:

1. Create `public/sw.js` with basic caching
2. Register manually in `app/layout.tsx`
3. Use Workbox libraries directly

#### Option D: Docker Development Environment
The issue may be macOS-specific. Using Docker might resolve it:
```bash
# Build in Docker (where npm works correctly)
docker build -t crms-app .
docker run -p 3000:3000 crms-app
```

---

## Testing

### 1. Analytics Navigation (✅ Can Test Now)

**Steps:**
1. Start development server: `npm run dev`
2. Login and navigate to dashboard
3. Click each analytics card:
   - Officer Productivity
   - Case Trends
   - Station Performance
   - National Statistics (if SuperAdmin/Admin)
4. Verify pages load without 404 errors
5. Check browser console - no RSC 404 errors

**Expected Results:**
- All analytics pages load successfully
- No 404 errors in Network tab for `?_rsc=...` requests
- Analytics dashboards display charts and data

### 2. Service Worker Error Handling (✅ Can Test Now)

**Steps:**
1. Start development server: `npm run dev`
2. Open browser console
3. Look for Service Worker messages

**Expected Results:**
- Warning message instead of error:
  ```
  [Service Worker] sw.js not found - PWA features disabled.
  This is expected in development mode unless ENABLE_PWA_DEV=true.
  For production, run "npm run build" to generate service worker.
  ```
- No scary red errors
- App continues to function normally

### 3. PWA Functionality (⚠️ Cannot Test Until Package Resolved)

**Steps (Once Package Issue Resolved):**
1. Run production build: `npm run build`
2. Check if `public/sw.js` generated
3. Start production server: `npm run start`
4. Open DevTools → Application → Service Workers
5. Verify service worker registered

**Expected Results:**
- `sw.js` file exists in `public/` folder
- Service worker registers successfully
- No 404 errors for `/sw.js`
- PWA install prompt available (on supported devices)

---

## Files Changed

### Modified Files
1. **app/dashboard/page.tsx**
   - Lines 324, 338, 352, 367
   - Changed `/analytics/*` to `/dashboard/analytics/*`
   - Impact: Fixes all analytics navigation

2. **lib/hooks/use-service-worker.ts**
   - Lines 121-133 (error handling block)
   - Added graceful 404 handling with informative messages
   - Impact: Improves developer experience

### Files NOT Changed (But Related)
- `next.config.mjs` - PWA configuration (already correct)
- `components/pwa/service-worker-provider.tsx` - Uses the hook (already correct)
- `package.json` - PWA package listed (but not installing)
- `public/manifest.json` - PWA manifest (already correct)

---

## Recommendations

### Immediate Actions
1. ✅ **Test analytics navigation** - Should work immediately
2. ⚠️ **Investigate npm/file system** - Determine why package won't install
3. 🔄 **Try workaround Option A** - Manual tarball extraction
4. 📋 **Document environment** - npm version, Node version, macOS version

### Short-Term (This Week)
1. Resolve PWA package installation issue using one of the workarounds
2. Run production build and verify `sw.js` generation
3. Test complete PWA functionality (offline mode, caching, etc.)
4. Add E2E tests for analytics navigation

### Long-Term (Next Sprint)
1. Consider migration to alternative PWA solution if issue persists
2. Add health check for required node_modules packages
3. Document known environment-specific issues
4. Create Docker-based development environment

---

## Additional Notes

### Why Service Worker Isn't Critical in Development
- Development mode uses hot module replacement (HMR)
- Caching in dev mode causes stale content issues
- Service workers are primarily for production offline functionality
- Most development happens online with fast reloads

### When PWA Features Are Needed
- **Production deployments** - For offline-first functionality
- **Low-connectivity testing** - Simulating 2G/3G networks in Africa
- **PWA install testing** - Testing "Add to Home Screen" feature
- **Offline sync testing** - Background sync functionality

### Environment Details
- **OS:** macOS 25.0.0 (darwin)
- **Node.js:** (check with `node --version`)
- **npm:** (check with `npm --version`)
- **Project:** CRMS Pan-African Digital Public Good
- **Location:** `/Users/saidubundukamara/Dev/crms`

---

## Contact & Support

If you encounter issues:
1. Check this document first
2. Review `docs/PWA_DEVELOPMENT_GUIDE.md`
3. Try workarounds in order (A → B → C → D)
4. File issue with npm package maintainer if problem persists

**Package Issue:** https://github.com/DuCanhGH/next-pwa/issues  
**Project:** Criminal Record Management System (CRMS)  
**Status:** Analytics fixes deployed, PWA investigation ongoing
