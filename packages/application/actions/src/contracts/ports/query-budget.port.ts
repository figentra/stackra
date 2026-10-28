/**
 * Stackra file contract:
 * Purpose: the `QueryBudget` port: counts the database statements one call's `handle` runs, so an action or query that
 *          runs more than its declared `queryBudget`, or repeats one statement shape past the configured limit (an N+1
 *          loop), is reported with its key: a warning in production, a failure in strict mode (tests and development).
 * Boundary: an abstract class that is its own token. `@stackra/database` implements it over the queries its ORM logs
 *           and owns the repeat limit and the strict switch (configuration). With none bound nothing is counted.
 * Runtime: isomorphic
 * Governing contract: ADR 0097 (decision 4: batched reads); data-layer gap scale-performance 8 and model-orm 12
 *                     (stackra-282, STA-1400).
 */
import { Port } from "@stackra/contracts";

/**
 * Counts one call's queries.
 *
 * @example
 * export class DatabaseQueryBudgetDriver extends Driver(QueryBudget) {
 *   within<T>(key: string, budget: number | undefined, work: () => Promise<T>): Promise<T> {
 *     // count the statements `work` runs, then warn or fail
 *   }
 * }
 */
export abstract class QueryBudget extends Port {
  /**
   * Runs `work` counting the statements it runs for the call `key`, and reports a count above `budget` (no limit when
   * absent) or a statement shape repeated past the configured limit; resolves or rejects as `work` does.
   *
   * @throws RangeError in strict mode, after `work` resolved, when the call went over.
   */
  abstract within<T>(key: string, budget: number | undefined, work: () => Promise<T>): Promise<T>;
}
