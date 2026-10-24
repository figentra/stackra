/**
 * Stackra file contract:
 * Purpose: `remoteRefusal`, the base of a producer's refusal class in a service's generated client
 *          (`class CardDeclinedError extends remoteRefusal("payments", "card_declined", { kind, retryable }) {}`).
 * Boundary: the service form of `refusalRef`, with the module and code apart and the kind the manifest states.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0260 (decision 2).
 */
import type { RefusalOptions } from "@stackra/errors";

import { refusalRef } from "#core/functions/refusal-ref.function";
import type { RefusalRef } from "#core/types/refusal-ref.type";

/**
 * A producer's refusal class.
 *
 * @throws RangeError when `module` or `code` is not snake_case.
 * @example
 * export class CardDeclinedError extends remoteRefusal("payments", "card_declined", {
 *   kind: ErrorKind.FailedPrecondition,
 *   retryable: false,
 * }) {}
 */
export function remoteRefusal(module: string, code: string, options: RefusalOptions): RefusalRef {
  return refusalRef(`${module}.${code}`, options);
}
