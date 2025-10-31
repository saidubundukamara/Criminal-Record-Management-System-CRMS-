/**
 * Cache Manager
 *
 * Advanced cache management utilities for PWA optimization.
 * Handles cache versioning, invalidation, cleanup, and monitoring.
 *
 * Pan-African Design Considerations:
 * - Efficient cache management for low-storage devices
 * - Smart cleanup strategies for limited device storage
 * - Cache size limits to prevent storage quota issues
 */

export interface CacheConfig {
  name: string;
  version: number;
  maxSize: number; // in MB
  maxAge: number; // in milliseconds
}

export interface CacheStats {
  name: string;
  version: number;
  size: number; // in bytes
  itemCount: number;
  hitRate: number; // percentage
  lastCleanup: number; // timestamp
}

export interface CacheItem {
  url: string;
  cachedAt: number;
  size: number;
  hits: number;
}

/**
 * Cache Manager for advanced PWA caching strategies
 */
export class CacheManager {
  private static instance: CacheManager;
  private configs: Map<string, CacheConfig> = new Map();
  private stats: Map<string, CacheStats> = new Map();

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Register a cache configuration
   */
  registerCache(config: CacheConfig): void {
    this.configs.set(config.name, config);

    // Initialize stats if not exists
    if (!this.stats.has(config.name)) {
      this.stats.set(config.name, {
        name: config.name,
        version: config.version,
        size: 0,
        itemCount: 0,
        hitRate: 0,
        lastCleanup: Date.now(),
      });
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(cacheName: string): Promise<CacheStats | null> {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      let totalSize = 0;
      const items: CacheItem[] = [];

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          const size = blob.size;
          totalSize += size;

          // Get metadata from headers
          const cachedAt = parseInt(response.headers.get('x-cached-at') || '0');
          const hits = parseInt(response.headers.get('x-cache-hits') || '0');

          items.push({
            url: request.url,
            cachedAt,
            size,
            hits,
          });
        }
      }

      const stats: CacheStats = {
        name: cacheName,
        version: this.configs.get(cacheName)?.version || 1,
        size: totalSize,
        itemCount: items.length,
        hitRate: this.calculateHitRate(items),
        lastCleanup: this.stats.get(cacheName)?.lastCleanup || Date.now(),
      };

      this.stats.set(cacheName, stats);
      return stats;
    } catch (error) {
      console.error(`Error getting cache stats for ${cacheName}:`, error);
      return null;
    }
  }

  /**
   * Calculate cache hit rate
   */
  private calculateHitRate(items: CacheItem[]): number {
    if (items.length === 0) return 0;

    const totalHits = items.reduce((sum, item) => sum + item.hits, 0);
    const avgHits = totalHits / items.length;

    // Normalize to percentage (0-100)
    // Assuming average of 10+ hits is 100% hit rate
    return Math.min(100, (avgHits / 10) * 100);
  }

  /**
   * Clean up cache based on size and age
   */
  async cleanupCache(cacheName: string): Promise<void> {
    try {
      const config = this.configs.get(cacheName);
      if (!config) {
        console.warn(`No config found for cache: ${cacheName}`);
        return;
      }

      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      const items: (CacheItem & { request: Request })[] = [];
      let totalSize = 0;

      // Collect all cached items with metadata
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          const size = blob.size;
          totalSize += size;

          const cachedAt = parseInt(response.headers.get('x-cached-at') || '0');
          const hits = parseInt(response.headers.get('x-cache-hits') || '0');

          items.push({
            request,
            url: request.url,
            cachedAt,
            size,
            hits,
          });
        }
      }

      const maxSizeBytes = config.maxSize * 1024 * 1024; // Convert MB to bytes
      const now = Date.now();

      // Step 1: Remove items older than maxAge
      const itemsToRemove: Request[] = [];
      items.forEach((item) => {
        if (now - item.cachedAt > config.maxAge) {
          itemsToRemove.push(item.request);
        }
      });

      // Step 2: If still over size limit, remove least recently used items
      let remainingSize = totalSize;
      const remainingItems = items.filter(
        (item) => !itemsToRemove.includes(item.request)
      );

      if (remainingSize > maxSizeBytes) {
        // Sort by hits (ascending) - remove least used first
        remainingItems.sort((a, b) => a.hits - b.hits);

        for (const item of remainingItems) {
          if (remainingSize <= maxSizeBytes) break;
          itemsToRemove.push(item.request);
          remainingSize -= item.size;
        }
      }

      // Remove items from cache
      for (const request of itemsToRemove) {
        await cache.delete(request);
      }

      // Update stats
      const stats = this.stats.get(cacheName);
      if (stats) {
        stats.lastCleanup = Date.now();
        this.stats.set(cacheName, stats);
      }

      console.log(
        `Cache cleanup complete for ${cacheName}: Removed ${itemsToRemove.length} items`
      );
    } catch (error) {
      console.error(`Error cleaning up cache ${cacheName}:`, error);
    }
  }

  /**
   * Invalidate cache by version
   */
  async invalidateCache(cacheName: string, newVersion: number): Promise<void> {
    try {
      const config = this.configs.get(cacheName);
      if (!config) return;

      // If version changed, delete old cache
      if (config.version !== newVersion) {
        const oldCacheName = `${cacheName}-v${config.version}`;
        await caches.delete(oldCacheName);

        // Update config
        config.version = newVersion;
        this.configs.set(cacheName, config);

        console.log(`Invalidated cache ${oldCacheName}, new version: v${newVersion}`);
      }
    } catch (error) {
      console.error(`Error invalidating cache ${cacheName}:`, error);
    }
  }

  /**
   * Get all cache names
   */
  async getAllCacheNames(): Promise<string[]> {
    try {
      return await caches.keys();
    } catch (error) {
      console.error('Error getting cache names:', error);
      return [];
    }
  }

  /**
   * Get total cache size across all caches
   */
  async getTotalCacheSize(): Promise<number> {
    try {
      const cacheNames = await this.getAllCacheNames();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const stats = await this.getCacheStats(cacheName);
        if (stats) {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error getting total cache size:', error);
      return 0;
    }
  }

  /**
   * Increment cache hit counter for a request
   */
  async incrementHit(cacheName: string, request: Request): Promise<void> {
    try {
      const cache = await caches.open(cacheName);
      const response = await cache.match(request);

      if (response) {
        const hits = parseInt(response.headers.get('x-cache-hits') || '0') + 1;

        // Clone response with updated hit count
        const headers = new Headers(response.headers);
        headers.set('x-cache-hits', hits.toString());

        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });

        await cache.put(request, newResponse);
      }
    } catch (error) {
      console.error('Error incrementing cache hit:', error);
    }
  }

  /**
   * Precache critical resources
   */
  async precacheResources(cacheName: string, urls: string[]): Promise<void> {
    try {
      const cache = await caches.open(cacheName);

      const precachePromises = urls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            // Add metadata headers
            const headers = new Headers(response.headers);
            headers.set('x-cached-at', Date.now().toString());
            headers.set('x-cache-hits', '0');
            headers.set('x-precached', 'true');

            const newResponse = new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers,
            });

            await cache.put(url, newResponse);
          }
        } catch (error) {
          console.error(`Failed to precache ${url}:`, error);
        }
      });

      await Promise.all(precachePromises);
      console.log(`Precached ${urls.length} resources to ${cacheName}`);
    } catch (error) {
      console.error(`Error precaching resources:`, error);
    }
  }

  /**
   * Clear all caches (for emergency cleanup)
   */
  async clearAllCaches(): Promise<void> {
    try {
      const cacheNames = await this.getAllCacheNames();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('All caches cleared');
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Default cache configurations for CRMS
export const CACHE_CONFIGS: CacheConfig[] = [
  {
    name: 'crms-static',
    version: 1,
    maxSize: 50, // 50 MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  {
    name: 'crms-api',
    version: 1,
    maxSize: 100, // 100 MB
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  {
    name: 'crms-images',
    version: 1,
    maxSize: 200, // 200 MB
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
];

// Register default caches
if (typeof window !== 'undefined') {
  CACHE_CONFIGS.forEach((config) => cacheManager.registerCache(config));
}
