/**
 * Stackra file contract:
 * Purpose: `encodeGuardianLoginAttestation(attestation, signer)`, the compact token of a guardian sign-in attestation:
 *          the base64url of its canonical JSON, the base64url of the signing key's id, and the base64url ES256
 *          signature over the first segment's text, joined by dots (the consent snapshot's token form).
 * Boundary: internal; the only writer of the token form `decodeGuardianLoginAttestation` reads. Signs through the
 *           `Signer` port, so the private key can stay in KMS. Never logs the attestation or the signature.
 * Runtime: isomorphic
 * Governing contract: ADR 0416 (one canonical form for signatures); ADR 0472 (decision 2: the token form); STA-2818.
 */
import type { Signer } from "@stackra/contracts";
import { base64url, canonicalJson } from "@stackra/support";

import type { GuardianLoginAttestation } from "#core/types/guardian-login-attestation.type";

/**
 * The signed compact token of `attestation`.
 *
 * @example
 * const token = await encodeGuardianLoginAttestation(attestation, signer); // "<payload>.<key id>.<signature>"
 */
export async function encodeGuardianLoginAttestation(
  attestation: GuardianLoginAttestation,
  signer: Signer,
): Promise<string> {
  const payload = base64url.encode(new TextEncoder().encode(canonicalJson(attestation)));
  const signature = await signer.sign(new TextEncoder().encode(payload));
  const keyId = base64url.encode(new TextEncoder().encode(signature.keyId));
  return `${payload}.${keyId}.${signature.value}`;
}
