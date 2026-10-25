/**
 * Stackra file contract:
 * Purpose: `ErrorCategory`, the ten envelope categories of ADR 0140, read from the `category` of each `ErrorKind`, so
 *          the list is written once.
 * Boundary: a type only. Clients branch on the category and `retryable`, never on message text (0140).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decision 2).
 */
import type { ErrorKind } from "#core/enums/error-kind.enum";

/** `validation`, `unauthenticated`, `forbidden`, `entitlement_required`, `not_found`, `conflict`, ... */
export type ErrorCategory = (typeof ErrorKind)["~enum"][ErrorKind]["category"];
