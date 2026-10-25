/**
 * Stackra file contract:
 * Purpose: `GLOBAL_MODELS`, the classes `Model.global(...)` composed: a model that extends one is global by design
 *          (an official law corpus, a reference table) and carries no `tenant_id`.
 * Boundary: a WeakSet written only by `Model.global` and read by `Model.isGlobal`. Internal: not exported.
 * Runtime: isomorphic
 * Governing contract: ADR 0210 (2026-10-24 amendment); ADR 0321 (2026-10-24 amendment).
 */

/** The bases `Model.global` returned. */
export const GLOBAL_MODELS = new WeakSet<object>();
