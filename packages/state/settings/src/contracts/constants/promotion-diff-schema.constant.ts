/**
 * Stackra file contract:
 * Purpose: `PROMOTION_DIFF_SCHEMA`, the shipped `PromotionDiff$`: one promotable kind's diff (the kind, the live
 *          snapshot's hash, the change rows, the previous snapshot and the optional platform release) as JSON.
 * Boundary: shape only. The rows and the snapshot stay opaque JSON, as the kind's `Promotable` wrote them; applying
 *           or rolling back a diff is the `Promotable`'s job.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); STA-1284.
 */
import { z } from "zod";

import type { PromotionDiff } from "#contracts/types/promotion-diff.type";

/** The shipped `PromotionDiff$`. */
export const PROMOTION_DIFF_SCHEMA: z.ZodType<PromotionDiff> = z.object({
  kind: z.string().min(1),
  base: z.string().min(1),
  changes: z.array(z.json()),
  previous: z.json(),
  release: z.string().min(1).exactOptional(),
});
