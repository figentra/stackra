/**
 * Stackra file contract:
 * Purpose: `installDecodedAccessors`, makes a refusal class report the kind and `retryable` of the envelope an instance
 *          was decoded from, and its declared ones otherwise, because a client's ref may not know the producer's kind.
 * Boundary: internal; not exported from an entry. It defines accessors on the class's prototype (TypeScript refuses an
 *           accessor over the `Refusal` interface's properties in a class body); `category` follows `kind`.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope, decision 3 retryable).
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";
import type { ErrorEnvelope } from "@stackra/errors";

import { DECODED_ENVELOPE } from "#core/constants/decoded-envelope.constant";
import { errorKindOf } from "#core/functions/error-kind-of.function";

/** The envelope a refusal was decoded from, if any. */
function envelopeOf(refusal: object): ErrorEnvelope | undefined {
  return (refusal as { readonly [DECODED_ENVELOPE]?: ErrorEnvelope })[DECODED_ENVELOPE];
}

/**
 * Installs the `kind` and `retryable` accessors on `prototype`.
 *
 * @param declared - the kind and `retryable` the class declares.
 */
export function installDecodedAccessors(
  prototype: object,
  declared: { readonly kind: ErrorKind; readonly retryable?: boolean },
): void {
  Object.defineProperties(prototype, {
    kind: {
      get(this: object): ErrorKind {
        const envelope = envelopeOf(this);
        return envelope === undefined ? declared.kind : errorKindOf(envelope.category);
      },
    },
    retryable: {
      get(this: { readonly kind: ErrorKind }): boolean {
        return (
          envelopeOf(this)?.retryable ??
          declared.retryable ??
          Enum.meta(ErrorKind, this.kind).retryable
        );
      },
    },
  });
}
