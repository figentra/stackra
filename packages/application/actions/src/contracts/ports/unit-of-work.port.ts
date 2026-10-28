/**
 * Stackra file contract:
 * Purpose: the `UnitOfWork` port: the one database transaction an action's `handle` runs in, so its writes and its
 *          outbox events commit together and `ctx.afterCommit` work waits for the commit; the action's `timeout`
 *          bounds each statement inside it.
 * Boundary: an abstract class that is its own token. `@stackra/database` implements it; queries never open one. An
 *           app that binds none (memory drivers only) runs `handle` without a transaction and still runs `afterCommit`
 *           work only after `handle` succeeded.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 2: one transaction per action, external calls after commit).
 */
import { Port } from "@stackra/contracts";
import type { Duration } from "@stackra/contracts";

/**
 * Runs work in one transaction.
 *
 * @example
 * export class MikroUnitOfWorkDriver extends Driver(UnitOfWork) {
 *   transaction<T>(work: () => Promise<T>): Promise<T> {
 *     return this.em.transactional(work);
 *   }
 * }
 */
export abstract class UnitOfWork extends Port {
  /**
   * Runs `work` in a transaction: commits when it resolves, rolls back and rejects with its error when it rejects.
   * `options.timeout` is the action's statement timeout, replacing the session's for this transaction only.
   */
  abstract transaction<T>(
    work: () => Promise<T>,
    options?: { readonly timeout?: Duration },
  ): Promise<T>;
}
