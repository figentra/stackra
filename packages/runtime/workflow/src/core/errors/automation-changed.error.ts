/**
 * Stackra file contract:
 * Purpose: `AutomationChangedError`, the refusal of a draft that lost the race for its revision number: another draft
 *          of the same automation was written first. A 409 that a retry, which takes the next number, resolves.
 * Boundary: a refusal; it names the automation and never the document.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3: automations are versioned); ADR 0270 (decision 6: OCC); ADR 0140; ADR 0294
 *                     (decision 20).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Two drafts of one automation at once.
 *
 * @example
 * throw AutomationChangedError.create({ automationId });
 */
export class AutomationChangedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: true,
}) {
  /** The automation whose revision number was taken. */
  automationId!: PublicId<"wfa">;
}
