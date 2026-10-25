/**
 * Stackra file contract:
 * Purpose: `MemoryPolicyState`, everything `MemoryPolicySourceDriver.load` takes: grants and segment memberships per
 *          principal (or for every principal), and the roles and rules in force.
 * Boundary: a type only, for tests and local runs; a row without `principal` applies to every principal.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 3); ADR 0333 (decision 2).
 */
import type { PublicId } from "@stackra/contracts";

import type { BreakGlassGrant, DenyRule, FieldRule, Grant, VisibilityRule } from "#contracts/index";

/** The memory source's whole policy. */
export interface MemoryPolicyState {
  /** Grants, each for one principal or (without `principal`) for every principal. */
  readonly grants?: readonly (Grant & { readonly principal?: PublicId })[];

  /** Custom and provisioned roles by key, each with the permission keys it holds. */
  readonly roles?: Readonly<Record<string, readonly string[]>>;

  /** Segment memberships, each for one principal or (without `principal`) for every principal. */
  readonly segments?: readonly { readonly segment: PublicId; readonly principal?: PublicId }[];

  /** The explicit denies in force. */
  readonly denies?: readonly DenyRule[];

  /** The record visibility rules in force. */
  readonly visibility?: readonly VisibilityRule[];

  /** The field rules in force. */
  readonly fields?: readonly FieldRule[];

  /** Break-glass grants, each for one principal or (without `principal`) for every principal. */
  readonly breakGlass?: readonly (BreakGlassGrant & { readonly principal?: PublicId })[];
}
