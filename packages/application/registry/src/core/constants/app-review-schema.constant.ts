/**
 * Stackra file contract:
 * Purpose: `APP_REVIEW_SCHEMA`, the shipped zod schema of `AppReview`: the listing key, the version, the review state,
 *          the reviewer and the notes.
 * Boundary: internal; `app-review.schema.ts` registers it.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8); ADR 0294 (decision 26: a package ships its own `X$`).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { ReviewState } from "#core/enums/review-state.enum";

/** The shipped `AppReview$`. */
export const APP_REVIEW_SCHEMA = z.object({
  app: z.string().min(1),
  version: z.string().min(1),
  state: z.enum(Enum.values(ReviewState) as [ReviewState, ...ReviewState[]]),
  reviewer: z.string().min(1).nullable().default(null),
  notes: z.string().nullable().default(null),
});
