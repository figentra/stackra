/**
 * Stackra file contract:
 * Purpose: unit tests of `runTransaction`: a plain call is a savepoint or a new transaction with no options; the
 *          statement and lock timeouts are set first, as whole milliseconds; isolation and read-only reach the ORM;
 *          `requiresNew` starts its own transaction; a serialization failure or deadlock runs the work again up to
 *          `retry` times and then leaves; any other error leaves at once; isolation, read-only and retry are refused
 *          inside a running transaction without `requiresNew`, and a retry outside 0 to 10 is refused; `retryDelay`
 *          stays under a doubling, capped ceiling.
 * Boundary: test only; a recording entity manager stands in for MikroORM, so no database runs and no back-off waits
 *           longer than its jitter (fake timers).
 * Runtime: node (vitest)
 * Governing contract: ADR 0136 (decision 2); data-layer gap mo6 (stackra-279); ADR 0022; ADR 0269.
 */
import { TransactionPropagation } from "@mikro-orm/core";
import type { EntityManager } from "@mikro-orm/postgresql";
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TRANSACTION_RETRY } from "#core/constants/transaction-retry.constant";
import { Isolation } from "#core/enums/isolation.enum";
import { retryDelay } from "#core/functions/retry-delay.function";
import { runTransaction } from "#core/functions/run-transaction.function";

/** A recording entity manager; `inTransaction` says whether a transaction is already running. */
function fakeEm(inTransaction = false) {
  const em = {
    execute: vi.fn(async (_sql: string) => []),
    isInTransaction: vi.fn(() => inTransaction),
    transactional: vi.fn(
      async (work: (trx: unknown) => Promise<unknown>, _options?: unknown): Promise<unknown> =>
        work(em),
    ),
  };
  return em;
}

/** A driver error carrying a SQLSTATE. */
function stateError(code: string): Error {
  return Object.assign(new Error(code), { code });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("runTransaction", () => {
  it("runs the work with no options and sets nothing", async () => {
    const em = fakeEm();
    expect(await runTransaction(em as unknown as EntityManager, async () => 7)).toBe(7);
    expect(em.transactional.mock.calls[0]?.[1]).toEqual({});
    expect(em.execute).not.toHaveBeenCalled();
  });

  it("sets the statement and lock timeouts, and passes isolation, read-only and requiresNew", async () => {
    const em = fakeEm(true);
    await runTransaction(em as unknown as EntityManager, async () => undefined, {
      requiresNew: true,
      timeout: Duration.seconds(2),
      lockTimeout: Duration.parse("250ms"),
      isolation: Isolation.Serializable,
      readOnly: true,
    });
    expect(em.execute.mock.calls.map(([statement]) => statement)).toEqual([
      "set local statement_timeout = 2000",
      "set local lock_timeout = 250",
    ]);
    expect(em.transactional.mock.calls[0]?.[1]).toEqual({
      propagation: TransactionPropagation.REQUIRES_NEW,
      isolationLevel: "serializable",
      readOnly: true,
    });
  });

  it("takes timeouts inside a running transaction, but refuses isolation, read-only and retry there", async () => {
    const em = fakeEm(true);
    const manager = em as unknown as EntityManager;
    await runTransaction(manager, async () => undefined, { lockTimeout: Duration.seconds(1) });
    expect(em.execute).toHaveBeenCalledWith("set local lock_timeout = 1000");
    for (const options of [
      { isolation: Isolation.RepeatableRead },
      { readOnly: true },
      { retry: 2 },
    ])
      await expect(runTransaction(manager, async () => undefined, options)).rejects.toThrow(
        TypeError,
      );
  });

  it("refuses a retry count that is not a whole number from 0 to 10", async () => {
    const manager = fakeEm() as unknown as EntityManager;
    for (const retry of [-1, 1.5, TRANSACTION_RETRY.max + 1])
      await expect(runTransaction(manager, async () => undefined, { retry })).rejects.toThrow(
        TypeError,
      );
  });

  it("runs the work again after a serialization failure or deadlock, up to retry times", async () => {
    vi.useFakeTimers();
    const em = fakeEm();
    const work = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(stateError("40001"))
      .mockRejectedValueOnce(stateError("40P01"))
      .mockResolvedValueOnce("booked");
    const result = runTransaction(em as unknown as EntityManager, work, { retry: 2 });
    await vi.runAllTimersAsync();
    expect(await result).toBe("booked");
    expect(work).toHaveBeenCalledTimes(3);
    expect(em.transactional).toHaveBeenCalledTimes(3);
  });

  it("leaves with the last failure once the retries run out, and at once for any other error", async () => {
    vi.useFakeTimers();
    const em = fakeEm();
    const manager = em as unknown as EntityManager;
    const deadlock = stateError("40P01");
    const exhausted = runTransaction(
      manager,
      async () => {
        throw deadlock;
      },
      {
        retry: 1,
      },
    );
    const settled = expect(exhausted).rejects.toBe(deadlock);
    await vi.runAllTimersAsync();
    await settled;
    expect(em.transactional).toHaveBeenCalledTimes(2);

    const unique = stateError("23505");
    const lockFailed = stateError("55P03");
    for (const error of [unique, lockFailed, new TypeError("bug")]) {
      em.transactional.mockClear();
      await expect(
        runTransaction(
          manager,
          async () => {
            throw error;
          },
          { retry: 3 },
        ),
      ).rejects.toBe(error);
      expect(em.transactional).toHaveBeenCalledTimes(1);
    }
  });
});

describe("retryDelay", () => {
  it("jitters under a ceiling that doubles from the base up to the cap", () => {
    expect(retryDelay(0, 0)).toBe(0);
    expect(retryDelay(0, 0.999)).toBe(TRANSACTION_RETRY.baseMs - 1);
    expect(retryDelay(2, 0.5)).toBe((TRANSACTION_RETRY.baseMs * 4) / 2);
    expect(retryDelay(20, 0.5)).toBe(TRANSACTION_RETRY.capMs / 2);
  });
});
