/**
 * Stackra file contract:
 * Purpose: `DETACHED_CALLS`, the detached call each `DetachedCall.run` context stands for, so `RequestContext.detached()`
 *          answers inside a stream or loop and nowhere else.
 * Boundary: internal to the pipeline and `RequestContext`; keyed by the context object `run` stores, a copy of the
 *           call's context made for it, so the call's own transaction never reads as detached. Weak: an entry goes
 *           with its context.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0136 (decision 1).
 */
import type { DetachedCall } from "#core/types/detached-call.type";

/** The detached call of each context `DetachedCall.run` stored. */
export const DETACHED_CALLS: WeakMap<object, DetachedCall> = new WeakMap();
