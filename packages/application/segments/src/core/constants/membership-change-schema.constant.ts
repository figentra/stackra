/**
 * Stackra file contract:
 * Purpose: `MEMBERSHIP_CHANGE_SCHEMA`, the zod schema this package ships for `MembershipEntered` and `MembershipLeft`
 *          (their `X$`): the segment, the subject model's key and the subject's public id.
 * Boundary: the stand-in for what gen will write for this package; the two events carry the same fields. Internal:
 *           the event files register it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0332 (decisions 3 and 4).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `MembershipEntered$` and `MembershipLeft$`. */
export const MEMBERSHIP_CHANGE_SCHEMA = z.object({
  segmentId: publicId("seg"),
  subjectModel: z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/),
  subjectId: z.string().min(1).max(33),
});
