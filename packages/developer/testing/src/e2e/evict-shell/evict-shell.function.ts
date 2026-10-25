/**
 * Stackra file contract:
 * Purpose: `evictShell(page)`, deletes the precached app shells (`index.html` of every locale) from the service
 *          worker's caches, the one state in which the worker answers a navigation with the offline page.
 * Boundary: runs in the page; touches only cache entries whose path ends in `/index.html` (Workbox's revision query
 *           included), so the offline pages and assets stay cached.
 * Runtime: node (Playwright)
 * Governing contract: ADR 0255 (the offline page); ADR 0269 (decision 6).
 */
import type { Page } from "@playwright/test";

/**
 * Evicts the shell from the caches `page` sees.
 *
 * @example
 * await evictShell(page);
 * await context.setOffline(true);
 */
export async function evictShell(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys())
        if (new URL(request.url).pathname.endsWith("/index.html")) await cache.delete(request);
    }
  });
}
