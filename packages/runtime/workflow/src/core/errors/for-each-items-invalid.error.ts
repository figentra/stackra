/**
 * Stackra file contract:
 * Purpose: `ForEachItemsInvalidError`, the refusal of a for-each step whose list is not a list, or holds more items
 *          than `workflow.forEachLimit` allows (OS-232: up to 1,000 by default): a 412 that fails the step without a
 *          retry, so the run compensates.
 * Boundary: a refusal; it names the step, how many items it got (absent when it got no list) and the limit, never an
 *           item.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0140; ADR 0294 (decision 20); OS-232 (for-each up to a configured
 *                     count).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A for-each list the step cannot walk.
 *
 * @example
 * throw ForEachItemsInvalidError.create({ step: "notify", count: 1200, limit: 1000 });
 */
export class ForEachItemsInvalidError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The for-each step. */
  step!: string;

  /** How many items its list held; absent when the reference named no list. */
  count?: number;

  /** The most items a for-each step takes (`workflow.forEachLimit`). */
  limit!: number;
}
