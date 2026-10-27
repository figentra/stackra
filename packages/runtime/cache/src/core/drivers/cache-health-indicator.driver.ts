/**
 * Stackra file contract:
 * Purpose: `CacheHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`cache`): it reads one key that is never written, which reaches the store the configured driver uses. The probe is
 *          bounded by `CacheConfig.health.timeout`; a probe that fails or runs past it is `down`, or `degraded` when
 *          `health.critical` is off, so `/readyz` fails a deploy whose the cache does not answer.
 * Boundary: `Driver(HealthIndicator)`, so `/readyz` finds it among the bound `HealthIndicator`s. It probes through
 *           the `Cache` port only; it writes nothing. A failure reports the error's name, never its message, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0184, registry gap R-27; gap analysis devx-ops "Health
 *                     checks" (P0, owner D10).
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { CacheConfig } from "#config/cache.config";
import type { Cache } from "#contracts/ports/cache.port";
import { CacheKey } from "#core/constants/cache-key.constant";

/** Whether the cache answers a cheap probe in time. */
export class CacheHealthIndicatorDriver extends Driver(HealthIndicator) {
  /** The dependency this indicator reports on. */
  override readonly name = "cache";

  private readonly cache: Cache;

  private readonly health: CacheConfig["health"];

  /**
   * @param cache - the bound `Cache`.
   * @param config - `health` holds the timeout and whether a failure is critical.
   */
  constructor(cache: Cache, config: CacheConfig) {
    super();
    this.cache = cache;
    this.health = config.health;
  }

  /** Reads the probe key; a miss is an answer. */
  override async check(): Promise<HealthReport> {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(Object.assign(new Error("cache probe timed out"), { name: "TimeoutError" })),
        Duration.toMilliseconds(this.health.timeout),
      );
    });
    try {
      await Promise.race([this.cache.get(CacheKey.of(CacheHealthIndicatorDriver, "probe")), late]);
      return { status: HealthStatus.Up, latency: Duration.seconds((Date.now() - started) / 1000) };
    } catch (error) {
      return {
        status: this.health.critical ? HealthStatus.Down : HealthStatus.Degraded,
        detail: `the cache did not answer (${(error as Error).name})`,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
