/**
 * Stackra file contract:
 * Purpose: `IssuedConsentSnapshot`, what `ConsentSnapshotIssuer.issue` answers: the compact signed token the client
 *          sends in the `Stackra-Consent` header, and the snapshot it carries, so the endpoint can tell the client when
 *          to ask again.
 * Boundary: a type only. The token is opaque to the client; only a verifier reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decisions 1 to 3).
 */
import type { ConsentSnapshot } from "#contracts/types/consent-snapshot.type";

/** A freshly signed snapshot. */
export interface IssuedConsentSnapshot {
  /** The compact token: base64url payload, base64url key id and base64url signature, joined by dots. */
  readonly token: string;

  /** The snapshot the token carries. */
  readonly snapshot: ConsentSnapshot;
}
