/**
 * Stackra file contract:
 * Purpose: `ForbiddenError`, the core refusal when the caller may not do this: the permission derived from the action
 *          key, or a record rule, refused it.
 * Boundary: a core refusal: raised by the permission step of the action pipeline and `ctx.authorize(record)` (ADR 0138,
 *           0132). Kind `Forbidden`, code `forbidden`, no details, so nothing about the refused call travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0294 (decisions 16 and 20), ADR 0132 (permissions), ADR 0138
 *                     (pipeline order)
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/** Not retryable: the same caller is refused again until a grant changes. */
export class ForbiddenError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
