/**
 * Stackra file contract:
 * Purpose: `StepUpRequiredError` (`step_up_required`), the testing stand-in of identity's refusal of the same name, for
 *          the memory `ActorStatusCheck` (sessions revoked or factors reset since the request).
 * Boundary: test only; actions cannot depend on `@stackra/identity`, whose driver raises the real one.
 * Runtime: node
 * Governing contract: ADR 0509 (FR-016 (e)); ADR 0207 (decision 1).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A newer authentication is needed. */
export class StepUpRequiredError extends Refusal({
  kind: ErrorKind.Unauthenticated,
  retryable: false,
}) {}
