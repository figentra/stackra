/**
 * Stackra file contract:
 * Purpose: `ConsentVerification`, `ConsentVerifier`'s answer: whether the verification passed and, when it did, the
 *          verifier's own reference to keep on the proof.
 * Boundary: a type in the leaf entry. The reference is the verifier's id of its check (never card data or the form's
 *           text), so the evidence trail can point at it.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (decision 5, Consequences); STA-1323.
 */

/**
 * A verification outcome.
 *
 * @example
 * const { verified, reference } = await verifier.verify(request);
 */
export interface ConsentVerification {
  /** Whether the method's check passed. */
  readonly verified: boolean;

  /** The verifier's id of the check, when it passed. */
  readonly reference?: string;
}
