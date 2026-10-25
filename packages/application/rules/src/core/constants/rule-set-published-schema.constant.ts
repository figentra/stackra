/**
 * Stackra file contract:
 * Purpose: `RULE_SET_PUBLISHED_SCHEMA`, the zod schema of `RuleSetPublished` that this package ships (its `X$`).
 * Boundary: the stand-in for what gen will write for this package. Internal: `rule-set-published.event.ts` registers
 *           it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0331 (decision 5).
 */
import { publicId } from "@stackra/validation";
import { z } from "zod";

/** The shipped `RuleSetPublished$`. */
export const RULE_SET_PUBLISHED_SCHEMA = z.object({
  ruleSetId: publicId("rset"),
  consumer: z.string().min(1),
  revision: z.int().min(1),
});
