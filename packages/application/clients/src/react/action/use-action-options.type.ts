/**
 * Stackra file contract:
 * Purpose: `UseActionOptions`, the second argument of `useAction`: the queries whose cached answers a sent call makes
 *          stale.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (TanStack Query core); ADR 0260 (decision 4).
 */
import type { QueryRef } from "#core/types/query-ref.type";

/** Options of one `useAction`. */
export interface UseActionOptions {
  /** Invalidated after each sent call (not after a queued one). */
  readonly invalidates?: readonly QueryRef[];
}
