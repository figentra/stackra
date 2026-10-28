/**
 * Stackra file contract:
 * Purpose: the `QueryObserver` port: told about every statement the connected database runs (`QuerySample`), so a
 *          driver can log slow statements, record telemetry or count queries.
 * Boundary: an abstract class that is its own token. The database calls `observe` synchronously after each statement,
 *           from inside the ORM's query log, so a driver must not throw or block: an error it throws is dropped. The
 *           sample carries no parameter value. Observers reach the database through `DatabaseOptions.observers`.
 * Runtime: node
 * Governing contract: data-layer gap scale-performance 7 (stackra-282, STA-1400); ADR 0184 (decision 1: telemetry).
 */
import { Port } from "@stackra/contracts";

import type { QuerySample } from "#contracts/types/query-sample.type";

/**
 * Watches the statements the database runs.
 *
 * @example
 * export class LoggerQueryObserverDriver extends Driver(QueryObserver) {
 *   observe(sample: QuerySample): void {
 *     if (sample.durationMs >= 500) this.logger.warn("database.slow_query", { ...sample });
 *   }
 * }
 */
export abstract class QueryObserver extends Port {
  /** Takes one statement the database ran; must not throw. */
  abstract observe(sample: QuerySample): void;
}
