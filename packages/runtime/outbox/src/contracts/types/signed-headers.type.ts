/**
 * Stackra file contract:
 * Purpose: `SignedHeaders`, the three headers that sign a delivery (the Standard Webhooks layout, research R-4):
 *          `webhook-id`, `webhook-timestamp` (Unix seconds) and `webhook-signature` (`v1a,<key id>,<base64>`).
 * Boundary: a type only; an `EventSigner` makes them and an `InboxVerifier` reads them.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12 and 16); the Standard Webhooks header layout.
 */

/** The signature headers of one delivery request; a type alias, so it passes as a plain header record. */
export type SignedHeaders = {
  /** The delivery id. */
  readonly "webhook-id": string;

  /** When it was signed, Unix seconds. */
  readonly "webhook-timestamp": string;

  /** `v1a,<key id>,<base64 Ed25519 signature>`; several space-separated during a rotation. */
  readonly "webhook-signature": string;
};
