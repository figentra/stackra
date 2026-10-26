/**
 * Stackra file contract:
 * Purpose: `INDUSTRY_PROFILE_SCHEMA`, the zod schema of `IndustryProfile` (its `X$`): an industry template (the seed
 *          pack's `industry-template` record kind: salon, restaurant, clinic) as it shapes the checklists a new scope
 *          starts with, by checklist key, each a customization (unlocked steps hidden, unlocked steps reordered).
 * Boundary: shape only; `ChecklistService.applyProfile` checks each customization against the scope's seeded template
 *           and applies it at sign-up only, never over a scope's own customization. Other record kinds of the same
 *           profile (settings, rule sets, automations) are seeded by their owners.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decision 4); config-model section 6; RV-22; ADR 0294 (decision 26).
 */
import { z } from "zod";

import { CHECKLIST_CUSTOMIZATION_SCHEMA } from "#core/constants/checklist-customization-schema.constant";

/** The shipped `IndustryProfile$`. */
export const INDUSTRY_PROFILE_SCHEMA = z.object({
  key: z.string().regex(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/, "Expected a dotted lowercase key"),
  label: z
    .string()
    .regex(/^[a-z][a-z0-9_-]*::[a-z0-9_.-]+$/, "Expected a lang key such as module::path"),
  checklists: z.record(
    z.string().regex(/^workflow-template:[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/),
    CHECKLIST_CUSTOMIZATION_SCHEMA,
  ),
});
