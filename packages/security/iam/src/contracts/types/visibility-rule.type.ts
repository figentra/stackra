/**
 * Stackra file contract:
 * Purpose: `VisibilityRule`, who may see, list or use which records of one model: an audience, a capability and a
 *          `@stackra/rules` condition over the record's attributes, allowing or denying.
 * Boundary: a type only, and a scope's data that references registered fields. It sits on top of row-level isolation and
 *           never replaces it (ADR 0333 decision 5). A deny beats an allow; a record no rule matches gets no answer
 *           here (`Decision.Abstain`), because no default is decided (ADR 0333 decision 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decisions 1 to 3 and 7); ADR 0208 (decision 3); ADR 0331.
 */
import type { Condition } from "@stackra/rules";

import type { Capability } from "#contracts/enums/capability.enum";
import type { Audience } from "#contracts/types/audience.type";

/**
 * A visibility rule.
 *
 * @example
 * const privateSale: VisibilityRule = {
 *   model: "catalogue.product",
 *   audience: { kind: "segment", id: vipId },
 *   capability: Capability.Use,
 *   condition: { field: "record.collection", operator: Operator.Equals, value: "private_sale" },
 * };
 */
export interface VisibilityRule {
  /** The model's key (`catalogue.product`). */
  readonly model: string;

  /** Who the rule is about. */
  readonly audience: Audience;

  /** What it lets the audience do, or refuses. */
  readonly capability: Capability;

  /** The records it covers (fields under the `record` fact source); absent for every record of the model. */
  readonly condition?: Condition;

  /** Refuses instead of allowing; a deny beats every allow. */
  readonly deny?: boolean;
}
