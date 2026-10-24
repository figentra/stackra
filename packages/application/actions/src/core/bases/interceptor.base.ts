/**
 * Stackra file contract:
 * Purpose: `Interceptor`, the kind base of a wrapper around a whole action or query call: `extends Interceptor` with
 *          `intercept(ctx, next)`, listed in the class's `interceptors`. It is the printed, whole-call form of Magento's
 *          `around`; an extension point has no around slot.
 * Boundary: bare only. A binding with constructor dependencies. It runs after idempotency and the rate limit and
 *           around `handle` (and the action's transaction); it may refuse by throwing, change nothing and call
 *           `next()`, or return another output of the same type. Calling `next()` more than once is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 24); ADR 0294 (decisions 16 and 23: Interceptor); ADR 0265 (decision 1: no
 *                     method-level around).
 */
import { registerKind } from "@stackra/container";

import type { QueryContext } from "#core/types/query-context.type";

/**
 * The interceptor kind base.
 *
 * @example
 * export class TimingInterceptor extends Interceptor {
 *   async intercept(ctx: QueryContext, next: () => Promise<unknown>): Promise<unknown> {
 *     const started = performance.now();
 *     try {
 *       return await next();
 *     } finally {
 *       this.metrics.record(ctx.key, performance.now() - started);
 *     }
 *   }
 * }
 */
export abstract class Interceptor {
  /** Type-only kind brand, so a class of another kind cannot stand in for an interceptor. */
  declare readonly "~kind": "interceptor";

  /**
   * Wraps one call: `next()` runs the rest of the chain and `handle`, once.
   *
   * @param ctx - the call's context; an action's is an `ActionContext`.
   * @returns the call's output, usually what `next()` resolved to.
   */
  abstract intercept(ctx: QueryContext, next: () => Promise<unknown>): Promise<unknown>;
}

registerKind(Interceptor, "interceptor");
