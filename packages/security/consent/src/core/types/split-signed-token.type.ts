/**
 * Stackra file contract:
 * Purpose: `SplitSignedToken`, a compact signed token split into its parsed, not yet shape-checked payload, the exact
 *          bytes that were signed, and the detached signature.
 * Boundary: internal type; what `splitSignedToken` returns and the snapshot and attestation decoders shape-check.
 *           Nothing in it is trusted until its payload passes a schema and its signature verifies with a trusted key.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 2: the token form); ADR 0416; STA-2818.
 */
import type { Signature } from "@stackra/contracts";

/** A split, not yet checked, signed token. */
export interface SplitSignedToken {
  /** The payload's JSON, parsed and unchecked. */
  readonly payload: unknown;

  /** The bytes the signature covers: the token's first segment as sent. */
  readonly message: Uint8Array;

  /** The detached ES256 signature and the key id it names. */
  readonly signature: Signature;
}
