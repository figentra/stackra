/**
 * Stackra file contract:
 * Purpose: `preloadDemo`, fetches the demo at a path ahead of its first mount, so it then mounts with no skeleton.
 * Boundary: fetching only; nothing renders here.
 * Runtime: browser
 * Governing contract: STA-1371 (no layout shift on load or platform switch, owner 2026-10-29).
 */
import { DEMO_CACHE } from "#src/components/component-page/demo-cache.constant";
import { DEMOS } from "#src/demos";

export function preloadDemo(path: string) {
  const load = DEMOS.modules[path];
  if (!load || DEMO_CACHE.loaded.has(path)) return;
  void load().then((module) => DEMO_CACHE.loaded.set(path, module.default));
}
