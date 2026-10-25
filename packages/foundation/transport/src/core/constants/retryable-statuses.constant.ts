/**
 * Stackra file contract:
 * Purpose: `RETRYABLE_STATUSES`, the HTTP statuses `retry` sends again: those of the `ErrorKind`s that are retryable
 *          by default (today 429 `rate_limited` and 503 `unavailable`).
 * Boundary: internal; derived from `ErrorKind`'s metadata, never written by hand, so a kind change moves it too.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decision 3: transport mappings come from the category, never by hand).
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";

/** The statuses of the retryable kinds. */
export const RETRYABLE_STATUSES: ReadonlySet<number> = new Set(
  Enum.values(ErrorKind)
    .map((kind) => Enum.meta(ErrorKind, kind))
    .filter((meta) => meta.retryable)
    .map((meta) => meta.httpStatus),
);
