/**
 * CRMS Next.js Configuration with PWA Support
 * Offline-first configuration for low-connectivity environments across Africa
 * Phase 9: Enhanced with advanced caching, bundle analysis, and performance optimization
 */

import withPWAInit from '@ducanh2912/next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';

// Bundle analyzer configuration (run with ANALYZE=true npm run build)
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = withPWAInit({
  dest: 'public',
  // Only disable in dev when NOT explicitly testing PWA
  disable: process.env.NODE_ENV === 'development' && process.env.ENABLE_PWA_DEV !== 'true',
  register: true,
  skipWaiting: true,
  // Service Worker configuration
  sw: '/sw.js',
  // Workbox configuration for caching strategies
  workboxOptions: {
    disableDevLogs: true,
    // Increase max file size for precaching (for low-bandwidth optimization)
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB

    // Precache critical app shell resources
    additionalManifestEntries: [
      { url: '/offline', revision: '1' },
      { url: '/favicon.ico', revision: '1' },
      { url: '/manifest.json', revision: '1' },
    ],

    // Cache strategies (optimized for 2G/3G networks across Africa)
    runtimeCaching: [
      {
        // Cache RSC (React Server Component) navigation payloads
        // These are fetched when using Next.js Link for client-side navigation
        urlPattern: ({ request, url }) => {
          // Match requests with _rsc query parameter
          return request.mode === 'cors' && url.searchParams.has('_rsc');
        },
        handler: 'NetworkFirst',
        options: {
          cacheName: 'crms-rsc-v1',
          networkTimeoutSeconds: 3, // Fast timeout for offline detection
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // Cache page navigations (for offline browsing)
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'crms-pages-v1',
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // Cache API routes (NetworkFirst - try network, fallback to cache)
        urlPattern: /^\/api\/.*$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'crms-api-v1',
          expiration: {
            maxEntries: 128, // Increased for offline operation
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 15, // Increased timeout for slow 2G/3G networks
          cacheableResponse: {
            statuses: [0, 200], // Cache successful responses
          },
          backgroundSync: {
            name: 'api-queue',
            options: {
              maxRetentionTime: 24 * 60, // Retry for max of 24 hours
            },
          },
        },
      },
      {
        // Cache fonts (CacheFirst - rarely change)
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'crms-fonts-v1',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // Cache images (CacheFirst with size limit)
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'crms-images-v1',
          expiration: {
            maxEntries: 100, // Limit for low-storage devices
            maxAgeSeconds: 14 * 24 * 60 * 60, // 14 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
          // Size-based plugin for evidence photos (optimize for low storage)
          plugins: [
            {
              cacheWillUpdate: async ({ response }) => {
                // Only cache images under 2MB
                const contentLength = response.headers.get('content-length');
                if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
                  return null; // Don't cache large images
                }
                return response;
              },
            },
          ],
        },
      },
      {
        // Cache JavaScript and CSS (StaleWhileRevalidate - balance freshness and speed)
        urlPattern: /\.(?:js|css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'crms-static-resources-v1',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // Cache HTML pages (NetworkFirst - ensure freshness)
        urlPattern: /\.(?:html|htm)$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'crms-html-v1',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        // Cache Next.js pages (StaleWhileRevalidate)
        urlPattern: /^\/_next\/data\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'crms-next-data-v1',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],

    // Ignore specific routes from caching
    navigateFallbackDenylist: [
      /^\/api\/auth/, // Don't cache auth routes
      /^\/api\/sync/, // Don't cache sync routes (handled separately)
    ],

    // Enable navigation preload for faster page loads
    navigationPreload: true,

    // Navigation fallback configuration
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
  },

  // Offline fallback page
  fallbacks: {
    document: '/offline',
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Security: Hide X-Powered-By header
  output: 'standalone', // Enable Docker deployment with standalone build

  // Turbopack config (empty to acknowledge webpack config from PWA plugin)
  turbopack: {},

  // Optimize for production
  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for security and PWA
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          }
        ]
      }
    ];
  },
};

// Chain both PWA and bundle analyzer plugins
export default bundleAnalyzer(withPWA(nextConfig));
