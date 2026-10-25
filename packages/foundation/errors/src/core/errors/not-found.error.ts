/**
 * Stackra file contract:
 * Purpose: `NotFoundError`, the core refusal when nothing the caller may see has the reference it gave.
 * Boundary: a core refusal: raised by generic lookups (`findOneOrFail`) when a module declares no more specific not-
 *           found refusal. Kind `NotFound`, code `not_found`, no details, so nothing about the refused call travels
 *           with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0294 (decisions 16 and 20), ADR 0140
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/** Not retryable: the reference does not resolve for this caller. */
export class NotFoundError extends Refusal({
  kind: ErrorKind.NotFound,
  retryable: false,
}) {}
