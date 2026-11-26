/**
 * Stackra file contract:
 * Purpose: `GUARDIAN_LOGIN_ATTESTATION_SCHEMA`, the zod schema of a decoded `GuardianLoginAttestation` payload, which
 *          `decodeGuardianLoginAttestation` checks before the verifier reads a field.
 * Boundary: internal. The token arrives as verification evidence from outside, so its payload is checked at the trust
 *           boundary even before the signature is; unknown keys are dropped. `kind` must be `consent_guardian_login`,
 *           so a consent snapshot signed by the same key never parses as an attestation. The signature is checked over
 *           the payload text as sent, not over this parse.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (Consequences); ADR 0095 as amended (Zod at the boundary); STA-2818.
 */
import { z } from "zod";

/** A public id: a lowercase prefix, an underscore and the id's characters. */
const PUBLIC_ID = /^[a-z][a-z0-9]*_[0-9A-Za-z]+$/;

/** A decoded attestation payload. */
export const GUARDIAN_LOGIN_ATTESTATION_SCHEMA = z.object({
  kind: z.literal("consent_guardian_login"),
  id: z.string().min(1).max(64),
  givenBy: z.string().max(64).regex(PUBLIC_ID),
  subject: z.string().max(64).regex(PUBLIC_ID),
  document: z.string().min(1).max(100),
  authTime: z.iso.datetime({ offset: true }),
  amr: z.array(z.string().min(1).max(32)).max(16),
  level: z.string().min(1).max(16).nullable(),
  issuedAt: z.iso.datetime({ offset: true }),
  expiresAt: z.iso.datetime({ offset: true }),
});
