/**
 * Stackra file contract:
 * Purpose: `DecodedConsentSnapshot`, a snapshot token split into what the verifier checks: the payload, the exact
 *          bytes that were signed, and the detached signature.
 * Boundary: internal type; what `decodeConsentSnapshot` returns and `ConsentSnapshotVerifier` reads. Nothing in it is
 *           trusted until the signature verifies with a trusted key.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 2); ADR 0416.
 */
import type { Signature } from "@stackra/contracts";

import type { ConsentSnapshot } from "#contracts/types/consent-snapshot.type";

/** A decoded, not yet verified, snapshot token. */
export interface DecodedConsentSnapshot {
  /** The payload, shape-checked only. */
  readonly snapshot: ConsentSnapshot;

  /** The bytes the signature covers: the token's first segment as sent. */
  readonly message: Uint8Array;

  /** The detached ES256 signature and the key id it names. */
  readonly signature: Signature;
}
