/**
 * Stackra file contract:
 * Purpose: `CONSENT_SNAPSHOT_SCHEMA`, the zod schema of a decoded `ConsentSnapshot` payload, which
 *          `decodeConsentSnapshot` checks before the verifier reads a field.
 * Boundary: internal. A snapshot arrives from outside (a request header, an ingest envelope), so its payload is checked
 *           at the trust boundary even before the signature is; unknown keys are dropped. The signature is checked over
 *           the payload text as sent, not over this parse.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 2); ADR 0095 as amended (Zod at the boundary).
 */
import { z } from "zod";

/** A decoded snapshot payload. */
export const CONSENT_SNAPSHOT_SCHEMA = z.object({
  id: z.string().min(1),
  subject: z.string().min(1),
  policyVersion: z.string().min(1),
  granted: z.array(z.string().min(1)),
  refused: z.array(z.string().min(1)),
  regime: z.string().min(1),
  region: z.string().min(1).nullable(),
  globalPrivacyControl: z.boolean(),
  decidedAt: z.iso.datetime({ offset: true }).nullable(),
  issuedAt: z.iso.datetime({ offset: true }),
  expiresAt: z.iso.datetime({ offset: true }),
});
