/**
 * Stackra file contract:
 * Purpose: `decidePolicy`, the answer of a record's policy method named after the verb of the call's permission.
 * Boundary: internal to the access-control drivers; fails closed: a policy that cannot be resolved (`connectPolicies` not
 *           called) or answers something other than a `Decision` is an error.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (as amended by 0294 and 0263); ADR 0138 (as amended: the record policy runs inside
 *                     `handle`); STA-2025.
 */
import { type Actor, Enum } from "@stackra/contracts";

import { POLICY_REGISTRY } from "#core/constants/policy-registry.constant";
import { Decision } from "#core/enums/decision.enum";
import type { PolicyRegistration } from "#core/types/policy-registration.type";

/** The three answers a policy method may give. */
const DECISIONS: ReadonlySet<unknown> = new Set(Enum.values(Decision));

/** The answer of the policy method named after the verb of `permission`; `Abstain` when the policy has none. */
export async function decidePolicy(
  row: PolicyRegistration,
  permission: string,
  actor: Actor,
  record: object,
): Promise<Decision> {
  const { resolver } = POLICY_REGISTRY;
  if (resolver === undefined)
    throw new Error(
      `${row.policy.name} cannot run: call connectPolicies(container) once the container is booted`,
    );
  const policy = resolver.get(row.policy);
  const method: unknown = Reflect.get(policy, permission.slice(permission.lastIndexOf(".") + 1));
  if (typeof method !== "function") return Decision.Abstain;
  const decision: unknown = await (method as (...args: unknown[]) => unknown).call(
    policy,
    actor,
    record,
  );
  if (!DECISIONS.has(decision))
    throw new TypeError(`${row.policy.name} answered ${String(decision)}, not a Decision`);
  return decision as Decision;
}
