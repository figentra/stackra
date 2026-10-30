/**
 * Stackra file contract:
 * Purpose: `RecommendOptions`, what `Recommender.similar` and `boughtTogether` take beyond the item: how many, and the
 *          scope node (the tenant) an HTTP engine answers for.
 * Boundary: a type only. `scope` is the caller's own scope node from its session, never request input; the Postgres
 *           driver ignores it (row-level security isolates), an HTTP engine that keeps per-tenant models requires it.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8); ADR 0327 (decision 9: isolation in the database).
 */
import type { ScopeRef } from "@stackra/contracts";

/** The options of a recommendation. */
export interface RecommendOptions {
  /** How many items at most, a whole number from 1; the configured default when absent. */
  readonly limit?: number | undefined;

  /** The scope node (the tenant) an out-of-process engine answers for; the session's, never input. */
  readonly scope?: ScopeRef | undefined;
}
