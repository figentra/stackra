/**
 * Stackra file contract:
 * Purpose: `DatabaseQueryBudgetDriver`, the action pipeline's `QueryBudget` on this package's query log: counts the
 *          statements a call's `handle` runs, and when it ran more than its `queryBudget` or one statement shape more
 *          than `DatabaseConfig.queries.repeats` times (an N+1 loop), logs `database.query_budget_exceeded` with the
 *          call's key, or, with `queries.strict`, fails the call.
 * Boundary: a driver of the @stackra/actions port (driver name `database`). Counts only what the connected database's
 *           drivers log (`observedLogger`), outside transaction control. The warning names the key, the count and the
 *           repeated shapes, never a value. Strict mode is for tests and development; it fails after `handle`, so
 *           its unit of work rolls back.
 * Runtime: node
 * Governing contract: data-layer gaps scale-performance 8 and model-orm 12 (stackra-282, STA-1400); ADR 0142 (drivers).
 */
import { QueryBudget } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { Logger } from "@stackra/contracts";

import type { DatabaseConfig } from "#config/database.config";
import type { QueryGuard } from "#core/types/query-guard.type";
import { QUERY_EVENTS } from "#node/constants/query-events.constant";
import { queryOverrun } from "#node/functions/query-overrun.function";
import { tallyQueries } from "#node/functions/tally-queries.function";

/**
 * The query budget of each call.
 *
 * @example
 * // generated wiring: { port: QueryBudget, candidates: { database: () => import("@stackra/database/node").then((m) => m.DatabaseQueryBudgetDriver) } }
 */
export class DatabaseQueryBudgetDriver extends Driver(QueryBudget) {
  /** The repeat limit and the strict switch. */
  private readonly guard: QueryGuard;

  /** Where an overrun is reported outside strict mode. */
  private readonly logger: Logger;

  /**
   * @param config - `queries` holds the repeat limit and the strict switch.
   * @param logger - takes the overrun warning.
   */
  constructor(config: DatabaseConfig, logger: Logger) {
    super();
    this.guard = config.queries;
    this.logger = logger;
  }

  /**
   * Implements `QueryBudget.within`, documented there.
   *
   * @throws RangeError in strict mode when the call went over.
   */
  override async within<T>(
    key: string,
    budget: number | undefined,
    work: () => Promise<T>,
  ): Promise<T> {
    const { output, tally } = await tallyQueries(work);
    const overrun = queryOverrun(tally, budget, this.guard.repeats);
    if (overrun === undefined) return output;
    if (this.guard.strict) throw new RangeError(`${key} ${overrun.message}`);
    this.logger.warn(QUERY_EVENTS.overrun, {
      action: key,
      queries: tally.queries,
      ...(budget === undefined ? {} : { budget }),
      repeated: overrun.repeated.map(([statement, times]) => ({ statement, times })),
    });
    return output;
  }
}
