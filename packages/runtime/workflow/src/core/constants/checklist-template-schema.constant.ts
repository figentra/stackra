/**
 * Stackra file contract:
 * Purpose: `CHECKLIST_TEMPLATE_SCHEMA`, the zod schema of `ChecklistTemplate` (its `X$`): a product's checklist as a
 *          versioned seed document (`checklist-template` record kind) keyed `workflow-template:<product>:<name>`
 *          (`workflow-template:commerce:onboarding`), with 1 to 50 steps, each a snake_case key, a lang-key label and
 *          optional description, a `locked` flag (false by default), an audience (`scope` by default) and an optional
 *          console route key the step links to.
 * Boundary: shape only. Step keys are unique. The text is lang keys, never prose, and a step holds no code: completing
 *           it is an action the product's own module calls. A locked step can be neither hidden nor reordered by a
 *           scope.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decisions 1 and 2); config-model sections 5 and 6 (templates ship as versioned seed
 *                     documents); RV-22; ADR 0294 (decision 26).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { CHECKLIST_STEP_KEY } from "#core/constants/checklist-step-key.constant";
import { ChecklistAudience } from "#core/enums/checklist-audience.enum";

/** A lang key (`<module>::<path>`). */
const LABEL = z
  .string()
  .regex(/^[a-z][a-z0-9_-]*::[a-z0-9_.-]+$/, "Expected a lang key such as module::path");

/** The shipped `ChecklistTemplate$`. */
export const CHECKLIST_TEMPLATE_SCHEMA = z
  .object({
    key: z
      .string()
      .regex(
        /^workflow-template:[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/,
        "Expected workflow-template:<product>:<name>",
      ),
    version: z
      .string()
      .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "Expected major.minor.patch"),
    steps: z
      .array(
        z.object({
          key: CHECKLIST_STEP_KEY,
          label: LABEL,
          description: LABEL.optional(),
          locked: z.boolean().default(false),
          audience: z
            .enum(Enum.values(ChecklistAudience) as [ChecklistAudience, ...ChecklistAudience[]])
            .default(ChecklistAudience.Scope),
          route: z
            .string()
            .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/, "Expected a route key")
            .optional(),
        }),
      )
      .min(1)
      .max(50),
  })
  .refine(
    (template) => new Set(template.steps.map((step) => step.key)).size === template.steps.length,
    {
      message: "Two steps share a key",
      path: ["steps"],
    },
  );
