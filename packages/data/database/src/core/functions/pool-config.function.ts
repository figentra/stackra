/**
 * Stackra file contract:
 * Purpose: `poolConfig(pool)`, a `DatabasePool` (whole or in part) as the pool options MikroORM hands the `pg` pool of
 *          the primary and of each replica.
 * Boundary: internal to `PostgresDatabaseDriver.connect`; pure. A field left out keeps the `pg` default.
 * Runtime: isomorphic
 * Governing contract: ADR 0473 (decision 2).
 */
import { timeoutMilliseconds } from "#core/functions/timeout-milliseconds.function";
import type { DatabasePool } from "#core/types/database-pool.type";

/**
 * The MikroORM pool options of `pool`.
 *
 * @throws RangeError when `max` is not a whole number of at least 1, or `min` is negative or above `max`.
 * @example
 * poolConfig({ max: 4, idleTimeout: Duration.seconds(30) }); // { max: 4, idleTimeoutMillis: 30000 }
 */
export function poolConfig(pool: Partial<DatabasePool>): {
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
} {
  const { max, min, idleTimeout } = pool;
  if (max !== undefined && (!Number.isInteger(max) || max < 1))
    throw new RangeError(`a pool of ${max} connections cannot serve a query`);
  if (min !== undefined && (!Number.isInteger(min) || min < 0 || (max !== undefined && min > max)))
    throw new RangeError(`a pool cannot keep ${min} connections open`);
  return {
    ...(min === undefined ? {} : { min }),
    ...(max === undefined ? {} : { max }),
    ...(idleTimeout === undefined ? {} : { idleTimeoutMillis: timeoutMilliseconds(idleTimeout) }),
  };
}
