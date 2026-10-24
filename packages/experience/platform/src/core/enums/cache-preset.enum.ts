/**
 * Stackra file contract:
 * Purpose: `CachePreset`, the caching preset of the PWA service worker (`PwaConfig.caching.preset`): one choice that
 *          sets every route's strategy, which `caching.routes` then overrides path by path.
 * Boundary: an `Enum.of` value plus the type of the same name; gen compiles the choice into the generated `sw.ts`.
 *           `/api/*` stays network-only in every preset (ADR 0255 decision 2), a fixed rule, not a preset.
 * Runtime: isomorphic
 * Governing contract: ADR 0255 (decisions 2 and 4); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** How the service worker caches by default. */
export const CachePreset = Enum.of({
  /** Every route network first; the cache only when the network fails or times out. */
  OnlineFirst: "online_first",
  /** Every route cache first, refreshed in the background. */
  OfflineFirst: "offline_first",
  /** The shell and hashed assets cache first; navigations network first with a timeout. */
  Balanced: "balanced",
});

/** One of the codes above. */
export type CachePreset = Enum.Value<typeof CachePreset>;
