/**
 * Stackra file contract:
 * Purpose: `ScopeDepthEntitlement`, the plan right that bounds how deep the tree nests below its first node of a
 *          recursive level: a number per plan, `Number.POSITIVE_INFINITY` for no bound.
 * Boundary: declared only. The plan values (ADR 0242) are the entitlement system's data, never here, and no call is
 *           registered as gated by it, so `PlanEntitlementCheckDriver` never counts rows against it. It is a limit
 *           because its grant is a number; `EntitlementKind.Limit` requires a counted model, so it names `ScopeNode`,
 *           but the grant is a depth, not a node count. The depth check at node creation is planned (ADR 0240).
 * Runtime: node
 * Governing contract: ADR 0240 (decision 2); ADR 0242 (the scope depth row); ADR 0327 (decision 1); ADR 0215
 *                     (decision 1).
 */
import { Entitlement, EntitlementKind } from "@stackra/entitlements";

import { ScopeNode } from "#node/models/scope-node.model";

/** How many nested levels a plan allows; key `scope.scope_depth`. */
export class ScopeDepthEntitlement extends Entitlement({
  kind: EntitlementKind.Limit,
  counts: () => ScopeNode,
}) {}
