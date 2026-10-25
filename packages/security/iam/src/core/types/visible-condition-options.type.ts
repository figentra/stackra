/**
 * Stackra file contract:
 * Purpose: `VisibleConditionOptions`, what the decision point's `visibleCondition` takes beside the actor, the
 *          capability and the model: where the call acts, the time, the model's registered attributes, and what a
 *          record no rule matches gets.
 * Boundary: a type only. `unmatched` has no default anywhere in code: ADR 0333 decision 7 leaves the answer open for
 *           the owner, so whoever registers a model states it. Without `rules` the model registered no attributes, so a
 *           rule with a condition cannot be tested and is read closed: an allow matches no record, a deny every one.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decisions 2, 4 and 7); ADR 0331 (decision 4: fact sources); ADR 0208 (decision 3).
 */
import type { Rules } from "@stackra/rules";

import type { Decision } from "#core/enums/decision.enum";
import type { CheckOptions } from "#core/types/check-options.type";

/** The options of `visibleCondition`. */
export interface VisibleConditionOptions extends Omit<CheckOptions, "record"> {
  /** The model's attributes as the `record` fact source; absent when it registers none. */
  readonly rules?: Rules;

  /** What a record no allow rule matches gets: `Allow` (visible unless denied) or `Deny` (hidden). */
  readonly unmatched: Exclude<Decision, typeof Decision.Abstain>;
}
