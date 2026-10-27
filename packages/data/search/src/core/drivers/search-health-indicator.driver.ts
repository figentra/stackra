/**
 * Stackra file contract:
 * Purpose: `SearchHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`search`): it searches `health.table` for one id, with no words and no filter. The probe is
 *          bounded by `SearchConfig.health.timeout`; a probe that fails or runs past it is `down`, or `degraded` when
 *          `health.critical` is off, so `/readyz` fails a deploy whose the search engine does not answer.
 * Boundary: `Driver(HealthIndicator)`, so `/readyz` finds it among the bound `HealthIndicator`s. It probes through
 *           the `SearchDriver` port only; it indexes and removes nothing. A failure reports the error's name, never its message, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0184, registry gap R-27; gap analysis devx-ops "Health
 *                     checks" (P0, owner D10).
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { SearchConfig } from "#config/search.config";
import type { SearchDriver } from "#contracts/ports/search-driver.port";
import type { SearchTable } from "#contracts/types/search-table.type";

/** Whether the search engine answers a cheap probe in time. */
export class SearchHealthIndicatorDriver extends Driver(HealthIndicator) {
  /** The dependency this indicator reports on. */
  override readonly name = "search";

  private readonly engine: SearchDriver;

  private readonly health: SearchConfig["health"];

  private readonly table: SearchTable;

  /**
   * @param engine - the bound `SearchDriver`.
   * @param config - `health` holds the timeout and whether a failure is critical.
   * @throws TypeError when `health.table` is empty: runway names the table the probe searches.
   */
  constructor(engine: SearchDriver, config: SearchConfig) {
    super();
    const [schema, table] = config.health.table.includes(".")
      ? config.health.table.split(".", 2)
      : [undefined, config.health.table];
    if (table === undefined || table === "")
      throw new TypeError(
        "search health.table is empty: runway names the table the probe searches",
      );
    this.table = {
      ...(schema === undefined ? {} : { schema }),
      table,
      primaryKey: config.health.primaryKey,
    };
    this.engine = engine;
    this.health = config.health;
  }

  /** Searches the probe table for one id. */
  override async check(): Promise<HealthReport> {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(Object.assign(new Error("search probe timed out"), { name: "TimeoutError" })),
        Duration.toMilliseconds(this.health.timeout),
      );
    });
    try {
      await Promise.race([
        this.engine.search(this.table, { words: [], filters: {}, offset: 0, limit: 1 }),
        late,
      ]);
      return { status: HealthStatus.Up, latency: Duration.seconds((Date.now() - started) / 1000) };
    } catch (error) {
      return {
        status: this.health.critical ? HealthStatus.Down : HealthStatus.Degraded,
        detail: `the search engine did not answer (${(error as Error).name})`,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
