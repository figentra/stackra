/**
 * Stackra file contract:
 * Purpose: the `ContextStorage` port: keeps the context of the running call across `await`, so `RequestContext`
 *          answers inside a service, a listener or an extension point the action called.
 * Boundary: an abstract class that is its own token. The driver is runtime-specific: `./node` ships the
 *           AsyncLocalStorage driver (Node, Workers with node compatibility), which keeps `.` free of `node:` imports
 *           for browser bundles. The stored value is opaque here; `RequestContext` types it.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1: the handler context); ADR 0294 (decision 15: the leaf entry holds ports).
 */
import { Port } from "@stackra/contracts";

/**
 * Stores one value per asynchronous call chain.
 *
 * @example
 * storage.run(ctx, () => action.handle(input, ctx)); // inside: storage.current() === ctx
 */
export abstract class ContextStorage extends Port {
  /** Runs `work` with `value` as the current value of everything it calls, synchronously or after `await`. */
  abstract run<T>(value: object, work: () => T): T;

  /** The value of the innermost `run` around the caller, or `undefined` outside every `run`. */
  abstract current(): object | undefined;
}
