/**
 * Stackra file contract:
 * Purpose: `PolicyRegistration`, one row gen hands `registerPolicies`: a model class with the policy that judges its
 *          records and, when the model declares one, the fact source its record fields are tested through.
 * Boundary: a type only. The pairing comes from the policy's type argument (`Policy<Order>`), which is gone at
 *           runtime, so this row is how `ctx.authorize(record)` finds the policy. `rules` registers the model's fields
 *           under the `record` fact source; without it a conditional deny on the model denies (fail closed).
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (as amended by 0294 and 0263: gen binds `ctx.authorize`); ADR 0305 (rule 5); ADR 0331
 *                     (decision 4: fact sources); ADR 0208 (decision 3).
 */
import type { AnyClass } from "@stackra/container";
import type { Rules } from "@stackra/rules";

import type { PolicyBase } from "#core/bases/policy.base";

/** The policy of one model. */
export interface PolicyRegistration {
  /** The model class whose records the policy judges. */
  readonly model: AnyClass;

  /** The policy class, resolved from the container when a record is authorized. */
  readonly policy: AnyClass<PolicyBase<object>>;

  /** The model's record fields as a `record` fact source, for conditional denies; absent when it declares none. */
  readonly rules?: Rules;
}
