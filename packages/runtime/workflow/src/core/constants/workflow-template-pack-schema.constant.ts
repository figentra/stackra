/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_TEMPLATE_PACK_SCHEMA`, the zod schema of `WorkflowTemplatePack` (its `X$`): a versioned document
 *          of default automations that a product's seed pack ships (onboarding steps, COD confirmation, booking to
 *          checkout), each an automation document.
 * Boundary: shape only. Each template is checked as an automation document against the registry when seeded
 *           (`checkAutomation`), so this schema keeps it as JSON with its key. The pack key is a dotted lowercase
 *           path, its version `major.minor.patch`; template keys are unique within a pack.
 * Runtime: isomorphic
 * Governing contract: config-model sections 5 and 6 (workflow templates ship as versioned seed documents); ADR 0122
 *                     (decision 3); ADR 0294 (decision 26).
 */
import { z } from "zod";

/** The shipped `WorkflowTemplatePack$`. */
export const WORKFLOW_TEMPLATE_PACK_SCHEMA = z
  .object({
    key: z.string().regex(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/, "Expected a dotted lowercase key"),
    version: z
      .string()
      .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "Expected major.minor.patch"),
    templates: z.array(z.looseObject({ key: z.string().min(1) })),
  })
  .refine(
    (pack) =>
      new Set(pack.templates.map((template) => template.key)).size === pack.templates.length,
    { message: "Two templates share a key", path: ["templates"] },
  );
