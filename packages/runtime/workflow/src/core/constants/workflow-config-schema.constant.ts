/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_CONFIG_SCHEMA`, the shipped zod schema of the workflow configuration (`WorkflowConfig$`): the
 *          journal driver, `postgres` by default.
 * Boundary: mirrors `WorkflowEngineOptions` by hand until gen compiles this package's schemas; change both together.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26: a package ships its compiled `X$`); ADR 0292 (decision 2).
 */
import { z } from "zod";

import { WORKFLOW_JOURNALS } from "#core/constants/workflow-journals.constant";

/** The shipped `WorkflowConfig$`. */
export const WORKFLOW_CONFIG_SCHEMA = z.object({
  journal: z.enum(WORKFLOW_JOURNALS).default("postgres"),
});
