/**
 * Stackra file contract:
 * Purpose: `AWARD_REVOKED_SCHEMA`, the zod schema this package ships for `AwardRevoked` (its `X$`): the award, its
 *          kind, and the recipient's model key and public id.
 * Boundary: the stand-in for what gen will write for this package. Internal: the event file registers it, and it is
 *           not exported from the entry. It never carries the revoke reason, which a person wrote.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0368 (decision 7).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `AwardRevoked$`. */
export const AWARD_REVOKED_SCHEMA = z.object({
  awardId: publicId("awd"),
  kindId: publicId("awk"),
  recipientModel: z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/),
  recipientId: z.string().min(1).max(33),
});
