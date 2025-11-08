# Rebuild Instructions for Offline Navigation

## What Was Wrong

Your `.env` file had:
```bash
NODE_ENV="development"  # ❌ This disabled PWA generation
```

This caused `next.config.mjs` to think it was in development mode:
```javascript
disable: process.env.NODE_ENV === 'development' && ...
// Evaluated to: disable: true && ... = true (DISABLED)
```

## What Was Fixed

Changed `.env` to:
```bash
NODE_ENV="production"  # ✅ Enables PWA generation
```

Now the config will:
```javascript
disable: process.env.NODE_ENV === 'development' && ...
// Evaluates to: disable: false && ... = false (ENABLED)
```

## How to Rebuild and Test

### Step 1: Clean Previous Build
```bash
rm -rf .next
```

### Step 2: Rebuild
```bash
npm run build
```

**Look for these in the build output:**
```
Creating an optimized production build...
✓ Compiled successfully
Generating static pages...
PWA: Service worker generated   # ← Should see this!
```

### Step 3: Verify Service Worker Generated
```bash
ls -la public/sw*.js
# Should show: public/sw.js and workbox files
```

### Step 4: Start Production Server
```bash
npm start
```

### Step 5: Test Offline Navigation

1. **Visit the dashboard**
   - Navigate to http://localhost:3000/dashboard
   - Click around to different pages (cases, persons, evidence)

2. **Wait for prefetch**
   - Open DevTools → Console
   - Wait 5-10 seconds
   - Look for: `[Prefetch] Complete: X successful, Y failed`

3. **Check service worker**
   - DevTools → Application tab
   - Left sidebar → Service Workers
   - Should show: "activated and is running"

4. **Verify caches**
   - DevTools → Application → Cache Storage
   - Should see multiple caches:
     - `crms-rsc-v1` ← RSC payloads (most important!)
     - `crms-pages-v1` ← Full pages
     - `crms-api-v1` ← API responses
     - Others (images, fonts, etc.)

5. **Go offline**
   - DevTools → Network tab
   - Dropdown at top: Change "No throttling" to "Offline"
   - Or check: ☐ Offline checkbox

6. **Test navigation**
   - Click navigation links in sidebar
   - **Expected:** Smooth navigation, no errors! ✅
   - **Not expected:** "Failed to fetch" errors

7. **Check console**
   - Should see: `[Navigation] Gone offline - using cached pages only`
   - Should see: Toast notification "Offline Mode"
   - Should NOT see: "Failed to fetch RSC payload" errors

## Troubleshooting

### If Service Worker Still Not Generated

**Check:**
```bash
# 1. Verify NODE_ENV
cat .env | grep NODE_ENV
# Should show: NODE_ENV="production"

# 2. Verify in node
node -p "require('dotenv').config(); process.env.NODE_ENV"
# Should show: production

# 3. Check next config
cat next.config.mjs | grep disable
# Should show the conditional disable line
```

### If Offline Navigation Still Fails

**Check console for:**
```javascript
// Open DevTools console
// Check service worker registration
navigator.serviceWorker.getRegistrations().then(r => console.log(r))
// Should show: [ServiceWorkerRegistration]

// Check caches
caches.keys().then(k => console.log(k))
// Should show array with 'crms-rsc-v1'

// Check specific cache
caches.open('crms-rsc-v1').then(c => c.keys()).then(k => console.log(k))
// Should show cached RSC requests
```

### If Build Fails

The build might fail due to pre-existing issues. Common errors:

**Error: "Cannot read properties of null"**
- This is the pre-existing build error
- Not related to PWA changes
- Need to fix separately

**Solution:** Revert NODE_ENV temporarily:
```bash
# In .env, change back to:
NODE_ENV="development"

# This lets you continue development
# But PWA won't work until build is fixed
```

## Expected Results After Rebuild

### ✅ Success Indicators

**During build:**
- No PWA-related errors
- Service worker files generated in `public/`

**During runtime:**
- Service worker registered
- Multiple caches created
- Prefetch completes successfully
- Offline navigation works

**When offline:**
- No "Failed to fetch" errors
- Smooth navigation between cached pages
- Toast notifications appear
- Uncached pages show `/offline` fallback

### ❌ Still Having Issues?

**Double-check:**
1. [ ] `.env` has `NODE_ENV="production"`
2. [ ] Ran `rm -rf .next` before rebuild
3. [ ] Build completed without errors
4. [ ] `public/sw.js` exists
5. [ ] Service worker shows as registered in DevTools
6. [ ] Caches exist in Cache Storage
7. [ ] Waited 5+ seconds for prefetch

**If all checked and still fails:**
- Check browser console for specific errors
- Try in incognito mode (clean state)
- Try different browser (Chrome recommended)

## Summary

**Problem:** `NODE_ENV="development"` in `.env` prevented PWA generation

**Fix:** Changed to `NODE_ENV="production"`

**Next:** Rebuild with `npm run build` and test!

The offline navigation should work perfectly after this rebuild. 🎉
