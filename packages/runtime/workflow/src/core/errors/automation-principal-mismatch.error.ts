/**
 * Stackra file contract:
 * Purpose: `AutomationPrincipalMismatchError`, the refusal to publish an automation whose principal acts in a scope that
 *          does not own the automation's scope (`automation_principal_mismatch`): a run would then act as that principal
 *          in another scope's isolation.
 * Boundary: a refusal, kind `Forbidden`; it names the automation, never the principal or a scope.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2); ADR 0153 (decision 2: the principal); ADR 0140; ADR 0294 (decision 20).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A principal from another scope.
 *
 * @example
 * throw AutomationPrincipalMismatchError.create({ automationId });
 */
export class AutomationPrincipalMismatchError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The id of the automation that was refused. */
  automationId!: PublicId<"wfa">;
}
