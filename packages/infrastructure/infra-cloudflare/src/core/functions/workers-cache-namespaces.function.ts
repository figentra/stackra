/**
 * Stackra file contract:
 * Purpose: `workersCacheNamespaces(root)`, the Workers KV namespace each environment's `workers` cache driver needs:
 *          every environment whose `defaults.service.config.cache.driver` is `workers` gets one, titled
 *          `<project>-<environment>-cache`.
 * Boundary: pure; reads the parsed root runway only. A member that picks the `workers` driver in its own runway, while
 *           its environment's default is another, is not seen here. Binding the namespace to a Worker under
 *           `cache.workers.binding` (default `CACHE`) is the Worker's deploy, not this stack.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1 and 2: shared resources from the root runway), ADR 0171 (decision 6).
 */
import type { RootRunway } from "@stackra/runway";

/** The `cache.driver` that stores entries in Workers KV. */
const WORKERS_DRIVER = "workers";

/**
 * Environment → its cache namespace's title.
 *
 * @example
 * // environments.production.defaults.service.config.cache.driver: workers
 * workersCacheNamespaces(root); // { production: "figentra-production-cache" }
 */
export function workersCacheNamespaces(root: RootRunway): Record<string, string> {
  return Object.fromEntries(
    Object.entries(root.environments ?? {}).flatMap(([environment, values]) => {
      const cache: unknown = values?.defaults?.service?.config?.["cache"];
      const driver =
        typeof cache === "object" && cache !== null
          ? (cache as Record<string, unknown>)["driver"]
          : undefined;
      return driver === WORKERS_DRIVER
        ? [[environment, `${root.project}-${environment}-cache`] as const]
        : [];
    }),
  );
}
