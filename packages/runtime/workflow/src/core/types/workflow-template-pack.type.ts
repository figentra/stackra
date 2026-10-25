/**
 * Stackra file contract:
 * Purpose: `WorkflowTemplatePack`, a versioned document of default automations, as `WorkflowTemplatePack$` parses it.
 * Boundary: a type only, inferred from the shipped schema so the two never drift.
 * Runtime: isomorphic
 * Governing contract: config-model sections 5 and 6.
 */
import type { z } from "zod";

import type { WORKFLOW_TEMPLATE_PACK_SCHEMA } from "#core/constants/workflow-template-pack-schema.constant";

/** A parsed workflow template pack. */
export type WorkflowTemplatePack = z.infer<typeof WORKFLOW_TEMPLATE_PACK_SCHEMA>;
