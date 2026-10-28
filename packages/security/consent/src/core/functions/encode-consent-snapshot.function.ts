/**
 * Stackra file contract:
 * Purpose: `encodeConsentSnapshot(snapshot, signer)`, the compact token of a snapshot: the base64url of its canonical
 *          JSON, the base64url of the signing key's id, and the base64url ES256 signature over the first segment's
 *          text, joined by dots.
 * Boundary: internal; the only writer of the token form `decodeConsentSnapshot` reads. Signs through the `Signer` port,
 *           so the private key can stay in KMS. Never logs the snapshot or the signature.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 2); ADR 0416 (one canonical form for signatures).
 */
import type { Signer } from "@stackra/contracts";
import { base64url, canonicalJson } from "@stackra/support";

import type { ConsentSnapshot } from "#contracts/types/consent-snapshot.type";

/**
 * The signed compact token of `snapshot`.
 *
 * @example
 * const token = await encodeConsentSnapshot(snapshot, signer); // "eyJ...<payload>.<key id>.<signature>"
 */
export async function encodeConsentSnapshot(
  snapshot: ConsentSnapshot,
  signer: Signer,
): Promise<string> {
  const payload = base64url.encode(new TextEncoder().encode(canonicalJson(snapshot)));
  const signature = await signer.sign(new TextEncoder().encode(payload));
  const keyId = base64url.encode(new TextEncoder().encode(signature.keyId));
  return `${payload}.${keyId}.${signature.value}`;
}
