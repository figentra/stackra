/**
 * Stackra file contract:
 * Purpose: `CHECKLIST_CUSTOMIZATION_SCHEMA`, the zod schema of `ChecklistCustomization` (its `X$`): the unlocked steps
 *          a scope hides and the order it puts its unlocked steps in, each at most 50 step keys, both empty by default.
 * Boundary: shape only; which steps exist and which are locked is the template's, so `checkCustomization` checks the
 *           keys against it.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decision 1); ADR 0294 (decision 26).
 */
import { z } from "zod";

import { CHECKLIST_STEP_KEY } from "#core/constants/checklist-step-key.constant";

/** The shipped `ChecklistCustomization$`. */
export const CHECKLIST_CUSTOMIZATION_SCHEMA = z.object({
  hidden: z.array(CHECKLIST_STEP_KEY).max(50).default([]),
  order: z.array(CHECKLIST_STEP_KEY).max(50).default([]),
});
