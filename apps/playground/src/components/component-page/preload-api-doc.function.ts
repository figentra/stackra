/**
 * Stackra file contract:
 * Purpose: `preloadApiDoc`, the API doc of an entry on one platform, fetched once and kept: the page preloads both
 *          platforms as it opens and `useApiDoc` reads the same promise. Undefined when no doc was generated.
 * Boundary: fetching and caching only; localising is `useApiDoc`'s.
 * Runtime: browser
 * Governing contract: STA-1371 (no layout shift on load or platform switch, owner 2026-10-29).
 */
import type { ApiDoc, Platform } from "@stackra/showcase";

import { API_DOCS } from "#src/components/component-page/api-docs.constant";

const CACHE = new Map<string, Promise<ApiDoc>>();

export function preloadApiDoc(platform: Platform, key: string): Promise<ApiDoc> | undefined {
  const id = `${platform}/${key}`;
  const load = API_DOCS[id];
  if (!load) return undefined;
  let pending = CACHE.get(id);
  if (!pending) {
    pending = load();
    CACHE.set(id, pending);
  }
  return pending;
}
