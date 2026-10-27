/**
 * Stackra file contract:
 * Purpose: `fakeClientError`, a `ClientError` for a test of an error state: an instance of a consumed refusal class
 *          (so its `refusalKey` is the producer's message key), or a `ServerRefusalError`, with the message given.
 * Boundary: test only; the refusal is built through `@stackra/errors/testing`'s `refusal`, so it is the class's own
 *           instance and `isRefusal(error, InsufficientStockError)` holds.
 * Runtime: node
 * Governing contract: ADR 0269 (fakes); ADR 0140 (refusals).
 */
import { refusal } from "@stackra/errors/testing";

import { ServerRefusalError } from "#core/errors/server-refusal.error";
import type { ClientError } from "#core/types/client-error.type";
import type { FakeClientErrorOptions } from "#testing/types/fake-client-error-options.type";

/**
 * A client error for a test.
 *
 * @example
 * render(<ScreenState kind="error" error={fakeClientError({ refusal: InsufficientStockError })} onRetry={retry} />);
 */
export function fakeClientError(options: FakeClientErrorOptions = {}): ClientError {
  const error: ClientError = refusal(options.refusal ?? ServerRefusalError);
  // `message` is an accessor on every refusal; an own property shadows it for this one error.
  if (options.message !== undefined)
    Object.defineProperty(error, "message", { value: options.message, configurable: true });
  return error;
}
