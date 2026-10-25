/**
 * Stackra file contract:
 * Purpose: `RefusalOptions`, what the called kind base takes: `Refusal({ kind, retryable })`.
 * Boundary: a type only. The code is never an option: it is derived from the class name (0294 decision 20).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20), ADR 0305 (rule 2: a kind with options is called), ADR 0140.
 */
import type { ErrorKind } from "#core/enums/error-kind.enum";

/** The options of `Refusal({ ... })`. */
export interface RefusalOptions {
  /** The kind, which gives the category and the transport status. */
  readonly kind: ErrorKind;

  /** Whether the same call may succeed later; the kind's default when left out. */
  readonly retryable?: boolean;
}
