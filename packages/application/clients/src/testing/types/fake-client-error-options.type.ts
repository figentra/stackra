/**
 * Stackra file contract:
 * Purpose: `FakeClientErrorOptions`, what `fakeClientError` takes: the refusal class to build (a consumed refusal ref)
 *          and the message to give it.
 * Boundary: a type only. Without `refusal` the error is a `ServerRefusalError`, a code no loaded ref declares.
 * Runtime: node
 * Governing contract: ADR 0269 (fakes); ADR 0140 (refusals).
 */
import type { ClientError } from "#core/types/client-error.type";

/** How to build a client error for a test. */
export interface FakeClientErrorOptions {
  /** The refusal class (`InsufficientStockError`); its message key becomes the error's `refusalKey`. */
  readonly refusal?: new () => ClientError;

  /** The error's message, as an untranslated envelope would read. */
  readonly message?: string;
}
