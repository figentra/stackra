/**
 * Stackra file contract:
 * Purpose: `decodeGuardianLoginAttestation(token)`, an attestation token split into its shape-checked payload, the
 *          signed bytes and the detached signature, or `null` when it is not a well-formed attestation token.
 * Boundary: internal; never throws, so a forged, truncated or foreign token (a consent snapshot among them) reads as
 *           not verified, never as an error. It checks nothing about trust: the verifier checks the key, the
 *           signature, the binding and the lifetime after this. The token form (8 KiB at most, three base64url
 *           segments) is `splitSignedToken`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (Consequences); ADR 0095 as amended (Zod at the boundary); STA-2818.
 */
import type { PublicId } from "@stackra/contracts";

import { GUARDIAN_LOGIN_ATTESTATION_SCHEMA } from "#core/constants/guardian-login-attestation-schema.constant";
import { splitSignedToken } from "#core/functions/split-signed-token.function";
import type { DecodedGuardianLoginAttestation } from "#core/types/decoded-guardian-login-attestation.type";
import type { GuardianLoginAttestation } from "#core/types/guardian-login-attestation.type";

/**
 * The parts of `token`, or `null`.
 *
 * @example
 * const decoded = decodeGuardianLoginAttestation(request.evidence);
 */
export function decodeGuardianLoginAttestation(
  token: string,
): DecodedGuardianLoginAttestation | null {
  const parts = splitSignedToken(token);
  if (parts === null) return null;
  const parsed = GUARDIAN_LOGIN_ATTESTATION_SCHEMA.safeParse(parts.payload);
  if (!parsed.success) return null;
  const attestation: GuardianLoginAttestation = Object.freeze({
    ...parsed.data,
    givenBy: parsed.data.givenBy as PublicId,
    subject: parsed.data.subject as PublicId,
    amr: Object.freeze([...parsed.data.amr]),
  });
  return Object.freeze({ attestation, message: parts.message, signature: parts.signature });
}
