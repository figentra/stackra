/**
 * Stackra file contract:
 * Purpose: `Audience`, who a deny or visibility rule applies to: the principals acting within a scope node, the
 *          members of a segment, or the holders of a role.
 * Boundary: a type only; a `ScopeRef` carries no `kind`, so `"kind" in audience` tells it from the two refs. The
 *           segment ref is @stackra/segments' own (its leaf `./contracts`), so IAM never evaluates a segment.
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decision 2); ADR 0327 (scope nodes); ADR 0332 (segments); ADR 0208 (roles).
 */
import type { ScopeRef } from "@stackra/contracts";
import type { SegmentRef } from "@stackra/segments/contracts";

import type { RoleRef } from "#contracts/types/role-ref.type";

/**
 * A rule's audience.
 *
 * @example
 * const audiences: Audience[] = [scope, { kind: "segment", id: vipId }, { kind: "role", key: SystemRole.Manager }];
 */
export type Audience = ScopeRef | SegmentRef | RoleRef;
