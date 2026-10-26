/**
 * Stackra file contract:
 * Purpose: `RuleSetChangedError`, the refusal of a draft that lost the race for its revision number: another draft of
 *          the same rule set was written first. A 409 that a retry, which takes the next number, resolves.
 * Boundary: a refusal; it names the rule set and never the condition.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 5); ADR 0140 (error envelope); ADR 0294 (decision 20).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Two drafts of one rule set at once.
 *
 * @example
 * throw RuleSetChangedError.create({ ruleSetId });
 */
export class RuleSetChangedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: true,
}) {
  /** The rule set whose revision number was taken. */
  ruleSetId!: PublicId<"rset">;
}
