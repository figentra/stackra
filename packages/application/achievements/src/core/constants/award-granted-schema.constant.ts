/**
 * Stackra file contract:
 * Purpose: `AWARD_GRANTED_SCHEMA`, the zod schema this package ships for `AwardGranted` (its `X$`): the award, its
 *          kind, the recipient's model key and public id, the level and the period.
 * Boundary: the stand-in for what gen will write for this package. Internal: the event file registers it, and it is
 *           not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0368 (decision 7).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `AwardGranted$`. */
export const AWARD_GRANTED_SCHEMA = z.object({
  awardId: publicId("awd"),
  kindId: publicId("awk"),
  recipientModel: z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/),
  recipientId: z.string().min(1).max(33),
  level: z.string().min(1).max(120).nullable(),
  period: z.string().min(1).max(60).nullable(),
});
