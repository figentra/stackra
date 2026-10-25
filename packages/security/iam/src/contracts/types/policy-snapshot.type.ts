/**
 * Stackra file contract:
 * Purpose: `PolicySnapshot`, everything the embedded decision point needs about one principal: its grants, the custom
 *          roles they may name, its segment memberships, the deny, visibility and field rules in force and its
 *          break-glass grants, at one version.
 * Boundary: a type only. The IAM service owns writes and pushes snapshots through events; the decision point only
 *           reads one, so a check costs no network hop. Module roles are code (`registerRoles`) and never appear in
 *           `roles`; a custom role there may hold a wildcard only when its key is a `SystemRole` code.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4); ADR 0333 (decision 3); ADR 0132 (decision 5: wildcards only in
 *                     system roles).
 */
import type { PublicId } from "@stackra/contracts";

import type { BreakGlassGrant } from "#contracts/types/break-glass-grant.type";
import type { DenyRule } from "#contracts/types/deny-rule.type";
import type { FieldRule } from "#contracts/types/field-rule.type";
import type { Grant } from "#contracts/types/grant.type";
import type { VisibilityRule } from "#contracts/types/visibility-rule.type";

/**
 * One principal's policy.
 *
 * @example
 * const snapshot: PolicySnapshot = {
 *   version: 42,
 *   grants: [{ role: SystemRole.Manager, scope: acme }],
 *   roles: { manager: ["orders.order.read", "orders.order.cancel"] },
 *   segments: [],
 *   denies: [],
 *   visibility: [],
 * };
 */
export interface PolicySnapshot {
  /** Rises with every change; an audit record names the version a decision read. */
  readonly version: number;

  /** The principal's grants. */
  readonly grants: readonly Grant[];

  /** Custom and provisioned roles by key, each with the permission keys it holds. */
  readonly roles: Readonly<Record<string, readonly string[]>>;

  /** The segments the principal is a member of. */
  readonly segments: readonly PublicId[];

  /** The explicit denies in force for the principal. */
  readonly denies: readonly DenyRule[];

  /** The record visibility rules in force for the principal. */
  readonly visibility: readonly VisibilityRule[];

  /** The field-level rules in force for the principal; absent for none. */
  readonly fields?: readonly FieldRule[];

  /** The principal's break-glass grants, open or not yet expired; absent for none. */
  readonly breakGlass?: readonly BreakGlassGrant[];
}
