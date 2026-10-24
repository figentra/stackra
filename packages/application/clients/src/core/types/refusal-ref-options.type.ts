/**
 * Stackra file contract:
 * Purpose: `RefusalRefOptions`, the second argument of `refusalRef`: the translated message key and, when the producer's
 *          manifest states them, the kind and whether a retry may succeed.
 * Boundary: a type only. Without `kind` a ref declares `failed_precondition`; a refusal decoded from an envelope takes
 *           its kind and `retryable` from the envelope either way.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (kinds, decision 3 retryable).
 */
import type { ErrorKind } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";

/** What a refusal ref declares. */
export interface RefusalRefOptions {
  /** The producer's message key (`catalogue::errors.variant_not_found.message`). */
  readonly message?: I18nKey;

  /** The kind the producer declared. */
  readonly kind?: ErrorKind;

  /** Whether a retry of the same call may succeed. */
  readonly retryable?: boolean;
}
