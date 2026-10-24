/**
 * Stackra file contract:
 * Purpose: `AsyncContextStorageDriver`, the `ContextStorage` for server runtimes: Node's `AsyncLocalStorage`, which
 *          keeps the running call's context across every `await`, timer and promise the call starts.
 * Boundary: the only file of this package that imports `node:` (here `node:async_hooks`), which is why it lives in the
 *           `./node` entry: browser bundles import `.` and never reach it. Workers run it with node compatibility.
 *           Concurrent calls each see their own context.
 * Runtime: node
 * Governing contract: ADR 0136 (decision 1); ADR 0294 (decision 15: runtime entries).
 */
import { AsyncLocalStorage } from "node:async_hooks";

import { Driver } from "@stackra/container";

import { ContextStorage } from "#contracts/index";

/**
 * Call context storage over `AsyncLocalStorage`.
 *
 * @example
 * const storage = new AsyncContextStorageDriver();
 * await storage.run(ctx, async () => {
 *   await somethingAsync();
 *   storage.current(); // ctx
 * });
 */
export class AsyncContextStorageDriver extends Driver(ContextStorage) {
  /** One store for every call this process runs. */
  private readonly store = new AsyncLocalStorage<object>();

  /** Runs `work` with `value` as the current value of everything it calls. */
  run<T>(value: object, work: () => T): T {
    return this.store.run(value, work);
  }

  /** The value of the innermost `run` around the caller. */
  current(): object | undefined {
    return this.store.getStore();
  }
}
