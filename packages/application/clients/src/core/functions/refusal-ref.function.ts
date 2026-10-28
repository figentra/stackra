/**
 * Stackra file contract:
 * Purpose: `refusalRef`, the base gen writes a consumed refusal class over
 *          (`class VariantNotFoundError extends refusalRef("catalogue.variant_not_found", { message }) {}`): a
 *          `Refusal` of this client whose code is the producer's, with its message key and module-qualified code.
 * Boundary: the class is recorded by its code, so `decodeRefusal` turns the producer's envelope into an instance of it
 *           and `isRefusal(error, VariantNotFoundError)` holds. A decoded instance takes its kind and `retryable` from
 *           the envelope; without one the declared kind applies (`failed_precondition` when none is declared).
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0232 (codes from class names); ADR 0260 (decision 2).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

import { REFUSAL_REFS } from "#core/constants/refusal-refs.constant";
import { defineStatics } from "#core/functions/define-statics.function";
import { installDecodedAccessors } from "#core/functions/install-decoded-accessors.function";
import type { RefusalRef } from "#core/types/refusal-ref.type";
import type { RefusalRefOptions } from "#core/types/refusal-ref-options.type";

/** A snake_case refusal code, optionally after dotted module segments. */
const REFUSAL_CODE = /^([a-z][a-z0-9_]*\.)*[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

/**
 * A consumed refusal class.
 *
 * @throws RangeError when `code` is not a snake_case refusal code.
 * @example
 * export class VariantNotFoundError extends refusalRef("catalogue.variant_not_found", {
 *   message: I18n.catalogue.errors.variant_not_found.message,
 * }) {}
 */
export function refusalRef(code: string, options: RefusalRefOptions = {}): RefusalRef {
  if (!REFUSAL_CODE.test(code))
    throw new RangeError(
      `"${code}" is not a refusal code: snake_case, optionally module-qualified`,
    );
  const unqualified = code.slice(code.lastIndexOf(".") + 1);
  const declared = {
    kind: options.kind ?? ErrorKind.FailedPrecondition,
    ...(options.retryable === undefined ? {} : { retryable: options.retryable }),
  };
  const Ref = class extends Refusal(declared) {};
  // The code is derived from the class name, so the base carries the name the producer's class has.
  Object.defineProperty(Ref, "name", {
    value: `${unqualified.replaceAll(/(^|_)([a-z0-9])/g, (_, __, letter: string) => letter.toUpperCase())}Error`,
  });
  defineStatics(Ref, { qualifiedCode: code, messageKey: options.message });
  Object.defineProperty(Ref.prototype, "refusalKey", { get: () => options.message });
  installDecodedAccessors(Ref.prototype, declared);
  const ref = Ref as unknown as RefusalRef;
  REFUSAL_REFS.set(unqualified, [...(REFUSAL_REFS.get(unqualified) ?? []), ref]);
  return ref;
}
