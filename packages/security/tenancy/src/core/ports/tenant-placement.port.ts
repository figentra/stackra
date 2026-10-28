/**
 * Stackra file contract:
 * Purpose: the `TenantPlacement` port: the placement map, tenant to region and cell, read by the region guard and the
 *          placement connection resolver.
 * Boundary: an abstract class that is its own token, kept in `.` beside the `Placement` type it names. The OS tenancy
 *           service implements it over the tenant row's `region` and `cell` columns; `MemoryTenantPlacementDriver`
 *           serves tests and single-process hosts. It answers only; placing and moving a tenant are the registry's.
 * Runtime: isomorphic
 * Governing contract: ADR 0172 (decision 3); ADR 0186 (decision 6); ADR 0353 (decision 1); ADR 0263; stackra-310.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { Placement } from "#core/types/placement.type";

/**
 * Answers where a tenant lives.
 *
 * @example
 * const placement = await placements.of(tenantId); // { region: "me", cell: "primary" }
 */
export abstract class TenantPlacement extends Port {
  /** The placement of the tenant with id `tenant`, or `undefined` when the registry has none. */
  abstract of(tenant: PublicId<"scp">): Promise<Placement | undefined>;
}
