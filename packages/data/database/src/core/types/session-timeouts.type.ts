/**
 * Stackra file contract:
 * Purpose: `SessionTimeouts`, the statement, lock and idle-in-transaction timeouts a runtime database session starts
 *          with (`DatabaseConfig.timeouts`, `DatabaseOptions.timeouts`).
 * Boundary: a type only. Values come from configuration (runway's `config.database` layer), never from code.
 * Runtime: isomorphic
 * Governing contract: data-layer gap sc5 (stackra-253); ADR 0305 (rules 10 to 13).
 */
import type { Duration } from "@stackra/contracts";

/** The session timeouts. */
export interface SessionTimeouts {
  /** `statement_timeout`: how long one statement may run. */
  readonly statement: Duration;

  /** `lock_timeout`: how long a statement may wait for a lock. */
  readonly lock: Duration;

  /** `idle_in_transaction_session_timeout`: how long a session may sit idle inside an open transaction. */
  readonly idleInTransaction: Duration;
}
