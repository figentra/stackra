/**
 * Stackra file contract:
 * Purpose: `AutomationNotDryRunError`, the refusal to publish an automation revision that has no dry run: a 412 that a
 *          dry run of that same revision resolves.
 * Boundary: a refusal; it names the automation and the revision, never the document.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3: publishing needs a dry run); ADR 0270 (decision 6: automation, with dry
 *                     run); ADR 0140; ADR 0294 (decision 20).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A publish before a dry run.
 *
 * @example
 * throw AutomationNotDryRunError.create({ automationId, revision: 3 });
 */
export class AutomationNotDryRunError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The automation. */
  automationId!: PublicId<"wfa">;

  /** The revision that has no dry run. */
  revision!: number;
}
