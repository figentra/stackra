/**
 * Stackra file contract:
 * Purpose: `ChecklistInvalidError`, the refusal of a checklist change the template does not allow: a customization that
 *          hides or reorders a locked step (`step_locked`), names a step the template does not have (`step_unknown`) or
 *          lists one twice (`step_duplicate`), and the completion of an unknown step.
 * Boundary: a refusal with field errors by path (`hidden.0`, `order.2`, `step`); it never echoes the template.
 * Runtime: isomorphic
 * Governing contract: ADR 0424 (decision 1: a scope never removes a locked step); ADR 0140; ADR 0294 (decision 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A checklist change the template does not allow.
 *
 * @example
 * throw ChecklistInvalidError.create({}, { fieldErrors: { "hidden.0": "step_locked" } });
 */
export class ChecklistInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
