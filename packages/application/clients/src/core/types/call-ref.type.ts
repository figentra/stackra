/**
 * Stackra file contract:
 * Purpose: `CallRef`, any consumed action or query ref, told apart by its static `kind`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 4).
 */
import type { ActionRef } from "#core/types/action-ref.type";
import type { QueryRef } from "#core/types/query-ref.type";

/** An action ref or a query ref. */
export type CallRef = ActionRef | QueryRef;
