/**
 * Stackra file contract:
 * Purpose: `policyRowOf`, the policy registration of a record's model, walking up its class chain.
 * Boundary: internal to the access-control drivers; reads `POLICY_REGISTRY`.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (as amended by 0294 and 0263); ADR 0138 (as amended: the record policy runs inside
 *                     `handle`); STA-2025.
 */
import type { AnyClass } from "@stackra/container";

import { POLICY_REGISTRY } from "#core/constants/policy-registry.constant";
import type { PolicyRegistration } from "#core/types/policy-registration.type";

/** The policy row of `record`'s model, walking up its class chain so a subclass model finds its base's policy. */
export function policyRowOf(record: object): PolicyRegistration | undefined {
  for (
    let type: unknown = record.constructor;
    typeof type === "function" && type !== Function.prototype;
    type = Object.getPrototypeOf(type)
  ) {
    const row = POLICY_REGISTRY.rows.get(type as AnyClass);
    if (row !== undefined) return row;
  }
  return undefined;
}
