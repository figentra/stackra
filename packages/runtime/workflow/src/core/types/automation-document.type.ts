/**
 * Stackra file contract:
 * Purpose: `AutomationDocument`, an automation (or a plan) as `AutomationDocument$` parses it: key, version, trigger,
 *          timeout and steps.
 * Boundary: a type only, inferred from the shipped schema so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0270 (decision 6); ADR 0245 (decision 8).
 */
import type { z } from "zod";

import type { AUTOMATION_DOCUMENT_SCHEMA } from "#core/constants/automation-document-schema.constant";

/** A parsed automation document. */
export type AutomationDocument = z.infer<typeof AUTOMATION_DOCUMENT_SCHEMA>;
