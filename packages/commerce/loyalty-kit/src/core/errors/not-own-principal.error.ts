/**
 * Stackra file contract:
 * Purpose: `NotOwnPrincipalError`, the refusal when a customer tries to enroll a principal other than themselves.
 * Boundary: a refusal (`forbidden`: the caller may act only for their own principal); code `not_own_principal`,
 *           derived from the class name. It carries no details. The text is
 *           `loyalty_kit::errors.not_own_principal.message`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0140; ADR 0232; ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Built with `NotOwnPrincipalError.create()`.
 *
 * @example
 * if (input.principalId !== ctx.actor.id) throw NotOwnPrincipalError.create();
 */
export class NotOwnPrincipalError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
