/**
 * Stackra file contract:
 * Purpose: `Messages`, the merged catalogues of one request or screen by namespace: what gen's `loadMessages` returns,
 *          what `formatMessage` reads and what the React provider holds.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (as amended by 0305 conventions 1).
 */
import type { Catalogue } from "#core/types/catalogue.type";

/** Namespace (`web`, `orders`) to its catalogue, already merged along the locale's fallback chain. */
export type Messages = { readonly [namespace: string]: Catalogue };
