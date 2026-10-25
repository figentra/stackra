/**
 * Stackra file contract:
 * Purpose: `DisputeEvidence`, what the merchant sends to contest a chargeback.
 * Boundary: a type in the leaf entry; files are ids the provider gave for uploads made through its own file API.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (Enforcement: the dispute port).
 */

/**
 * The merchant's answer.
 *
 * @example
 * await gateway.respond(dispute.providerRef, { text: "Delivered on 2 May, signed by the customer." });
 */
export interface DisputeEvidence {
  /** The merchant's statement. */
  readonly text: string;

  /** Provider file ids of supporting documents. */
  readonly files?: readonly string[];
}
