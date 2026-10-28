/**
 * Stackra file contract:
 * Purpose: `runTransaction(em, work, options)`, how both `Database` drivers run `transaction`: the ORM transaction (a
 *          savepoint inside a running one, a new one with `requiresNew`) at the requested isolation level and
 *          read-only flag, with the transaction-local statement and lock timeouts set first, run again on a
 *          serialization failure or deadlock as many times as `retry` allows.
 * Boundary: internal to `PostgresDatabaseDriver` and `MemoryDatabaseDriver`, so the two stay the same. `isolation`,
 *           `readOnly` and `retry` need a transaction this call starts: inside a running one, a savepoint cannot change
 *           them and a retry of only the savepoint would run against an aborted transaction, so they are refused. A
 *           retry runs the whole `work` again in a fresh transaction; the failed attempt's entity-manager fork is
 *           dropped by the ORM. Any other error, or the last attempt's, leaves unchanged (`translateDbError` maps it
 *           at the action boundary).
 * Runtime: node
 * Governing contract: ADR 0136 (decision 2); data-layer gap mo6 (P1 part, stackra-279).
 */
import { setTimeout as sleep } from "node:timers/promises";

import { TransactionPropagation } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/postgresql";

import { TRANSACTION_RETRY } from "#core/constants/transaction-retry.constant";
import { retryDelay } from "#core/functions/retry-delay.function";
import { sqlStateOf } from "#core/functions/sql-state-of.function";
import { timeoutMilliseconds } from "#core/functions/timeout-milliseconds.function";
import type { TransactionOptions } from "#core/types/transaction-options.type";

/**
 * Runs `work` in a transaction of `em` by `options`.
 *
 * @throws TypeError when `isolation`, `readOnly` or `retry` is asked inside a running transaction without
 *         `requiresNew`, or `retry` is not a whole number from 0 to 10.
 * @throws RangeError when a timeout is not a finite, non-negative length.
 * @example
 * return runTransaction(this.em(), work, { isolation: Isolation.Serializable, retry: 3 });
 */
export async function runTransaction<T>(
  em: EntityManager,
  work: () => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const { requiresNew, timeout, lockTimeout, isolation, readOnly, retry = 0 } = options;
  if (!Number.isInteger(retry) || retry < 0 || retry > TRANSACTION_RETRY.max)
    throw new TypeError(
      `retry takes a whole number from 0 to ${TRANSACTION_RETRY.max}, got ${retry}`,
    );
  const starts = requiresNew === true || !em.isInTransaction();
  if (!starts && (isolation !== undefined || readOnly === true || retry > 0))
    throw new TypeError(
      "isolation, readOnly and retry apply to a transaction the call starts: inside a running one pass requiresNew",
    );
  // the timeouts are checked once, before the first attempt opens anything
  const locals: string[] = [];
  if (timeout !== undefined)
    locals.push(`set local statement_timeout = ${timeoutMilliseconds(timeout)}`);
  if (lockTimeout !== undefined)
    locals.push(`set local lock_timeout = ${timeoutMilliseconds(lockTimeout)}`);
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await em.transactional(
        async (trx) => {
          // raw-sql: transaction-local timeouts, each a whole number of milliseconds from the caller's Duration
          for (const statement of locals) await trx.execute(statement);
          return work();
        },
        {
          ...(requiresNew === true ? { propagation: TransactionPropagation.REQUIRES_NEW } : {}),
          ...(isolation === undefined ? {} : { isolationLevel: isolation }),
          ...(readOnly === true ? { readOnly: true } : {}),
        },
      );
    } catch (error) {
      const state = sqlStateOf(error);
      if (attempt >= retry || state === undefined || !TRANSACTION_RETRY.states.has(state))
        throw error;
      await sleep(retryDelay(attempt));
    }
  }
}
