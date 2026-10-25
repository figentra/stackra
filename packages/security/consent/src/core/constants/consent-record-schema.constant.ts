/**
 * Stackra file contract:
 * Purpose: `CONSENT_RECORD_SCHEMA`, the zod schema of a stored `ConsentRecord`, which `parseConsentRecord` checks a
 *          cookie or a storage value against before the ledger trusts it.
 * Boundary: internal. A stored value comes from outside the code (a cookie the visitor can edit, an area another
 *           version wrote), so it is checked at the trust boundary; unknown keys are dropped.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 3); ADR 0095 as amended (Zod at the boundary).
 */
import { z } from "zod";

/** A stored decision. */
export const CONSENT_RECORD_SCHEMA = z.object({
  policyVersion: z.string().min(1),
  decidedAt: z.iso.datetime({ offset: true }),
  categories: z.record(z.string().min(1), z.boolean()),
});
