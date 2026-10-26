/**
 * Stackra file contract:
 * Purpose: `ChecklistCustomization`, a scope's checklist customization: the unlocked steps it hides and the order of its unlocked steps, as `ChecklistCustomization$` parses it.
 * Boundary: a type only, inferred from the shipped schema so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0424.
 */
import type { z } from "zod";

import type { CHECKLIST_CUSTOMIZATION_SCHEMA } from "#core/constants/checklist-customization-schema.constant";

/** A scope's checklist customization: the unlocked steps it hides and the order of its unlocked steps. */
export type ChecklistCustomization = z.output<typeof CHECKLIST_CUSTOMIZATION_SCHEMA>;
