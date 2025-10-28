/**
 * CRMS Next.js Configuration with PWA Support
 * Offline-first configuration for low-connectivity environments across Africa
 */

import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
  register: true,
  skipWaiting: true,
  // Service Worker configuration
  sw: '/sw.js',
  // Workbox configuration for caching strategies
  workboxOptions: {
    disableDevLogs: true,
    // Cache strategies
    runtimeCaching: [
      {
        // Cache API routes (NetworkFirst - try network, fallback to cache)
        urlPattern: /^\/api\/.*$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10, // Fallback to cache after 10s (for slow networks)
        },
      },
      {
        // Cache static assets (CacheFirst - faster for repeated visits)
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-font-assets',
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        // Cache images
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-image-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      {
        // Cache JavaScript and CSS
        urlPattern: /\.(?:js|css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-js-css-assets',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      {
        // Cache HTML pages
        urlPattern: /\.(?:html|htm)$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'static-html-cache',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
    ],
  },
  // Background Sync for offline operations
  // fallbacks: {
  //   document: '/offline',
  // },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Security: Hide X-Powered-By header

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

export default withPWA(nextConfig);
