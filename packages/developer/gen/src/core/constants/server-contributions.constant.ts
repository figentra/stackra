/**
 * Stackra file contract:
 * Purpose: `SERVER_CONTRIBUTIONS`, the extension-point contributions gen binds in a service's wiring when the service
 *          declares their package: the request guards of `@stackra/app/server` (`OriginGuard`, `CsrfGuard`, with the
 *          `app.cors` and `app.csrf` config rows) and the six `HealthIndicator` drivers `/readyz` runs (database,
 *          cache, queue, realtime, filesystem, search, each with its package config row).
 * Boundary: data only; each entry lists the package that must be declared, the class, its constructor tokens in
 *           parameter order and the config rows (key and class) its tokens need. The container finds them with
 *           `getAll(RequestGuard)` and `getAll(HealthIndicator)`; gen adds them so no member binds them by hand.
 * Runtime: isomorphic
 * Governing contract: ADR 0457 (multi-binding); ADR 0437 (server-check order); ADR 0190 (health); STA-1374
 *                     (stackra-216); STA-1379 (stackra-221); STA-1385.
 */
import type { ClassRef } from "#core/types/class-ref.type";
import type { ServerContribution } from "#core/types/server-contribution.type";

const APP = "@stackra/app/server";
const CORS: ClassRef = { name: "CorsConfig", from: APP };
const CSRF: ClassRef = { name: "CsrfConfig", from: APP };

/** A health driver of `pkg` over its port, configured by `<Config>` under `key`. */
function health(
  pkg: string,
  driver: ClassRef,
  port: ClassRef,
  config: string,
  key: string,
): ServerContribution {
  const configClass: ClassRef = { name: config, from: pkg };
  return {
    package: pkg,
    provide: driver,
    deps: [port, configClass],
    configs: [{ key, provide: configClass }],
  };
}

/** The contributions, guards first (in their `order`), then the health drivers. */
export const SERVER_CONTRIBUTIONS: readonly ServerContribution[] = Object.freeze([
  {
    package: "@stackra/app",
    provide: { name: "OriginGuard", from: APP },
    deps: [CORS, CSRF],
    configs: [
      { key: "app.cors", provide: CORS },
      { key: "app.csrf", provide: CSRF },
    ],
  },
  {
    package: "@stackra/app",
    provide: { name: "CsrfGuard", from: APP },
    deps: [CSRF],
    configs: [{ key: "app.csrf", provide: CSRF }],
  },
  health(
    "@stackra/database",
    { name: "DatabaseHealthIndicatorDriver", from: "@stackra/database/node" },
    { name: "Database", from: "@stackra/database" },
    "DatabaseConfig",
    "database",
  ),
  health(
    "@stackra/cache",
    { name: "CacheHealthIndicatorDriver", from: "@stackra/cache" },
    { name: "Cache", from: "@stackra/cache/contracts" },
    "CacheConfig",
    "cache",
  ),
  health(
    "@stackra/queue",
    { name: "QueueHealthIndicatorDriver", from: "@stackra/queue" },
    { name: "QueueDriver", from: "@stackra/queue/contracts" },
    "QueueConfig",
    "queue",
  ),
  health(
    "@stackra/realtime",
    { name: "RealtimeHealthIndicatorDriver", from: "@stackra/realtime" },
    { name: "RealtimeFanout", from: "@stackra/realtime/contracts" },
    "RealtimeConfig",
    "realtime",
  ),
  health(
    "@stackra/filesystem",
    { name: "FilesystemHealthIndicatorDriver", from: "@stackra/filesystem" },
    { name: "FileSystem", from: "@stackra/filesystem/contracts" },
    "FilesystemConfig",
    "filesystem",
  ),
  health(
    "@stackra/search",
    { name: "SearchHealthIndicatorDriver", from: "@stackra/search" },
    { name: "SearchDriver", from: "@stackra/search/contracts" },
    "SearchConfig",
    "search",
  ),
]);
