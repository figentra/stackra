/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/iam (the `PolicySource` port, the policy snapshot and
 *          its grants, rules and audiences, and `Capability`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15). `SegmentRef` is @stackra/segments' and `ScopeRef` @stackra/contracts', so neither
 *           is re-exported here.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Capability } from "#contracts/enums/capability.enum";
export { PolicySource } from "#contracts/ports/policy-source.port";
export type { Audience } from "#contracts/types/audience.type";
export type { DenyRule } from "#contracts/types/deny-rule.type";
export type { Grant } from "#contracts/types/grant.type";
export type { PolicySnapshot } from "#contracts/types/policy-snapshot.type";
export type { RoleRef } from "#contracts/types/role-ref.type";
export type { VisibilityRule } from "#contracts/types/visibility-rule.type";
