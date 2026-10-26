/**
 * Stackra file contract:
 * Purpose: `checkCustomization`, the check of a scope's checklist customization against its template: every hidden and
 *          ordered step exists, is unlocked and appears once in its list.
 * Boundary: pure. It is the trust boundary for a customization from a studio or an industry profile; `checklistView`
 *           trusts what passed it, and drops what a later template version removed or locked.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decision 1: a scope hides or reorders unlocked steps and never removes a locked one).
 */
import type { FieldErrors } from "@stackra/errors";

import { CHECKLIST_CUSTOMIZATION_SCHEMA } from "#core/constants/checklist-customization-schema.constant";
import { ChecklistInvalidError } from "#core/errors/checklist-invalid.error";
import type { ChecklistCustomization } from "#core/types/checklist-customization.type";
import type { ChecklistTemplate } from "#core/types/checklist-template.type";

/**
 * `input` as a customization of `template`.
 *
 * @throws ZodError when `input` is not a customization; ChecklistInvalidError with a field error per refused key.
 * @example
 * checkCustomization(onboarding, { hidden: ["import_products"], order: ["invite_staff"] });
 */
export function checkCustomization(
  template: ChecklistTemplate,
  input: unknown,
): ChecklistCustomization {
  const customization = CHECKLIST_CUSTOMIZATION_SCHEMA.parse(input);
  const steps = new Map(template.steps.map((step) => [step.key, step]));
  const errors: Record<string, string> = {};
  for (const list of ["hidden", "order"] as const)
    customization[list].forEach((key, index) => {
      const step = steps.get(key);
      if (step === undefined) errors[`${list}.${index}`] = "step_unknown";
      else if (step.locked) errors[`${list}.${index}`] = "step_locked";
      else if (customization[list].indexOf(key) !== index)
        errors[`${list}.${index}`] = "step_duplicate";
    });
  if (Object.keys(errors).length > 0)
    throw ChecklistInvalidError.create({}, { fieldErrors: errors as FieldErrors });
  return customization;
}
