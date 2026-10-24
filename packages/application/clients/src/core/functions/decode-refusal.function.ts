/**
 * Stackra file contract:
 * Purpose: `decodeRefusal`, turns a producer's error envelope into a refusal of this client: an instance of the loaded
 *          refusal ref with the envelope's code (the one of the action's module first), else a `ServerRefusalError`.
 * Boundary: internal to the client runtime; not exported from an entry. The envelope is untrusted data: a detail whose
 *           name a refusal already uses (`code`, `kind`, `message`) is dropped rather than allowed to shadow it. The
 *           decoded refusal reports the envelope's kind and `retryable`.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0232 (codes).
 */
import type { ErrorEnvelope } from "@stackra/errors";

import { DECODED_ENVELOPE } from "#core/constants/decoded-envelope.constant";
import { REFUSAL_REFS } from "#core/constants/refusal-refs.constant";
import { ServerRefusalError } from "#core/errors/server-refusal.error";
import type { ClientError } from "#core/types/client-error.type";

/**
 * The refusal `envelope` describes.
 *
 * @example
 * throw decodeRefusal({ code: "variant_not_found", category: "not_found", retryable: false, action: "catalogue.variant.get_by_barcode@1" });
 */
export function decodeRefusal(envelope: ErrorEnvelope): ClientError {
  const module = envelope.action?.split(".")[0];
  const candidates = REFUSAL_REFS.get(envelope.code) ?? [];
  // Every ref class is concrete at run time; its type is abstract only so gen's subclass stays the one to construct.
  const Type = (candidates.find((ref) => ref.qualifiedCode === `${module}.${envelope.code}`) ??
    candidates[0] ??
    ServerRefusalError) as new () => ClientError;
  const refusal = new Type();
  const inherited = Object.getPrototypeOf(refusal) as object;
  for (const [name, value] of Object.entries(envelope.details ?? {}))
    if (!(name in inherited))
      Object.defineProperty(refusal, name, { value, enumerable: true, configurable: true });
  if (envelope.fieldErrors !== undefined)
    Object.defineProperty(refusal, "fieldErrors", {
      value: Object.freeze({ ...envelope.fieldErrors }),
    });
  Object.defineProperty(refusal, DECODED_ENVELOPE, { value: envelope });
  return refusal;
}
