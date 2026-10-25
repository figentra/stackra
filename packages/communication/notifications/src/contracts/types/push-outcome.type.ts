/**
 * Stackra file contract:
 * Purpose: `PushOutcome`, what a push send returns: accepted with the provider's id, or the device is gone (and was
 *          revoked).
 * Boundary: a type only. Any other failure is a refusal, not an outcome.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); RFC 8030 (section 6.2).
 */

/** The result of one push. */
export type PushOutcome =
  | { readonly status: "sent"; readonly providerId: string }
  | { readonly status: "revoked" };
