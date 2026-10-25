/**
 * Stackra file contract:
 * Purpose: `PolicyOptions`, the options of the called form `Policy<Order>({ permissions })`: the permission set whose
 *          verbs the policy's methods are named after, when its stem differs from the policy's.
 * Boundary: a type only. A policy whose stem matches its permission set (`OrderPolicy`, `OrderPermissions`) is written
 *           bare and takes no options (ADR 0305 rule 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 5 to 7); ADR 0132 (as amended by 0294).
 */
import type { AnyClass } from "@stackra/container";

import type { Permissions } from "#core/bases/permissions.base";

/** The options of a policy class. */
export interface PolicyOptions {
  /** The permission set the policy refines, when it is not the sibling of the same stem. */
  readonly permissions?: AnyClass<Permissions>;
}
