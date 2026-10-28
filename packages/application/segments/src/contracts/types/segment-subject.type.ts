/**
 * Stackra file contract:
 * Purpose: `SegmentSubject`, what a consumer implements so segments may cover one of its models: the fields a segment's
 *          rules over it may test, its subjects page by page, and the facts of a set of them.
 * Boundary: a type only, not a port: each subject model is its own class, registered with `registerSegmentSubjects`
 *           and resolved from the container `SegmentService` is connected to. Both methods run in the scope session
 *           of the segment being computed, so they read only the subjects at or below its scope node (row-level
 *           security). The consumer computes the facts; segments only evaluate them through @stackra/rules.
 * Runtime: isomorphic
 * Governing contract: ADR 0332 (decisions 1 to 3); ADR 0331 (decisions 4 and 9).
 */
import type { RuleFacts, Rules } from "@stackra/rules";

/**
 * A model segments may cover.
 *
 * @example
 * export class CustomerSegmentSubject extends Service implements SegmentSubject {
 *   readonly rules = CUSTOMER_SEGMENT_RULES;
 *
 *   async ids(after: string | null, limit: number): Promise<readonly string[]> { ... }
 *
 *   async facts(ids: readonly string[]): Promise<ReadonlyMap<string, RuleFacts>> { ... }
 * }
 */
export interface SegmentSubject {
  /** The fields a segment over this model may test; its key is the consumer key of the segment's rule set. */
  readonly rules: Rules;

  /** Up to `limit` public ids of the subjects in the running scope, ascending, after `after` (from the first when null). */
  ids: (after: string | null, limit: number) => Promise<readonly string[]>;

  /** The facts of each of `ids` in the running scope, by public id; an id left out is no subject there (deleted). */
  facts: (ids: readonly string[]) => Promise<ReadonlyMap<string, RuleFacts>>;
}
