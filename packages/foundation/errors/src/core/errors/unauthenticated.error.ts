/**
 * Stackra file contract:
 * Purpose: `UnauthenticatedError`, the core refusal when the call carries no verified caller and the endpoint is not
 *          public.
 * Boundary: a core refusal: raised by the generated gateway, before any action runs (ADR 0237); a client may sign in
 *           and try again. Kind `Unauthenticated`, code `unauthenticated`, no details, so nothing about the refused
 *           call travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds), ADR 0294 (decisions 16 and 20), ADR 0237 (generated gateway), ADR
 *                     0082 (API areas and auth)
 */
import { Refusal } from "#core/bases/refusal.base";
import { ErrorKind } from "#core/enums/error-kind.enum";

/** Not retryable as is: the caller must sign in first. */
export class UnauthenticatedError extends Refusal({
  kind: ErrorKind.Unauthenticated,
  retryable: false,
}) {}
