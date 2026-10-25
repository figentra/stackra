/**
 * Stackra file contract:
 * Purpose: `SignatureSigner`, one person asked to sign an envelope, with the contact the provider reaches them on.
 * Boundary: a type only; personal data that travels to the provider the tenant's Connection names (ADR 0356). At least
 *           one of `email` and `phone` is needed by every provider; the driver refuses a signer it cannot reach.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5).
 */

/** A signer of an envelope. */
export interface SignatureSigner {
  /** The name shown to the signer and printed in the provider's certificate. */
  readonly name: string;

  /** The address the provider sends the signing link to. */
  readonly email?: string;

  /** The number the provider sends the signing link or one-time code to (E.164). */
  readonly phone?: string;

  /** The signing order, from 1; signers with the same order sign in parallel. */
  readonly order: number;
}
