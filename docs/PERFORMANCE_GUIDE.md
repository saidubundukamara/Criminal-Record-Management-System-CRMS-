# CRMS Performance Optimization Guide

**Pan-African Digital Public Good**
**Optimized for 2G/3G Networks Across Africa**

---

## Table of Contents

1. [Overview](#overview)
2. [Performance Targets](#performance-targets)
3. [Web Vitals](#web-vitals)
4. [Caching Strategies](#caching-strategies)
5. [Bundle Optimization](#bundle-optimization)
6. [Network Optimization](#network-optimization)
7. [Storage Management](#storage-management)
8. [Monitoring & Debugging](#monitoring--debugging)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

CRMS is designed for low-connectivity environments across Africa where 2G and 3G networks are still prevalent. This guide explains how the system achieves fast, reliable performance even in challenging network conditions.

### Key Performance Features

- **Offline-First Architecture**: Works seamlessly without internet
- **Intelligent Caching**: Adapts to device capabilities
- **Progressive Web App (PWA)**: Install like a native app
- **Background Sync**: Syncs data when connection restored
- **Adaptive Loading**: Adjusts content based on network speed
- **Storage Management**: Prevents quota exceeded errors

---

## Performance Targets

### Lighthouse Scores

| Category | Target | Importance |
|----------|--------|------------|
| Performance | **90+** | Critical |
| PWA | **100** | Critical |
| Accessibility | **100** | Required |
| Best Practices | **100** | Required |
| SEO | **100** | Recommended |

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** (First Input Delay) | < 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |
| **TTFB** (Time to First Byte) | < 800ms | 800ms - 1800ms | > 1800ms |
| **FCP** (First Contentful Paint) | < 1.8s | 1.8s - 3.0s | > 3.0s |
| **INP** (Interaction to Next Paint) | < 200ms | 200ms - 500ms | > 500ms |

### Network-Specific Targets

| Network | TTI | FCP | Notes |
|---------|-----|-----|-------|
| **4G** | < 2s | < 1s | Optimal experience |
| **3G** | < 3s | < 1.8s | Common in African cities |
| **2G** | < 5s | < 3s | Rural areas, acceptable |

---

## Web Vitals

### What Are Web Vitals?

Web Vitals are Google's metrics for measuring user experience quality:

1. **LCP (Largest Contentful Paint)**: When main content is visible
2. **FID (First Input Delay)**: Time until page becomes interactive
3. **CLS (Cumulative Layout Shift)**: Visual stability (no jumping content)

### Automatic Tracking

CRMS automatically tracks all Web Vitals for every user:

```typescript
// Automatic tracking (already integrated)
// Metrics sent to /api/performance
// Viewable by admins in performance dashboard (future)
```

### Manual Performance Marks

Add custom performance marks for specific operations:

```typescript
import { reportCustomMetric, measureOperation } from '@/lib/performance/web-vitals';

// Simple metric
reportCustomMetric('case-search-duration', 150, 'ms');

// Measure async operation
const cases = await measureOperation('fetch-cases', async () => {
  return await fetchCases();
});
// Automatically reports duration
```

---

## Caching Strategies

### Cache Hierarchy

CRMS uses 6 different caching strategies optimized for different resource types:

| Resource Type | Strategy | Duration | Max Size | Purpose |
|---------------|----------|----------|----------|---------|
| **API Routes** | NetworkFirst | 24h | 100MB | Fresh data, offline fallback |
| **Fonts** | CacheFirst | 30d | 20MB | Rarely change |
| **Images** | CacheFirst (< 2MB) | 14d | 200MB | Evidence photos |
| **JS/CSS** | StaleWhileRevalidate | 7d | 100MB | Fast load, auto-update |
| **HTML** | NetworkFirst | 24h | 50MB | Fresh pages |
| **Next.js Data** | StaleWhileRevalidate | 24h | 100MB | Page data |

### How It Works

**NetworkFirst** (API routes, HTML):
1. Try network first (15s timeout for slow networks)
2. If network fails, use cache
3. Update cache with network response

**CacheFirst** (fonts, images):
1. Check cache first
2. If not in cache, fetch from network
3. Store in cache for future use

**StaleWhileRevalidate** (JS, CSS):
1. Serve from cache immediately (fast!)
2. Fetch from network in background
3. Update cache for next time

### Manual Cache Management

```typescript
import { cacheManager } from '@/lib/cache/manager';

// Get cache statistics
const stats = await cacheManager.getCacheStats('crms-api-v1');
console.log(`Cache size: ${stats.size} bytes`);
console.log(`Hit rate: ${stats.hitRate}%`);

// Clean up old items
await cacheManager.cleanupCache('crms-api-v1');

// Clear all caches (emergency)
await cacheManager.clearAllCaches();

// Precache critical resources
await cacheManager.precacheResources('crms-static', [
  '/',
  '/login',
  '/dashboard',
  '/offline',
]);
```

---

## Bundle Optimization

### Analyzing Bundle Size

```bash
# Generate bundle analysis
ANALYZE=true npm run build

# Opens in browser showing:
# - Total bundle size
# - Size by route
# - Largest dependencies
# - Duplicate modules
```

### Best Practices

**1. Code Splitting**
```typescript
// ❌ Bad: Import everything
import { HugeComponent } from '@/components/huge';

// ✅ Good: Dynamic import
const HugeComponent = dynamic(() => import('@/components/huge'), {
  loading: () => <Spinner />,
});
```

**2. Lazy Loading**
```typescript
// ✅ Lazy load images
<Image
  src="/large-image.jpg"
  loading="lazy"  // Browser native lazy loading
  alt="Evidence"
/>
```

**3. Tree Shaking**
```typescript
// ❌ Bad: Imports entire library
import _ from 'lodash';

// ✅ Good: Import specific functions
import { debounce } from 'lodash/debounce';
```

### Current Bundle Sizes

Target sizes (after gzip):
- Initial load: < 200KB
- Per route: < 100KB
- Total JS: < 500KB

---

## Network Optimization

### Adaptive Loading

CRMS automatically adapts to network conditions:

```typescript
import { getNetworkQuality, isLowEndDevice } from '@/lib/performance/web-vitals';

// Check network quality
const quality = getNetworkQuality();
// Returns: 'excellent' | 'good' | 'poor' | 'offline'

// Adapt based on network
if (quality === 'poor') {
  // Load low-res images
  // Reduce animation
  // Limit data fetching
}

// Check device capability
if (isLowEndDevice()) {
  // Disable heavy animations
  // Reduce concurrent operations
}
```

### Network Timeouts

Timeouts automatically adjust based on connection:

| Network | API Timeout | Cache Fallback |
|---------|-------------|----------------|
| 4G | 5s | 10s |
| 3G | 10s | 15s |
| 2G | 20s | 30s |

### Request Optimization

**1. Batch Requests**
```typescript
// ❌ Bad: Multiple requests
const case1 = await fetch(`/api/cases/${id1}`);
const case2 = await fetch(`/api/cases/${id2}`);
const case3 = await fetch(`/api/cases/${id3}`);

// ✅ Good: Single batched request
const cases = await fetch(`/api/cases/batch`, {
  method: 'POST',
  body: JSON.stringify({ ids: [id1, id2, id3] }),
});
```

**2. Debounce Search**
```typescript
import { debounce } from '@/lib/performance/monitoring';

// Debounce search (wait 300ms after user stops typing)
const debouncedSearch = debounce(async (query) => {
  const results = await fetch(`/api/search?q=${query}`);
}, 300);
```

---

## Storage Management

### Monitoring Storage

```typescript
import { storageManager, onStorageEvent } from '@/lib/db/storage-manager';

// Get current usage
const estimate = await storageManager.getStorageEstimate();
console.log(`Using ${estimate.usagePercent.toFixed(1)}%`);

// Listen for warnings
onStorageEvent((type, estimate) => {
  if (type === 'critical') {
    // Show warning to user
    alert('Storage almost full! Clear offline data.');
  }
});
```

### Storage Thresholds

- **80%**: Warning (suggest cleanup)
- **95%**: Critical (force cleanup or block new downloads)

### Automated Cleanup

```typescript
// Cleanup old synced data
const result = await storageManager.performAutomatedCleanup({
  deleteOldCases: true,
  deleteOldEvidence: true,
  daysThreshold: 90, // Delete data older than 90 days
  keepMinimum: 50,   // Keep at least 50 items
});

console.log(`Deleted ${result.itemsDeleted} items`);
console.log(`Freed ${storageManager.formatBytes(result.spaceSaved)}`);
```

### Persistent Storage

Request persistent storage to prevent eviction:

```typescript
// Request persistence (won't be cleared by browser)
const granted = await storageManager.requestPersistentStorage();

if (granted) {
  console.log('Storage is now persistent!');
}
```

---

## Monitoring & Debugging

### Running Lighthouse Audits

```bash
# Basic audit
node scripts/lighthouse-audit.js

# Custom URL
node scripts/lighthouse-audit.js --url=https://crms.sl

# Results saved in ./lighthouse-results/
```

### DevTools Performance

**1. Chrome DevTools**
- Open DevTools (F12)
- Performance tab
- Record page load
- Analyze waterfall

**2. Network Throttling**
- DevTools > Network tab
- Throttling dropdown
- Select "Slow 3G" or "Fast 3G"
- Test user experience

**3. Lighthouse Panel**
- DevTools > Lighthouse tab
- Select device (Mobile/Desktop)
- Run audit
- View recommendations

### Performance Monitoring API

```bash
# Get last 7 days of metrics (Admin only)
GET /api/performance?days=7

# Filter by metric
GET /api/performance?metric=LCP&days=30

# Response format:
{
  "summary": {
    "totalSessions": 1250,
    "avgLCP": 2.1,  // seconds
    "avgFID": 45,   // ms
    "avgCLS": 0.08
  },
  "byConnection": [
    {
      "connectionType": "3g",
      "metrics": {
        "LCP": { "average": 2.8, "median": 2.5 }
      }
    }
  ],
  "byDevice": [
    {
      "deviceCategory": "low-end",
      "memoryRange": "< 2GB",
      "metrics": { ... }
    }
  ]
}
```

---

## Best Practices

### DO ✅

1. **Use Offline-First Patterns**
   - Store locally first, sync later
   - Provide instant feedback
   - Handle conflicts gracefully

2. **Optimize Images**
   - Use WebP/AVIF formats
   - Compress before upload
   - Use `loading="lazy"`
   - Implement responsive images

3. **Minimize JavaScript**
   - Code split by route
   - Remove unused dependencies
   - Use dynamic imports
   - Tree shake libraries

4. **Cache Aggressively**
   - Cache static assets (fonts, images)
   - Cache API responses
   - Use service worker

5. **Monitor Performance**
   - Run Lighthouse regularly
   - Check Web Vitals
   - Monitor storage usage
   - Track bundle size

### DON'T ❌

1. **Don't Block Rendering**
   - Avoid synchronous scripts
   - Don't use `document.write()`
   - Minimize render-blocking CSS

2. **Don't Ignore Low-End Devices**
   - Test on 2GB RAM devices
   - Test on 2G network
   - Provide low-data mode

3. **Don't Overload Service Worker**
   - Keep SW logic simple
   - Don't cache everything
   - Set cache size limits

4. **Don't Forget Accessibility**
   - Use semantic HTML
   - Provide alt text
   - Support keyboard navigation

5. **Don't Skip Error Handling**
   - Handle offline gracefully
   - Provide clear error messages
   - Offer retry mechanisms

---

## Troubleshooting

### Slow Page Loads

**Symptoms**: Pages take > 5s to load on 3G

**Solutions**:
1. Check bundle size: `ANALYZE=true npm run build`
2. Run Lighthouse: `node scripts/lighthouse-audit.js`
3. Reduce image sizes
4. Enable code splitting
5. Check server response times

### High Cache Usage

**Symptoms**: Storage quota exceeded errors

**Solutions**:
```typescript
// 1. Check cache sizes
const total = await cacheManager.getTotalCacheSize();
console.log(formatBytes(total));

// 2. Cleanup old caches
await cacheManager.cleanupCache('crms-images-v1');

// 3. Clear all caches (emergency)
await cacheManager.clearAllCaches();
```

### Poor Web Vitals

**LCP > 4s**:
- Optimize largest image/element
- Use CDN for images
- Implement lazy loading
- Reduce server response time

**FID > 300ms**:
- Minimize JavaScript execution
- Code split large bundles
- Defer non-critical scripts
- Use web workers for heavy tasks

**CLS > 0.25**:
- Set explicit sizes for images/videos
- Don't insert content above existing content
- Use CSS containment
- Preload fonts

### Sync Conflicts

**Symptoms**: Sync keeps failing with conflicts

**Solutions**:
1. Check conflict resolution UI is working
2. Verify timestamps are correct
3. Ensure server accepts conflict resolution
4. Check network connectivity during sync

### Storage Warnings

**Symptoms**: "Storage almost full" warnings

**Solutions**:
```typescript
// 1. Check usage
const estimate = await storageManager.getStorageEstimate();

// 2. Automated cleanup
await storageManager.performAutomatedCleanup({
  daysThreshold: 60, // More aggressive
});

// 3. Manual cleanup (if needed)
await storageManager.clearAllData();
```

---

## Performance Checklist

Use this checklist before deploying:

### Development
- [ ] Bundle analyzer shows reasonable sizes
- [ ] No console errors or warnings
- [ ] Images are optimized (< 100KB each)
- [ ] Lazy loading implemented
- [ ] Code splitting configured

### Testing
- [ ] Lighthouse audit passes (all categories > 90)
- [ ] Works on 2G network
- [ ] Works on low-end device (2GB RAM)
- [ ] Web Vitals all "good"
- [ ] Storage management tested

### Monitoring
- [ ] Web Vitals tracking enabled
- [ ] Performance API working
- [ ] Cache statistics available
- [ ] Storage warnings configured
- [ ] Error logging active

### Production
- [ ] CDN configured (if applicable)
- [ ] Compression enabled (gzip/brotli)
- [ ] Service worker registered
- [ ] Persistent storage requested
- [ ] Background sync enabled

---

## Additional Resources

### Documentation
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### Tools
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [WebPageTest](https://www.webpagetest.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

### CRMS-Specific
- [PHASE_9_COMPLETE.md](./PHASE_9_COMPLETE.md) - Implementation details
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Full roadmap
- [SERVICE_REPOSITORY_ARCHITECTURE.md](./SERVICE_REPOSITORY_ARCHITECTURE.md) - Architecture guide

---

**Last Updated:** October 31, 2025
**Phase:** 9 - PWA Optimization
**Status:** Production-Ready

For questions or issues, refer to project documentation or contact the development team.
