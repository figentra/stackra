/**
 * Stackra file contract:
 * Purpose: `ANALYTICS_IDENTITY_SCHEMA`, the zod schema of a kept `AnalyticsIdentityRecord`, which
 *          `parseAnalyticsIdentity` checks a cookie or a storage value against before the client trusts it.
 * Boundary: internal. A kept value comes from outside the code (a cookie the visitor can edit, an area another version
 *           wrote), so it is checked at the trust boundary; unknown keys are dropped and ids are bounded in length.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 5); ADR 0095 as amended (Zod at the boundary).
 */
import { z } from "zod";

/** An id as kept: non-empty, at most 128 characters. */
const ID = z.string().min(1).max(128);

/** A kept identity. */
export const ANALYTICS_IDENTITY_SCHEMA = z.object({
  anonymousId: ID,
  userId: ID.optional(),
  groups: z.record(z.string().min(1).max(64), ID).optional(),
});
