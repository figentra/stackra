/**
 * Stackra file contract:
 * Purpose: `refusalFromStored`, a refusal equal to the one `storedRefusal` kept: same code, kind, retryable flag,
 *          details and field errors, so its envelope matches the first.
 * Boundary: the class is built per call from the stored kind, because the original class may not be known here; the
 *           code is set on the instance, so `isRefusal(error, OriginalError)` still matches.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (decision 1); STA-2532.
 */
import { Refusal } from "#core/bases/refusal.base";
import type { StoredRefusal } from "#core/types/stored-refusal.type";

/**
 * Recreates the refusal kept in `stored`.
 *
 * @example
 * throw refusalFromStored(earlier.refusal);
 */
export function refusalFromStored(stored: StoredRefusal): Refusal {
  class StoredRefusalError extends Refusal({
    kind: stored.kind,
    retryable: stored.retryable,
  }) {}
  const refusal = StoredRefusalError.create(
    { ...stored.details },
    stored.fieldErrors === undefined ? {} : { fieldErrors: stored.fieldErrors },
  );
  // an own, non-enumerable property shadows the class-derived code, so it never counts as a detail
  Object.defineProperty(refusal, "code", { value: stored.code });
  return refusal;
}
