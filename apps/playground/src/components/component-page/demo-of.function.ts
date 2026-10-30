/**
 * Stackra file contract:
 * Purpose: `demoOf`, the component for a demo path: the lazy one already made (a swap would remount the demo),
 *          else the loaded module itself, else a new lazy one; undefined when no demo file exists.
 * Boundary: picking only; `LiveDemo` mounts what it returns inside its Suspense.
 * Runtime: browser
 * Governing contract: STA-1371 (no layout shift on load or platform switch, owner 2026-10-29).
 */
import type { ComponentType, LazyExoticComponent } from "react";
import { lazy } from "react";

import { DEMO_CACHE } from "#src/components/component-page/demo-cache.constant";
import { DEMOS } from "#src/demos";

export function demoOf(
  path: string,
): ComponentType | LazyExoticComponent<ComponentType> | undefined {
  const made = DEMO_CACHE.lazy.get(path);
  if (made) return made;
  const ready = DEMO_CACHE.loaded.get(path);
  if (ready) return ready;
  const load = DEMOS.modules[path];
  if (!load) return undefined;
  const component = lazy(() =>
    load().then((module) => {
      DEMO_CACHE.loaded.set(path, module.default);
      return module;
    }),
  );
  DEMO_CACHE.lazy.set(path, component);
  return component;
}
