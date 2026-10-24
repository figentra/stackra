/**
 * Stackra file contract:
 * Purpose: `errorKindOf`, the `ErrorKind` of an envelope category (`precondition_failed` gives `failed_precondition`),
 *          since an envelope carries the category and every kind has its own.
 * Boundary: internal to refusal decoding; not exported from an entry. An unknown category is `internal`.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (kinds and categories).
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";

/**
 * The kind whose category is `category`.
 *
 * @example
 * errorKindOf("precondition_failed"); // ErrorKind.FailedPrecondition
 */
export function errorKindOf(category: string): ErrorKind {
  return (
    Enum.values(ErrorKind).find((kind) => Enum.meta(ErrorKind, kind).category === category) ??
    ErrorKind.Internal
  );
}
