/**
 * Stackra file contract:
 * Purpose: `automationProblems`, every problem of an automation document by path, as `@stackra/workflow`'s
 *          `checkAutomation` reports them (an unregistered or wrong-kind block, a forward reference, a condition over
 *          an unknown fact, a shape it refuses), for the automation editor.
 * Boundary: pure; it never throws, so the editor shows problems while an automation is incomplete; the host's save
 *           runs the same check through `AutomationService.draft`.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decision 3: the automation editor); ADR 0122 (decision 3); ADR 0153 (decision 1);
 *                     ADR 0140.
 */
import { type FieldErrors, isRefusal } from "@stackra/errors";
import { AutomationInvalidError, checkAutomation } from "@stackra/workflow";

/**
 * The problems of `document`; `{}` when it has none.
 *
 * @example
 * automationProblems(draft); // { "steps.0.block": "block_unknown" }
 */
export function automationProblems(document: unknown): FieldErrors {
  try {
    checkAutomation(document);
    return {};
  } catch (error) {
    if (isRefusal(error, AutomationInvalidError))
      return error.fieldErrors ?? { "(root)": "invalid" };
    throw error;
  }
}
