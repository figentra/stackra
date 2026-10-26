/**
 * Stackra file contract:
 * Purpose: `ChecklistTemplate`, a parsed checklist template: its key, version and steps, as `ChecklistTemplate$` parses it.
 * Boundary: a type only, inferred from the shipped schema so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0424.
 */
import type { z } from "zod";

import type { CHECKLIST_TEMPLATE_SCHEMA } from "#core/constants/checklist-template-schema.constant";

/** A parsed checklist template: its key, version and steps. */
export type ChecklistTemplate = z.output<typeof CHECKLIST_TEMPLATE_SCHEMA>;
