/**
 * Stackra file contract:
 * Purpose: `DEMO_CACHE`, the demo components already made, by demo path: `loaded` holds a module that has arrived
 *          (mounted directly, with no suspense) and `lazy` the one lazy component made per path.
 * Boundary: state only; `demoOf` and `preloadDemo` read and fill it.
 * Runtime: browser
 * Governing contract: STA-1371 (no layout shift on load or platform switch, owner 2026-10-29).
 */
import type { ComponentType, LazyExoticComponent } from "react";

export const DEMO_CACHE = {
  loaded: new Map<string, ComponentType>(),
  // One per path: a lazy made per mount suspends again on every mount.
  lazy: new Map<string, LazyExoticComponent<ComponentType>>(),
} as const;
