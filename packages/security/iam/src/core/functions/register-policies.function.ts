/**
 * Stackra file contract:
 * Purpose: `registerPolicies`, how gen's generated entry tells `ctx.authorize(record)` which policy judges the records
 *          of which model, and which fact source tests their fields.
 * Boundary: writes the process-wide registry; a later row for a model replaces the earlier one. Checks each row, so a
 *           wrong row fails at boot rather than on the first record.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (as amended by 0294 and 0263); ADR 0294 (decisions 10 and 22).
 */
import { kindOf } from "@stackra/container";
import { Rules } from "@stackra/rules";

import { POLICY_REGISTRY } from "#core/constants/policy-registry.constant";
import type { PolicyRegistration } from "#core/types/policy-registration.type";

/**
 * Registers the policy of each model.
 *
 * @throws TypeError when a row's model is not a class, its policy does not extend `Policy`, or its rules are not a
 *         `Rules` registry.
 * @example
 * registerPolicies([{ model: Order, policy: OrderPolicy }]);
 */
export function registerPolicies(rows: readonly PolicyRegistration[]): void {
  for (const row of rows) {
    if (typeof row.model !== "function")
      throw new TypeError("registerPolicies: a row's model is a model class");
    if (kindOf(row.policy)?.kind !== "policy")
      throw new TypeError(`registerPolicies: ${row.policy.name} does not extend Policy<Model>`);
    if (row.rules !== undefined && !(row.rules instanceof Rules))
      throw new TypeError(
        `registerPolicies: the rules of ${row.model.name} are not Rules.create(...)`,
      );
    POLICY_REGISTRY.rows.set(row.model, Object.freeze({ ...row }));
  }
}
