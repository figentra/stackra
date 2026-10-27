/**
 * Stackra file contract:
 * Purpose: `Audience`, who a deny or visibility rule applies to: the principals acting within a scope node, or the
 *          holders of a role.
 * Boundary: a type only; a `ScopeRef` carries no `kind`, so `"kind" in audience` tells it from a `RoleRef`. IAM is
 *           permission-only and knows no segments: a segment is a business level, so a segment-targeted rule ("VIPs
 *           cannot cancel orders") is a `@stackra/rules` condition that @stackra/segments feeds (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decision 2, as amended by ADR 0462); ADR 0327 (scope nodes); ADR 0208 (roles);
 *                     ADR 0462 (decision 1).
 */
import type { ScopeRef } from "@stackra/contracts";

import type { RoleRef } from "#contracts/types/role-ref.type";

/**
 * A rule's audience.
 *
 * @example
 * const audiences: Audience[] = [scope, { kind: "role", key: SystemRole.Manager }];
 */
export type Audience = ScopeRef | RoleRef;
