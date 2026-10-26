/**
 * Stackra file contract:
 * Purpose: `FormInvalidError`, the refusal of a form document the builder cannot store: a shape `FormDocument$`
 *          refuses, or a condition that names a field the form does not have, a field of a later step, or an operator
 *          or value its type does not take.
 * Boundary: a refusal with field errors by path (`steps.1.when.all.0`); it never echoes the document.
 * Runtime: isomorphic
 * Governing contract: ADR 0426 (decisions 1 and 2); ADR 0140; ADR 0294 (decision 20).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A form document the builder refuses.
 *
 * @example
 * throw FormInvalidError.create({}, { fieldErrors: { "steps.0.fields.1.when.(root)": "field_unknown" } });
 */
export class FormInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
