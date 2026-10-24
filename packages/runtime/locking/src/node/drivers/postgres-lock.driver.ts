/**
 * Stackra file contract:
 * Purpose: `PostgresLockDriver`, the server's `LockDriver`: a transaction-level advisory lock per key
 *          (`pg_try_advisory_xact_lock` on the key's 64-bit text hash) and a fencing token from the
 *          `locking.lock_tokens` sequence.
 * Boundary: raw SQL on the running context's entity manager. A lock taken inside the caller's transaction lasts until
 *           that transaction ends, so it covers the caller's commit and cannot outlive its holder (a dead connection
 *           ends it); `within` opens a transaction only when none runs. So renewal and release have nothing to do,
 *           and the TTL never cuts a lock short. A try never blocks; it stops at the first busy key, and the keys
 *           taken before it stay held until the transaction ends (sorted keys keep that free of cycles). Every key is
 *           a bound parameter.
 * Runtime: node
 * Governing contract: ADR 0149 (decisions 1 to 3); ADR 0103 (decisions 1 and 2); ADR 0160 (raw SQL is parameterised);
 *                     ADR 0136 (decision 2: one transaction per action); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import type { Duration } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import { LockDriver } from "#contracts/index";
import type { LockLease } from "#contracts/index";

/**
 * Locks in Postgres.
 *
 * @example
 * await database.transaction(() => locks.with(keys, Duration.seconds(5), () => stock.reserve(lines)));
 */
export class PostgresLockDriver extends Driver(LockDriver) {
  /** The connected database. */
  private readonly database: Database;

  /** @param database - the connected database whose running transaction each lock joins. */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Runs `work` in the running transaction, or in a new one when none runs. */
  within<T>(work: () => Promise<T>): Promise<T> {
    return this.database.em().isInTransaction() ? work() : this.database.transaction(work);
  }

  /** See `LockDriver.tryAcquire`; the TTL is not used, since the locks end with the transaction. */
  async tryAcquire(
    keys: readonly string[],
    owner: string,
    _ttl: Duration,
  ): Promise<LockLease | undefined> {
    const em = this.database.em();
    for (const key of keys) {
      // raw-sql: an advisory lock is a Postgres function with no ORM form (ADR 0149 d1)
      // oxlint-disable-next-line no-await-in-loop -- keys are taken in sorted order, one after the other
      const [row] = (await em.execute(
        "select pg_try_advisory_xact_lock(hashtextextended(?, 0)) as held",
        [key],
      )) as unknown as readonly { readonly held: boolean }[];
      if (row?.held !== true) return undefined;
    }
    // raw-sql: the fencing token is a sequence value, larger than every token drawn before it (ADR 0149 d3)
    const [row] = (await em.execute(
      "select nextval('locking.lock_tokens') as token",
    )) as unknown as readonly {
      readonly token: string | number;
    }[];
    return { keys: [...keys], owner, token: Number(row?.token) };
  }

  /** Always `true`: the lease holds until its transaction ends. */
  renew(_lease: LockLease, _ttl: Duration): Promise<boolean> {
    return Promise.resolve(true);
  }

  /** Nothing to do: the locks end with their transaction. */
  release(_lease: LockLease): Promise<void> {
    return Promise.resolve();
  }
}
