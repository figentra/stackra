/**
 * Stackra file contract:
 * Purpose: `SearchHit`, how one record appears to a principal in a search or a conflict check: in full, as an
 *          existence-only hit (its id and kind, nothing else), or not at all.
 * Boundary: a type only, `existenceHit`'s answer.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decision 2, and the existence capability); Juristra walls (existence-only hits).
 */
import type { PublicId } from "@stackra/contracts";

/** One hit. */
export type SearchHit<T> =
  | { readonly kind: "full"; readonly record: T }
  | { readonly kind: "exists"; readonly id: PublicId; readonly model: string };
